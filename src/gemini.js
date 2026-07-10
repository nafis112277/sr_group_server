const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Supports multiple keys: GEMINI_API_KEYS=key1,key2,key3 (comma-separated)
// Falls back to the old single GEMINI_API_KEY if GEMINI_API_KEYS isn't set.
const API_KEYS = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

const COOLDOWN_MS = 60 * 1000; // if a key gets rate-limited, skip it for 60s
let cursor = 0;
const cooldownUntil = new Map(); // keyIndex -> timestamp until it should be skipped

function keyTryOrder() {
  const now = Date.now();
  const order = [];
  for (let i = 0; i < API_KEYS.length; i++) {
    const idx = (cursor + i) % API_KEYS.length;
    if ((cooldownUntil.get(idx) || 0) <= now) order.push(idx);
  }
  // if every key is on cooldown, try them anyway rather than failing outright
  if (order.length === 0) {
    for (let i = 0; i < API_KEYS.length; i++) order.push((cursor + i) % API_KEYS.length);
  }
  return order;
}

// history: [{ role: 'user' | 'assistant', content: string }]
export async function callGemini(systemPrompt, history) {
  if (API_KEYS.length === 0) {
    return { ok: false, error: 'Server has no GEMINI_API_KEY(S) configured. Add GEMINI_API_KEYS to .env and restart the server.' };
  }

  const contents = history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const order = keyTryOrder();
  let lastError = 'The AI did not return a reply.';

  for (const idx of order) {
    const apiKey = API_KEYS[idx];
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { maxOutputTokens: 1000 },
          }),
        }
      );

      const data = await response.json();

      // Rate-limited or quota exhausted on this key -> cool it down, try next key
      const errMsg = data && data.error && data.error.message;
      if (response.status === 429 || (errMsg && /quota|rate/i.test(errMsg))) {
        console.warn(`[gemini] Key #${idx + 1} rate-limited, cooling down ${COOLDOWN_MS / 1000}s`);
        cooldownUntil.set(idx, Date.now() + COOLDOWN_MS);
        lastError = errMsg || 'Rate limited';
        continue;
      }

      if (errMsg) {
        console.error(`[gemini] Key #${idx + 1} error:`, errMsg);
        lastError = errMsg;
        continue;
      }

      const candidate = data && data.candidates && data.candidates[0];
      const parts = candidate && candidate.content && candidate.content.parts;

      if (parts && parts.length) {
        const text = parts.map((p) => p.text || '').filter(Boolean).join('\n');
        if (text) {
          cursor = (idx + 1) % API_KEYS.length; // spread load: next call starts from the following key
          return { ok: true, text };
        }
      }

      lastError = 'The AI did not return a reply.';
    } catch (err) {
      console.error(`[gemini] Key #${idx + 1} request failed:`, err.message);
      lastError = 'Could not reach the AI provider. Please try again.';
      continue;
    }
  }

  // every key failed or is exhausted
  return { ok: false, error: lastError };
}
