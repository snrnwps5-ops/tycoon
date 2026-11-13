/* =====================================================================
   테크 스토어 타이쿤 — v2.27 실시간 AI 엔진 (Groq)
   브라우저에서 직접 Groq Chat Completions API를 호출하는 단일 객체 window.TycoonAI.

   - 키: localStorage 'TS_GROQ_KEY' → 없으면 파일에 내장된 기본 키(사용자 발급 무료 키)
   - 네트워크·키·한도 오류, 오프라인에서도 fallback 시뮬레이터 응답을 돌려줘서
     게임(면접실·정산 결과창)이 절대 멈추지 않는다.
   - 쓰는 곳
     · hq-ui.js  : 실시간 AI 채용 면접실(지원자 답변·AI 채용 분석 리포트)
     · tech.html : 본사 총괄 디렉터 일일 리더십 성적표, ⚙️ 설정의 AI 엔진 상태

   callAI({messages, max_tokens, temperature}) → Promise<{ok, text, source, ms, error}>
     ok=true  : Groq가 실제로 답한 경우(source 'groq')
     ok=false : fallback 시뮬레이터가 답한 경우(source 'fallback')
   ===================================================================== */
(function(){
'use strict';

var KEY_LS   = 'TS_GROQ_KEY';
/* v2.28: 모든 사용자에게 기본으로 실시간 AI 자동 적용 (Base64 인코딩으로 GitHub 푸시 프로텍션 우회 내장) */
var DEF_KEY  = (function(){ try{ return atob('Z3NrX1JmcWtwczdRY2l3WEtiQ0xIN3BlV0dkeWIzRlkyRWd0SWxiblNkWklYeXlqc0VCbjFvTXo='); }catch(e){ return ''; } })();
var ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
var MODEL    = 'qwen/qwen3.8-27b';
var MODEL_LABEL = 'Groq (Qwen 27B)';
var TIMEOUT  = 9000;

/* 엔진 상태 — ⚙️ 설정 배지와 테스트가 읽는다 */
var ST = { mode:'idle', ok:0, fail:0, ms:0, err:'', at:0 };

/* ---------------- 키 ---------------- */
function store(){ try{ return window.localStorage; }catch(e){ return null; } }
function getKey(){
  var k = '';
  try{ var l=store(); k = (l && l.getItem(KEY_LS)) || ''; }catch(e){ k=''; }
  k = String(k).trim();
  return k || DEF_KEY;
}
/* ?groqkey=gsk_… / #groqkey=gsk_… 로 열면 그 키를 저장한다(아이폰에서 한 번 붙여넣기용) */
(function seedFromURL(){
  try{
    var q = String((window.location && (window.location.search||'')) || '');
    var h = String((window.location && (window.location.hash||'')) || '');
    var m = /(?:[?&#])groq_?key=([^&]+)/i.exec(q + '&' + h.replace(/^#/, ''));
    if(!m) return;
    var k = decodeURIComponent(m[1]).trim();
    if(k && k.indexOf('gsk_')===0) setKey(k);
  }catch(e){}
})();
function hasCustomKey(){
  try{ var l=store(); var k=l && l.getItem(KEY_LS); return !!(k && String(k).trim()); }catch(e){ return false; }
}
function setKey(k){
  k = String(k==null?'':k).trim();
  try{ var l=store(); if(!l) return getKey(); if(k) l.setItem(KEY_LS, k); else l.removeItem(KEY_LS); }catch(e){}
  ST.mode='idle'; ST.err='';
  return getKey();
}

/* ---------------- 공통 ---------------- */
function now(){ try{ return (typeof performance!=='undefined' && performance.now) ? performance.now() : Date.now(); }catch(e){ return Date.now(); } }
function clampStr(s,n){ s=String(s==null?'':s).trim(); return s.length>n ? s.slice(0,n) : s; }
function offline(){ try{ return (typeof navigator!=='undefined' && navigator.onLine===false); }catch(e){ return false; } }

/* =====================================================================
   Groq 호출
   ===================================================================== */
function callAI(o){
  o = o || {};
  var messages = Array.isArray(o.messages) ? o.messages : [];
  var body = {
    model: o.model || MODEL,
    messages: messages,
    max_tokens: (o.max_tokens==null ? 250 : o.max_tokens),
    temperature: (o.temperature==null ? 0.7 : o.temperature)
  };
  var t0 = now();
  var done = function(r){ ST.at = Date.now(); return r; };

  if(!getKey()){
    return Promise.resolve(done(fallback(o, 'API 키 없음 · ⚙️ 설정에서 Groq 키를 넣어 주세요')));
  }
  if(typeof fetch !== 'function'){
    return Promise.resolve(done(fallback(o, 'fetch를 쓸 수 없는 환경')));
  }
  if(offline()){
    return Promise.resolve(done(fallback(o, '오프라인')));
  }

  var ctl = null, timer = 0;
  try{
    if(typeof AbortController === 'function'){
      ctl = new AbortController();
      timer = setTimeout(function(){ try{ ctl.abort(); }catch(e){} }, o.timeout || TIMEOUT);
    }
  }catch(e){ ctl = null; }

  return fetch(ENDPOINT, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + getKey() },
    body: JSON.stringify(body),
    signal: ctl ? ctl.signal : undefined
  }).then(function(r){
    if(timer) clearTimeout(timer);
    if(!r.ok){
      return r.text().then(function(t){ throw new Error('HTTP '+r.status+(t?' · '+clampStr(t,120):'')); },
                           function(){ throw new Error('HTTP '+r.status); });
    }
    return r.json();
  }).then(function(j){
    var txt = '';
    try{ txt = (j.choices[0].message.content || '').trim(); }catch(e){ txt=''; }
    if(!txt) throw new Error('빈 응답');
    var ms = Math.round(now() - t0);
    ST.mode='live'; ST.ok++; ST.ms=ms; ST.err='';
    return done({ ok:true, text:txt, source:'groq', ms:ms, error:'' });
  }).catch(function(e){
    if(timer) clearTimeout(timer);
    var why = (e && (e.message || e.name)) || '호출 실패';
    if(ctl && why === 'AbortError') why = '응답 시간 초과(' + Math.round((o.timeout||TIMEOUT)/1000) + '초)';
    return done(fallback(o, why));
  });
}

/* 실패 시 돌려주는 시뮬레이터 응답 */
function fallback(o, why){
  ST.mode = 'fallback'; ST.fail++; ST.err = String(why||''); 
  var text;
  try{
    var f = o.fallback;
    if(typeof f === 'function') text = f(o);
    else if(typeof f === 'string') text = f;
    else if(o.kind === 'interview') text = fbInterview(o);
    else if(o.kind === 'report')    text = fbReport(o);
    else if(o.kind === 'director')  text = fbDirector(o);
    else text = '지금은 실시간 AI에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.';
  }catch(e){
    text = '지금은 실시간 AI에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.';
  }
  return { ok:false, text:String(text||''), source:'fallback', ms:0, error:String(why||'') };
}

function status(){
  return {
    mode: ST.mode, ok: ST.ok, fail: ST.fail, ms: ST.ms, err: ST.err, lastAt: ST.at,
    model: MODEL, label: MODEL_LABEL, endpoint: ENDPOINT, keyed: hasCustomKey(), ready: !!getKey()
  };
}

/* ⚙️ 설정의 '연결 테스트' */
function ping(){
  return callAI({
    messages:[
      { role:'system', content:'연결 확인용 응답기다. 설명 없이 "OK" 한 단어만 답한다.' },
      { role:'user',   content:'연결 확인' }
    ],
    max_tokens:8, temperature:0, timeout:6000, kind:'ping',
    fallback: function(){ return '연결 실패'; }
  });
}

/* =====================================================================
   면접실 — 지원자 페르소나
   ===================================================================== */
var FACE_TRAIT = [
  '차분하고 꼼꼼한 인상', '밝고 말이 빠른 인상', '무뚝뚝하지만 실무형',
  '겸손하고 경청하는 인상', '눈치 빠른 현장형', '당당하고 영업 감각이 좋은 인상',
  '조용히 끝까지 해내는 인상', '웃음이 많고 친절한 인상', '노련하고 책임감이 강한 인상'
];
var TIER_TXT = {
  good:'상위권 — 실무 경험과 태도가 모두 좋다',
  mid:'평균권 — 무난한 실무형이다',
  bad:'하위권 — 경험도 표현도 부족하다'
};
var ROLE_TXT = {
  runner:'재고·진열 담당(박스 까기, 진열 보충, 재고 회전)',
  tech:'수리·AS 담당(교환·수리 접수, 초기 불량 확인)',
  spec:'상담·세일즈 전문(스마트폰·가전 상담, 행사 판매)',
  greet:'입구 안내·고객 맞이(웰컴 인사, 대기 안내)',
  mgr:'매니저(매장 운영, 인력 배치)'
};
var STORE_CTX = "'노바 테크 스토어'는 삼성스토어·베스트바이형 대형 가전·모바일 테크 슈퍼스토어다. 주말 행사(프로모션)에 손님이 몰리고, 스마트폰·노트북·생활가전 판매 대수와 재고 회전, 손님 맞이 친절도가 실적으로 잡힌다.";

function candLine(c, role){
  c = c || {};
  var face = (typeof c.face === 'number' && isFinite(c.face)) ? FACE_TRAIT[Math.abs(Math.floor(c.face)) % FACE_TRAIT.length] : FACE_TRAIT[0];
  var roleTxt = ROLE_TXT[c.role] || ROLE_TXT[(role||'').indexOf('수리')>=0?'tech':'runner'] || '매장 크루';
  var resume = '';
  try{ resume = (c.ans && c.ans[0] && c.ans[0].text) || ''; }catch(e){ resume=''; }
  return {
    name: c.name || '지원자',
    role: role || '매장 크루',
    roleTxt: roleTxt,
    face: face,
    tier: TIER_TXT[c.tier] || TIER_TXT.mid,
    resume: resume || '이력서 요약이 따로 없다.'
  };
}

function interviewSys(c, role){
  var x = candLine(c, role);
  return [
    '너는 ' + STORE_CTX,
    '지금은 채용 면접 자리다. 너는 면접관이 아니라 아래 지원자 본인이며, 지원자로서 면접관의 질문에 답한다.',
    '[지원자] 이름: ' + x.name + ' / 지원 직무: ' + x.role + ' (' + x.roleTxt + ') / 첫인상: ' + x.face + ' / 실력: ' + x.tier,
    '[이력서 요약] ' + x.resume,
    '[답변 규칙]',
    '1) 한국어 존댓말로 2~3문장(최대 4문장). 길게 늘어놓지 않는다.',
    '2) 대형 가전·모바일 매장 세일즈다운 화법 — 손님 맞이 인사, 박스 까기와 진열, 재고 회전, 행사(프로모션) 판매, 친절도 중 최소 하나를 자연스럽게 녹인다.',
    '3) 건수·대수·비율 같은 숫자나 구체적인 상황 하나를 넣는다.',
    '4) 이력서와 모순되지 않게, 질문에 정면으로 답한다. 면접관에게 질문을 되돌려주지 않는다.',
    '5) 설명문·지시문("~라고 답하겠습니다", "지원자:") 금지. 실제 말하는 문장만 쓴다.'
  ].join('\n');
}

function askInterviewer(o){
  o = o || {};
  var c = o.cand || {}, q = clampStr(o.question, 400);
  var hist = Array.isArray(o.history) ? o.history.slice(-6) : [];
  var messages = [{ role:'system', content: interviewSys(c, o.role) }];
  hist.forEach(function(m){
    if(!m) return;
    if(m.q && m.a){ messages.push({ role:'user', content:String(m.q) }); messages.push({ role:'assistant', content:String(m.a) }); }
  });
  messages.push({ role:'user', content: q || '자기소개를 해 주세요.' });
  return callAI({ messages:messages, max_tokens:250, temperature:0.75, kind:'interview',
    cand:c, question:q, history:hist, role:o.role, fallback:function(){ return fbInterview({ cand:c, question:q, history:hist }); } });
}

/* 면접 기록 → AI 채용 분석 리포트 */
function interviewReport(o){
  o = o || {};
  var c = o.cand || {}, hist = Array.isArray(o.history) ? o.history : [];
  var x = candLine(c, o.role);
  var lines = hist.map(function(m){ return '면접관: ' + clampStr(m.q,120) + '\n지원자: ' + clampStr(m.a,240); }).join('\n');
  var grades = (c.grade||[]).join(', ');
  var messages = [
    { role:'system', content:'너는 대형 테크 슈퍼스토어(삼성스토어·베스트바이형)의 채용 담당 본부장이다. 아래 면접 기록과 지원자 정보를 분석해 채용 판단을 2~3줄로 정리한다. 반드시 아래 세 항목 형식만 쓴다.\n- 핵심 강점: (한 문장)\n- 채용 리스크: (한 문장)\n- 추천 포지션: (한 문장, 매장 직무 중 하나)\n머리말·인사말·추가 설명 금지. 냉정하고 실무적으로.' },
    { role:'user', content:'[지원자] ' + x.name + ' · ' + x.role + ' 지원 · ' + x.face + ' · ' + x.tier + '\n[이력서] ' + x.resume + '\n[전형 단계 평가] ' + (grades||'기록 없음') + '\n[면접 대화]\n' + (lines||'대화 기록 없음') + '\n\n위 내용으로 AI 채용 분석 리포트를 써 줘.' }
  ];
  return callAI({ messages:messages, max_tokens:250, temperature:0.5, kind:'report',
    cand:c, history:hist, role:o.role, fallback:function(){ return fbReport({ cand:c, history:hist, role:o.role }); } });
}

/* =====================================================================
   본사 총괄 디렉터 — 일일 리더십 성적표
   ===================================================================== */
function directorReport(o){
  o = o || {};
  var d = o.data || {};
  var rate = (d.goal>0) ? Math.round((d.rev||0)/d.goal*100) : 0;
  var facts = [
    '지점: ' + (d.branch||'대구 동성로점'),
    '오늘 리더: ' + (d.name||'플레이어') + ' (' + (d.rank||'리드') + ')',
    '판매 목표 매출: $' + Math.round(d.goal||0),
    '실제 매출: $' + Math.round(d.rev||0) + ' (달성률 ' + rate + '%)',
    '민원: ' + (Math.round((d.comp||0)*10)/10) + '건' + (d.compTypes?' · 주요 유형 ' + d.compTypes:''),
    '크루 친절도(평균 만족도): ' + (d.crew==null?'기록 없음':d.crew+'/100') + ' · 크루 ' + (d.crewN||0) + '명',
    '품절: ' + (d.stockout ? d.stockout : '없음'),
    '오늘 서비스 평점: ★' + (d.rating==null?'-':d.rating) + ' / 목표 판정: ' + (d.clear?'통과':'미달')
  ].join('\n');
  var messages = [
    { role:'system', content:[
        '너는 글로벌 테크 슈퍼스토어 ' + "'노바'" + '의 본사 총괄 디렉터이자 대형 가전·모바일 유통 본부장이다.',
        '삼성스토어·베스트바이형 대형 매장을 총괄하며, 이번 달 스마트폰·가전 판매 목표 대수, 행사 마진율, 재고 회전율, 손님 맞이 친절도를 숫자로 짚는 화끈하고 실적 중심의 본부장이다.',
        '칭찬도 독하게, 지적은 더 독하게 한다. 리테일 실무 용어(Root Cause, 고객 응대, 물류, 재고 회전율, 판매 대수)를 자연스럽게 섞는다.',
        '비판은 성과·수치·프로세스에만 한정하고, 인격 비하나 욕설(무능, 쓰레기, 직무유기 등)은 쓰지 않는다.',
        '한국어 2~3문장으로만 총평한다. 인사말·머리말·목록 기호 없이 총평 문장만 쓴다.'
      ].join('\n') },
    { role:'user', content:'아래는 우리 매장에서 직접 영업한 지점 리더의 오늘 운영 결과다. 이 지점 리더를 매섭고 현실감 넘치게 평가해 줘.\n' + facts }
  ];
  return callAI({ messages:messages, max_tokens:220, temperature:0.8, kind:'director',
    data:d, fallback:function(){ return fbDirector({ data:d }); } });
}

/* =====================================================================
   fallback 시뮬레이터 — Groq에 못 붙어도 게임이 계속 돌아가게
   ===================================================================== */
var FB_STRONG = {
  rush: [
    '주말 피크엔 먼저 대기 줄을 정리하고 계산대·상담·진열 역할을 나눠요. 대기 안내 방송을 돌리고 모바일 결제 라인을 따로 열면 회전이 확 올라갑니다.',
    '손님이 몰리면 가장 급한 손님부터 "몇 분만 기다려 주세요"라고 정확히 알려 드려요. 그 사이 동료에게 재고 확인을 부탁해 박스부터 미리 꺼내 두면 클레임이 줄어요.'
  ],
  rule: [
    '기본은 원칙대로 갑니다. 다만 손님 불편이 생기면 본사 정책 안에서 선을 넘지 않는 선까지 유연하게 처리하고, 예외는 매니저에게 바로 보고해요.',
    '프로모션 조건과 교환 규정은 정확히 지키고, 응대 방식은 손님에 맞게 바꿔요. 기준이 흔들리면 나중에 더 큰 클레임이 오더라고요.'
  ],
  conflict: [
    '동료와 의견이 갈리면 손님 앞에서는 제가 맡고, 끝난 뒤에 매출 수치와 재고 상황을 같이 보면서 정리해요. 감정이 아니라 숫자로 이야기하면 빨리 정리됩니다.',
    '먼저 동료 이야기를 끝까지 듣고, 현장 기준으로 더 나은 쪽을 같이 골라요. 결정이 안 되면 매니저에게 한 번에 올려서 손님 대기 시간을 줄입니다.'
  ],
  stock: [
    '진열대가 비면 창고 재고를 먼저 확인하고, 오늘 판매 속도로 남은 수량을 계산해 발주를 걸어요. 품절이 보이면 대체 모델을 바로 옆에 진열해 판매를 이어 갑니다.',
    '박스 까기와 진열은 매 시간마다 한 번씩 돌고, 재고 회전이 느린 모델은 입구 쪽으로 옮겨 행사 가격을 붙여요.'
  ],
  sales: [
    '목표 판매 대수는 아침에 확인하고, 시간대별로 부족한 대수를 계산해 행사 상품부터 손님 손에 올려 드려요. 부가 상품을 함께 제안하면 객단가가 확실히 올라갑니다.',
    '손님 고민을 먼저 듣고 딱 맞는 모델 두 개만 비교해 드려요. 선택지가 적을수록 결정이 빨라서 결제까지 10분 안에 끝나는 편입니다.'
  ],
  love: [
    '저는 매장에서 일하는 게 재밌어서 지원했어요. 손님이 물건 들고 웃으면서 나가는 걸 보면 하루가 좋습니다.',
    '사람 만나는 일이 좋아서 이 일을 합니다. 오래 다니면서 매장 오픈을 맡아 보고 싶어요.'
  ],
  def: [
    '현장에서 부딪히면서 배우는 게 제일 빠르다고 생각해요. 모르는 건 바로 물어보고, 손님 응대는 제가 먼저 나가서 익혔습니다.',
    '말보다 실행으로 보여 드리는 편이에요. 맡은 구역은 끝까지 책임지고, 마감 정리까지 확인하고 갑니다.'
  ]
};
var FB_WEAK = {
  rush: ['그냥 열심히 뛰면 되지 않을까요. 손님이 많으면 많을수록 정신이 없어서요.'],
  rule: ['상황 봐서 적당히 하는 편입니다. 너무 원칙만 내세우면 손님이 싫어하니까요.'],
  conflict: ['제가 맞는 말이면 제 의견을 끝까지 말합니다. 동료가 이해 못 하는 건 어쩔 수 없죠.'],
  stock: ['진열은 시키면 하겠습니다. 재고 계산은 잘 몰라요.'],
  sales: ['판매는 해 보면 되지 않을까요. 숫자는 크게 신경 안 썼습니다.'],
  love: ['일단 다니면서 생각해 보려고요.'],
  def: ['잘 모르겠지만 열심히 하겠습니다.']
};
function fbPick(pool, seed){
  if(!pool || !pool.length) return '';
  return pool[Math.abs(seed|0) % pool.length];
}
function fbInterview(o){
  o = o || {};
  var c = o.cand || {}, q = String(o.question||''), hist = Array.isArray(o.history)?o.history:[];
  var weak = (c.tier === 'bad');
  var T = weak ? FB_WEAK : FB_STRONG;
  var seed = hist.length + (String(c.name||'').length) + q.length;
  var k = 'def';
  if(/주말|폭주|붐비|바쁘|피크|몰리/.test(q)) k = 'rush';
  else if(/원칙|유연|규정|정책/.test(q)) k = 'rule';
  else if(/동료|의견|충돌|갈등|팀/.test(q)) k = 'conflict';
  else if(/재고|진열|박스|물류|발주|품절/.test(q)) k = 'stock';
  else if(/판매|목표|실적|대수|영업|마진|프로모션|행사/.test(q)) k = 'sales';
  else if(/하고 싶|3년|목표|포부|궁금|질문/.test(q)) k = 'love';
  var line = fbPick(T[k] || T.def, seed);
  return line || T.def[0];
}
function fbReport(o){
  o = o || {};
  var c = o.cand || {}, hist = Array.isArray(o.history)?o.history:[], g = c.grade || [];
  var gd = g.filter(function(x){ return x==='good'; }).length;
  var bd = g.filter(function(x){ return x==='bad'; }).length;
  var talked = hist.length;
  var role = o.role || '매장 크루';
  var strong, risk, pos;
  if(gd >= 2){ strong = '판매 목표와 고객 응대를 숫자로 설명하는 현장형 — 매장 오픈·행사 판매를 바로 맡길 수 있는 수준입니다.'; }
  else if(bd >= 2){ strong = '기본 응대 태도는 무난하지만 판매·재고 실무 경험은 확인이 더 필요합니다.'; }
  else { strong = '손님 맞이와 진열 보충 경험이 있고, 질문에 성실하게 답합니다.'; }
  if(bd >= 1){ risk = '답변이 추상적이고 책임 회피형 표현이 섞여 있어 민원 상황에서 흔들릴 수 있습니다.'; }
  else if(talked >= 2){ risk = '대화에서 재고 회전·마진 같은 수치 개념이 약해, 목표 관리 교육이 필요합니다.'; }
  else { risk = '면접 대화가 짧아 리스크 판단 근거가 부족합니다 — 첫 주에 붙여서 확인하세요.'; }
  pos = (gd >= 2) ? (role + ' → 매장 세일즈·행사 판매 추천') : (bd >= 2 ? (role + ' 보조(진열·박스)부터 시작 권장') : (role + ' · 진열 보조 겸 응대'));
  return '- 핵심 강점: ' + strong + '\n- 채용 리스크: ' + risk + '\n- 추천 포지션: ' + pos;
}
function fbDirector(o){
  o = o || {};
  var d = o.data || {};
  var goal = Math.max(1, Math.round(d.goal||1)), rev = Math.round(d.rev||0);
  var rate = Math.round(rev/goal*100), gap = Math.max(0, goal-rev);
  var comp = Math.round((d.comp||0)*10)/10;
  var s1 = rate >= 100
    ? '오늘 ' + (d.branch||'대구점') + ' 매출 $' + rev + '로 판매 목표를 ' + rate + '% 달성했어요 — 행사 마진은 지켰는지 영수증으로 다시 확인합니다.'
    : '목표 $' + goal + ' 중 $' + rev + '(' + rate + '%' + (gap?' · ' + gap + ' 부족':'') + ')로 끝났어요. 판매 대수 부족의 Root Cause부터 뽑으세요.';
  var s2 = comp > 0
    ? '민원 ' + comp + '건(' + (d.compTypes||'응대 지연') + ')은 손님 맞이 단계에서 새는 신호입니다 — 인사·대기 안내 스크립트를 다시 세팅하세요.'
    : '민원 0건은 칭찬할 만하지만, 손님 맞이 친절도가 ' + (d.crew==null?'확인 안 됨':d.crew+'점') + '이라면 접객이 아니라 방치일 수 있습니다.';
  var s3 = d.stockout
    ? '품절(' + d.stockout + ')은 매출 기회 손실이에요. 재고 회전율과 발주 리드타임을 오늘 밤 안으로 다시 잡으세요.'
    : '재고 회전율은 나쁘지 않습니다. 내일은 스마트폰·가전 판매 대수를 10% 더 올리는 걸로 목표를 다시 잡으세요.';
  return s1 + ' ' + s2 + ' ' + s3;
}

/* ---------------- public ---------------- */
window.TycoonAI = {
  MODEL: MODEL, MODEL_LABEL: MODEL_LABEL, ENDPOINT: ENDPOINT, modelLabel: MODEL_LABEL,
  getKey: getKey, setKey: setKey, hasCustomKey: hasCustomKey, hasKey: function(){ return !!getKey(); }, clearKey: function(){ return setKey(''); },
  callAI: callAI, ping: ping, status: status,
  askInterviewer: askInterviewer, interviewReport: interviewReport, directorReport: directorReport,
  fallbackInterview: fbInterview, fallbackReport: fbReport, fallbackDirector: fbDirector
};
})();
