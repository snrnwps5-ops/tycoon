/* ---- seasonal dressing (실제 날짜 기준, 2D) ---- */
const SEASON=(()=>{ try{ const o=localStorage.getItem('tech-season'); if(o!==null) return o; }catch(e){} const m=new Date().getMonth()+1; return m===11?'bf':m===12?'xmas':''; })();
let SNOW=null; function tickSnow(dt){}
