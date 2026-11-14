/* 테스트 공용 도구 — 게임 페이지를 오프라인으로 띄우고, 게임 안 훅(window.__H, window.__T)으로 상태를 조작한다.
   window.__T는 tech.html이 file:// 로 열리거나 ?test=1 일 때만 생긴다. */
const fs=require('fs'), path=require('path'), puppeteer=require('puppeteer-core');
const ROOT=path.resolve(__dirname,'..'), RUN=path.join(__dirname,'.run'), SHOTS=path.join(__dirname,'shots');
const W=ms=>new Promise(r=>setTimeout(r,ms));
function chromePath(){ const c=[process.env.CHROME,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean); for(const p of c){ try{ if(fs.existsSync(p)) return p; }catch(e){} } throw new Error('Chrome을 찾지 못했어요. CHROME=/경로/chrome 으로 지정하세요'); }
/* 저장소 파일을 .run/ 으로 복사하고, CDN three.js를 로컬 node_modules로 바꾼다 */
function prep(){ fs.mkdirSync(RUN,{recursive:true}); fs.mkdirSync(SHOTS,{recursive:true});
  for(const f of fs.readdirSync(ROOT)){ if(/\.(js|jpg|png|txt|webmanifest)$/.test(f)) fs.copyFileSync(path.join(ROOT,f),path.join(RUN,f)); }
  for(const f of ['tech.html','tech-test.html']){ let s=fs.readFileSync(path.join(ROOT,f),'utf8');
    s=s.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','../node_modules/three/build/three.min.js').replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.128\.0\/examples\/js\//g,'../node_modules/three/examples/js/');
    fs.writeFileSync(path.join(RUN,f),s); } }
async function launch(mode){ return puppeteer.launch({executablePath:chromePath(),headless:true,args:['--no-sandbox','--allow-file-access-from-files',...(mode==='2d'?['--disable-gpu','--disable-3d-apis']:['--use-gl=swiftshader','--enable-unsafe-swiftshader'])]}); }
function fileFor(mode){ return 'file://'+path.join(RUN,mode==='2d'?'tech-test.html':'tech.html'); }
/* 페이지 열기. opts.state(S 객체에 덮어쓸 값)가 있으면 한 번 열어 저장한 뒤 다시 연다 */
async function open(browser,mode,opts){ opts=opts||{}; const pg=await browser.newPage(); await pg.setViewport({width:opts.w||393,height:opts.h||852,isMobile:true,hasTouch:true});
  const errs=[]; pg.on('pageerror',e=>errs.push(String(e.message).slice(0,200)));
  await pg.evaluateOnNewDocument(r=>{ window.__NOWARM=1; window.__NR=r?0:1; },!!opts.render);
  const boot=mode==='2d'?6000:13000;
  pg.goto(fileFor(mode)).catch(()=>{}); await W(boot);
  if(opts.state){ await pg.evaluate(st=>{ const S=window.__H.S; Object.assign(S,st); S.seen=1; const x=new Date(); S.att={n:1,d:x.getFullYear()+'-'+(x.getMonth()+1)+'-'+x.getDate()}; S.offer=1;
      localStorage.setItem(Object.keys(localStorage).find(k=>/^bunsik-tech/.test(k))||'bunsik-tech-v1',JSON.stringify(S)); window.__noSave=1; sessionStorage.setItem('tech-skip','1'); },opts.state);
    pg.goto(fileFor(mode)).catch(()=>{}); await W(boot); }
  const T={pg,errs,
    ev:(f,...a)=>pg.evaluate(f,...a),
    click:id=>pg.evaluate(id=>{ const e=document.getElementById(id); if(e){ e.click(); return true; } return false; },id),
    modalText:()=>pg.evaluate(()=>{ const m=document.getElementById('modal'); return m.classList.contains('on')?document.getElementById('mbox').innerText.replace(/\n+/g,' | '):''; }),
    shot:n=>pg.screenshot({path:path.join(SHOTS,n+'.png')}),
    async toPreDay(){ const t=await pg.evaluate(()=>{ const e=document.getElementById('title'); return !!e&&getComputedStyle(e).display!=='none'; }); if(t){ await T.click('tStart'); await W(1500); await T.click('rdGo'); await W(4000); }
      for(let i=0;i<10;i++){ if(await pg.evaluate(()=>!!document.getElementById('dayGo'))) return true; if(await T.click('attGo')){ await W(1000); continue; } if(await T.click('ofNo')){ await W(700); continue; } if(await T.click('mOk')){ await W(600); continue; } await W(700); } return false; },
    async startDay(){ await T.toPreDay(); await T.click('dayGo'); await W(800); },
    /* 매출·민원을 직접 넣고 영업을 끝낸다 (mult = 목표 대비 배수) */
    async endDay(mult,comp){ await pg.evaluate((m,c)=>{ const T=window.__T, S=window.__H.S; T.rev=Math.round(T.dayCfg(S.day).goal*m); T.comp=c; T.nps=[10,10,9,9]; T.revs=[5,5,5,5]; S.reviews=[5,5,5,5,5,5]; window.__H.endNow(); },mult,comp); await W(3500); return T.modalText(); },
    close:()=>pg.close()};
  return T; }
module.exports={prep,launch,open,W,ROOT,RUN,SHOTS};
