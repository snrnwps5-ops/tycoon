/* 2D 판(tech-test.html)이 3D 판(tech.html)의 게임 로직을 빠짐없이 갖고 있는지 확인 — 빌드가 어긋나면 여기서 잡힌다 */
const fs=require('fs'), path=require('path');
module.exports={name:'2D·3D 로직 동기화', static:true, modes:['-'], async run({assert,L}){
  const a=fs.readFileSync(path.join(L.ROOT,'tech.html'),'utf8'), b=fs.readFileSync(path.join(L.ROOT,'tech-test.html'),'utf8'), idx=fs.readFileSync(path.join(L.ROOT,'index.html'),'utf8');
  assert(a===idx,'index.html이 tech.html과 다릅니다 (cp tech.html index.html)');
  const v=fs.readFileSync(path.join(L.ROOT,'version.txt'),'utf8').trim(); const va=(a.match(/var V='(\d+)'/)||[])[1], vb=(b.match(/var V='(\d+)'/)||[])[1];
  assert(/^\d+$/.test(v),'version.txt는 숫자여야 합니다 (지금: '+v+')'); assert(va===v,'tech.html var V('+va+') ≠ version.txt('+v+')'); assert(vb===v,'tech-test.html var V('+vb+') ≠ version.txt('+v+')');
  const names=[...new Set((a.match(/function (lv|lp|mgr|staffLook|navFree|scout)[A-Za-z0-9_]*/g)||[]).map(s=>s.slice(9)))];
  const miss=names.filter(n=>b.indexOf('function '+n+'(')<0); assert(!miss.length,'2D 판에 없는 함수: '+miss.join(', '));
  assert(names.length>30,'검사할 함수 목록이 너무 적어요('+names.length+') — 이름 규칙이 바뀌었는지 확인');
}};
