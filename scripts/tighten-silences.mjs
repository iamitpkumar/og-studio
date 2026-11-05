import ffmpeg from 'ffmpeg-static';
import { runMedia } from '../apps/web/src/server/media.mjs';

/**
 * Detect silence intervals in an audio/video file using FFmpeg silencedetect filter.
 * @param {string} filePath - Absolute path to audio or video file.
 * @param {number} noiseDb - Noise threshold in dB (default: -30dB).
 * @param {number} minDurationSec - Minimum duration in seconds to consider silence (default: 0.4s).
 * @returns {Promise<Array<{start: number, end: number, duration: number}>>}
 */
export async function detectSilences(filePath, noiseDb = -30, minDurationSec = 0.4) {
  const args = [
    '-v', 'info',
    '-i', filePath,
    '-af', `silencedetect=noise=${noiseDb}dB:d=${minDurationSec}`,
    '-f', 'null',
    '-'
  ];
  const output = await runMedia(ffmpeg, args, 300000);
  const silences = [];
  let currentStart = null;
  const lines = output.split(/\r?\n/);
  for (const line of lines) {
    const sMatch = /silence_start:\s*([\d.]+)/.exec(line);
    if (sMatch) {
      currentStart = parseFloat(sMatch[1]);
    }
    const eMatch = /silence_end:\s*([\d.]+)\s*\|\s*silence_duration:\s*([\d.]+)/.exec(line);
    if (eMatch && currentStart !== null) {
      const end = parseFloat(eMatch[1]);
      const duration = parseFloat(eMatch[2]);
      silences.push({ start: currentStart, end, duration });
      currentStart = null;
    }
  }
  return silences;
}

/**
 * Converts silence intervals into tight speech segments with optional safety padding.
 * @param {Array<{start: number, end: number}>} silences
 * @param {number} totalDuration
 * @param {number} paddingSec - Safety padding preserved around speech (default: 0.08s).
 * @returns {Array<{start: number, end: number}>}
 */
export function calculateSpeechSegments(silences, totalDuration, paddingSec = 0.08) {
  if (!silences || !silences.length) {
    return [{ start: 0, end: totalDuration }];
  }
  const speech = [];
  let cursor = 0;
  for (const s of silences) {
    const speechEnd = Math.min(totalDuration, s.start + paddingSec);
    const speechStart = Math.max(0, cursor);
    if (speechEnd > speechStart + 0.1) {
      speech.push({ start: speechStart, end: speechEnd });
    }
    cursor = Math.max(0, s.end - paddingSec);
  }
  if (cursor < totalDuration - 0.1) {
    speech.push({ start: cursor, end: totalDuration });
  }
  return speech;
}
