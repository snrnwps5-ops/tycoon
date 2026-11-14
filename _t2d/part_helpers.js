/* ---- visual helpers (2D: 오라/마커는 렌더러가 직접 그림) ---- */
function addAura(c){ c.aura=c.influ?'#ff5ab8':c.vip?'#ffd23f':c.flight?'#5ad1ff':c.tough?'#ff4a3a':null; }
function tickMarkers(t){}
const SPOTCOL={pick:'#ff9a1a',buy:'#2f6fd8',fix:'#2faa45',sw:'#7a4ad6'};
let RAIN=null;
function setRain(on){ RAIN=null; }
function tickRain(dt){}
