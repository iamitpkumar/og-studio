import { fail } from './store.mjs';

// Bound streamed bodies too: a missing Content-Length must not bypass the limit.
export async function readBody(request, limit) {
  if (Number(request.headers.get('content-length')) > limit) fail('Request is too large.', 413);
  const reader = request.body?.getReader();
  if (!reader) fail('A request body is required.');
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); fail('Request is too large.', 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}

export async function readJSON(request) {
  const bytes = await readBody(request, 100000);
  let value;
  try { value = JSON.parse(bytes.toString('utf8')); } catch { fail('Send valid JSON.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Send a JSON object.');
  return value;
}
