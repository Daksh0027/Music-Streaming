const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

const streamDir = path.join(__dirname, 'test');
if (!fs.existsSync(streamDir)) {
  fs.mkdirSync(streamDir, { recursive: true });
}

const url = 'https://aac.saavncdn.com/992/7a12c4a164052ab0f59655f33f115fd5_320.mp4';

console.log('Spawning FFmpeg from:', ffmpegPath);

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

// Capture and print first few lines of stdout/stderr to check for errors
let lines = 0;
ffmpegProcess.stderr.on('data', (data) => {
  if (lines < 30) {
    console.log('STDERR:', data.toString());
    lines++;
  }
});

ffmpegProcess.on('close', (code) => {
  console.log('FFmpeg exited with code:', code);
  process.exit(code);
});
