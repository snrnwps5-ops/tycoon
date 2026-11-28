/* 테스트 공용 도구 — 게임 페이지를 오프라인으로 띄우고, 게임 안 훅(window.__H, window.__T)으로 상태를 조작한다.
   window.__T는 tech.html이 file:// 로 열리거나 ?test=1 일 때만 생긴다. */
const fs=require('fs'), path=require('path'), puppeteer=require('puppeteer-core');
const ROOT=path.resolve(__dirname,'..'), RUN=path.join(__dirname,'.run'), SHOTS=path.join(__dirname,'shots');
const W=ms=>new Promise(r=>setTimeout(r,ms));
function chromePath(){ const c=[process.env.CHROME,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean); for(const p of c){ try{ if(fs.existsSync(p)) return p; }catch(e){} } throw new Error('Chrome을 찾지 못했어요. CHROME=/경로/chrome 으로 지정하세요'); }
/* 저장소 파일을 .run/ 으로 복사하고, CDN three.js를 로컬 node_modules로 바꾼다 */
function prep(){ fs.mkdirSync(RUN,{recursive:true}); fs.mkdirSync(SHOTS,{recursive:true});
  for(const f of fs.readdirSync(ROOT)){ if(/\.(js|jpg|png|webp|txt|webmanifest)$/.test(f)) fs.copyFileSync(path.join(ROOT,f),path.join(RUN,f)); } try{ fs.mkdirSync(path.join(RUN,'fonts'),{recursive:true}); for(const f of fs.readdirSync(path.join(ROOT,'fonts'))) fs.copyFileSync(path.join(ROOT,'fonts',f),path.join(RUN,'fonts',f)); }catch(e){}
  /* v2.99: node_modules(three)가 없으면 CDN 주소를 그대로 둔다 — npm install 없이도 돌릴 수 있게 */
  const hasThree=fs.existsSync(path.join(__dirname,'node_modules','three','build','three.min.js'));
  for(const f of ['tech.html','tech-test.html']){ let s=fs.readFileSync(path.join(ROOT,f),'utf8');
    if(hasThree) s=s.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','../node_modules/three/build/three.min.js').replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.128\.0\/examples\/js\//g,'../node_modules/three/examples/js/');
    fs.writeFileSync(path.join(RUN,f),s); } }
async function launch(mode){ return puppeteer.launch({executablePath:chromePath(),headless:true,args:['--no-sandbox','--allow-file-access-from-files',...(mode==='2d'?['--disable-gpu','--disable-3d-apis']:['--use-gl=swiftshader','--enable-unsafe-swiftshader'])]}); }
function fileFor(mode){ return 'file://'+path.join(RUN,mode==='2d'?'tech-test.html':'tech.html'); }
/* 페이지 열기. opts.state(S 객체에 덮어쓸 값)가 있으면 한 번 열어 저장한 뒤 다시 연다 */
async function open(browser,mode,opts){ opts=opts||{}; const pg=await browser.newPage(); await pg.setViewport({width:opts.w||393,height:opts.h||852,isMobile:true,hasTouch:true});
  const errs=[]; pg.on('pageerror',e=>errs.push(String(e.message).slice(0,200)));
  await pg.evaluateOnNewDocument((r,ft)=>{ window.__NOWARM=1; window.__NR=r?0:1; if(!ft) window.__NOFTUE=1; },!!opts.render,!!opts.ftue);
  const boot=mode==='2d'?6000:13000;
  pg.goto(fileFor(mode)).catch(()=>{}); await W(boot);
  /* v2.99: 소프트웨어 렌더링 환경에서는 3D 첫 화면이 13초를 넘길 때가 있다 — 훅이 뜰 때까지 기다린다 */
  try{ await pg.waitForFunction(()=>!!(window.__T&&window.__H&&window.__H.S),{timeout:90000}); }catch(e){}
  /* v2.99: 2D 판은 세이브 키가 bunsik-tech-2d-v1로 분리돼 있다 — 예전처럼 'bunsik-tech-v1'로 fallback 하면
     2D에서 상태 주입이 조용히 실패해 day/단계가 늘 1일차로 남았다. 판별한 키에 직접 쓴다. */
  if(opts.state){ await pg.evaluate((st,is2d)=>{ const S=window.__H.S; Object.assign(S,st); S.seen=1; const x=new Date(); S.att={n:1,d:x.getFullYear()+'-'+(x.getMonth()+1)+'-'+x.getDate()}; S.offer=1;
      const KEY=Object.keys(localStorage).find(k=>/^bunsik-tech/.test(k))||(is2d?'bunsik-tech-2d-v1':'bunsik-tech-v1');
      localStorage.setItem(KEY,JSON.stringify(S)); window.__noSave=1; sessionStorage.setItem('tech-skip','1'); },opts.state,mode==='2d');
    pg.goto(fileFor(mode)).catch(()=>{}); await W(boot); }
  const T={pg,errs,
    ev:(f,...a)=>pg.evaluate(f,...a),
    click:id=>pg.evaluate(id=>{ const e=document.getElementById(id); if(e){ e.click(); return true; } return false; },id),
    modalText:()=>pg.evaluate(()=>{ const m=document.getElementById('modal'); return m.classList.contains('on')?document.getElementById('mbox').innerText.replace(/\n+/g,' | '):''; }),
    shot:n=>pg.screenshot({path:path.join(SHOTS,n+'.png')}),
    /* v2.99: 출근 허브의 '영업 시작' 버튼 id는 v262Go (옛 rdGo는 사라졌다). 신규 유저는 허브 없이 바로 DAY 1. */
    /* v2.99: 출근 허브의 '영업 시작' id는 v262Go. 신규 유저(FTUE)와 2D 판은 허브 없이 바로 시작한다. */
    async toPreDay(){ const t=await pg.evaluate(()=>{ const e=document.getElementById('title'); return !!e&&getComputedStyle(e).display!=='none'; }); if(t){ await T.click('tStart'); await W(2000); }
      /* v2.99: v2.62 출근 허브가 영업 준비창 앞에 있다. 허브의 [📋 오늘 정보·전략]을 눌러야 예전 '영업 준비창'
         (목표·판매 전략·[영업 시작])으로 들어간다. 허브의 [영업 시작!](v262Go)은 준비창을 건너뛰고 바로 영업을 연다. */
      const hubGo=async()=>{ const k=await pg.evaluate(()=>{ const b=document.querySelector('#mbox [data-v2="go"][data-k="info"]')||document.getElementById('v262Go'); if(!b) return ''; b.click(); return b.getAttribute('data-k')||'go'; }); if(k){ await W(1500); return true; } return false; };
      for(let i=0;i<14;i++){ if(await pg.evaluate(()=>!!document.getElementById('dayGo'))) return true;
        if(await pg.evaluate(()=>{ const b=document.getElementById('v262Go'); return !!(b&&b.offsetParent); })){ await hubGo(); continue; }
        if(await T.click('attGo')){ await W(1000); continue; } if(await T.click('ofNo')){ await W(700); continue; } if(await T.click('mOk')){ await W(600); continue; } await W(700); } return false; },
    async startDay(){ await T.toPreDay(); await T.click('dayGo'); await W(800); },
    /* 매출·민원을 직접 넣고 영업을 끝낸다 (mult = 목표 대비 배수) */
    async endDay(mult,comp){ await pg.evaluate((m,c)=>{ const T=window.__T, S=window.__H.S; T.rev=Math.round(T.dayCfg(S.day).goal*m); T.comp=c; T.nps=[10,10,9,9]; T.revs=[5,5,5,5]; S.reviews=[5,5,5,5,5,5]; window.__H.endNow(); },mult,comp); await W(3500); return T.modalText(); },
    close:()=>pg.close()};
  return T; }
module.exports={prep,launch,open,W,ROOT,RUN,SHOTS};
