'use strict';
// ---------- редактор кремля (мастерская, вкладка «Кремль») ----------
// Карта рисуется тем же кодом, что в игре (js/map.js). Здания и мелочи тащатся мышью с шагом в полклетки; под зданием — площадка-ромб,
// красная, если наложилась на другое здание, стену или воду. Мелочи — из палитры: одобренные (assets/props), деревья и кусты Поля, деревья атласа.
// Русло реки — точки, их тоже тащат мышью. «Сохранить» пишет js/layout.js в подключённую папку, без неё — скачивает файл.
const ED={mode:'obj',sel:null,drag:null,place:null,hover:null,zoom:'fit',dirty:false,hist:[],msg:''};
const edC=()=>document.getElementById('edmap');
const edIt=h=>h&&(h.b||h.p);
const edName=p=>(PROP[p.k]&&PROP[p.k].n)||(BIOME[p.k]&&BIOME[p.k].n)||'Дерево атласа';
const edNum=v=>String(v).replace('.',',');
// вид карты под размер кремля: кремль с посадом, река и подписи зон с запасом
function edView(){const R=MAP.R+2.5;mapView(2*R*MAP.TW+280,2*R*MAP.TH+260)}
function edBuild(skip){const c=edC();if(!c||!ATL.complete)return;edView();MB=null;buildMap(()=>true,skip?{skip:x=>x===skip}:{});
  if(c.width!==MAP.W||c.height!==MAP.H){c.width=MAP.W;c.height=MAP.H;edZoom()}edPaint()}
let edT=0;const edSoon=(ms=60)=>{clearTimeout(edT);edT=setTimeout(()=>{if(!ED.drag){edBuild();edPanel()}},ms)};

// ---------- рисунок: карта как в игре, поверх — площадки, выбор, русло ----------
function edDia(g,f,fill,line){const C=MAP.C,p=[gp(C+f.x0,C+f.y0),gp(C+f.x1,C+f.y0),gp(C+f.x1,C+f.y1),gp(C+f.x0,C+f.y1)];g.beginPath();p.forEach((q,k)=>k?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.closePath();
  if(fill){g.fillStyle=fill;g.fill()}if(line){g.strokeStyle=line;g.lineWidth=1;g.stroke()}}
function edItem(g,h){const it=edIt(h),[x,y]=gp(MAP.C+it.at[0],MAP.C+it.at[1]);if(h.b)bldDraw(g,it,x,y);else drawProp(g,it,x,y)}
function edRect(h){const it=edIt(h),[x,y]=gp(MAP.C+it.at[0],MAP.C+it.at[1]);return h.b?bldRect(it,x,y):propRect(it,x,y)}
function edPaint(){const c=edC();if(!c||!MB)return;const g=c.getContext('2d');paintMap(c,{open:()=>true});g.save();
  const W=edWarn();
  if(ED.mode==='obj'){
    BLD.forEach(b=>{const bad=W.bad.has(b),sel=edIt(ED.sel)===b;edDia(g,footprint(b),bad?'rgba(232,112,90,.38)':sel?'rgba(212,168,74,.32)':null,bad?'#e8705a':sel?'#d4a84a':'rgba(240,220,170,.6)')});
    PROPS.forEach(p=>{const[x,y]=gp(MAP.C+p.at[0],MAP.C+p.at[1]);g.fillStyle=W.bad.has(p)?'#e8705a':edIt(ED.sel)===p?'#d4a84a':'rgba(240,220,170,.6)';g.fillRect(Math.round(x)-1,Math.round(y)-1,3,3)})}
  if(ED.drag&&ED.drag.h)edItem(g,ED.drag.h); // то, что тащат, — поверх всего
  if(ED.place&&ED.place.p)edItem(g,{p:ED.place.p});
  const fr=(h,col)=>{const r=edRect(h);if(r){g.strokeStyle=col;g.lineWidth=1;g.strokeRect(Math.round(r.x)-.5,Math.round(r.y)-.5,r.w+1,r.h+1)}};
  if(ED.hover&&!ED.drag&&edIt(ED.hover)!==edIt(ED.sel))fr(ED.hover,'rgba(240,220,170,.55)');if(ED.sel&&ED.sel.t!=='pt')fr(ED.sel,'#d4a84a');
  if(ED.mode==='river')edRiver(g,RV.s);g.restore()}
// русло: ось, берега по ширине, контрольные точки
function edRiver(g,s){const C=MAP.C,S=(x,y)=>gp(C+x,C+y),line=(f,col,w)=>{g.strokeStyle=col;g.lineWidth=w;g.beginPath();s.forEach((p,k)=>{const q=f(p,k);k?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1])});g.stroke()};
  const nrm=k=>{const a=s[Math.max(0,k-1)],b=s[Math.min(s.length-1,k+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;return[-dy/l,dx/l]};
  [-1,1].forEach(sg=>line((p,k)=>{const n=nrm(k);return S(p[0]+n[0]*p[2]/2*sg,p[1]+n[1]*p[2]/2*sg)},'rgba(111,200,190,.45)',1));
  line(p=>S(p[0],p[1]),'rgba(111,200,190,.9)',1);
  RIVER.forEach((p,k)=>{const[x,y]=S(p[0],p[1]),sel=ED.sel&&ED.sel.t==='pt'&&ED.sel.k===k;g.fillStyle=sel?'#d4a84a':'#6fc8be';g.strokeStyle='#0d0a08';g.lineWidth=2;
    g.beginPath();g.arc(x,y,sel?6:5,0,7);g.stroke();g.fill();g.fillStyle='#0d0a08';g.font='9px monospace';g.fillText(k+1,x+7,y-6)})}

// ---------- проверки: наложение площадок, здание на стене или в воде, мелочь внутри площадки или в воде ----------
function edWet(x0,y0,x1,y1){const N=MAP.N,C=MAP.C;for(let i=Math.floor(x0+C);i<x1+C;i++)for(let j=Math.floor(y0+C);j<y1+C;j++){const c=i>=0&&j>=0&&i<N&&j<N&&MB.cells[i*N+j];if(c&&c.g==='water')return true}return false}
function edWarn(){const bad=new Set(),msg=[],F=new Map(BLD.map(b=>[b,footprint(b)])),R=MAP.R,ov=(a,b)=>a.x0<b.x1-.01&&b.x0<a.x1-.01&&a.y0<b.y1-.01&&b.y0<a.y1-.01;
  if(!MB)return{bad,msg};
  BLD.forEach((a,i)=>BLD.slice(i+1).forEach(b=>{if(ov(F.get(a),F.get(b))){bad.add(a);bad.add(b);msg.push(`${a.name} и ${b.name}: площадки наложились`)}}));
  BLD.forEach(b=>{const f=F.get(b),d=(u,v)=>u>0?u:v<0?-v:0,lo=Math.max(d(f.x0,f.x1),d(f.y0,f.y1)),hi=Math.max(-f.x0,f.x1,-f.y0,f.y1);
    if(lo<R+.25&&hi>R-.25){bad.add(b);msg.push(`${b.name} стоит на стене`)}
    if(edWet(f.x0+.1,f.y0+.1,f.x1-.1,f.y1-.1)){bad.add(b);msg.push(`${b.name} в воде`)}});
  PROPS.forEach(p=>{const b=BLD.find(b=>{const f=F.get(b);return p.at[0]>f.x0+.15&&p.at[0]<f.x1-.05&&p.at[1]>f.y0+.15&&p.at[1]<f.y1-.05});
    if(b){bad.add(p);msg.push(`${edName(p)} внутри площадки: ${b.name}`)}
    if(edWet(p.at[0]-.3,p.at[1]-.3,p.at[0]+.01,p.at[1]+.01)){bad.add(p);msg.push(`${edName(p)} в воде`)}});
  return{bad,msg}}

// ---------- мышь и клавиши ----------
function edXY(e){const c=edC(),r=c.getBoundingClientRect();return[(e.clientX-r.left)*c.width/r.width,(e.clientY-r.top)*c.height/r.height]}
function edGrid(mx,my){const u=(mx-MAP.W/2)/(MAP.TW/2),v=(my-MAP.H/2)/(MAP.TH/2)+2*MAP.C;return[(u+v)/2-MAP.C,(v-u)/2-MAP.C]}
const edSnap=v=>Math.round(v*2)/2;
// что под мышью: сначала ближние (ниже на экране); здания — по непрозрачным пикселям, мелочи — по прямоугольнику
const edScr=document.createElement('canvas');
function edHit(mx,my){const L=[...BLD.map(b=>({t:'bld',b})),...PROPS.map(p=>({t:'prop',p}))].sort((a,b)=>{const p=edIt(a).at,q=edIt(b).at;return q[0]+q[1]-p[0]-p[1]});
  return L.find(h=>{const r=edRect(h);if(!r)return false;const m=h.p?2:0;if(mx<r.x-m||my<r.y-m||mx>=r.x+r.w+m||my>=r.y+r.h+m)return false;if(h.p)return true;
    edScr.width=r.w;edScr.height=r.h;const g=edScr.getContext('2d');g.translate(-r.x,-r.y);edItem(g,h);return g.getImageData(Math.floor(mx-r.x),Math.floor(my-r.y),1,1).data[3]>8})||null}
function edPt(mx,my){return RIVER.findIndex(p=>{const[x,y]=gp(MAP.C+p[0],MAP.C+p[1]);return Math.hypot(x-mx,y-my)<8})}
function edMark(){ED.hist.push(JSON.stringify(layoutOf()));if(ED.hist.length>80)ED.hist.shift()}
function edChanged(){ED.dirty=true;ED.msg='';edBuild();edPanel()}
function edUndo(){const s=ED.hist.pop();if(!s)return;applyLayout(JSON.parse(s));ED.sel=null;ED.place=null;edSyncR();edChanged()}
function edDown(e){if(!MB||e.button)return;const[mx,my]=edXY(e),[gx,gy]=edGrid(mx,my);
  if(ED.place){edMark();const p={k:ED.place.k,v:ED.place.v,at:[edSnap(gx),edSnap(gy)],fl:0};PROPS.push(p);ED.sel={t:'prop',p};if(!e.shiftKey)ED.place=null;else ED.place.p=null;return edChanged()}
  if(ED.mode==='river'){const k=edPt(mx,my);ED.sel=k>=0?{t:'pt',k}:null;if(k>=0){edMark();ED.drag={pt:k}}edPaint();return edPanel()}
  const h=edHit(mx,my);ED.sel=h;edPanel();if(!h)return edPaint();
  edMark();const it=edIt(h);ED.drag={h,off:[it.at[0]-gx,it.at[1]-gy]};edBuild(it)}
function edMove(e){if(!MB)return;const[mx,my]=edXY(e),[gx,gy]=edGrid(mx,my),c=edC(),d=ED.drag;
  if(d&&d.h){const it=edIt(d.h),nx=edSnap(gx+d.off[0]),ny=edSnap(gy+d.off[1]);if(nx!==it.at[0]||ny!==it.at[1]){it.at=[nx,ny];d.moved=1;edPaint();edPanel()}return}
  if(d&&d.pt!=null){RIVER[d.pt]=[r2(gx),r2(gy)];d.moved=1;paintMap(c,{open:()=>true});edRiver(c.getContext('2d'),riverPts());return}
  if(ED.place){ED.place.p={k:ED.place.k,v:ED.place.v,at:[edSnap(gx),edSnap(gy)],fl:0};c.style.cursor='copy';return edPaint()}
  const h=ED.mode==='obj'?edHit(mx,my):null,k=ED.mode==='river'?edPt(mx,my):-1;
  if(edIt(h)!==edIt(ED.hover)){ED.hover=h;edPaint()}c.style.cursor=h||k>=0?'grab':ED.mode==='river'?'crosshair':'default'}
function edUp(){const d=ED.drag;if(!d)return;ED.drag=null;if(d.moved)edChanged();else{ED.hist.pop();edBuild()}}
function edLeave(){if(ED.hover||ED.place&&ED.place.p){ED.hover=null;if(ED.place)ED.place.p=null;edPaint()}}
// двойной клик в режиме реки — новая точка на ближайшем участке русла
function edDbl(e){if(ED.mode!=='river'||!MB)return;const[gx,gy]=edGrid(...edXY(e));let k=0,best=1e9;
  for(let q=0;q<RIVER.length-1;q++){const d=segD(gx,gy,RIVER[q],RIVER[q+1]);if(d<best){best=d;k=q}}
  edMark();RIVER.splice(k+1,0,[r2(gx),r2(gy)]);ED.sel={t:'pt',k:k+1};edChanged()}
function edFlip(){const it=edIt(ED.sel);if(!it)return;edMark();it.fl=it.fl?0:1;edChanged()}
function edDel(){if(!ED.sel)return;if(ED.sel.t==='prop'){edMark();PROPS.splice(PROPS.indexOf(ED.sel.p),1)}
  else if(ED.sel.t==='pt'){if(RIVER.length<=2)return toast('В русле должно остаться хотя бы две точки');edMark();RIVER.splice(ED.sel.k,1)}else return;ED.sel=null;edChanged()}
// стрелки двигают выбранное на полклетки по экрану: вправо-влево на 20 пикселей, вверх-вниз на 10
function edNudge(dx,dy){const it=edIt(ED.sel);if(!it)return;edMark();it.at=[edSnap(it.at[0]+dx),edSnap(it.at[1]+dy)];edChanged()}
function edKey(e){if(tab!=='krem'||!edC()||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  if((e.metaKey||e.ctrlKey)&&e.code==='KeyZ'){e.preventDefault();return edUndo()}
  if(e.key==='Escape'){ED.place=null;ED.sel=null;edPaint();return edPanel()}
  if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();return edDel()}
  if(e.code==='KeyF')return edFlip();
  const a={ArrowRight:[.5,-.5],ArrowLeft:[-.5,.5],ArrowDown:[.5,.5],ArrowUp:[-.5,-.5]}[e.key];if(a&&ED.sel&&ED.sel.t!=='pt'){e.preventDefault();edNudge(...a)}}
// размер кремля: всё, что за стенами (здания, мелочи, русло), отодвигается вместе со стеной, внутри — остаётся на месте
function edR(v){v=+v;if(v===MAP.R)return;edMark();const d=v-MAP.R,R=MAP.R,push=p=>{const m=Math.max(Math.abs(p[0]),Math.abs(p[1]));if(m<R-.01)return p;const k=(m+d)/m;return[r2(p[0]*k),r2(p[1]*k)]};
  RIVER=RIVER.map(push);[...BLD,...PROPS].forEach(it=>{it.at=push(it.at)});MAP.R=v;ED.dirty=true;ED.msg='';edSyncR();edSoon(120)}
function edSyncR(){const s=document.getElementById('edR'),l=document.getElementById('edRl');if(s)s.value=MAP.R;if(l)l.textContent=`${2*MAP.R}×${2*MAP.R} клеток`}
function edZoom(z){if(z)ED.zoom=z;const c=edC();if(!c)return;c.style.width=ED.zoom==='fit'?'100%':ED.zoom*MAP.W+'px';
  document.querySelectorAll('[data-edzoom]').forEach(b=>b.classList.toggle('on',String(ED.zoom)===b.dataset.edzoom))}
function edMode(m){ED.mode=m;ED.sel=null;ED.place=null;ED.hover=null;document.querySelectorAll('[data-edmode]').forEach(b=>b.classList.toggle('on',b.dataset.edmode===m));edPaint();edPanel()}

// ---------- сохранение: js/layout.js ----------
function layoutText(){const L=layoutOf();
  return`// Расстановка кремля. Файл пишет редактор мастерской (studio.html → вкладка «Кремль» → «Сохранить»); формат — в js/map.js, applyLayout.
// R — полуразмер кремля в клетках; bld — здание: [dx, dy, отражено]; props — мелочи: [картинка, кадр, dx, dy, отражено]; river — точки русла [dx, dy] от Гор к Омуту.
const LAYOUT={
"R":${L.R},
"bld":${JSON.stringify(L.bld)},
"props":[${L.props.map(p=>'\n '+JSON.stringify(p)).join(',')}${L.props.length?'\n':''}],
"river":${JSON.stringify(L.river)}
};
`}
async function edRootOK(){if(!root)return false;const o={mode:'readwrite'};try{return await root.queryPermission(o)==='granted'||await root.requestPermission(o)==='granted'}catch(e){return false}}
async function edSave(){const t=layoutText();
  try{if(await edRootOK()){const d=await root.getDirectoryHandle('js'),w=await(await d.getFileHandle('layout.js',{create:true})).createWritable();await w.write(t);await w.close();
      ED.msg='<span class="ok">Сохранено в js/layout.js.</span> Напиши Claude «сохранил»: он закоммитит, и игра на сайте покажет эту расстановку.'}
    else{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/javascript'}));a.download='layout.js';a.click();
      ED.msg='<span class="gold">Скачано как layout.js.</span> Положи его в <code>equation-dungeon/js/</code> с заменой и напиши Claude «сохранил». Чтобы сохранялось само, подключи папку игры (кнопка вверху).'}
    ED.dirty=false}catch(e){ED.msg=`<span class="bad">Не сохранилось: ${esc(e.message)}</span>`}edPanel()}
// расстановка из подключённой папки свежее, чем с сайта (там файл кэшируется до 10 минут); правки, которые ещё не сохранены, не трогаем
async function edLoadFolder(){if(!root||ED.dirty)return;try{const t=await(await(await(await root.getDirectoryHandle('js')).getFileHandle('layout.js')).getFile()).text(),i=t.indexOf('{',t.indexOf('LAYOUT'));
  applyLayout(JSON.parse(t.slice(i,t.lastIndexOf('}')+1)));edSyncR()}catch(e){}}
addEventListener('beforeunload',e=>{if(ED.dirty){e.preventDefault();e.returnValue=''}});

// ---------- панель: что выбрано, предупреждения, палитра мелочей, масштаб зданий ----------
function edHTML(){return`<div class="panel" id="ed"><h2>Редактор кремля</h2>
  <p class="small muted">Тащи здания и мелочи мышью: шаг — полклетки, ромб под зданием — его площадка. Площадка краснеет, если наложилась на другое здание, стену или воду. Клик по мелочи в палитре, потом по карте — поставить (с Shift — ставить ещё). Выбранное: <b>F</b> — отразить, <b>Delete</b> — удалить мелочь, стрелки — сдвинуть, <b>Cmd+Z</b> — отменить. В режиме «Русло реки» тащи точки, двойной клик — новая точка.</p>
  <div class="row edbar"><button data-edmode="obj" class="${ED.mode==='obj'?'on':''}">Здания и мелочи</button><button data-edmode="river" class="${ED.mode==='river'?'on':''}">Русло реки</button>
    <label class="small">Размер кремля <input type="range" id="edR" min="6" max="12" step="1" value="${MAP.R}"> <span id="edRl"></span></label>
    <span style="flex:1"></span><span class="small muted">Масштаб</span><button data-edzoom="fit">Вписать</button><button data-edzoom="1">×1</button><button data-edzoom="2">×2</button>
    <button data-edundo>Отменить</button><button class="main" data-edsave>Сохранить</button></div>
  <div class="edwrap"><canvas id="edmap" width="${MAP.W}" height="${MAP.H}"></canvas></div>
  <div class="edinfo" id="edinfo"></div>
  <div class="edpal" id="edpal"></div>
  <div class="slot"><div class="px small gold">Масштаб зданий: все рядом, в одном масштабе (×2)</div><div class="edscale" id="edscale"></div></div></div>`}
function edPanel(){const el=document.getElementById('edinfo');if(!el)return;const s=ED.sel,it=edIt(s),W=edWarn();let a='';
  if(s&&s.b){const f=footprint(it);a=`<b class="gold">${it.name}</b> · площадка ${edNum(r2(f.s))}×${edNum(r2(f.s))} кл. · место ${edNum(it.at[0])}; ${edNum(it.at[1])} <button data-edflip>⇄ Отразить</button>`}
  else if(s&&s.p)a=`<b class="gold">${edName(it)}</b>${it.k.startsWith('p_')||it.k.startsWith('b_')?`, вариант ${it.v+1}`:''} · место ${edNum(it.at[0])}; ${edNum(it.at[1])} <button data-edflip>⇄ Отразить</button><button data-eddel>Удалить</button>`;
  else if(s&&s.t==='pt')a=`<b class="gold">Точка русла ${s.k+1} из ${RIVER.length}</b> · река течёт от точки 1 (Горы) к последней (Омут) · <button data-eddel>Удалить точку</button>`;
  else if(ED.place)a=`<span class="gold">Ставим: ${edName(ED.place)}</span> — кликни на карте. Esc — отмена`;
  else a=`<span class="muted">${ED.mode==='river'?'Тащи точки русла; двойной клик по карте — новая точка. Мосты встают сами там, где тропы из ворот пересекают реку.':'Кликни здание или мелочь, чтобы выбрать и тащить.'}</span>`;
  el.innerHTML=`<div class="row">${a}<span style="flex:1"></span><span class="small ${ED.dirty?'gold':'muted'}">${ED.dirty?'есть несохранённые изменения':'как в js/layout.js'}</span></div>
    ${ED.msg?`<div class="small">${ED.msg}</div>`:''}
    ${W.msg.length?`<div class="small bad">${W.msg.join(' · ')}</div>`:'<div class="small ok">Наложений нет</div>'}`}
// палитра: одобренные мелочи (каждый кадр ленты), деревья и кусты Поля, деревья атласа
function edItems(){const o=[];
  Object.keys(PROP).filter(id=>id!=='p_most').forEach(id=>{const k=pimg(id);if(k)k.fr.forEach((f,v)=>o.push({g:'Одобренные мелочи',k:id,v}))});
  ['b_pole_trees','b_pole_bushes'].forEach(id=>{const k=bimg(id);if(k)k.fr.forEach((f,v)=>o.push({g:'Деревья и кусты Поля',k:id,v}))});
  ['birch','oak','spruce','autumn','dead','bush'].forEach(n=>variants(n).sort().forEach(k=>o.push({g:'Деревья атласа',k,v:0})));return o}
function edPalette(){const el=document.getElementById('edpal');if(!el)return;const L=edItems(),G=[...new Set(L.map(x=>x.g))];
  el.innerHTML=`<div class="px small gold">Мелочи — клик, потом клик по карте</div>`+(L.some(x=>x.g==='Одобренные мелочи')?'':'<div class="small muted">Одобренных пока нет: отметь варианты в карточках «Мелочи» ниже и нажми «Сохранить набор» — они появятся здесь.</div>')+
    G.map(g=>`<div class="small muted">${g}</div><div class="items">${L.map((x,i)=>x.g===g?`<button class="pitem ${ED.place&&ED.place.k===x.k&&ED.place.v===x.v?'on':''}" data-pi="${i}" title="${esc(edName(x))}"><canvas></canvas></button>`:'').join('')}</div>`).join('');
  el.querySelectorAll('[data-pi]').forEach(b=>{const x=L[+b.dataset.pi],c=b.querySelector('canvas'),g0=c.getContext('2d'),k=propSrc(x.k);let w,h,draw;
    if(k){const f=k.fr[x.v%k.fr.length];w=f.w;h=f.h;draw=(g,s)=>g.drawImage(k.im,f.sx+f.x0,f.y0,f.w,f.h,0,0,f.w*s,f.h*s)}else{const a=ATLAS[x.k];w=a[2];h=a[3];draw=(g,s)=>g.drawImage(ATL,a[0],a[1],a[2],a[3],0,0,a[2]*s,a[3]*s)}
    const s=Math.max(1,Math.min(3,Math.floor(48/Math.max(w,h))));c.width=w*s;c.height=h*s;g0.imageSmoothingEnabled=false;draw(g0,s);b.onclick=()=>{ED.mode!=='obj'&&edMode('obj');ED.place={k:x.k,v:x.v};ED.sel=null;edPalette();edPanel()}})}
// все здания рядом в одном масштабе: подпись — площадка в клетках
function edScale(){const el=document.getElementById('edscale');if(!el)return;const L=[...BLD.map(b=>({n:b.name,id:b.id,b})),{n:'Проездная башня',id:'tower_gate'},{n:'Прясло',id:'wall_out'}];
  const g=pimg('p_strazh');if(g)L.push({n:'Стражник',st:g});
  el.innerHTML=L.map((x,i)=>`<figure><canvas data-sc="${i}"></canvas><figcaption class="small">${x.n}${x.b?`<br><span class="muted">${edNum(r2(footprint(x.b).s))}×${edNum(r2(footprint(x.b).s))} кл.</span>`:''}</figcaption></figure>`).join('');
  el.querySelectorAll('[data-sc]').forEach(c=>{const x=L[+c.dataset.sc],g0=c.getContext('2d');let src,sx,sy,w,h;
    if(x.st){const f=x.st.fr[0];src=x.st.im;sx=f.sx+f.x0;sy=f.y0;w=f.w;h=f.h}else{const k=kimg(x.id);if(!k){c.width=c.height=0;return}src=k.im;sx=k.x0;sy=k.y0;w=k.x1-k.x0+1;h=k.y1-k.y0+1}
    c.width=w*2;c.height=h*2;g0.imageSmoothingEnabled=false;g0.drawImage(src,sx,sy,w,h,0,0,w*2,h*2)})}
function edInit(){const c=edC();if(!c)return;c.onmousedown=edDown;c.onmousemove=edMove;c.onmouseleave=edLeave;c.ondblclick=edDbl;edSyncR();edZoom();edBuild();edPanel();edPalette();edScale()}
addEventListener('mouseup',edUp);addEventListener('keydown',edKey);
document.addEventListener('input',e=>{if(e.target.id==='edR')edR(e.target.value)});
document.addEventListener('click',e=>{const d=e.target.dataset;if(!d)return;
  if(d.edmode)edMode(d.edmode);else if(d.edzoom)edZoom(d.edzoom==='fit'?'fit':+d.edzoom);else if('edsave'in d)edSave();else if('edundo'in d)edUndo();else if('edflip'in d)edFlip();else if('eddel'in d)edDel()});
