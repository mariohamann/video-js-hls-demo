import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir } from 'fs/promises';

const execAsync = promisify(exec);

const inputFile = "./src/input.mov";
const outputDir = "./public/videos";

async function convertToHLS() {
  await mkdir(`${outputDir}/480p`, { recursive: true });
  await mkdir(`${outputDir}/720p`, { recursive: true });
  await mkdir(`${outputDir}/1080p`, { recursive: true });

  const command = `
    ffmpeg -i ${inputFile} \
    -filter_complex \
    "[0:v]split=3[v1][v2][v3]; \
     [v1]scale=w=854:h=480[v1out]; \
     [v2]scale=w=1280:h=720[v2out]; \
     [v3]scale=w=1920:h=1080[v3out]" \
    -map "[v1out]" -c:v:0 libx264 -b:v:0 1400k -maxrate:v:0 1498k -bufsize:v:0 2100k -preset slow -crf 23 -g 48 -sc_threshold 0 -profile:v:0 main \
    -map "[v2out]" -c:v:1 libx264 -b:v:1 3500k -maxrate:v:1 3745k -bufsize:v:1 5250k -preset slow -crf 23 -g 48 -sc_threshold 0 -profile:v:1 high \
    -map "[v3out]" -c:v:2 libx264 -b:v:2 6500k -maxrate:v:2 6955k -bufsize:v:2 9750k -preset slow -crf 22 -g 48 -sc_threshold 0 -profile:v:2 high \
    -map a:0 -c:a:0 aac -b:a:0 128k -ac 2 \
    -map a:0 -c:a:1 aac -b:a:1 128k -ac 2 \
    -map a:0 -c:a:2 aac -b:a:2 192k -ac 2 \
    -f hls \
    -hls_time 6 \
    -hls_playlist_type vod \
    -hls_flags independent_segments \
    -hls_segment_type mpegts \
    -master_pl_name master.m3u8 \
    -var_stream_map "v:0,a:0,name:480p v:1,a:1,name:720p v:2,a:2,name:1080p" \
    -hls_segment_filename "${outputDir}/%v/segment_%03d.ts" \
    ${outputDir}/%v/playlist.m3u8
  `;

  try {
    const { stdout, stderr } = await execAsync(command);
    console.log('Conversion complete!');
    console.log('Master playlist:', `${outputDir}/master.m3u8`);
    console.log('Quality levels:');
    console.log('  - 480p:', `${outputDir}/480p/playlist.m3u8`);
    console.log('  - 720p:', `${outputDir}/720p/playlist.m3u8`);
    console.log('  - 1080p:', `${outputDir}/1080p/playlist.m3u8`);
    return `${outputDir}/master.m3u8`;
  } catch (error) {
    console.error('Conversion failed:', error);
    throw error;
  }
}

await convertToHLS();
