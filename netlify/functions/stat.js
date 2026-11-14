/* 익명 플레이 통계 (v2.43) — "어디서 그만두는지" 보려고 만든 최소한의 집계.
   - 개인정보 없음: 기기마다 무작위로 만든 id(uid)와 진행 숫자(몇 일차·매장·별)만 받는다. IP는 저장하지 않는다.
   - 저장: Netlify Blobs 'tycoon-stats' 스토어, 사용자당 키 1개(u/<uid>)를 덮어쓴다 → 동시 쓰기 충돌 없음.
   - POST  (게임이 보냄): {uid, ev:'sess'|'day', d, stg, st}
   - GET   (사람이 봄):   /.netlify/functions/stat → 이탈 지점 요약 JSON
   설정에서 '익명 플레이 통계'를 끄면 게임이 아예 보내지 않는다. */
const { getStore, connectLambda } = require('@netlify/blobs');

const ALLOWED_ORIGINS = ['https://snrnwps5-ops.github.io', 'https://mega-tech-tycoon.netlify.app'];
const RATE = { windowMs: 60 * 1000, max: 20 };
const hits = new Map();
function limited(ip) {
  const now = Date.now(); const rec = hits.get(ip) || { t: now, n: 0 };
  if (now - rec.t > RATE.windowMs) { rec.t = now; rec.n = 0; }
  rec.n++; hits.set(ip, rec);
  if (hits.size > 5000) { for (const [k, v] of hits) { if (now - v.t > RATE.windowMs) hits.delete(k); } }
  return rec.n > RATE.max;
}
const int = (v, lo, hi) => { v = Math.round(+v); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo; };

exports.handler = async function (event) {
  const h = event.headers || {};
  const origin = h.origin || h.Origin || '';
  const okOrigin = ALLOWED_ORIGINS.indexOf(origin) >= 0;
  const headers = {
    'Access-Control-Allow-Origin': okOrigin ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin', 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'
  };
  const reply = (statusCode, obj) => ({ statusCode, headers, body: JSON.stringify(obj) });
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  if (event.httpMethod === 'POST' && !okOrigin) return reply(403, { error: 'origin' });
  let store;
  try { connectLambda(event); store = getStore('tycoon-stats'); } catch (e) { return reply(503, { error: 'blobs', detail: String(e.message || e).slice(0, 120) }); }

  if (event.httpMethod === 'POST') {
    const ip = (h['x-nf-client-connection-ip'] || h['x-forwarded-for'] || '').split(',')[0].trim();
    if (limited(ip)) return reply(429, { error: 'rate' });
    if ((event.body || '').length > 600) return reply(413, { error: 'size' });
    let b; try { b = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '{}')); } catch (e) { return reply(400, { error: 'json' }); }
    const uid = String(b.uid || '');
    if (!/^[a-z0-9]{12,24}$/.test(uid)) return reply(400, { error: 'uid' });
    const ev = b.ev === 'day' ? 'day' : 'sess';
    const now = Date.now(), key = 'u/' + uid;
    let u = null; try { u = await store.get(key, { type: 'json' }); } catch (e) { u = null; }
    u = u || { f: now, n: 0, p: 0, d: 0, s: 0, st: 0 };
    u.l = now; u.d = Math.max(u.d || 0, int(b.d, 0, 999)); u.s = Math.max(u.s || 0, int(b.stg, 0, 20)); u.st = Math.max(u.st || 0, int(b.st, 0, 9999));
    if (ev === 'sess') u.n = (u.n || 0) + 1; else u.p = (u.p || 0) + 1;
    await store.setJSON(key, u);
    return reply(200, { ok: 1 });
  }

  if (event.httpMethod === 'GET') {
    const now = Date.now(), DAY = 864e5;
    const users = [];
    const { blobs } = await store.list({ prefix: 'u/' });
    for (const b of blobs.slice(0, 3000)) { try { const u = await store.get(b.key, { type: 'json' }); if (u) users.push(u); } catch (e) {} }
    const quit = users.filter(u => now - u.l > 3 * DAY);           // 3일 넘게 안 들어온 사람 = 이탈로 본다
    const hist = {}; quit.forEach(u => { hist[u.d] = (hist[u.d] || 0) + 1; });
    const reach = {}; for (let d = 1; d <= 30; d++) reach[d] = users.filter(u => u.d >= d).length;
    const stage = {}; users.forEach(u => { stage[u.s] = (stage[u.s] || 0) + 1; });
    return reply(200, {
      설명: '게임 일차(d)는 0부터. 이탈 = 3일 넘게 안 들어온 사람. 이탈_일차별: 그 사람들이 마지막으로 도달한 일차.',
      전체: users.length,
      최근24시간: users.filter(u => now - u.l < DAY).length,
      이탈: quit.length,
      이탈_일차별: hist,
      일차_도달수: reach,
      최고매장별: stage,
      평균_접속횟수: users.length ? +(users.reduce((a, u) => a + (u.n || 0), 0) / users.length).toFixed(1) : 0,
      평균_플레이일수: users.length ? +(users.reduce((a, u) => a + (u.p || 0), 0) / users.length).toFixed(1) : 0
    });
  }
  return reply(405, { error: 'method' });
};
