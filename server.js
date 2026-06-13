const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3001;
const CACHE_DIR = path.join(__dirname, 'hls-cache');

let ACTUAL_PORT = PORT;

app.get('/health', (req, res) => res.send('OK'));

// Enable CORS for all cross-origin requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization,range');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Ensure cache directory exists and is clean on startup
if (fs.existsSync(CACHE_DIR)) {
  try { fs.rmSync(CACHE_DIR, { recursive: true, force: true }); }
  catch (err) { console.warn('[HLS Backend] Failed to clean cache dir on startup:', err.message); }
}
try { fs.mkdirSync(CACHE_DIR, { recursive: true }); }
catch (err) { console.error('[HLS Backend] Failed to create cache dir:', err.message); }

// Ensure FFmpeg binary has execute permissions on Linux/Unix
if (process.platform !== 'win32') {
  try {
    fs.chmodSync(ffmpegPath, 0o755);
    console.log('[HLS Backend] Successfully ensured execute permissions on ffmpeg static binary');
  } catch (err) {
    console.warn('[HLS Backend] Failed to adjust permissions on ffmpeg binary:', err.message);
  }
}

// Map to track active streams: hash -> { process, lastAccessed, dir, exited, fellBack }
const activeStreams = new Map();

// Map to track registered metadata: hash -> { url, duration }
const streamRegistry = new Map();
const REGISTRY_FILE = path.join(__dirname, 'registry.json');

function loadRegistry() {
  try {
    if (fs.existsSync(REGISTRY_FILE)) {
      const data = fs.readFileSync(REGISTRY_FILE, 'utf8');
      const parsed = JSON.parse(data);
      for (const [k, v] of Object.entries(parsed)) streamRegistry.set(k, v);
      console.log(`[HLS Backend] Loaded ${streamRegistry.size} registered streams from disk.`);
    }
  } catch (err) {
    console.warn('[HLS Backend] Failed to load registry from disk:', err.message);
  }
}

function saveRegistry() {
  try {
    const obj = {};
    for (const [k, v] of streamRegistry.entries()) obj[k] = v;
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(obj), 'utf8');
  } catch (err) {
    console.warn('[HLS Backend] Failed to save registry to disk:', err.message);
  }
}

loadRegistry();

// Returns the highest segment index written to disk for a given hash, or -1 if none
function getLatestProducedSegment(hash) {
  const dir = path.join(CACHE_DIR, hash);
  try {
    const files = fs.readdirSync(dir).filter(f => f.startsWith('seg-') && f.endsWith('.ts'));
    if (files.length === 0) return -1;
    return Math.max(...files.map(f => parseInt(f.replace('seg-', '').replace('.ts', ''))));
  } catch {
    return -1;
  }
}

// Helper to spawn FFmpeg and start transcoding.
// useCopy=true  → stream-copy mode (fastest, no re-encode, requires AAC source)
// useCopy=false → re-encode at 128k AAC (fallback if source is not AAC)
// startSegment  → HLS start_number, used when restarting from a seek point
function startTranscoding(hash, url, duration, startSegment = 0, useCopy = true) {
  const streamDir = path.join(CACHE_DIR, hash);
  const playlistPath = path.join(streamDir, 'playlist.m3u8');

  if (!fs.existsSync(streamDir)) fs.mkdirSync(streamDir, { recursive: true });

  const modeLabel = useCopy ? 'stream-copy' : 're-encode@128k';
  console.log(`[HLS Backend] Starting transcoding (${modeLabel}) for hash ${hash} from seg ${startSegment}: ${url}`);

  // Kill every other active stream to conserve CPU on the free tier
  for (const [activeHash, stream] of activeStreams.entries()) {
    if (activeHash !== hash) {
      console.log(`[HLS Backend] Terminating active stream: ${activeHash}`);
      try { stream.process.kill('SIGTERM'); } catch (e) {}
      setTimeout(() => {
        try { stream.process.kill('SIGKILL'); } catch (e) {}
        try { fs.rmSync(stream.dir, { recursive: true, force: true }); } catch (e) {}
      }, 3000);
      activeStreams.delete(activeHash);
    }
  }

  // Route FFmpeg through the local /stream proxy so JioSaavn CDN headers are injected
  let ffmpegInputUrl = url;
  try {
    const parsedUrl = new URL(url);
    const proxiedPath = parsedUrl.pathname + parsedUrl.search;
    ffmpegInputUrl = `http://127.0.0.1:${ACTUAL_PORT}/stream/${parsedUrl.hostname}${proxiedPath}`;
    console.log(`[HLS Backend] Routing FFmpeg through local proxy: ${ffmpegInputUrl}`);
  } catch (e) {
    console.warn(`[HLS Backend] Could not parse URL for proxying, using direct: ${e.message}`);
  }

  // Audio codec args:
  // - copy mode: remux AAC into .ts containers with zero re-encoding (3-5x faster)
  // - fallback:  decode + re-encode to AAC at exactly 128k CBR
  const audioArgs = useCopy
    ? ['-c:a', 'copy']
    : ['-c:a', 'aac', '-b:a', '128k', '-ar', '44100'];

  const ffmpegProcess = spawn(ffmpegPath, [
    // Reconnect flags — critical on Render where CDN drops are common
    '-reconnect', '1',
    '-reconnect_streamed', '1',
    '-reconnect_delay_max', '5',
    '-i', ffmpegInputUrl,
    ...audioArgs,
    '-vn',
    '-hls_time', '3',           // 3s segments → user hears audio sooner
    '-start_number', String(startSegment),
    '-hls_list_size', '0',
    '-hls_flags', 'independent_segments',
    '-hls_segment_filename', path.join(streamDir, 'seg-%d.ts'),
    path.join(streamDir, 'internal_playlist.m3u8')
  ]);

  const streamObj = {
    process: ffmpegProcess,
    lastAccessed: Date.now(),
    dir: streamDir,
    exited: false,
    fellBack: !useCopy   // track whether we're already in fallback mode
  };

  activeStreams.set(hash, streamObj);

  let ffmpegStderrBuffer = '';
  ffmpegProcess.stderr.on('data', (data) => {
    const text = data.toString();
    ffmpegStderrBuffer += text;
    const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('frame=') && !l.startsWith('size='));
    if (lines.length > 0) console.error(`[FFmpeg stderr ${hash}]: ${lines.join(' | ').trim()}`);
  });

  ffmpegProcess.on('close', (code) => {
    console.log(`[HLS Backend] FFmpeg process for ${hash} exited with code ${code}`);
    if (code !== 0) {
      const tail = ffmpegStderrBuffer.slice(-800).trim();
      console.error(`[HLS Backend] FFmpeg failure tail for ${hash}: ${tail}`);

      // If stream-copy failed (e.g. source is not AAC), automatically retry with re-encode
      if (useCopy && !streamObj.fellBack) {
        console.log(`[HLS Backend] Stream-copy failed for ${hash} — falling back to re-encode@128k`);
        streamObj.fellBack = true;
        const registered = streamRegistry.get(hash);
        if (registered) {
          // Clean up any partial segments before restarting
          try { fs.rmSync(streamDir, { recursive: true, force: true }); } catch (e) {}
          activeStreams.delete(hash);
          startTranscoding(hash, registered.url, registered.duration, 0, false);
        }
        return;
      }
    }
    streamObj.exited = true;
  });

  ffmpegProcess.on('error', (err) => {
    console.error(`[HLS Backend] FFmpeg spawn error for ${hash}:`, err.message);
    streamObj.exited = true;
  });

  // Write the complete VOD manifest immediately so hls.js can start requesting segments
  // right away. Segment files are served as FFmpeg produces them (with polling fallback).
  if (!fs.existsSync(playlistPath)) {
    const segmentDuration = 3;
    const numSegments = Math.ceil(duration / segmentDuration);

    let m3u8 = `#EXTM3U\n`;
    m3u8 += `#EXT-X-VERSION:3\n`;
    m3u8 += `#EXT-X-TARGETDURATION:${segmentDuration}\n`;
    m3u8 += `#EXT-X-MEDIA-SEQUENCE:0\n`;
    m3u8 += `#EXT-X-PLAYLIST-TYPE:VOD\n`;

    for (let i = 0; i < numSegments; i++) {
      const actualDuration = (i === numSegments - 1)
        ? (duration - (i * segmentDuration))
        : segmentDuration;
      m3u8 += `#EXTINF:${actualDuration.toFixed(3)},\n`;
      m3u8 += `seg-${i}.ts?url=${encodeURIComponent(url)}&duration=${duration}\n`;
    }

    m3u8 += `#EXT-X-ENDLIST\n`;
    fs.writeFileSync(playlistPath, m3u8);
  }
}

// Deterministic hash function — must match frontend implementation
function getHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({ status: 'running', service: 'HLS Transcoding Backend', cors: 'enabled', version: '1.1.0' });
});

// Master Playlist endpoint
app.get('/hls/:hash/playlist.m3u8', async (req, res) => {
  const { hash } = req.params;
  const url = req.query.url;
  const duration = parseFloat(req.query.duration || '180');

  if (!url) return res.status(400).send('URL query parameter is required');

  streamRegistry.set(hash, { url, duration });
  saveRegistry();

  const streamDir = path.join(CACHE_DIR, hash);
  const playlistPath = path.join(streamDir, 'playlist.m3u8');
  const seg0Path = path.join(streamDir, 'seg-0.ts');

  const needsTranscoding = !fs.existsSync(playlistPath) || !activeStreams.has(hash);
  if (needsTranscoding) {
    startTranscoding(hash, url, duration);

    // Pre-warm: wait for seg-0.ts before sending the playlist so hls.js doesn't
    // immediately request a segment that doesn't exist yet. 8s is enough on Render
    // for FFmpeg to connect to the CDN and emit the first 3-second segment.
    const PRE_WARM_TIMEOUT_MS = 8000;
    const PRE_WARM_POLL_MS = 100; // poll faster (was 200ms) for lower latency
    const maxPreWarmPolls = PRE_WARM_TIMEOUT_MS / PRE_WARM_POLL_MS;
    for (let i = 0; i < maxPreWarmPolls; i++) {
      if (fs.existsSync(seg0Path)) {
        console.log(`[HLS Backend] Pre-warm complete: seg-0.ts ready for hash ${hash} after ${i * PRE_WARM_POLL_MS}ms`);
        break;
      }
      const activeStream = activeStreams.get(hash);
      if (activeStream && activeStream.exited) {
        console.warn(`[HLS Backend] Pre-warm aborted: FFmpeg exited early for hash ${hash}`);
        break;
      }
      await new Promise(resolve => setTimeout(resolve, PRE_WARM_POLL_MS));
    }
  }

  const stream = activeStreams.get(hash);
  if (stream) stream.lastAccessed = Date.now();

  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(playlistPath);
});

// Segment serve route with seek-jump detection and polling fallback
app.get('/hls/:hash/:file', async (req, res) => {
  const { hash, file } = req.params;
  const { url, duration } = req.query;
  const filePath = path.join(CACHE_DIR, hash, file);

  if (file.endsWith('.ts') && !fs.existsSync(filePath)) {
    const segIndex = parseInt(file.replace('seg-', '').replace('.ts', ''));

    // Self-healing: restart transcoding if it stopped
    if (!activeStreams.has(hash)) {
      console.log(`[HLS Backend] Segment ${file} requested but transcoding is idle. Restarting...`);
      let registered = streamRegistry.get(hash);

      if (!registered && url) {
        registered = { url, duration: parseFloat(duration || '180') };
        streamRegistry.set(hash, registered);
        saveRegistry();
      }

      if (registered) {
        startTranscoding(hash, registered.url, registered.duration, 0, true);
      } else {
        console.warn(`[HLS Backend] No registry metadata for hash ${hash}.`);
      }
    } else {
      // Seek-jump detection: if the user seeked far ahead of what FFmpeg has produced,
      // kill the current process and restart from the requested segment index.
      // This avoids waiting for FFmpeg to sequentially produce all preceding segments.
      const latestSeg = getLatestProducedSegment(hash);
      if (segIndex > latestSeg + 4) {
        console.log(`[HLS Backend] Seek jump detected: need seg-${segIndex}, FFmpeg at seg-${latestSeg}. Restarting from seek point.`);
        const stream = activeStreams.get(hash);
        try { stream.process.kill('SIGKILL'); } catch (e) {}
        activeStreams.delete(hash);

        const registered = streamRegistry.get(hash);
        if (registered) {
          // Clean up segments before the seek point to avoid stale files
          try {
            const streamDir = path.join(CACHE_DIR, hash);
            const staleFiles = fs.readdirSync(streamDir).filter(f => {
              if (!f.startsWith('seg-') || !f.endsWith('.ts')) return false;
              const idx = parseInt(f.replace('seg-', '').replace('.ts', ''));
              return idx >= segIndex; // remove from seek point onward
            });
            staleFiles.forEach(f => fs.unlinkSync(path.join(streamDir, f)));
          } catch (e) {}

          startTranscoding(hash, registered.url, registered.duration, segIndex, true);
        }
      }
    }

    // Poll up to 45 seconds for the segment to appear on disk
    const MAX_WAIT_MS = 45000;
    const POLL_INTERVAL_MS = 100;
    const maxPolls = MAX_WAIT_MS / POLL_INTERVAL_MS;
    let ready = false;
    for (let i = 0; i < maxPolls; i++) {
      if (fs.existsSync(filePath)) { ready = true; break; }
      const activeStream = activeStreams.get(hash);
      if (activeStream && activeStream.exited) {
        console.warn(`[HLS Backend] FFmpeg exited before producing ${file}.`);
        break;
      }
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    if (!ready) {
      console.warn(`[HLS Backend] Timeout waiting for segment: ${file}`);
      return res.status(504).send('Segment not ready — transcoding timeout');
    }
  }

  const stream = activeStreams.get(hash);
  if (stream) stream.lastAccessed = Date.now();

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// Stream proxy — injects browser-like headers so JioSaavn CDN accepts requests from Render IPs
app.get(/^\/stream\/([^\/]+)\/(.+)$/, (req, res) => {
  const hostname = req.params[0];
  const targetPath = req.url.replace(/^\/stream\/[^\/]+\//, '');
  const targetUrl = `https://${hostname}/${targetPath}`;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'identity',  // don't compress — FFmpeg doesn't need it
    'Referer': `https://${hostname}/`,
    'Origin': `https://${hostname}`,
    'Connection': 'keep-alive',
    'Keep-Alive': 'timeout=30',
  };

  if (req.headers['range']) headers['Range'] = req.headers['range'];

  console.log(`[HLS Backend] Proxying: ${targetUrl}`);

  const proxyReq = https.request(targetUrl, { method: 'GET', headers }, (proxyRes) => {
    const resHeaders = { ...proxyRes.headers };
    resHeaders['Access-Control-Allow-Origin'] = '*';
    res.writeHead(proxyRes.statusCode, resHeaders);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`[HLS Backend] Stream proxy error for ${targetUrl}:`, err.message);
    if (!res.headersSent) res.status(500).send('Stream proxy error');
  });

  req.pipe(proxyReq);
});



// Garbage collector — cleans up streams idle for more than 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [hash, stream] of activeStreams.entries()) {
    if (now - stream.lastAccessed > 900000) {
      console.log(`[HLS Backend] GC: Cleaning up idle stream ${hash}`);
      try { stream.process.kill('SIGTERM'); } catch (e) {}
      setTimeout(() => {
        try { stream.process.kill('SIGKILL'); } catch (e) {}
        try { fs.rmSync(stream.dir, { recursive: true, force: true }); } catch (e) {}
      }, 3000);
      activeStreams.delete(hash);
    }
  }
}, 10000);

app.listen(PORT, () => {
  ACTUAL_PORT = PORT;
  console.log(`[HLS Backend] Dynamic HLS transcoding server running on port ${PORT}`);
});