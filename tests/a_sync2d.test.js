/* 2D 판(tech-test.html)이 3D 판(tech.html)의 게임 로직을 빠짐없이 갖고 있는지 확인 — 빌드가 어긋나면 여기서 잡힌다
   v2.99: 버전 체계가 'v2.xx' 형식으로 바뀌어(version.txt·var V 모두 v 접두어) 검사식을 함께 고쳤다. */
const fs=require('fs'), path=require('path');
module.exports={name:'2D·3D 로직 동기화', static:true, modes:['-'], async run({assert,L}){
  const a=fs.readFileSync(path.join(L.ROOT,'tech.html'),'utf8'), b=fs.readFileSync(path.join(L.ROOT,'tech-test.html'),'utf8'), idx=fs.readFileSync(path.join(L.ROOT,'index.html'),'utf8');
  const head=fs.readFileSync(path.join(L.ROOT,'_t2d','part_head.html'),'utf8'), ver=fs.readFileSync(path.join(L.ROOT,'version.txt'),'utf8').trim();
  assert(a===idx,'index.html이 tech.html과 다릅니다 (cp tech.html index.html)');
  const va=(a.match(/var V='([^']+)'/)||[])[1], vb=(b.match(/var V='([^']+)'/)||[])[1], vh=(head.match(/var V='([^']+)'/)||[])[1];
  assert(/^v\d+\.\d+$/.test(ver),'version.txt는 v2.xx 형식이어야 합니다 (지금: '+ver+')');
  assert(va===ver,'tech.html var V('+va+') ≠ version.txt('+ver+')');
  assert(vb===ver,'tech-test.html var V('+vb+') ≠ version.txt('+ver+')');
  assert(vh===ver,'_t2d/part_head.html var V('+vh+') ≠ version.txt('+ver+')');
  const tv=(a.match(/<div class="tv">([^<]+)<\/div>/)||[])[1];
  assert(tv===ver,'타이틀에 보이는 버전('+tv+') ≠ version.txt('+ver+')');
  const names=[...new Set((a.match(/function (lv|lp|mgr|staffLook|navFree|scout|rsu|poach|mkt)[A-Za-z0-9_]*/g)||[]).map(s=>s.slice(9)))];
  const miss=names.filter(n=>b.indexOf('function '+n+'(')<0); assert(!miss.length,'2D 판에 없는 함수: '+miss.join(', '));
  assert(names.length>30,'검사할 함수 목록이 너무 적어요('+names.length+') — 이름 규칙이 바뀌었는지 확인');
}};
