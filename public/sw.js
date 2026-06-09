// Service Worker for HLS Audio Streaming Proxy
const SW_VERSION = 'v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Helper to transform any cross-origin audio URL to our dynamic same-origin proxy
function getProxyUrl(originalUrl) {
  try {
    const url = new URL(originalUrl);
    // Maps https://aac.saavncdn.com/path/file.mp3 -> /stream/aac.saavncdn.com/path/file.mp3
    return `/stream/${url.hostname}${url.pathname}${url.search}`;
  } catch (err) {
    return originalUrl;
  }
}

// Helper to fetch the total size of the audio file using a safe HTTP Range request (0-0)
async function getAudioSize(url) {
  try {
    const proxyUrl = getProxyUrl(url);
    const response = await fetch(proxyUrl, {
      headers: {
        'Range': 'bytes=0-0'
      }
    });
    
    if (!response.ok && response.status !== 206) {
      return null;
    }
    
    const contentRange = response.headers.get('content-range');
    if (contentRange) {
      const match = contentRange.match(/\/(\d+)$/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      return parseInt(contentLength, 10);
    }
  } catch (err) {
    console.error('[HLS SW] Failed to fetch audio total size:', err);
  }
  return null;
}

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. Intercept M3U8 Playlist Request
  if (requestUrl.pathname === '/hls/music.m3u8') {
    event.respondWith(
      (async () => {
        const audioUrl = requestUrl.searchParams.get('url');
        const durationSec = parseFloat(requestUrl.searchParams.get('duration') || '180');
        
        if (!audioUrl) {
          return new Response('Missing audio URL parameter', { status: 400 });
        }

        // Fetch the file size
        const totalSize = await getAudioSize(audioUrl);
        if (!totalSize) {
          return new Response('Unable to resolve audio size', { status: 500 });
        }

        // Segment configuration (10-second segments)
        const segmentDuration = 10;
        const numSegments = Math.ceil(durationSec / segmentDuration);
        const segmentSize = Math.ceil(totalSize / numSegments);

        // Build standard M3U8 VOD manifest
        let m3u8 = `#EXTM3U\n`;
        m3u8 += `#EXT-X-VERSION:4\n`;
        m3u8 += `#EXT-X-TARGETDURATION:${segmentDuration}\n`;
        m3u8 += `#EXT-X-MEDIA-SEQUENCE:0\n`;
        m3u8 += `#EXT-X-PLAYLIST-TYPE:VOD\n`;

        for (let i = 0; i < numSegments; i++) {
          const start = i * segmentSize;
          const end = Math.min((i + 1) * segmentSize - 1, totalSize - 1);
          const actualDuration = (i === numSegments - 1) 
            ? (durationSec - (i * segmentDuration)) 
            : segmentDuration;

          m3u8 += `#EXTINF:${actualDuration.toFixed(2)},\n`;
          m3u8 += `/hls/segment.mp3?url=${encodeURIComponent(audioUrl)}&start=${start}&end=${end}\n`;
        }

        m3u8 += `#EXT-X-ENDLIST\n`;

        return new Response(m3u8, {
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Access-Control-Allow-Origin': '*'
          }
        });
      })()
    );
  }

  // 2. Intercept MP3 Segment Requests
  else if (requestUrl.pathname === '/hls/segment.mp3') {
    event.respondWith(
      (async () => {
        const audioUrl = requestUrl.searchParams.get('url');
        const start = requestUrl.searchParams.get('start');
        const end = requestUrl.searchParams.get('end');

        if (!audioUrl || start === null || end === null) {
          return new Response('Missing parameters', { status: 400 });
        }

        try {
          // Fetch specific byte chunk from the CDN via the same-origin proxy
          const proxyUrl = getProxyUrl(audioUrl);
          const response = await fetch(proxyUrl, {
            headers: {
              'Range': `bytes=${start}-${end}`
            }
          });

          if (!response.ok && response.status !== 206) {
            return new Response('Failed to stream segment', { status: response.status });
          }

          // Copy original CDN response headers (including correct Content-Type and crucial Content-Range!)
          const headers = new Headers(response.headers);
          
          // Ensure CORS is allowed and prevent browser from caching range requests on disk
          headers.set('Access-Control-Allow-Origin', '*');
          headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: headers
          });
        } catch (err) {
          console.error('[HLS SW] Segment stream error:', err);
          return new Response('Internal streaming error', { status: 500 });
        }
      })()
    );
  }
});
