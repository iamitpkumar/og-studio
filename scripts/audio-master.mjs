import ffmpeg from 'ffmpeg-static';
import { runMedia } from '../apps/web/src/server/media.mjs';

/**
 * Measure audio loudness in integrated LUFS, True Peak, and LRA using EBU R128.
 * @param {string} inputPath - Path to input media file.
 * @returns {Promise<{integratedLufs: number, truePeakDb: number, lra: number}>}
 */
export async function measureLoudness(inputPath) {
  const args = [
    '-v', 'info',
    '-i', inputPath,
    '-af', 'ebur128=framelog=verbose',
    '-f', 'null',
    '-'
  ];
  const output = await runMedia(ffmpeg, args, 300000);
  const iMatch = /I:\s+([-\d.]+)\s+LUFS/i.exec(output);
  const tpMatch = /Peak:\s+([-\d.]+)\s+dBFS/i.exec(output);
  const lraMatch = /LRA:\s+([-\d.]+)\s+LU/i.exec(output);
  return {
    integratedLufs: iMatch ? parseFloat(iMatch[1]) : -24,
    truePeakDb: tpMatch ? parseFloat(tpMatch[1]) : -1,
    lra: lraMatch ? parseFloat(lraMatch[1]) : 7
  };
}

/**
 * Normalize audio to mobile social video standard (-16 LUFS, -1.5 dB True Peak) with peak limiter.
 * @param {string} inputPath - Input audio/video file.
 * @param {string} outputPath - Mastered output audio/video file.
 * @param {number} targetLufs - Target loudness in LUFS (default: -16.0 for mobile social video).
 * @param {number} maxTruePeakDb - True Peak ceiling in dB (default: -1.5 dB).
 */
export async function normalizeSocialAudio(inputPath, outputPath, targetLufs = -16.0, maxTruePeakDb = -1.5) {
  const args = [
    '-y',
    '-v', 'error',
    '-i', inputPath,
    '-af', `loudnorm=I=${targetLufs}:TP=${maxTruePeakDb}:LRA=11,alimiter=limit=0.84:level=0:latency=1`,
    '-c:a', 'aac',
    '-b:a', '192k',
    outputPath
  ];
  await runMedia(ffmpeg, args, 300000);
}
