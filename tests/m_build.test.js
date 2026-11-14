/* _t2d/build.py로 다시 만든 2D 판이 저장소의 tech-test.html과 똑같은지 — 손으로 고친 2D 판과 빌드가 어긋나면 다음 빌드 때 기능이 사라진다 */
const fs=require('fs'), path=require('path'), os=require('os'), cp=require('child_process');
module.exports={name:'2D 빌드 스크립트 = 저장소 2D 판', static:true, modes:['-'], async run({assert,L}){
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'t2d-')), T2=path.join(tmp,'_t2d'); fs.mkdirSync(T2);
  for(const f of fs.readdirSync(path.join(L.ROOT,'_t2d'))) fs.copyFileSync(path.join(L.ROOT,'_t2d',f),path.join(T2,f));
  fs.copyFileSync(path.join(L.ROOT,'tech.html'),path.join(tmp,'tech.html'));
  try{ cp.execFileSync('python3',['-I',path.join(T2,'build.py')],{stdio:'pipe'}); }catch(e){ assert(false,'build.py 실행 실패: '+String(e.stderr||e.message).slice(0,200)); return; }
  const a=fs.readFileSync(path.join(tmp,'tech-test.html'),'utf8'), b=fs.readFileSync(path.join(L.ROOT,'tech-test.html'),'utf8');
  if(a!==b){ const al=a.split('\n'), bl=b.split('\n'); let i=0; while(i<al.length&&al[i]===bl[i]) i++; assert(false,'빌드 결과가 tech-test.html과 달라요 ('+(i+1)+'번째 줄부터) → python3 _t2d/build.py 로 다시 만들고 커밋하세요'); }
  fs.rmSync(tmp,{recursive:true,force:true}); }};
