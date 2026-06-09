const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const https = require('https');

// Intercept and collect console logs in-memory for Render diagnostics
const debugLogs = [];
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => {
  debugLogs.push(`[LOG] [${new Date().toISOString()}] ${args.join(' ')}`);
  if (debugLogs.length > 300) debugLogs.shift();
  originalLog.apply(console, args);
};

console.error = (...args) => {
  debugLogs.push(`[ERROR] [${new Date().toISOString()}] ${args.join(' ')}`);
  if (debugLogs.length > 300) debugLogs.shift();
  originalError.apply(console, args);
};

console.warn = (...args) => {
  debugLogs.push(`[WARN] [${new Date().toISOString()}] ${args.join(' ')}`);
  if (debugLogs.length > 300) debugLogs.shift();
  originalWarn.apply(console, args);
};

const app = express();
const PORT = process.env.PORT || 3001; // Support Render's dynamic port assignment
const CACHE_DIR = path.join(__dirname, 'hls-cache');

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

  // Spawn ffmpeg to output segment files. We output to an internal dummy playlist.
  const ffmpegProcess = spawn(ffmpegPath, [
    '-headers', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36\r\n',
    '-i', url,
    '-c:a', 'aac',
    '-b:a', '192k',
    '-vn',
    '-hls_time', '6',
    '-start_number', '0',
    '-hls_list_size', '0',
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

  ffmpegProcess.on('close', (code) => {
    console.log(`[HLS Backend] FFmpeg process for ${hash} exited with code ${code}`);
    streamObj.exited = true;
  });

  ffmpegProcess.on('error', (err) => {
    console.error(`[HLS Backend] FFmpeg process for ${hash} error:`, err.message);
  });

  // Log stderr details to help diagnose cloud audio fetching issues
  ffmpegProcess.stderr.on('data', (data) => {
    console.error(`[FFmpeg stderr ${hash}]: ${data.toString().trim()}`);
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

// Route to expose captured in-memory debug logs
app.get('/debug-logs', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(debugLogs.join('\n'));
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
  if (!fs.existsSync(playlistPath) || !activeStreams.has(hash)) {
    startTranscoding(hash, url, duration);
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

    // Poll up to 10 seconds (gives FFmpeg more time for deep seeks/scrubs)
    let ready = false;
    for (let i = 0; i < 200; i++) { // Poll every 50ms up to 10 seconds
      if (fs.existsSync(filePath)) {
        ready = true;
        break;
      }
      
      // If the FFmpeg process has exited and file still doesn't exist, it will never exist
      const activeStream = activeStreams.get(hash);
      if (activeStream && activeStream.exited) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    if (!ready) {
      console.warn(`[HLS Backend] Timeout waiting for segment: ${file}`);
      return res.status(404).send('Segment not ready');
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

  const headers = { ...req.headers };
  // Remove host to prevent SSL mismatches
  delete headers.host;

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
    console.error('[HLS Backend] Stream proxy error:', err.message);
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
  console.log(`[HLS Backend] Dynamic HLS transcoding server running on port ${PORT}`);
});
