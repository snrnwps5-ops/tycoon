/* boot guard (2D test mode): WebGL/3D 없이 동작. 오류가 나면 화면에 원인을 보여 줍니다. */
(function(){ var done=false, failed=false;
  var MSG={init:['게임을 시작하는 중 오류가 났어요','2D 테스트 모드에서 예상하지 못한 오류가 났어요. 아래 내용을 알려 주세요.'],
    canvas:['2D 화면을 만들 수 없어요','이 브라우저에서 canvas 2D를 사용할 수 없어요. 다른 브라우저로 열어 주세요.']};
  window.bootFail=function(kind,detail){ if(done||failed) return; failed=true; var m=MSG[kind]||MSG.init, el=document.getElementById('load')||document.getElementById('loading');
    if(!el){ el=document.createElement('div'); document.body.appendChild(el); } var d=detail?String(detail&&detail.message||detail).slice(0,300):'';
    el.id='bootErr'; el.className=''; el.setAttribute('style','position:fixed;inset:0;z-index:99;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;background:radial-gradient(circle at 50% 40%,#1a3aa0,#0a1650);color:#fff;font-family:"Noto Sans KR",sans-serif;opacity:1');
    el.innerHTML='<div style="font-size:44px">⚠️</div><div style="font-size:20px;font-weight:900;margin:10px 0 8px">'+m[0]+'</div><div style="font-size:13px;font-weight:700;line-height:1.7;color:#cfe0ff;max-width:340px;text-align:left">'+m[1]+'</div>'+(d?'<div style="margin-top:10px;font:11px monospace;color:#8fa6d8;max-width:340px;word-break:break-all">['+kind+'] '+d.replace(/</g,'&lt;')+'</div>':'')+
      '<button id="beRetry" style="margin-top:18px;width:230px;height:54px;border:0;border-radius:18px;background:linear-gradient(#6fdcff,#2f7df0);color:#fff;font-size:18px;font-weight:900">다시 시도</button>';
    var t=document.getElementById('title'); if(t) t.style.display='none'; document.body.classList.remove('title');
    document.getElementById('beRetry').onclick=function(){ location.reload(); }; };
  window.bootOK=function(){ done=true; };
  window.__ERR=[];
  addEventListener('error',function(e){ try{ window.__ERR.push(String((e&&e.message)||e)); }catch(_){} });
  addEventListener('unhandledrejection',function(e){ try{ window.__ERR.push('rej:'+String((e&&e.reason&&e.reason.message)||(e&&e.reason)||'')); }catch(_){} });
  window.bootPre=function(){ try{ var c=document.createElement('canvas'); return !!c.getContext('2d'); }catch(e){ bootFail('canvas',e); return false; } };
  addEventListener('error',function(e){ if(!done&&e&&e.message&&!/ResizeObserver/.test(e.message)) bootFail('init',e.message); });
  addEventListener('unhandledrejection',function(e){ if(!done){ var m=e&&e.reason&&(e.reason.message||e.reason)||''; bootFail('init',m); } });
  setTimeout(function(){ if(!done) bootFail('init','no response after 45s'); },45000);
})();
/* 미니 3D 호환 레이어 — 2D 모드에서는 장면을 그리지 않고 데이터(위치/색/목록)만 유지합니다. */
(function(){
  function V3(x,y,z){ this.x=x||0; this.y=y||0; this.z=z||0; }
  V3.prototype.set=function(x,y,z){ this.x=x; this.y=y; this.z=z; return this; };
  V3.prototype.copy=function(v){ this.x=v.x; this.y=v.y; this.z=v.z; return this; };
  V3.prototype.clone=function(){ return new V3(this.x,this.y,this.z); };
  V3.prototype.add=function(v){ this.x+=v.x; this.y+=v.y; this.z+=v.z; return this; };
  V3.prototype.sub=function(v){ this.x-=v.x; this.y-=v.y; this.z-=v.z; return this; };
  V3.prototype.addScaledVector=function(v,s){ this.x+=v.x*s; this.y+=v.y*s; this.z+=v.z*s; return this; };
  V3.prototype.multiplyScalar=function(s){ this.x*=s; this.y*=s; this.z*=s; return this; };
  V3.prototype.lerp=function(v,a){ this.x+=(v.x-this.x)*a; this.y+=(v.y-this.y)*a; this.z+=(v.z-this.z)*a; return this; };
  V3.prototype.lerpVectors=function(a,b,t){ this.x=a.x+(b.x-a.x)*t; this.y=a.y+(b.y-a.y)*t; this.z=a.z+(b.z-a.z)*t; return this; };
  V3.prototype.setY=function(y){ this.y=y; return this; };
  V3.prototype.distanceTo=function(v){ return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z); };
  V3.prototype.length=function(){ return Math.hypot(this.x,this.y,this.z); };
  V3.prototype.normalize=function(){ var l=this.length()||1; this.x/=l; this.y/=l; this.z/=l; return this; };
  V3.prototype.project=function(){ var p=(window.__proj||function(){return {x:0,y:0};})(this.x,this.y,this.z); this.x=p.x; this.y=p.y; this.z=0; return this; };
  function Color(c){ this.hex='#000000'; this.set(c); }
  Color.prototype.set=function(c){ this.hex=(typeof c==='number')?('#'+('000000'+c.toString(16)).slice(-6)):String(c||'#000'); return this; };
  Color.prototype.clone=function(){ return new Color(this.hex); };
  Color.prototype.copy=function(c){ this.hex=c.hex; return this; };
  Color.prototype.getHex=function(){ return parseInt(this.hex.replace('#',''),16)||0; };
  Color.prototype.getHexString=function(){ return this.hex.replace('#','').toLowerCase(); };
  Color.prototype.convertLinearToSRGB=function(){ return this; };
  function Obj(){ this.children=[]; this.position=new V3(); this.rotation={x:0,y:0,z:0,set:function(x,y,z){this.x=x;this.y=y;this.z=z;}};
    this.scale={x:1,y:1,z:1,set:function(x,y,z){this.x=x;this.y=y;this.z=z;},setScalar:function(s){this.x=this.y=this.z=s;}};
    this.visible=true; this.castShadow=false; this.receiveShadow=false; this.renderOrder=0; this.frustumCulled=true;
    this.quaternion={x:0,y:0,z:0,w:1,set:function(){},copy:function(){},clone:function(){return this;}}; }
  Obj.prototype.add=function(o){ if(o&&o!==this) this.children.push(o); return this; };
  Obj.prototype.remove=function(o){ var i=this.children.indexOf(o); if(i>=0) this.children.splice(i,1); return this; };
  Obj.prototype.traverse=function(f){ f(this); for(var i=0;i<this.children.length;i++){ var c=this.children[i]; if(c&&c.traverse) c.traverse(f); } };
  Obj.prototype.clone=function(){ var o=new Obj(); o.position.copy(this.position); o.rotation.x=this.rotation.x; o.rotation.y=this.rotation.y; o.rotation.z=this.rotation.z; return o; };
  Obj.prototype.lookAt=function(){};
  Obj.prototype.updateMatrixWorld=function(){};
  Obj.prototype.updateProjectionMatrix=function(){};
  Obj.prototype.getWorldPosition=function(v){ return v.copy(this.position); };
  function Geo(p){ this.parameters=p||{}; this.type='Geometry'; this.attributes={}; }
  Geo.prototype.rotateX=function(){ return this; };
  Geo.prototype.rotateY=function(){ return this; };
  Geo.prototype.center=function(){ return this; };
  Geo.prototype.dispose=function(){};
  Geo.prototype.setAttribute=function(k,v){ this.attributes[k]=v; return this; };
  function Mesh(g,m){ Obj.call(this); this.geometry=g||new Geo(); this.material=m||{}; this.isMesh=true; }
  Mesh.prototype=Object.create(Obj.prototype); Mesh.prototype.constructor=Mesh;
  function Group(){ Obj.call(this); }
  Group.prototype=Object.create(Obj.prototype); Group.prototype.constructor=Group;
  function Scene(){ Obj.call(this); this.background=null; }
  Scene.prototype=Object.create(Obj.prototype); Scene.prototype.constructor=Scene;
  function Cam(){ Obj.call(this); this.zoom=1; this.left=-1; this.right=1; this.top=1; this.bottom=-1; this.near=0.1; this.far=200; }
  Cam.prototype=Object.create(Obj.prototype); Cam.prototype.constructor=Cam;
  function Shape(){ this.pts=[]; }
  Shape.prototype.moveTo=function(){ return this; };
  Shape.prototype.lineTo=function(){ return this; };
  Shape.prototype.quadraticCurveTo=function(){ return this; };
  Shape.prototype.bezierCurveTo=function(){ return this; };
  Shape.prototype.closePath=function(){ return this; };
  function Tex(cv){ this.image=cv||null; this.needsUpdate=false; this.wrapS=0; this.wrapT=0; this.repeat={set:function(){}}; this.anisotropy=1; this.flipY=true; this.encoding=0; this.minFilter=0; this.magFilter=0; }
  Tex.prototype.clone=function(){ return new Tex(this.image); };
  Tex.prototype.dispose=function(){};
  function Mat(o){ for(var k in (o||{})) this[k]=o[k]; this.opacity=(o&&o.opacity!=null)?o.opacity:1; this.transparent=!!(o&&o.transparent); }
  Mat.prototype.clone=function(){ return new Mat(this); };
  Mat.prototype.dispose=function(){};
  function Light(o){ for(var k in (o||{})) this[k]=o[k]; this.position=new V3(); this.target={position:new V3()}; this.shadow={mapSize:{set:function(){}},camera:{}}; }
  window.THREE={
    Vector3:V3, Color:Color, Scene:Scene, Group:Group, Mesh:Mesh, Object3D:Obj, OrthographicCamera:Cam,
    BoxGeometry:function(w,h,d){ Geo.call(this,{width:w,height:h,depth:d}); this.type='BoxGeometry'; },
    PlaneGeometry:function(w,h){ Geo.call(this,{width:w,height:h}); this.type='PlaneGeometry'; },
    CylinderGeometry:function(a,b,h,s){ Geo.call(this,{radiusTop:a,radiusBottom:b,height:h}); this.type='CylinderGeometry'; },
    SphereGeometry:function(r){ Geo.call(this,{radius:r}); this.type='SphereGeometry'; },
    RingGeometry:function(a,b,s){ Geo.call(this,{innerRadius:a,outerRadius:b}); this.type='RingGeometry'; },
    CircleGeometry:function(r){ Geo.call(this,{radius:r}); this.type='CircleGeometry'; },
    ConeGeometry:function(r,h,s){ Geo.call(this,{radius:r,height:h}); this.type='ConeGeometry'; },
    TorusGeometry:function(r,t){ Geo.call(this,{radius:r,tube:t}); this.type='TorusGeometry'; },
    OctahedronGeometry:function(r){ Geo.call(this,{radius:r}); this.type='OctahedronGeometry'; },
    ExtrudeGeometry:function(s,o){ Geo.call(this,o); this.type='ExtrudeGeometry'; },
    BufferGeometry:function(){ Geo.call(this); this.type='BufferGeometry'; },
    Box3:function(){ this.min=new V3(); this.max=new V3(); },
    Shape:Shape, CanvasTexture:Tex, DataTexture:Tex, TextureLoader:function(){ this.load=function(){ return new Tex(); }; },
    MeshLambertMaterial:Mat, MeshBasicMaterial:Mat, MeshPhongMaterial:Mat, MeshToonMaterial:Mat, MeshStandardMaterial:Mat,
    PointsMaterial:Mat, LineBasicMaterial:Mat, Points:Mesh, LineSegments:Mesh,
    HemisphereLight:Light, DirectionalLight:Light, AnimationMixer:function(){ this.update=function(){}; this.clipAction=function(){ return {reset:function(){return this;},fadeIn:function(){return this;},fadeOut:function(){return this;},play:function(){return this;},setEffectiveWeight:function(){return this;}}; }; },
    SkeletonUtils:{clone:function(o){ return o; }}, GLTFLoader:function(){ this.parse=function(){ }; },
    WebGLRenderer:function(){ return {setPixelRatio:function(){},setSize:function(){},render:function(){},shadowMap:{},domElement:document.createElement('canvas')}; },
    RepeatWrapping:1000, NearestFilter:1003, LinearEncoding:3000, RGBAFormat:1023, DoubleSide:2, AdditiveBlending:2, PCFSoftShadowMap:2
  };
  window.THREE.BufferAttribute=function(arr,item){ this.array=arr; this.itemSize=item; this.needsUpdate=false; };
})();
