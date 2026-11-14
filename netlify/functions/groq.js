/* Groq 프록시 (v2.33 — 남용 방지)
   - 허용한 출처(게임이 올라간 주소)에서 온 요청만 받는다.
   - 모델·토큰 수·메시지 크기를 서버에서 고정/제한한다(클라이언트가 보낸 model은 무시).
   - IP당 호출 수를 제한한다(함수 인스턴스 메모리 기준 — 인스턴스가 여러 개면 느슨해지는 '최소한의' 장치).
   주의: Origin 헤더는 브라우저 밖(curl 등)에서는 꾸밀 수 있다. 완전한 차단이 아니라 비용 상한을 낮추는 장치다.
         Groq 콘솔의 사용 한도(spend limit)도 함께 걸어 둘 것. */
const ALLOWED_ORIGINS = [
  'https://snrnwps5-ops.github.io',
  'https://mega-tech-tycoon.netlify.app'
];
const MODEL = 'qwen/qwen3.8-27b';
const MAX_TOKENS = 300;          // 게임이 쓰는 최대값은 250
const MAX_MESSAGES = 24;
const MAX_CHARS = 12000;         // 메시지 전체 글자 수 상한
const RATE = { windowMs: 60 * 1000, max: 12 };   // IP당 1분에 12회
const hits = new Map();

function limited(ip) {
  const now = Date.now();
  const rec = hits.get(ip) || { t: now, n: 0 };
  if (now - rec.t > RATE.windowMs) { rec.t = now; rec.n = 0; }
  rec.n++;
  hits.set(ip, rec);
  if (hits.size > 5000) { for (const [k, v] of hits) { if (now - v.t > RATE.windowMs) hits.delete(k); } }
  return rec.n > RATE.max;
}

exports.handler = async function (event) {
  const h = event.headers || {};
  const origin = h.origin || h.Origin || '';
  const okOrigin = ALLOWED_ORIGINS.indexOf(origin) >= 0;
  const cors = {
    'Access-Control-Allow-Origin': okOrigin ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
    'Content-Type': 'application/json'
  };
  const reply = (statusCode, obj) => ({ statusCode, headers: cors, body: typeof obj === 'string' ? obj : JSON.stringify(obj) });

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method Not Allowed' });
  if (!okOrigin) return reply(403, { error: 'Origin not allowed' });

  const ip = h['x-nf-client-connection-ip'] || (h['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return reply(429, { error: 'Too many requests' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return reply(500, { error: 'GROQ_API_KEY not configured' });

  let payload;
  try { payload = JSON.parse(event.body || '{}'); } catch (e) { return reply(400, { error: 'Bad JSON' }); }

  const src = Array.isArray(payload.messages) ? payload.messages : [];
  if (!src.length || src.length > MAX_MESSAGES) return reply(400, { error: 'Bad messages' });
  let chars = 0;
  const messages = [];
  for (const m of src) {
    if (!m || typeof m.content !== 'string' || ['system', 'user', 'assistant'].indexOf(m.role) < 0) return reply(400, { error: 'Bad message' });
    chars += m.content.length;
    messages.push({ role: m.role, content: m.content });
  }
  if (chars > MAX_CHARS) return reply(413, { error: 'Messages too long' });

  const mt = Number(payload.max_tokens);
  const tp = Number(payload.temperature);

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: Math.max(1, Math.min(MAX_TOKENS, isFinite(mt) && mt > 0 ? Math.floor(mt) : 250)),
        temperature: Math.max(0, Math.min(1.2, isFinite(tp) ? tp : 0.7))
      })
    });
    const text = await upstream.text();
    return reply(upstream.status, text);
  } catch (err) {
    return reply(502, { error: 'Upstream error' });
  }
};
