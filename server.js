const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const https = require('https');



const app = express();
const PORT = process.env.PORT || 3001; // Support Render's dynamic port assignment
const CACHE_DIR = path.join(__dirname, 'hls-cache');

// We keep a reference to the port so startTranscoding can build local proxy URLs
let ACTUAL_PORT = PORT;
app.get('/health', (req, res) => res.send('OK'));
// Enable CORS for all cross-origin requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization,range');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Ensure cache directory exists and is clean on startup
if (fs.existsSync(CACHE_DIR)) {
  try {
    fs.rmSync(CACHE_DIR, { recursive: true, force: true });
  } catch (err) {
    console.warn('[HLS Backend] Failed to clean cache dir on startup:', err.message);
  }
}
try {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
} catch (err) {
  console.error('[HLS Backend] Failed to create cache dir:', err.message);
}

// Ensure FFmpeg binary has execute permissions on Linux/Unix systems (critical for Render deployment)
if (process.platform !== 'win32') {
  try {
    fs.chmodSync(ffmpegPath, 0o755);
    console.log('[HLS Backend] Successfully ensured execute permissions on ffmpeg static binary');
  } catch (err) {
    console.warn('[HLS Backend] Failed to adjust permissions on ffmpeg binary:', err.message);
  }
}

// Map to track active streams: hash -> { process, lastAccessed, dir, exited }
const activeStreams = new Map();

// Map to track registered metadata: hash -> { url, duration }
const streamRegistry = new Map();
const REGISTRY_FILE = path.join(__dirname, 'registry.json');

// Load registry from disk on startup to recover from server cold starts/restarts
function loadRegistry() {
  try {
    if (fs.existsSync(REGISTRY_FILE)) {
      const data = fs.readFileSync(REGISTRY_FILE, 'utf8');
      const parsed = JSON.parse(data);
      for (const [k, v] of Object.entries(parsed)) {
        streamRegistry.set(k, v);
      }
      console.log(`[HLS Backend] Loaded ${streamRegistry.size} registered streams from disk.`);
    }
  } catch (err) {
    console.warn('[HLS Backend] Failed to load registry from disk:', err.message);
  }
}

// Save registry to disk so it survives container restarts
function saveRegistry() {
  try {
    const obj = {};
    for (const [k, v] of streamRegistry.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(obj), 'utf8');
  } catch (err) {
    console.warn('[HLS Backend] Failed to save registry to disk:', err.message);
  }
}

// Load metadata immediately
loadRegistry();

// Helper to spawn FFmpeg and start transcoding dynamically
function startTranscoding(hash, url, duration) {
  const streamDir = path.join(CACHE_DIR, hash);
  const playlistPath = path.join(streamDir, 'playlist.m3u8');

  if (!fs.existsSync(streamDir)) {
    fs.mkdirSync(streamDir, { recursive: true });
  }

  console.log(`[HLS Backend] Starting background transcoding for hash ${hash}: ${url}`);

  // Kill any other active stream processes to conserve CPU
  for (const [activeHash, stream] of activeStreams.entries()) {
    if (activeHash !== hash) {
      console.log(`[HLS Backend] Terminating active stream: ${activeHash}`);
      try {
        stream.process.kill('SIGKILL');
      } catch (e) {}
      try {
        fs.rmSync(stream.dir, { recursive: true, force: true });
      } catch (e) {}
      activeStreams.delete(activeHash);
    }
  }

  // Build a local proxy URL so FFmpeg fetches audio through this server's own /stream route.
  // JioSaavn CDN (aac.saavncdn.com) blocks requests from Render's US data-centre IPs, but
  // the frontend browser can reach it fine. The /stream route proxies the request using
  // Node's https module which has no such restrictions from the server side — and more
  // importantly, it forwards the original headers that the CDN expects.
  let ffmpegInputUrl = url;
  try {
    const parsedUrl = new URL(url);
    // Route through our own local /stream proxy: http://127.0.0.1:PORT/stream/hostname/path?query
    const proxiedPath = parsedUrl.pathname + parsedUrl.search;
    ffmpegInputUrl = `http://127.0.0.1:${ACTUAL_PORT}/stream/${parsedUrl.hostname}${proxiedPath}`;
    console.log(`[HLS Backend] Routing FFmpeg through local proxy: ${ffmpegInputUrl}`);
  } catch (e) {
    console.warn(`[HLS Backend] Could not parse URL for proxying, using direct: ${e.message}`);
  }

  // Spawn ffmpeg to output segment files. We output to an internal dummy playlist.
  const ffmpegProcess = spawn(ffmpegPath, [
    '-i', ffmpegInputUrl,
    '-c:a', 'aac',
    '-b:a', '128k',
    '-vn',
    '-hls_time', '6',
    '-start_number', '0',
    '-hls_list_size', '0',
    '-hls_flags', 'independent_segments',
    '-hls_segment_filename', path.join(streamDir, 'seg-%d.ts'),
    path.join(streamDir, 'internal_playlist.m3u8')
  ]);

  const streamObj = {
    process: ffmpegProcess,
    lastAccessed: Date.now(),
    dir: streamDir,
    exited: false
  };

  activeStreams.set(hash, streamObj);

  let ffmpegStderrBuffer = '';
  ffmpegProcess.stderr.on('data', (data) => {
    const text = data.toString();
    ffmpegStderrBuffer += text;
    // Only log meaningful lines (skip frame/progress lines to reduce noise)
    const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('frame=') && !l.startsWith('size='));
    if (lines.length > 0) {
      console.error(`[FFmpeg stderr ${hash}]: ${lines.join(' | ').trim()}`);
    }
  });

  ffmpegProcess.on('close', (code) => {
    console.log(`[HLS Backend] FFmpeg process for ${hash} exited with code ${code}`);
    if (code !== 0) {
      // Log last part of stderr to capture the actual error message
      const tail = ffmpegStderrBuffer.slice(-800).trim();
      console.error(`[HLS Backend] FFmpeg failure tail for ${hash}: ${tail}`);
    }
    streamObj.exited = true;
  });

  ffmpegProcess.on('error', (err) => {
    console.error(`[HLS Backend] FFmpeg spawn error for ${hash}:`, err.message);
    streamObj.exited = true;
  });

  // INSTANT VOD MANIFEST GENERATION: Write the complete HLS manifest immediately if not present
  if (!fs.existsSync(playlistPath)) {
    const segmentDuration = 6;
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

// Deterministic Hash Function matching frontend
function getHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

// Root endpoint to verify server status and CORS headers
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'HLS Transcoding Backend',
    cors: 'enabled',
    version: '1.0.1'
  });
});



// Master Playlist endpoint
app.get('/hls/:hash/playlist.m3u8', async (req, res) => {
  const { hash } = req.params;
  const url = req.query.url;
  const duration = parseFloat(req.query.duration || '180');

  if (!url) {
    return res.status(400).send('URL query parameter is required');
  }

  // Register metadata for self-healing restarts and persist it
  streamRegistry.set(hash, { url, duration });
  saveRegistry();

  const streamDir = path.join(CACHE_DIR, hash);
  const playlistPath = path.join(streamDir, 'playlist.m3u8');

  // If playlist doesn't exist or stream is not active, start transcoding
  const needsTranscoding = !fs.existsSync(playlistPath) || !activeStreams.has(hash);
  if (needsTranscoding) {
    startTranscoding(hash, url, duration);

    // PRE-WARM: Wait for seg-0.ts to be produced before responding with the playlist.
    // This prevents hls.js from immediately requesting seg-0.ts before FFmpeg has had
    // any time to process the audio. On Render this is critical since FFmpeg needs to
    // establish a network connection to the remote CDN first.
    const seg0Path = path.join(streamDir, 'seg-0.ts');
    const PRE_WARM_TIMEOUT_MS = 30000;
    const PRE_WARM_POLL_MS = 200;
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

  // Update last accessed timestamp
  const stream = activeStreams.get(hash);
  if (stream) {
    stream.lastAccessed = Date.now();
  }

  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  // Disable client caching so browser always queries server for the playlist manifest
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(playlistPath);
});

// Segment and playlist files serve route with polling fallback
app.get('/hls/:hash/:file', async (req, res) => {
  const { hash, file } = req.params;
  const { url, duration } = req.query;
  const filePath = path.join(CACHE_DIR, hash, file);

  // If requesting a .ts segment that hasn't been generated yet
  if (file.endsWith('.ts') && !fs.existsSync(filePath)) {
    // Self-healing: if transcoding has stopped or directory was deleted, auto-restart
    if (!activeStreams.has(hash)) {
      console.log(`[HLS Backend] Segment ${file} requested but transcoding is idle. Checking registry to restart...`);
      let registered = streamRegistry.get(hash);
      
      // Fallback to query params if not found in registry (e.g. after server restart/redeploy)
      if (!registered && url) {
        console.log(`[HLS Backend] Restoring registry metadata from query params for hash ${hash}`);
        registered = { url, duration: parseFloat(duration || '180') };
        streamRegistry.set(hash, registered);
        saveRegistry();
      }

      if (registered) {
        startTranscoding(hash, registered.url, registered.duration);
      } else {
        console.warn(`[HLS Backend] No registry metadata found for hash ${hash} to restart transcoding.`);
      }
    }

    // Poll up to 45 seconds — Render needs extra time to:
    // 1. Open TCP connection to remote CDN
    // 2. Follow redirects
    // 3. Buffer enough audio to emit the first segment
    const MAX_WAIT_MS = 45000;
    const POLL_INTERVAL_MS = 100;
    const maxPolls = MAX_WAIT_MS / POLL_INTERVAL_MS;
    let ready = false;
    for (let i = 0; i < maxPolls; i++) {
      if (fs.existsSync(filePath)) {
        ready = true;
        break;
      }
      
      // If the FFmpeg process has exited and file still doesn't exist, it will never exist
      const activeStream = activeStreams.get(hash);
      if (activeStream && activeStream.exited) {
        console.warn(`[HLS Backend] FFmpeg exited before producing ${file} — segment will never exist.`);
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
  if (stream) {
    stream.lastAccessed = Date.now();
  }

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// Stream proxy route to pipe direct progressive streams under same-origin rules with seek/range headers
app.get(/^\/stream\/([^\/]+)\/(.+)$/, (req, res) => {
  const hostname = req.params[0];
  const targetPath = req.url.replace(/^\/stream\/[^\/]+\//, '');
  const targetUrl = `https://${hostname}/${targetPath}`;

  // Always inject browser-like headers so JioSaavn CDN doesn't block the request.
  // When FFmpeg routes through here it sends minimal headers, which CDNs reject.
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': `https://${hostname}/`,
    'Origin': `https://${hostname}`,
    'Connection': 'keep-alive',
  };

  // Forward range header if present (needed for browser seek support)
  if (req.headers['range']) {
    headers['Range'] = req.headers['range'];
  }

  console.log(`[HLS Backend] Proxying: ${targetUrl}`);

  const options = {
    method: 'GET',
    headers: headers
  };

  const proxyReq = https.request(targetUrl, options, (proxyRes) => {
    const resHeaders = { ...proxyRes.headers };
    resHeaders['Access-Control-Allow-Origin'] = '*';
    res.writeHead(proxyRes.statusCode, resHeaders);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`[HLS Backend] Stream proxy error for ${targetUrl}:`, err.message);
    if (!res.headersSent) {
      res.status(500).send('Stream proxy error');
    }
  });

  req.pipe(proxyReq);
});

// Periodic Garbage Collector for inactive streams (runs every 10 seconds)
setInterval(() => {
  const now = Date.now();
  for (const [hash, stream] of activeStreams.entries()) {
    // 15 minutes of inactivity -> clean up (prevent premature deletion of paused/scrubbed tracks)
    if (now - stream.lastAccessed > 900000) {
      console.log(`[HLS Backend] Garbage Collector: Cleaning up idle stream ${hash}`);
      try {
        stream.process.kill('SIGKILL');
      } catch (e) {}
      
      // Delay folder deletion slightly to allow OS to release file locks
      setTimeout(() => {
        try {
          fs.rmSync(stream.dir, { recursive: true, force: true });
        } catch (e) {
          console.warn(`[HLS Backend GC] Failed to remove dir ${stream.dir}:`, e.message);
        }
      }, 1000);

      activeStreams.delete(hash);
    }
  }
}, 10000);

app.listen(PORT, () => {
  ACTUAL_PORT = PORT; // confirm the port after server starts
  console.log(`[HLS Backend] Dynamic HLS transcoding server running on port ${PORT}`);
});
