/* ---- service spots (2D) ---- */
const SPOTS=[]; const spot=(type,x,z,face,lock)=>{ const s={type:type,x:x,z:z,face:face,occ:null,on:!lock}; SPOTS.push(s); return s; };
const PICKG=new THREE.Group();
furn({k:'c',x:-7.3,z:-2.4,w:2.5,d:0.9,c:'#f4f5f7',label:'픽업'});
if(STG>=1) furn({k:'c',x:-5.5,z:-2.4,w:1.3,d:0.9,c:'#eef2f8',label:''});
ob(-8.55,-6.05,-2.77,-2.03); if(STG>=1) ob(-6.15,-4.85,-2.77,-2.03);
spot('pick',-7.9,-1.4,Math.PI); spot('pick',-6.7,-1.4,Math.PI); if(STG>=1) spot('pick',-5.5,-1.4,Math.PI);
const TW=STG>=2?3.0:2.4;
function salesTable(x,z){ furn({k:'table',x:x,z:z,w:TW,d:1.25,c:WOOD,label:'체험'}); ob(x-TW/2-0.05,x+TW/2+0.05,z-0.65,z+0.65); }
const T1=new THREE.Group(), T2=new THREE.Group(), T3=new THREE.Group(); T2.visible=false; T3.visible=false;
salesTable(-1.25,0.2); spot('buy',-1.85,1.25,Math.PI); spot('buy',-0.65,1.25,Math.PI);
salesTable(4.25,0.2); spot('buy',3.65,1.25,Math.PI,true); spot('buy',4.85,1.25,Math.PI,true);
if(STG>=2){ salesTable(-2.4,3.8); spot('buy',-3.0,4.85,Math.PI); spot('buy',-1.8,4.85,Math.PI); }
// 수리실 안내판 (v2.61: 수리 공간은 매장 밖 별도 화면 — 매장에는 안내만)
const REPG=new THREE.Group(); REPG.visible=false;
furn({k:'c',x:6.9,z:-3.55,w:1.62,d:0.14,c:'#0f2a1e',label:'수리실'});
furn({k:'c',x:6.9,z:-3.2,w:1.25,d:1.25,c:'rgba(47,170,69,.35)',label:''});
ob(5.9,7.9,-3.7,-2.7);
// 소프트웨어 상담 바 (가운데 뒤)
const SUPG=new THREE.Group(); SUPG.visible=false;
furn({k:'table',x:2.6,z:-6.6,w:2.6,d:0.8,c:WOOD,label:'상담'});
ob(1.25,3.95,-7.05,-6.15);
spot('sw',2.0,-5.6,Math.PI,true); spot('sw',3.2,-5.6,Math.PI,true);
// 입구 안내
const GRG=new THREE.Group();
furn({k:'podium',x:-3.4,z:5.6,w:0.7,d:0.5,c:'#1d2433',label:'안내'});
ob(-3.75,-3.05,5.35,5.85);
const GSPOT={type:'greet',x:-3.4,z:6.4,face:Math.PI,occ:null,on:true};
// 물류 & 재고 센터 데스크 (v2.6 · 백오피스) — v2.98: 뒤 선반 앞 통로 2.4m
const HUBCFG={x:-5.6,z:-6.60,padZ:-5.88};
furn({k:'c',x:-5.6,z:-6.60,w:2.2,d:0.78,c:'#2a3144',label:'물류 센터',dark:1});
furn({k:'podium',x:-4.4,z:-6.96,w:0.5,d:0.5,c:'#c9955a',label:''});
ob(-6.8,-4.28,-7.22,-6.2);
// 계산대
const CASH={x:3.6,z:6.2,meshes:[],g:new THREE.Group()};
furn({k:'c',x:3.6,z:5.4,w:1.4,d:0.6,c:'#fafbfd',label:'계산'});
ob(2.9,4.3,5.1,5.7);
function bundle(){ return new THREE.Group(); }
let cashVal=S.cash||0; function rebuildCash(){}
// 장식 (언락)
const DECOR=new THREE.Group(); DECOR.visible=false;
function buildDecor(){}
