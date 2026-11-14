#!/usr/bin/env python3
# tech.html -> tech-test.html (2D 탑다운 테스트 모드) 빌드 스크립트
# 원본 tech.html은 읽기만 하고 절대 수정하지 않습니다.
# 모든 로직 구간은 원본 텍스트를 그대로 옮기고, 3D 렌더링/모델/월드 구축 구간만 2D 구현으로 바꿉니다.
import io, os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, '..', 'tech.html')
OUT = os.path.join(ROOT, '..', 'tech-test.html')

src = io.open(SRC, encoding='utf-8').read()

def part(name):
    return io.open(os.path.join(ROOT, name), encoding='utf-8').read().rstrip('\n')

def span(a, b, end_inclusive=False):
    """a 마커부터 b 마커 직전까지 (b 포함 옵션)"""
    i = src.index(a)
    if b is None:
        return src[i:]
    j = src.index(b, i)
    return src[i:j] if not end_inclusive else src[i:j + len(b)]

M_RENDER = '/* ---------- renderer ---------- */'
M_ASSET = '/* ---------- assets ---------- */'
M_CHAR = '/* ---------- characters ---------- */'
M_WORLD = '/* ---------- world ---------- */'
M_ITEMS = '/* ---- items ---- */'
M_SHELF = '/* ---- shelves (sources) ---- */'
M_SEASON = '// ---- seasonal dressing'
M_SPOTS = '/* ---- service spots ---- */'
M_HELP = '/* ---- visual helpers'
M_QUIZ = '/* ---- quiz content ---- */'
M_PADS = '/* ---- unlock pads ---- */'
M_STAFF = '/* ---- staff ---- */'
M_SOUNDS = '// sounds'
M_SOUNDS_END = "addEventListener('pointerdown',initAudio,{once:true});"

for m in [M_RENDER, M_ASSET, M_CHAR, M_WORLD, M_ITEMS, M_SHELF, M_SEASON, M_SPOTS, M_HELP, M_QUIZ, M_PADS, M_STAFF, M_SOUNDS, M_SOUNDS_END]:
    if src.count(m) != 1:
        raise SystemExit('marker count %d: %s' % (src.count(m), m))

out = []
out.append(part('part_head.html'))
out.append(span('<style>', '</style>'))
out.append(part('part_css.css'))
out.append('</style>\n</head>')
out.append(span('<body>', '<script>'))
out.append(part('part_ai.html'))
out.append('<script src="hq-ui.js"></script>')  # v2.9: HQ UI 모듈(2D에서도 동일하게 로드)
out.append('<script src="ai-service.js"></script>')  # v2.27: Groq 실시간 AI 엔진(2D에서도 동일하게 로드)
out.append('<script>')
out.append(part('part_boot.js'))
out.append('</script>')
out.append('<script>')
out.append(span('(async function(){', M_RENDER))
out.append(part('part_engine.js'))                     # renderer 구간 -> 2D 렌더러
out.append(part('part_assets_head.js'))
out.append(span(M_SOUNDS, M_SOUNDS_END, True))         # 신스 사운드 코드는 그대로
out.append('\n' + part('part_assets_tail.js'))
out.append(part('part_char.js'))                       # characters 구간 -> 2D 캐릭터
out.append(part('part_world.js'))                      # world 구간 -> 2D 평면도 데이터
out.append(part('part_items.js'))                      # items 구간 -> 2D 아이템 스텁
out.append(part('part_shelves.js'))                    # shelves 구간 -> 2D 진열대
out.append(part('part_season.js'))                     # 계절 연출 -> 데이터만
out.append(part('part_spots.js'))                      # service spots -> 2D 좌표/카운터
out.append(part('part_helpers.js'))                    # 오라/마커 -> 렌더러 담당
out.append(span(M_QUIZ, M_PADS))                       # 상담/퀴즈 콘텐츠 원본 그대로
out.append(part('part_pads.js'))                       # unlock pads -> 2D
out.append(span(M_STAFF, None))                        # 직원 이후 ~ 끝 원본 그대로

text = '\n'.join(out)

def rep(old, new, count=1):
    global text
    n = text.count(old)
    if n != count:
        raise SystemExit('REPLACE FAIL (%d!=%d): %s' % (n, count, old[:120].replace('\n', '\\n')))
    text = text.replace(old, new)

# 1) 세이브 키 분리 (원본 게임 세이브를 건드리지 않음)
rep("const SAVE='bunsik-tech-v1', RS=false;",
    "const SAVE='bunsik-tech-2d-v1', RS=false;")

# 2) 2D 이동 + 자동 경로 (아이소메트릭 변환 제거, 원본 물리/속도식은 그대로 사용)
m = re.search(r"  // player\n.*?(?=  player\.ch\.g\.position\.copy)", text, re.S)
if not m:
    raise SystemExit('movement block not found')
spm = re.search(r"const sp=([^;]+);", m.group(0))
spx = spm.group(1) if spm else "5.6*(1+0.1*S.up.spd)*(feverT>0?1.3:1)*Math.min(1,il)"
new_move = ("  // player (2D: 화면 방향 = 월드 방향, A* 자동 이동 경로 지원)\n"
  "  let ix=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0), iz=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0); if(joy.on&&Math.hypot(joy.dx,joy.dy)>0.15){ ix=joy.dx; iz=joy.dy; tapStop(); } else if(!ix&&!iz){ const ti=tapInput(dt); if(ti){ ix=ti[0]; iz=ti[1]; } }\n"
  "  const nvv=navStep(dt); if(nvv){ ix=nvv.ix; iz=nvv.iz; }\n"
  "  const il=Math.hypot(ix,iz); if(il>0.1&&!quizOpen){ const sp=" + spx + "; const k=sp*dt/Math.max(1,il);\n"
  "    const mx=ix*k, mz=iz*k;\n"
  "    const ox=player.pos.x, oz=player.pos.z;\n"
  "    player.pos.x+=mx; collideAxis(player.pos,'x',ox);\n"
  "    player.pos.z+=mz; collideAxis(player.pos,'z',oz);\n"
  "    player.face=Math.atan2(mx,mz); player.speed=sp; } else player.speed=0;\n")
text = text[:m.start()] + new_move + text[m.end():]

# 3) titleCam no-op (2D에는 회전 카메라가 없음)
m = re.search(r"function titleCam\(dt\)\{[^\n]*\n", text)
if not m:
    raise SystemExit('titleCam not found')
text = text[:m.start()] + "function titleCam(dt){}\n" + text[m.end():]

# 4) 타이틀 화면 건너뛰고 바로 시작
start = text.index('{ let skip=false;')
end = text.index("addEventListener('pagehide',offSave);")
text = text[:start] + ("{ titleOn=false; titleK=0; document.body.classList.remove('title');\n"
                       "  const _tt=$('title'); if(_tt) _tt.style.display='none'; beginPlay(); }\n") + text[end:]

# 5) AI 조작 패널 + QA 헬퍼
panel = """
/* ---- AI 조작 패널 / QA 헬퍼 ---- */
$('aitog').onclick=function(){ $('aip').classList.toggle('min'); $('aitog').textContent=$('aip').classList.contains('min')?'+':'–'; };
Array.prototype.forEach.call(document.querySelectorAll('#aip [data-go]'),function(b){ b.onclick=function(){ if(quizOpen) return;
  const k=b.dataset.go;
  if(k==='serve'){ const gd=guide(); if(gd){ navTo(gd[0],gd[1]); } else { toast('지금 응대할 손님이 없어요',2); } return; }
  const t=GOTO[k]; if(t) navTo(t[0],t[1]); }; });
Array.prototype.forEach.call(document.querySelectorAll('#aip [data-dir]'),function(b){ b.onclick=function(){ if(quizOpen) return; const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[b.dataset.dir]; nudge(d[0],d[1]); }; });
$('aistop').onclick=function(){ NAV.path=[]; NAV.goal=null; };
$('aiv').onclick=function(){ window.__ERR=[]; var _b=$('diagB'); if(_b){ _b.textContent='오류 0'; _b.className=''; } };
$('aizoom').onclick=function(){ ZOOMI=(ZOOMI+1)%ZOOMS.length; };
let _resetT=0; $('aireset').onclick=function(){ const b=$('aireset');
  if(performance.now()-_resetT<4000){ try{ localStorage.removeItem('bunsik-tech-2d-v1'); }catch(e){} location.reload(); return; }
  _resetT=performance.now(); b.textContent='정말 지울까요?';
  setTimeout(function(){ if(performance.now()-_resetT>=3900){ _resetT=0; b.textContent='♻️ 초기화'; } },4100); };
window.__H2={navTo:navTo,stop:function(){ NAV.path=[]; NAV.goal=null; },pos:function(){ return {x:player.pos.x,z:player.pos.z}; },
  zoom:function(i){ ZOOMI=(i||0)%ZOOMS.length; },dstate:function(){ return dayState; },ready:function(){ return !!(VIEW.W&&typeof custs!=='undefined'); }};
requestAnimationFrame(step);
"""
rep("requestAnimationFrame(step);\n})();", panel + "})();")

io.open(OUT, 'w', encoding='utf-8').write(text)
print('written', OUT, len(text), 'chars', text.count('\n'), 'lines')

# v2.8: 루트 index.html = tech.html 완전 동일 사본 (분식집·호텔 로비 삭제, 루트 접속 = 테크 스토어 즉시 실행)
IDX = os.path.join(ROOT, '..', 'index.html')
io.open(IDX, 'w', encoding='utf-8').write(src)
print('synced', IDX, len(src), 'chars')
