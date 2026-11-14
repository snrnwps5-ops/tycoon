/* 사용법: cd tests && npm i && npm test   (Chrome 경로가 다르면 CHROME=/경로 npm test)
   옵션: --only3d / --only2d / --grep 이름 */
const fs=require('fs'), path=require('path'), L=require('./lib');
const argv=process.argv.slice(2), only=argv.includes('--only3d')?'3d':argv.includes('--only2d')?'2d':null, gi=argv.indexOf('--grep'), grep=gi>=0?argv[gi+1]:null;
(async()=>{ L.prep(); const files=fs.readdirSync(__dirname).filter(f=>/\.test\.js$/.test(f)).sort(); let pass=0, fail=0; const out=[];
  for(const f of files){ const t=require(path.join(__dirname,f)); if(grep&&t.name.indexOf(grep)<0&&f.indexOf(grep)<0) continue;
    for(const mode of (t.modes||['3d','2d'])){ if(only&&mode!==only) continue; const fails=[]; const assert=(c,m)=>{ if(!c) fails.push(m); };
      const t0=Date.now(); let b=null;
      try{ b=t.static?null:await L.launch(mode); await t.run({browser:b,mode,assert,L}); }catch(e){ fails.push('예외: '+String(e&&e.message||e).slice(0,200)); }
      try{ if(b) await b.close(); }catch(e){}
      const ok=!fails.length; ok?pass++:fail++; const line=(ok?'✅ PASS':'❌ FAIL')+'  '+t.name+' ['+mode+'] '+Math.round((Date.now()-t0)/1000)+'s'+(ok?'':'\n      - '+fails.join('\n      - ')); console.log(line); out.push(line); } }
  console.log('\n'+pass+' 통과 · '+fail+' 실패'); process.exit(fail?1:0); })();
