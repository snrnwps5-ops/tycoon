/* ---- items (2D) ---- */
const IT={p:{n:'폰',c:'#1d2433'},l:{n:'랩탑',c:'#aab2bf'},w:{n:'워치',c:'#ff5a6a'},b:{n:'배터리',c:'#46c95a'},s:{n:'액정',c:'#2a2d38'},c:{n:'카메라',c:'#5a6578'}};
function makeItem(t){ const g=new THREE.Group(); g.__item=t; return g; }
const IH={p:0.12,l:0.12,w:0.18,b:0.1,s:0.07,c:0.15};
function layoutStack(o){}
function takeItem(o,t){ const i=o.stack.lastIndexOf(t); if(i<0) return false; o.stack.splice(i,1); return true; }
