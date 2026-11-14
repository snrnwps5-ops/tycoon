/* ---- service spots (2D) ---- */
const SPOTS=[]; const spot=(type,x,z,face,lock)=>{ const s={type:type,x:x,z:z,face:face,occ:null,on:!lock}; SPOTS.push(s); return s; };
const PICKG=new THREE.Group();
furn({k:'c',x:-5.2,z:-2.6,w:2.5,d:0.9,c:'#f4f5f7',label:'픽업'});
if(STG>=1) furn({k:'c',x:-3.4,z:-2.6,w:1.3,d:0.9,c:'#eef2f8',label:''});
ob(-6.45,-3.95,-2.97,-2.23); if(STG>=1) ob(-4.05,-2.75,-2.97,-2.23);
spot('pick',-5.8,-1.6,Math.PI); spot('pick',-4.6,-1.6,Math.PI); if(STG>=1) spot('pick',-3.4,-1.6,Math.PI);
const TW=STG>=2?3.0:2.4;
function salesTable(x,z){ furn({k:'table',x:x,z:z,w:TW,d:1.25,c:WOOD,label:'체험'}); ob(x-TW/2-0.05,x+TW/2+0.05,z-0.65,z+0.65); }
const T1=new THREE.Group(), T2=new THREE.Group(), T3=new THREE.Group(); T2.visible=false; T3.visible=false;
salesTable(-0.6,-0.6); spot('buy',-1.2,0.45,Math.PI); spot('buy',0.0,0.45,Math.PI);
salesTable(3.3,-0.6); spot('buy',2.7,0.45,Math.PI,true); spot('buy',3.9,0.45,Math.PI,true);
if(STG>=2){ salesTable(-3.4,1.4); spot('buy',-4.0,2.5,Math.PI); spot('buy',-2.8,2.5,Math.PI); }
// 수리 카운터 (오른쪽)
const REPG=new THREE.Group(); REPG.visible=false;
furn({k:'c',x:5.2,z:-4.6,w:2.5,d:0.8,c:'#eef4ee',label:'수리'});
if(STG>=1) furn({k:'c',x:3.4,z:-4.6,w:1.3,d:0.8,c:'#e8f0e8',label:''});
ob(3.95,6.45,-4.97,-4.23); if(STG>=1) ob(2.75,4.05,-4.97,-4.23);
spot('fix',4.6,-3.6,Math.PI,true); spot('fix',5.8,-3.6,Math.PI,true); if(STG>=1) spot('fix',3.4,-3.6,Math.PI,true);
// 소프트웨어 상담 바 (가운데 뒤)
const SUPG=new THREE.Group(); SUPG.visible=false;
furn({k:'table',x:0.4,z:-5.3,w:2.6,d:0.8,c:WOOD,label:'상담'});
ob(-0.95,1.75,-5.75,-4.85);
spot('sw',-0.2,-4.3,Math.PI,true); spot('sw',1.0,-4.3,Math.PI,true);
// 입구 안내
const GRG=new THREE.Group();
furn({k:'podium',x:-1.6,z:4.0,w:0.7,d:0.5,c:'#1d2433',label:'안내'});
ob(-1.95,-1.25,3.75,4.25);
const GSPOT={type:'greet',x:-1.6,z:4.9,face:Math.PI,occ:null,on:true};
// 물류 & 재고 센터 데스크 (v2.6 · 백오피스)
furn({k:'c',x:-5.2,z:-6.42,w:2.2,d:0.78,c:'#2a3144',label:'물류 센터',dark:1});
furn({k:'podium',x:-4.0,z:-6.78,w:0.5,d:0.5,c:'#c9955a',label:''});
ob(-6.4,-4.0,-6.82,-6.02);
// 계산대
const CASH={x:2.8,z:3.4,meshes:[],g:new THREE.Group()};
furn({k:'c',x:2.8,z:2.6,w:1.4,d:0.6,c:'#fafbfd',label:'계산'});
ob(2.1,3.5,2.3,2.9);
function bundle(){ return new THREE.Group(); }
let cashVal=S.cash||0; function rebuildCash(){}
// 장식 (언락)
const DECOR=new THREE.Group(); DECOR.visible=false;
function buildDecor(){}
