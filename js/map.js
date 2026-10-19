'use strict';
// ---------- изометрическая карта: кремль в центре, зоны секторами вокруг ----------
// сетка больше окна: лес уходит за края, кремль в центре; R — полуразмер кремля в клетках
const MAP={N:49,TW:40,TH:20,C:24,W:880,H:560,R:8};
const ATL=new Image();ATL.src='assets/env/atlas.png';
function drawA(g,name,x,y,sc=1){const a=ATLAS[name];if(!a||!ATL.complete)return;g.drawImage(ATL,a[0],a[1],a[2],a[3],Math.round(x-a[4]*sc),Math.round(y-a[5]*sc),a[2]*sc,a[3]*sc)}
const VAR={};const variants=p=>VAR[p]||(VAR[p]=Object.keys(ATLAS).filter(k=>k.startsWith(p+'_')));
const rnd=seed=>{let s=(seed>>>0)||1;return()=>(s=(s*1664525+1013904223)>>>0)/4294967296};
const hash=(i,j)=>((i*73856093)^(j*19349663)^0x5bd1e995)>>>0;
const gp=(i,j)=>[MAP.W/2+(i-j)*MAP.TW/2,MAP.H/2+(i+j-2*MAP.C)*MAP.TH/2]; // точка сетки → экран
const onScreen=(x,y,m=60)=>x>-m&&x<MAP.W+m&&y>-m&&y<MAP.H+m*2;
const RAY=k=>Math.PI/2+k*Math.PI/4; // направление на зону k (0 — вниз, дальше по часовой)

// ---------- арт кремля из мастерской: assets/buildings/<id>.png; пока его нет — атлас и процедурные стены ----------
// прясла: wall — вид изнутри (задние стороны), wall_out — вид снаружи (передние); наклон «/» или «\» игра узнаёт по картинке и отражает; g_* — ленты плиток земли 40×20
const FORT=['wall','wall_out','tower_corner','tower_small','tower_gate'],GROUND={kreml:'t_kremlin',most:'t_road',road:'t_road',posad:'t_posad'};
const KREM_IDS=()=>[...BLD.map(b=>b.id),...FORT,...Object.keys(GROUND).map(k=>'g_'+k)];
const KIM={};let onKremLoad=null;
function prepK(id,im){const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);
  if(id.startsWith('g_'))return{im:c,n:Math.max(1,Math.round(c.width/MAP.TW))};
  let x0=1e9,y0=1e9,x1=-1,y1=-1;
  try{const d=g.getImageData(0,0,c.width,c.height).data;
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>=10){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  }catch(e){x0=y0=0;x1=c.width-1;y1=c.height-1} // file:// не даёт читать пиксели — берём холст целиком
  if(x1<0)return false;const k={im:c,x0,y0,x1,y1,ax:Math.round((x0+x1+1)/2),ay:y1+1};
  if(id.startsWith('wall'))k.slash=wallSlash(g,k);return k}
// прясло «/», если верх картинки слева ниже, чем справа
function wallSlash(g,k){const w=k.x1-k.x0+1,q=Math.max(1,Math.floor(w/4)),top=x=>{try{const d=g.getImageData(x,0,1,k.y1+1).data;for(let y=0;y<=k.y1;y++)if(d[y*4+3]>=10)return y}catch(e){}return 0};
  let l=0,r=0;for(let i=0;i<q;i++){l+=top(k.x0+i);r+=top(k.x1-i)}return l>r}
function kimg(id){if(!(id in KIM)){KIM[id]=null;const im=new Image();im.onload=()=>{KIM[id]=prepK(id,im);onKremLoad&&onKremLoad()};im.onerror=()=>{KIM[id]=false};im.src=`assets/buildings/${id}.png`}return KIM[id]}
const setKrem=(id,c)=>{KIM[id]=c?prepK(id,c):false}; // мастерская подставляет выбранное сразу
// картинка по якорю (низ по центру); flip — зеркально
function drawK(g,k,x,y,flip,dy=0){x=Math.round(x);y=Math.round(y-k.ay+dy);if(!flip)return g.drawImage(k.im,x-k.ax,y);g.save();g.translate(x,0);g.scale(-1,1);g.drawImage(k.im,-k.ax,y);g.restore()}

function cellInfo(i,j){
  const dx=i+.5-MAP.C,dy=j+.5-MAP.C,R=MAP.R,ax=Math.abs(dx),ay=Math.abs(dy),m=Math.max(ax,ay),r=Math.hypot(dx,dy),h=rnd(hash(i,j))();
  if(m<R)return{z:-1,g:ax<1||ay<1||ax<2.6&&ay<2.6?'most':'kreml'}; // внутри стен: мостовая от ворот и соборная площадь в центре
  if(m<R+2.5){if(dx<0&&dy>0&&Math.abs(dx+dy)<2.6+h*.8)return{z:-2,g:'water'}; // речка от Омута к левой башне, у неё баня
    return{z:-2,g:ax<1||ay<1?'road':'posad'}}                     // посад вокруг стен, дороги из ворот
  const sx=(dx-dy)*MAP.TW/2,sy=(dx+dy)*MAP.TH/2,a=Math.atan2(sy,sx)+(h-.5)*.3;
  const zi=Math.floor(((a-Math.PI/2+Math.PI/8)%(2*Math.PI)+4*Math.PI)%(2*Math.PI)/(Math.PI/4));
  const perp=k=>{const t=RAY(k);return{along:sx*Math.cos(t)+sy*Math.sin(t),d:Math.abs(sx*Math.sin(t)-sy*Math.cos(t))/MAP.TW}};
  if(r<R+7){for(let k=0;k<8;k++){const p=perp(k);if(p.along>0&&p.d<.45)return{z:zi,g:'road'}}} // тропы от посада в зоны
  const Z=ZONES[zi],B=BIOMES[Z.ground];let g=Z.ground;
  if(Z.water&&perp(zi).d<1.1+h*.4)g='water';
  if(B&&B.ponds&&bimg(BIO_WATER)&&B.ponds.some(([px,py,s])=>Math.hypot(dx-px,dy-py)<s+(h-.5)*.6))g='water'; // пруды биома, когда выбран арт воды
  return{z:zi,g};
}

let MB=null; // {cells, base canvas, rects}
function buildMap(open){
  const cells=[],objs=[],rects=[];
  for(let i=0;i<MAP.N;i++)for(let j=0;j<MAP.N;j++){const c=cellInfo(i,j),r=rnd(hash(i,j)*7+3);c.i=i;c.j=j;c.v=r();c.r=r;cells.push(c)}
  const V=vertices(cells),N1=MAP.N+1,corn=c=>{const o=c.i*N1+c.j;return[V[o],V[o+N1],V[o+1],V[o+N1+1]]};
  cells.forEach(c=>{const r=c.r;
    if(c.g==='road'||c.g==='water'||c.z===-1)return;
    const [x,y]=gp(c.i+.5,c.j+.5);if(!onScreen(x,y))return;const ox=()=>(r()-.5)*16,oy=()=>(r()-.5)*7;
    const gr=grove(c.i,c.j),bo=!gr&&c.z>=0&&bioObjs(BIOMES[ZONES[c.z].ground]); // деревья и предметы биома, пока их нет — атлас
    if(bo){const o=bioPick(c.i,c.j,bo); // не больше одного на клетку, на своей земле, не у воды и не прямо за высоким деревом
      if(o&&!corn(c).includes('water')&&corn(c).filter(v=>v===c.g).length>1&&!(o.f.h<=40&&[[1,0],[0,1],[1,1]].some(([a,b])=>{const q=bioPick(c.i+a,c.j+b,bo);return q&&q.f.h>40})))
        objs.push({y:y+o.oy,f:g=>drawF(g,o.k.im,o.f,x+o.ox,y+o.oy,o.fl)})}
    else{const trees=gr||(c.z===-2?{bush:.05}:ZONES[c.z].trees);
      for(const k in trees)if(r()<trees[k]){const vv=variants(k),n=vv[Math.floor(r()*vv.length)],px=x+ox(),py=y+oy();objs.push({y:py,f:g=>drawA(g,n,px,py)})}}
    if(c.z>=0&&ZONES[c.z].mounds&&r()<.08){const px=x+ox(),py=y+oy();objs.push({y:py,f:g=>mound(g,px,py)})}
    if(c.z>=0&&ZONES[c.z].rocks&&r()<.14){const px=x+ox(),py=y+oy(),s=.7+r()*.6;objs.push({y:py,f:g=>rock(g,px,py,s)})}
  });
  // стены: башни по углам, ворота посередине каждой стороны, между ними малые башни, а между башнями прясла стены
  const R=MAP.R,k0=MAP.C-R,k1=MAP.C+R,K=[[k0,k0],[k1,k0],[k1,k1],[k0,k1]],at=(a,b,t)=>gp(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);
  for(let e=0;e<4;e++){const a=K[e],b=K[(e+1)%4],slash=e%2===1,front=e===1||e===2; // стороны 1 и 3 идут «/», 0 и 2 — «\»; 1 и 2 — передние, к нам наружной стороной
    for(let q=0;q<4;q++){const[px,py]=at(a,b,(q+.5)/4);objs.push({y:py,f:g=>wallSpan(g,a,b,q,px,py,slash,front)})}
    [.25,.5,.75].forEach(t=>{const[px,py]=at(a,b,t);objs.push({y:py+1,f:g=>tower(g,t===.5?'tower_gate':'tower_small',px,py,slash)})})}
  K.forEach(([i,j])=>{const[px,py]=gp(i,j);objs.push({y:py+1,f:g=>tower(g,'tower_corner',px,py,false)})});
  BLD.forEach(b=>{const[px,py]=gp(MAP.C+b.at[0],MAP.C+b.at[1]);objs.push({y:py,f:g=>{const k=kimg(b.id);
    if(k){drawK(g,k,px,py,b.fl);rects.push({id:b.id,x:b.fl?Math.round(px)+k.ax-k.x1-1:Math.round(px)-k.ax+k.x0,y:Math.round(py)-k.ay+k.y0,w:k.x1-k.x0+1,h:k.y1-k.y0+1})}
    else if(b.spr){drawA(g,b.spr,px,py);const a=ATLAS[b.spr];rects.push({id:b.id,x:px-a[4],y:py-a[5],w:a[2],h:a[3]})}
    else{kapishche(g,px,py);rects.push({id:b.id,x:px-22,y:py-34,w:44,h:42})}}})});
  const cv=document.createElement('canvas');cv.width=MAP.W;cv.height=MAP.H;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
  g.fillStyle='#07060a';g.fillRect(0,0,MAP.W,MAP.H);
  cells.forEach(c=>{const[x,y]=gp(c.i,c.j);if(onScreen(x,y))ground(g,c,x,y,corn(c))});
  objs.sort((a,b)=>a.y-b.y).forEach(o=>o.f(g));
  cells.forEach(c=>{if(c.z>=0&&!open(c.z))diamond(g,c.i,c.j,'rgba(6,4,8,.66)')});
  const vg=g.createRadialGradient(MAP.W/2,MAP.H/2,MAP.H*.42,MAP.W/2,MAP.H/2,MAP.W*.62);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(4,3,6,.85)');
  g.fillStyle=vg;g.fillRect(0,0,MAP.W,MAP.H);
  MB={cells,base:cv,rects};
}
// плитка земли целиком: биом (js/biomes.js), лента из мастерской (кремль, посад, дороги) или атлас
function plain(g,t,v,x,y){const B=BIOMES[t],b=B&&bimg(B.ground);if(b)return g.drawImage(b.im,Math.floor(v*b.n)*MAP.TW,0,MAP.TW,MAP.TH,x-MAP.TW/2,y,MAP.TW,MAP.TH);
  const k=GROUND[t]&&kimg('g_'+t);if(k)return g.drawImage(k.im,Math.floor(v*k.n)*MAP.TW,0,MAP.TW,k.im.height,x-MAP.TW/2,y,MAP.TW,k.im.height);
  const vv=variants(GROUND[t]||'t_'+t);drawA(g,vv[Math.floor(v*vv.length)],x-MAP.TW/2,y)}
// у каждой вершины сетки своя земля: большинство из 12 клеток вокруг (ближние четыре вдвое весомее), ничья — по жребию;
// так граница зон идёт плавной линией, а не лесенкой по клеткам. Рядом дорога — дорога, чтобы поле не съедало тропы
const VNB=[[-1,-1,2],[0,-1,2],[-1,0,2],[0,0,2],[-2,-1,1],[-2,0,1],[1,-1,1],[1,0,1],[-1,-2,1],[0,-2,1],[-1,1,1],[0,1,1]];
function vertices(cells){const N=MAP.N,V=[];
  for(let i=0;i<=N;i++)for(let j=0;j<=N;j++){const n={};let best=null,bn=0,road=false;const r=rnd(hash(i,j)*13+5);
    for(const[da,db,w]of VNB){const a=i+da,b=j+db;if(a<0||b<0||a>=N||b>=N)continue;const t=cells[a*N+b].g;if(w>1&&t==='road')road=true;n[t]=(n[t]||0)+w}
    if(!road)for(const t in n)if(n[t]>bn||n[t]===bn&&r()<.5){best=t;bn=n[t]}
    V.push(road?'road':best)}
  return V}
// клетка слоями по земле её углов t = [NW, NE, SW, SE] (верх, право, лево, низ ромба): сначала обычная земля (своя или соседа),
// поверх — земля биома по маске углов из набора переходов к этой земле, поверх — вода с берегом. Без арта биома — плитка клетки целиком
function ground(g,c,x,y,t){const bit=f=>t.reduce((m,v,k)=>f(v)?m|8>>k:m,0),W=bimg(BIO_WATER),wet=W&&t.includes('water');
  const bio=t.find(v=>BIOMES[v]&&bimg(BIOMES[v].ground)),B=bio&&BIOMES[bio],land=v=>v!==bio&&!(W&&v==='water');
  let base=land(c.g)?c.g:null;if(!base){const n={};t.filter(land).forEach(v=>n[v]=(n[v]||0)+1);base=Object.keys(n).sort((a,b)=>n[b]-n[a])[0]||bio||c.g}
  if(base!==bio)plain(g,base,c.v,x,y);
  if(B)bioLand(g,B,c,x,y,bit(v=>v===bio||wet&&v==='water'),B.sets[base]&&bimg(B.sets[base])||Object.values(B.sets).map(bimg).find(Boolean),c.g===bio);
  if(wet){const wm=bit(v=>v==='water'),sx=Math.floor(c.v*W.n)*MAP.TW,M=bimg(BIO_SHORE);
    if(wm===15||!M&&c.g==='water')g.drawImage(W.im,sx,0,MAP.TW,MAP.TH,x-MAP.TW/2,y,MAP.TW,MAP.TH);else if(M&&wm)g.drawImage(bioPiece(M,'w'+sx,wm,W.im,sx,'#1b1d12'),x-MAP.TW/2,y)}}
// земля биома на углах fm клетки: виды плиток лежат пятнами (у каждой вершины свой вид по плавному шуму), между видами и с соседней землёй
// граница по маске углов из набора переходов S. Без наборов — плитка клетки целиком, и только если клетка своя (own)
function bioLand(g,B,c,x,y,fm,S,own){const k=bimg(B.ground),X=x-MAP.TW/2,tile=(v,m)=>m===15?g.drawImage(k.im,v*MAP.TW,0,MAP.TW,MAP.TH,X,y,MAP.TW,MAP.TH):g.drawImage(bioPiece(S,B.ground+v,m,k.im,v*MAP.TW),X,y);
  if(!fm)return;if(!S){if(own)tile(bioVar(c.i,c.j,k.n),15);return}
  const vs=[[0,0],[1,0],[0,1],[1,1]].map(([a,b])=>bioVar(c.i+a,c.j+b,k.n)),n={};vs.forEach((v,q)=>{if(fm&8>>q)n[v]=(n[v]||0)+1});
  const order=Object.keys(n).map(Number).sort((a,b)=>n[b]-n[a]);tile(order[0],fm);
  for(const v of order.slice(1))tile(v,vs.reduce((m,w,q)=>fm&8>>q&&w===v?m|8>>q:m,0))}
// вид плитки у вершины: плавный шум с шагом в 3 клетки, поделённый на n видов
function bioVar(i,j,n){const s=3,a=Math.floor(i/s),b=Math.floor(j/s),fx=i/s-a,fy=j/s-b,h=(p,q)=>rnd(hash(p,q)*31+17)(),l=(u,v,t)=>u+(v-u)*t*t*(3-2*t);
  return Math.min(n-1,Math.floor(l(l(h(a,b),h(a+1,b),fx),l(h(a,b+1),h(a+1,b+1),fx),fy)*n))}
// предмет биома на клетке по её собственному жребию (так видно, что стоит у соседей): картинка, кадр, отражение, сдвиг; null — пусто
function bioPick(i,j,bo){const r=rnd(hash(i,j)*11+7),q=bo.find(([,p])=>r()<p);if(!q)return null;const k=q[0];return{k,f:k.fr[Math.floor(r()*k.fr.length)],fl:r()<.5,ox:(r()-.5)*16,oy:(r()-.5)*7}}
// предметы биома, у которых выбрана основа: [картинка, вероятность на клетку]; null — ни одной
function bioObjs(B){if(!B||!B.objs)return null;const o=Object.entries(B.objs).map(([id,p])=>[bimg(id),p]).filter(q=>q[0]);return o.length?o:null}
// кадр предмета по якорю (низ видимой части по центру)
function drawF(g,im,f,x,y,fl){x=Math.round(x);y=Math.round(y-f.ay+1);if(!fl)return g.drawImage(im,f.sx+f.x0,f.y0,f.w,f.h,x-f.ax,y,f.w,f.h);
  g.save();g.translate(x,0);g.scale(-1,1);g.drawImage(im,f.sx+f.x0,f.y0,f.w,f.h,-f.ax,y,f.w,f.h);g.restore()}
// прясло стены между башнями; короткий арт ставим несколько раз вдоль прясла. Без арта — частокол
function wallSpan(g,a,b,q,px,py,slash,front){const k=front&&kimg('wall_out')||kimg('wall');
  if(k){const L=k.x1-k.x0+1,S=MAP.R*MAP.TW/4,n=Math.max(1,Math.ceil(S/(L*.75))),step=n>1?(S-L)/(n-1):0,s=slash?-1:1; // S — ширина прясла на экране
    // куски внахлёст от дальнего к ближнему: каждый следующий закрывает торец предыдущего
    for(let m=0;m<n;m++){const o=(m-(n-1)/2)*step*s;drawK(g,k,px+o,py+o*s/2,k.slash!==slash,L/4)}return}
  for(let t=q/4+.04;t<(q+1)/4-.03;t+=.02){const[x,y]=gp(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);pole(g,x,y)}}
// башня стоит центром на линии стены: низ картинки — ближний угол её основания. Проезд нарисован на левой грани, на сторонах «/» — отражаем
function tower(g,id,x,y,flip){const k=kimg(id);if(k)return drawK(g,k,x,y,flip,(k.x1-k.x0+1)/4);if(id!=='tower_small')drawA(g,'tower',x,y)}
// роща вокруг капища за стенами: берёзы и дубы, но не перед самим капищем, чтобы его было видно
function grove(i,j){const b=BLD.find(b=>b.id==='kapishche');if(!b)return null;const cx=MAP.C+b.at[0]-.8,cy=MAP.C+b.at[1]-.8,dx=i+.5-cx,dy=j+.5-cy,d=Math.hypot(dx,dy);
  if(d>3.4)return null;return d>1.3&&dx+dy<1?{birch:.45,oak:.2}:{}}
function diamond(g,i,j,col){const[x,y]=gp(i,j);g.fillStyle=col;g.beginPath();g.moveTo(x,y);g.lineTo(x+MAP.TW/2,y+MAP.TH/2);g.lineTo(x,y+MAP.TH);g.lineTo(x-MAP.TW/2,y+MAP.TH/2);g.closePath();g.fill()}
function pole(g,x,y){g.fillStyle='#1e130b';g.fillRect(x-2,y-15,4,15);g.beginPath();g.moveTo(x-2,y-15);g.lineTo(x+2,y-15);g.lineTo(x,y-19);g.fill();g.fillStyle='#6b4a2e';g.fillRect(x-1,y-14,2,13)}
function mound(g,x,y){g.fillStyle='#1e1610';g.beginPath();g.ellipse(x,y-2,15,7,0,0,7);g.fill();g.fillStyle='#3e3022';g.beginPath();g.ellipse(x-1,y-5,10,4,0,0,7);g.fill()}
function rock(g,x,y,s){g.fillStyle='#2e2e34';g.beginPath();g.moveTo(x-9*s,y);g.lineTo(x-5*s,y-11*s);g.lineTo(x+3*s,y-14*s);g.lineTo(x+9*s,y-4*s);g.lineTo(x+6*s,y+2*s);g.closePath();g.fill();
  g.fillStyle='#55555c';g.beginPath();g.moveTo(x-5*s,y-11*s);g.lineTo(x+3*s,y-14*s);g.lineTo(x+1*s,y-3*s);g.lineTo(x-7*s,y-1*s);g.closePath();g.fill()}
function kapishche(g,x,y){for(let k=0;k<7;k++){const a=k/7*Math.PI*2;g.fillStyle='#55555c';g.beginPath();g.ellipse(x+Math.cos(a)*17,y+Math.sin(a)*8,3,2.5,0,0,7);g.fill()}
  g.fillStyle='#e8862a';g.fillRect(x-2,y+3,4,3);g.fillStyle='#1e130b';g.fillRect(x-4,y-29,8,29);g.fillStyle='#5a3a22';g.fillRect(x-3,y-28,6,27);
  g.fillStyle='#1e130b';g.fillRect(x-2,y-24,1,2);g.fillRect(x+1,y-24,1,2);g.fillRect(x-2,y-19,4,1);g.fillRect(x-4,y-14,8,1)}
function zoneLabelPos(zi){const t=RAY(zi),r=[14.5,12.6,12.9,12.6,16.6,12.6,12.9,12.6][zi],rho=r*Math.SQRT2/Math.hypot(Math.cos(t)/(MAP.TW/2),Math.sin(t)/(MAP.TH/2)),[cx,cy]=gp(MAP.C,MAP.C);return[cx+rho*Math.cos(t),cy+rho*Math.sin(t)]}
function plate(g,x,y,lines,hot){g.font='9px "Press Start 2P", monospace';const w=Math.max(...lines.map(l=>g.measureText(l).width))+14,h=lines.length*14+8;
  g.fillStyle=hot?'rgba(60,30,16,.92)':'rgba(14,10,8,.82)';g.fillRect(x-w/2,y-h/2,w,h);g.strokeStyle=hot?'#d4a84a':'#6a4a2a';g.lineWidth=1;g.strokeRect(x-w/2+.5,y-h/2+.5,w-1,h-1);
  lines.forEach((l,k)=>{g.fillStyle=k?'#9a8a72':(hot?'#f0d080':'#e8dcc4');g.fillText(l,x-g.measureText(l).width/2,y-h/2+16+k*14)})}

// рисует карту на видимом холсте: основа + подсветка + подписи
function paintMap(cv,st){const g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(MB.base,0,0);
  const hz=st.hover&&st.hover.type==='zone'?st.hover.zi:-9,sz=st.sel&&st.sel.type==='zone'?st.sel.zi:-9;
  MB.cells.forEach(c=>{if(c.z===hz||c.z===sz)diamond(g,c.i,c.j,c.z===sz?'rgba(255,200,120,.16)':'rgba(255,220,160,.1)')});
  ZONES.forEach((z,zi)=>{const[x,y]=zoneLabelPos(zi);plate(g,x,y,st.open(zi)?[z.short]:[z.short,'закрыто'],zi===hz||zi===sz)});
  const hb=st.hover&&st.hover.type==='bld'?st.hover.id:null;
  if(hb){const r=MB.rects.find(q=>q.id===hb),b=BLD.find(q=>q.id===hb);g.strokeStyle='#d4a84a';g.strokeRect(r.x+.5,r.y+.5,r.w,r.h);plate(g,r.x+r.w/2,r.y-10,[b.name],1)}}
function mapPick(cv,ev){const rc=cv.getBoundingClientRect(),mx=(ev.clientX-rc.left)*cv.width/rc.width,my=(ev.clientY-rc.top)*cv.height/rc.height;
  for(let k=MB.rects.length-1;k>=0;k--){const r=MB.rects[k];if(mx>=r.x&&mx<=r.x+r.w&&my>=r.y&&my<=r.y+r.h)return{type:'bld',id:r.id}}
  const u=(mx-MAP.W/2)/(MAP.TW/2),v=(my-MAP.H/2)/(MAP.TH/2)+2*MAP.C,i=Math.floor((u+v)/2),j=Math.floor((v-u)/2);
  if(i<0||j<0||i>=MAP.N||j>=MAP.N)return null;const c=MB.cells[i*MAP.N+j];return c.z>=0?{type:'zone',zi:c.z}:null}

// фон боя: небо зоны, полоса изометрической земли и деревья на заднем плане
// фон боя биома: картинка без растяжения — по высоте окна обрезаем небо сверху, по ширине — края поровну
function paintArena(cv,zi){const Z=ZONES[zi],B=BIOMES[Z.ground],k=B&&B.arena&&bimg(B.arena);
  if(k){const w0=k.im.width,h0=k.im.height,a=(cv.clientWidth||440)/(cv.clientHeight||118),w=Math.min(w0,Math.round(h0*a)),h=Math.min(h0,Math.round(w0/a)),g=cv.getContext('2d');
    cv.width=w;cv.height=h;g.imageSmoothingEnabled=false;g.drawImage(k.im,(w0-w)>>1,h0-h,w,h,0,0,w,h);
    const fog=g.createLinearGradient(0,0,0,h);fog.addColorStop(0,'rgba(0,0,0,.25)');fog.addColorStop(.6,'rgba(0,0,0,0)');fog.addColorStop(1,'rgba(0,0,0,.35)');g.fillStyle=fog;g.fillRect(0,0,w,h);return}
  const W=440,H=118,g=cv.getContext('2d');cv.width=W;cv.height=H;g.imageSmoothingEnabled=false;
  const sk=g.createLinearGradient(0,0,0,70);sk.addColorStop(0,Z.sky[1]);sk.addColorStop(1,Z.sky[0]);g.fillStyle=sk;g.fillRect(0,0,W,H);
  const r=rnd(zi*977+13),tv=variants('t_'+Z.ground),wv=variants('t_water');
  for(let row=0;row<8;row++)for(let col=-1;col<12;col++){const n=Z.water&&row<2?wv[Math.floor(r()*wv.length)]:tv[Math.floor(r()*tv.length)];drawA(g,n,col*40+(row%2?20:0),60+row*8)}
  const kinds=Object.keys(Z.trees),objs=[];for(let k=0;k<11;k++){const kind=kinds[Math.floor(r()*kinds.length)],vv=variants(kind);objs.push([vv[Math.floor(r()*vv.length)],r()*W,66+r()*10])}
  objs.sort((a,b)=>a[2]-b[2]).forEach(o=>drawA(g,o[0],o[1],o[2]));
  const fog=g.createLinearGradient(0,0,0,H);fog.addColorStop(0,'rgba(0,0,0,.35)');fog.addColorStop(.6,'rgba(0,0,0,0)');fog.addColorStop(1,'rgba(0,0,0,.45)');g.fillStyle=fog;g.fillRect(0,0,W,H)}
