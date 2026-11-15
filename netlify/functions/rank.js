/* 주간 랭킹 (v2.67) — Netlify Blobs 'tycoon-rank'
   - 받는 것: 닉네임(최대 12자) · 주간 매출 · 지점 index(0~5) · 테마('store'|'hotel'). 그 밖의 값은 버린다.
   - 개인정보 없음: 실명·연락처·이메일 모양의 닉네임은 서버에서 거절한다. IP는 저장하지 않고,
     '같은 사람이 같은 닉네임으로 여러 번 올려도 1줄'이 되도록 IP+닉네임 해시를 키로만 쓴다.
   - 저장: 주간 버킷 w/<YYYY-Www>/<해시> → { n, r, s, t, u } (최고 매출만 남긴다)
   - GET  /.netlify/functions/rank?week=YYYY-Www&nick=닉네임
       → { week, count, top:[{nick,rev,stg,theme}], me:{rank,nick,rev}|null }
   - POST {nick, rev, stg, theme} → { ok, week, rank, rev, count }
   비정상 값(음수·상한 초과·타입 오류·거대한 본문)은 모두 서버에서 잘라내거나 거절한다. */
const { getStore, connectLambda } = require('@netlify/blobs');

const ALLOWED_ORIGINS = ['https://snrnwps5-ops.github.io', 'https://mega-tech-tycoon.netlify.app'];
const STORE_NAME = 'tycoon-rank';
const MAX_REV = 50000000;      /* 주간 매출 상한 $50,000,000 */
const TOP_N = 50;              /* 순위표에 보여 주는 인원 */
const LIST_CAP = 2000;         /* 한 주에 읽는 최대 줄 수 */
const MAX_BODY = 600;
const RATE = { windowMs: 60 * 1000, max: 30 };
const hits = new Map();

/* ---- 주차: KST 기준 월요일 시작(ISO) — 게임(v267WeekCode)과 같은 식 ---- */
function weekKey(now) {
  const ms = (typeof now === 'number' && isFinite(now)) ? now : Date.now();
  const kst = new Date(ms + 9 * 3600e3);
  const t = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()));
  const dow = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - dow + 3);                        /* 그 주 목요일 */
  const w1 = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const d1 = (w1.getUTCDay() + 6) % 7;
  w1.setUTCDate(w1.getUTCDate() - d1 + 3);
  const w = 1 + Math.round((t - w1) / (7 * 864e5));
  return t.getUTCFullYear() + '-W' + (w < 10 ? '0' : '') + w;
}
function weekOk(w) { return typeof w === 'string' && /^\d{4}-W\d{2}$/.test(w); }

function clampInt(v, lo, hi) {
  const n = Math.round(Number(v));
  if (!isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
/* 닉네임: 1~12자, 제어문자·꺾쇠 제거, 실명·연락처·이메일 모양 거절 */
function cleanNick(v) {
  if (typeof v !== 'string') return '';
  let t = v.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim();
  if (!t || t.length > 12) return '';
  if (/[@/\\]|https?:|\.(com|net|kr|co\.kr)|[0-9]{7,}/i.test(t)) return '';
  return t;
}
function hash(str) {
  /* FNV-1a 2회(다른 오프셋) — 외부 의존성 없는 짧은 키. 충돌은 드물고, 충돌해도 그 주의 한 줄만 덮인다. */
  let a = 0x811c9dc5, b = 0x01000193;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    a ^= c; a = Math.imul(a, 0x01000193) >>> 0;
    b ^= (c + i); b = Math.imul(b, 0x85ebca6b) >>> 0;
  }
  return (a.toString(36) + b.toString(36)).slice(0, 16);
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

async function loadWeek(store, week) {
  const out = [];
  let blobs = [];
  try { const r = await store.list({ prefix: 'w/' + week + '/' }); blobs = (r && r.blobs) || []; } catch (e) { blobs = []; }
  for (const b of blobs.slice(0, LIST_CAP)) {
    try {
      const e = await store.get(b.key, { type: 'json' });
      if (e && typeof e.n === 'string' && isFinite(e.r)) out.push({ nick: e.n, rev: clampInt(e.r, 0, MAX_REV), stg: clampInt(e.s, 0, 5), theme: (e.t === 'hotel' ? 'hotel' : 'store') });
    } catch (e) { /* 깨진 줄은 건너뛴다 */ }
  }
  out.sort((x, y) => (y.rev - x.rev) || (x.nick < y.nick ? -1 : x.nick > y.nick ? 1 : 0));
  return out;
}

exports.handler = async function (event) {
  const h = event.headers || {};
  const origin = h.origin || h.Origin || '';
  const okOrigin = ALLOWED_ORIGINS.indexOf(origin) >= 0;
  const headers = {
    'Access-Control-Allow-Origin': okOrigin ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  };
  const reply = (code, obj) => ({ statusCode: code, headers, body: JSON.stringify(obj) });
  const method = (event.httpMethod || 'GET').toUpperCase();
  if (method === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (method !== 'GET' && method !== 'POST') return reply(405, { error: 'method' });
  if (method === 'POST' && !okOrigin) return reply(403, { error: 'origin' });

  let store;
  try { connectLambda(event); store = getStore(STORE_NAME); }
  catch (e) { return reply(503, { error: 'blobs', detail: String((e && e.message) || e).slice(0, 120) }); }

  if (method === 'GET') {
    const q = event.queryStringParameters || {};
    const week = weekOk(q.week) ? q.week : weekKey(Date.now());
    const list = await loadWeek(store, week);
    const nick = cleanNick(q.nick || '');
    let me = null;
    if (nick) {
      const i = list.findIndex((x) => x.nick === nick);
      if (i >= 0) me = { rank: i + 1, nick: list[i].nick, rev: list[i].rev };
    }
    return reply(200, { week: week, count: list.length, top: list.slice(0, TOP_N), me: me });
  }

  /* ---- POST: 내 기록 등록 ---- */
  const ip = String(h['x-nf-client-connection-ip'] || (h['x-forwarded-for'] || '').split(',')[0].trim() || 'x');
  if (limited(ip)) return reply(429, { error: 'rate' });
  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '');
  if (raw.length > MAX_BODY) return reply(413, { error: 'size' });
  let b;
  try { b = JSON.parse(raw || '{}'); } catch (e) { return reply(400, { error: 'json' }); }
  if (!b || typeof b !== 'object') return reply(400, { error: 'body' });

  const nick = cleanNick(b.nick);
  if (!nick) return reply(400, { error: 'nick' });
  const revRaw = Number(b.rev);
  if (!isFinite(revRaw) || revRaw < 0) return reply(400, { error: 'rev' });
  const rev = clampInt(revRaw, 0, MAX_REV);
  const stg = clampInt(b.stg, 0, 5);
  const theme = (b.theme === 'hotel') ? 'hotel' : 'store';

  const week = weekKey(Date.now());
  const key = 'w/' + week + '/' + hash(ip + '|' + nick);
  let prev = null;
  try { prev = await store.get(key, { type: 'json' }); } catch (e) { prev = null; }
  if (!prev || !isFinite(prev.r) || rev >= Number(prev.r)) {
    try { await store.setJSON(key, { n: nick, r: rev, s: stg, t: theme, u: Date.now() }); }
    catch (e) { return reply(503, { error: 'write' }); }
  }

  const stored = (prev && isFinite(prev.r) && Number(prev.r) > rev) ? clampInt(prev.r, 0, MAX_REV) : rev;
  let rank = null, count = 0;
  try {
    const list = await loadWeek(store, week);
    count = list.length;
    const i = list.findIndex((x) => x.nick === nick);
    if (i >= 0) rank = i + 1;
  } catch (e) { /* 순위 계산 실패는 등록 성공을 막지 않는다 */ }
  return reply(200, { ok: 1, week: week, rank: rank, rev: stored, count: count });
};
