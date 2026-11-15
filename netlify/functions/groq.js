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
const UPSTREAM_TIMEOUT = 12000;   // v2.65: 게이트웨이가 붙잡힌 채 끝나지 않게 상한을 둔다
const hits = new Map();
const RETRY_AFTER = String(Math.ceil(RATE.windowMs / 1000));

/* v2.65: 추론 모델의 <think> 블록과 제어문자를 응답에서 한 번 더 걷어낸다(구버전 클라이언트 보호) */
function cleanReply(text) {
  if (typeof text !== 'string' || !text) return text;
  let t = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<\/?think[^>]*>/gi, '');
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\uFFFD/g, '');
  return t;
}
function stripJSON(text) {
  try {
    const j = JSON.parse(text);
    if (!j || !Array.isArray(j.choices)) return null;
    j.choices.forEach((c) => {
      const m = c && c.message;
      if (!m) return;
      if (typeof m.content === 'string') m.content = cleanReply(m.content).trim();
      if (m.reasoning != null) delete m.reasoning;   // 추론 과정은 내보내지 않는다
    });
    return JSON.stringify(j);
  } catch (e) { return null; }
}

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
  const reply = (statusCode, obj) => ({ statusCode, headers: Object.assign({ 'Cache-Control': 'no-store' }, cors), body: typeof obj === 'string' ? obj : JSON.stringify(obj) });

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method Not Allowed' });
  if (!okOrigin) return reply(403, { error: 'Origin not allowed' });

  const ip = h['x-nf-client-connection-ip'] || (h['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) {
    const r429 = reply(429, { error: 'Too many requests' });
    r429.headers['Retry-After'] = RETRY_AFTER;
    return r429;
  }

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
    const base = {
      model: MODEL,
      messages,
      max_tokens: Math.max(1, Math.min(MAX_TOKENS, isFinite(mt) && mt > 0 ? Math.floor(mt) : 250)),
      temperature: Math.max(0, Math.min(1.2, isFinite(tp) ? tp : 0.7))
    };
    const call = async (body) => {
      const ctl = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = ctl ? setTimeout(() => { try { ctl.abort(); } catch (e) {} }, UPSTREAM_TIMEOUT) : 0;
      try {
        return await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
          body: JSON.stringify(body),
          signal: ctl ? ctl.signal : undefined
        });
      } finally {
        if (timer) clearTimeout(timer);
      }
    };
    /* v2.36: 추론 모델이라 추론을 끄고 부른다(더 빠르고, 짧은 max_tokens 안에서 답이 잘리지 않게).
       모델이 이 옵션을 거부하면(400) 옵션 없이 한 번 더 부른다. */
    let upstream = await call(Object.assign({ reasoning_effort: 'none' }, base));
    if (upstream.status === 400) upstream = await call(base);
    const text = await upstream.text();
    if (upstream.status === 200) {
      const fixed = stripJSON(text);
      if (fixed) return reply(200, fixed);
    }
    if (upstream.status === 429) {
      const r429 = reply(429, text);
      const ra = upstream.headers.get('retry-after');
      r429.headers['Retry-After'] = ra || RETRY_AFTER;
      return r429;
    }
    return reply(upstream.status, text);
  } catch (err) {
    const name = String((err && err.name) || '');
    if (/abort/i.test(name)) return reply(504, { error: 'Upstream timeout' });
    return reply(502, { error: 'Upstream error' });
  }
};
