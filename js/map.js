'use strict';
// ---------- изометрическая карта: кремль в центре, зоны секторами вокруг ----------
// сетка больше окна: лес уходит за края, кремль в центре; R — полуразмер кремля в клетках (задаёт js/layout.js)
const MAP={N:49,TW:40,TH:20,C:24,W:880,H:560,R:8};
const ATL=new Image();ATL.src='assets/env/atlas.png';
function drawA(g,name,x,y,sc=1){const a=ATLAS[name];if(!a||!ATL.complete)return;g.drawImage(ATL,a[0],a[1],a[2],a[3],Math.round(x-a[4]*sc),Math.round(y-a[5]*sc),a[2]*sc,a[3]*sc)}
const VAR={};const variants=p=>VAR[p]||(VAR[p]=Object.keys(ATLAS).filter(k=>k.startsWith(p+'_')));
const rnd=seed=>{let s=(seed>>>0)||1;return()=>(s=(s*1664525+1013904223)>>>0)/4294967296};
const hash=(i,j)=>((i*73856093)^(j*19349663)^0x5bd1e995)>>>0;
// жребий клетки — от её места относительно кремля, а не от номера в сетке: сетка растёт с окном, а лес остаётся тем же (при C = 24 — как было)
const hc=(i,j)=>hash(i-MAP.C+24,j-MAP.C+24);
// окно карты: холст в пикселях игры и сетка, которой хватает до краёв (с запасом под деревья у нижнего края). true — размер сменился, карту надо собрать заново
function mapView(w,h){w=Math.max(200,Math.round(w));h=Math.max(150,Math.round(h));if(w===MAP.W&&h===MAP.H)return false;
  MAP.W=w;MAP.H=h;MAP.C=Math.max(24,Math.ceil(((w/2+60)/(MAP.TW/2)+(h/2+120)/(MAP.TH/2))/2)+1);MAP.N=2*MAP.C+1;return true}
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

// ---------- расстановка: js/layout.js, его пишет редактор в мастерской (вкладка «Кремль») ----------
// R — полуразмер кремля; bld — место здания [dx, dy, отражено]: точка сетки от центра кремля, куда встаёт низ картинки;
// props — мелочи [картинка, кадр, dx, dy, отражено]; river — контрольные точки русла [dx, dy]. Чего нет в файле — остаётся из BLD
let PROPS=[],RIVER=[];
function applyLayout(L){if(!L)return;MAP.R=L.R||MAP.R;
  BLD.forEach(b=>{const p=L.bld&&L.bld[b.id];if(p){b.at=[p[0],p[1]];b.fl=p[2]?1:0}});
  PROPS=(L.props||[]).map(p=>({k:p[0],v:p[1],at:[p[2],p[3]],fl:p[4]?1:0}));RIVER=(L.river||[]).map(p=>[p[0],p[1]])}
const r2=v=>Math.round(v*100)/100;
function layoutOf(){return{R:MAP.R,bld:Object.fromEntries(BLD.map(b=>[b.id,[r2(b.at[0]),r2(b.at[1]),b.fl?1:0]])),
  props:PROPS.map(p=>[p.k,p.v,r2(p.at[0]),r2(p.at[1]),p.fl?1:0]),river:RIVER.map(p=>[r2(p[0]),r2(p[1])])}}
applyLayout(typeof LAYOUT!=='undefined'&&LAYOUT);
// площадка здания — квадрат по сетке: низ картинки — ближний угол, сторона — ширина картинки / 40 (в изометрии квадрат s×s клеток шириной 40·s)
function footprint(b){const k=kimg(b.id),s=k?Math.max(1,(k.x1-k.x0+1)/MAP.TW):1.5;return{x0:b.at[0]-s,y0:b.at[1]-s,x1:b.at[0],y1:b.at[1],s}}

// ---------- река и тропы ----------
// Русло — сплайн через RIVER, концы продолжены по касательной за край карты. Ширина растёт вниз по течению (от Гор к Омуту), в Омуте река разливается.
// Тропы идут из ворот: дорога прямо от стены, за рекой развилка, оттуда к подписи зоны и дальше в лес. Где тропа пересекает реку — мост.
const GATE=[[0,1],[1,0],[-1,0],[0,-1]]; // ворота по сетке: передние левые и правые, задние левые и правые
const ZGATE=[0,0,2,2,2,3,3,1];          // из каких ворот тропа в зону
// подпись зоны и поворот тропы (экранные пиксели от центра при R = 8; с большим кремлём отодвигаются на столько же клеток)
const ZMARK=[[-20,256],[-330,240],[-400,-20],[-200,-170],[-30,-250],[200,-170],[400,-20],[330,240]];
const toG=(sx,sy)=>[sx/MAP.TW+sy/MAP.TH,sy/MAP.TH-sx/MAP.TW];   // экран от центра → клетки
const toS=(x,y)=>[(x-y)*MAP.TW/2,(x+y)*MAP.TH/2];                 // клетки → экран от центра
const out=(p,d)=>{const l=Math.hypot(p[0],p[1])||1;return[p[0]*(1+d/l),p[1]*(1+d/l)]}; // отодвинуть от центра на d клеток
const zoneOf=(x,y,n=0)=>{const[sx,sy]=toS(x,y),a=Math.atan2(sy,sx)+n;return Math.floor(((a-Math.PI/2+Math.PI/8)%(2*Math.PI)+4*Math.PI)%(2*Math.PI)/(Math.PI/4))};
let RV=null; // река: s — точки оси [x, y, ширина]; поле по клеткам: d — до оси, w — ширина, sd — сторона; tr — тропа; trails, bridges, marks
function riverPts(){const P=RIVER;if(P.length<2)return[];const n=P.length,Q=[[2*P[0][0]-P[1][0],2*P[0][1]-P[1][1]],...P,[2*P[n-1][0]-P[n-2][0],2*P[n-1][1]-P[n-2][1]]],s=[];
  const ext=(a,b,sign)=>{const dx=a[0]-b[0],dy=a[1]-b[1],l=Math.hypot(dx,dy)||1,o=[];for(let t=120;t>0;t-=.25)o.push([a[0]+dx/l*t,a[1]+dy/l*t]);return sign<0?o:o.reverse()};
  s.push(...ext(P[0],P[1],-1));
  for(let k=0;k<n-1;k++){const[p0,p1,p2,p3]=[Q[k],Q[k+1],Q[k+2],Q[k+3]],L=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]),m=Math.max(2,Math.ceil(L/.25));
    for(let q=0;q<m;q++){const t=q/m,t2=t*t,t3=t2*t,f=(a,b,c,d)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);s.push([f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])])}}
  s.push(P[n-1].slice(),...ext(P[n-1],P[n-2],1).slice(1));
  // ширина: 1,5 клетки у истока, 2,5 у устья; в Омуте за посадом — разлив до 3,8. Сглаживаем, чтобы разлив начинался плавно
  const i0=s.findIndex(p=>p[0]===P[0][0]&&p[1]===P[0][1]),i1=s.length-1-[...s].reverse().findIndex(p=>p[0]===P[n-1][0]&&p[1]===P[n-1][1]),
    raw=s.map((p,i)=>{const t=Math.min(1,Math.max(0,(i-i0)/Math.max(1,i1-i0)));return 1.5+t+(zoneOf(p[0],p[1])===2&&Math.max(Math.abs(p[0]),Math.abs(p[1]))>MAP.R+5?1.3:0)});
  return s.map((p,i)=>{let a=0,c=0;for(let q=Math.max(0,i-24);q<=Math.min(s.length-1,i+24);q++){a+=raw[q];c++}return[p[0],p[1],a/c]})}
// пересечения отрезка a→b с осью реки: [доля пути по отрезку, точка, номер точки оси]
function riverX(a,b,s){const o=[];for(let k=0;k<s.length-1;k++){const p=s[k],q=s[k+1],rx=b[0]-a[0],ry=b[1]-a[1],sx=q[0]-p[0],sy=q[1]-p[1],den=rx*sy-ry*sx;if(!den)continue;
  const t=((p[0]-a[0])*sy-(p[1]-a[1])*sx)/den,u=((p[0]-a[0])*ry-(p[1]-a[1])*rx)/den;if(t>=0&&t<=1&&u>=0&&u<=1)o.push([t,[a[0]+rx*t,a[1]+ry*t],k])}return o.sort((x,y)=>x[0]-y[0])}
// расстояние от точки до отрезка
function segD(x,y,a,b){const vx=b[0]-a[0],vy=b[1]-a[1],l=vx*vx+vy*vy,t=l?Math.max(0,Math.min(1,((x-a[0])*vx+(y-a[1])*vy)/l)):0;return Math.hypot(x-a[0]-vx*t,y-a[1]-vy*t)}
function prepWorld(){const N=MAP.N,C=MAP.C,R=MAP.R,s=riverPts(),d=new Float32Array(N*N).fill(99),w=new Float32Array(N*N),sd=new Int8Array(N*N),tr=new Uint8Array(N*N);
  // тропы: дорога из ворот до развилки (сразу за мостом, если река пересекает дорогу ближе 12 клеток от стены), от развилки — к подписи зоны и дальше в лес
  const trails=[],bridges=[],marks=[];
  GATE.forEach((u,g)=>{const S=[u[0]*R,u[1]*R],far=[u[0]*(R+12),u[1]*(R+12)],x=riverX(S,far,s).filter(c=>Math.max(Math.abs(c[1][0]),Math.abs(c[1][1]))>R+.5);
    let F=[u[0]*(R+2.5),u[1]*(R+2.5)];if(x.length){const c=x[x.length-1],k=12*c[0]+s[c[2]][2]/2+1.2;F=[u[0]*(R+k),u[1]*(R+k)]}
    trails.push({p:[S,F],w:1,g});
    ZGATE.forEach((gg,zi)=>{if(gg!==g)return;const W=out(toG(...ZMARK[zi]),R-8),T=out(W,26);marks[zi]=W;trails.push({p:[F,W,T],w:.55,g,zi})})});
  trails.forEach(t=>{for(let q=0;q<t.p.length-1;q++){const a=t.p[q],b=t.p[q+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]),u=[(b[0]-a[0])/L,(b[1]-a[1])/L];
      riverX(a,b,s).forEach(c=>bridges.push({x:c[1],u,w:t.w>.9?1.2:1,k:c[2]}));
      const i0=Math.max(0,Math.floor(Math.min(a[0],b[0])+C-2)),i1=Math.min(N-1,Math.ceil(Math.max(a[0],b[0])+C+2)),j0=Math.max(0,Math.floor(Math.min(a[1],b[1])+C-2)),j1=Math.min(N-1,Math.ceil(Math.max(a[1],b[1])+C+2));
      for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++)if(segD(i+.5-C,j+.5-C,a,b)<t.w)tr[i*N+j]=1}});
  // под мостом река сужается до 1,6 клетки (мосты и строят на узком месте): так мост из мастерской достаёт до берегов
  bridges.forEach(b=>{for(let q=Math.max(0,b.k-16);q<=Math.min(s.length-1,b.k+16);q++){const t=Math.abs(q-b.k)/16;s[q][2]=Math.min(s[q][2],1.6+(s[q][2]-1.6)*t*t)}});
  // поле реки: каждая точка оси метит клетки вокруг себя
  for(let k=0;k<s.length;k++){const[x,y,ww]=s[k],ci=Math.floor(x+C),cj=Math.floor(y+C),q=s[Math.min(s.length-1,k+1)],p=s[Math.max(0,k-1)],tx=q[0]-p[0],ty=q[1]-p[1];
    if(ci<-4||cj<-4||ci>N+3||cj>N+3)continue;
    for(let i=ci-3;i<=ci+3;i++)for(let j=cj-3;j<=cj+3;j++){if(i<0||j<0||i>=N||j>=N)continue;const o=i*N+j,ex=i+.5-C-x,ey=j+.5-C-y,dd=Math.hypot(ex,ey);
      if(dd<d[o]){d[o]=dd;w[o]=ww;sd[o]=tx*ey-ty*ex>0?1:-1}}}
  // сторона кремля: где ось ближе всего к центру
  let best=1e9,side=1;s.forEach((p,k)=>{const h=Math.hypot(p[0],p[1]);if(h<best){best=h;const q=s[Math.min(s.length-1,k+1)],r=s[Math.max(0,k-1)];side=(q[0]-r[0])*-p[1]-(q[1]-r[1])*-p[0]>0?1:-1}});
  RV={s,d,w,sd,side,tr,trails,bridges,marks}}

function cellInfo(i,j){
  const dx=i+.5-MAP.C,dy=j+.5-MAP.C,R=MAP.R,ax=Math.abs(dx),ay=Math.abs(dy),m=Math.max(ax,ay),h=rnd(hc(i,j))(),o=i*MAP.N+j;
  if(m<R)return{z:-1,g:ax<1||ay<1||ax<2.6&&ay<2.6?'most':'kreml'}; // внутри стен: мостовая от ворот и соборная площадь в центре
  const wet=RV.d[o]<RV.w[o]/2+(h-.5)*.4,road=RV.tr[o];
  // посад вокруг стен; со стороны кремля он спускается к самой воде, если река близко. Река у города — тоже посад: её не закрывает туман закрытых зон
  if(m<R+2.5||RV.sd[o]===RV.side&&RV.d[o]<RV.w[o]/2+2.2&&m<R+6||wet&&m<R+7)return{z:-2,g:wet?'water':road?'road':'posad'};
  const zi=zoneOf(dx,dy,(h-.5)*.3),Z=ZONES[zi],B=BIOMES[Z.ground];let g=wet?'water':road?'road':Z.ground;
  if(g===Z.ground&&B&&B.ponds&&bimg(BIO_WATER)&&B.ponds.some(([px,py,s])=>Math.hypot(dx-px,dy-py)<s+(h-.5)*.6))g='water'; // пруды биома, когда выбран арт воды
  return{z:zi,g};
}

let MB=null; // {cells, base canvas, rects — здания для клика, props — мелочи (для редактора)}
// o (редактор мастерской): skip(вещь) — не рисовать то, что сейчас тащат
function buildMap(open,o={}){
  prepWorld();const cells=[],objs=[],rects=[],props=[],skip=o.skip||(()=>false);let ord=0; // ord — порядок рисования: редактор берёт ближнюю вещь
  for(let i=0;i<MAP.N;i++)for(let j=0;j<MAP.N;j++){const c=cellInfo(i,j),r=rnd(hc(i,j)*7+3);c.i=i;c.j=j;c.v=r();c.r=r;cells.push(c)}
  const V=vertices(cells),N1=MAP.N+1,corn=c=>{const o=c.i*N1+c.j;return[V[o],V[o+N1],V[o+1],V[o+N1+1]]};
  // клетки под зданиями, мелочами и у мостов — без деревьев и кустов
  const busy=new Set(),C=MAP.C,mark=(x0,y0,x1,y1)=>{for(let i=Math.floor(x0+C);i<x1+C;i++)for(let j=Math.floor(y0+C);j<y1+C;j++)busy.add(i*MAP.N+j)};
  BLD.forEach(b=>{const f=footprint(b);mark(f.x0-.3,f.y0-.3,f.x1+.6,f.y1+.6)});PROPS.forEach(p=>mark(p.at[0]-.6,p.at[1]-.6,p.at[0]+.4,p.at[1]+.4));RV.bridges.forEach(b=>mark(b.x[0]-2,b.x[1]-2,b.x[0]+2,b.x[1]+2));
  cells.forEach(c=>{const r=c.r;
    if(c.g==='road'||c.g==='water'||c.z===-1||busy.has(c.i*MAP.N+c.j))return;
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
  BLD.forEach(b=>{if(skip(b))return;const[px,py]=gp(MAP.C+b.at[0],MAP.C+b.at[1]);objs.push({y:py,f:g=>{bldDraw(g,b,px,py);rects.push({id:b.id,...bldRect(b,px,py),o:ord++})}})});
  // мелочи не кликаются: их прямоугольники нужны только редактору
  PROPS.forEach((p,n)=>{if(skip(p))return;const[px,py]=gp(MAP.C+p.at[0],MAP.C+p.at[1]);objs.push({y:py,f:g=>{const r=propRect(p,px,py);if(!r)return;drawProp(g,p,px,py);props.push({n,...r,o:ord++})}})});
  RV.bridges.forEach(b=>{const k=pimg('p_most');if(k){const[x,y]=gp(MAP.C+b.x[0],MAP.C+b.x[1]),f=k.fr[hash(Math.round(b.x[0]),Math.round(b.x[1]))%k.fr.length];objs.push({y:y+f.h/2,f:g=>bridgeImg(g,k,f,b,x,y)});return}
    const e=bridgeEnds(b,cells);if(e)objs.push({y:e.y,f:g=>bridge(g,e)})});
  const cv=document.createElement('canvas');cv.width=MAP.W;cv.height=MAP.H;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
  g.fillStyle='#07060a';g.fillRect(0,0,MAP.W,MAP.H);
  cells.forEach(c=>{const[x,y]=gp(c.i,c.j);if(onScreen(x,y))ground(g,c,x,y,corn(c))});
  if(!BIO_SHORE)shore(g,cells);
  objs.sort((a,b)=>a.y-b.y).forEach(o=>o.f(g));
  cells.forEach(c=>{if(c.z>=0&&!open(c.z)&&onScreen(...gp(c.i,c.j)))diamond(g,c.i,c.j,'rgba(6,4,8,.66)')});
  const D=Math.hypot(MAP.W,MAP.H)/2,vg=g.createRadialGradient(MAP.W/2,MAP.H/2,D*.5,MAP.W/2,MAP.H/2,D*1.02);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(4,3,6,.8)');
  g.fillStyle=vg;g.fillRect(0,0,MAP.W,MAP.H);
  MB={cells,base:cv,rects,props};
}
// берег: светлая кромка по краю воды там, где сосед — суша, и тёмная изнутри. Вода лежит ромбами (наборов переходов нет), и без кромки тёмная вода сливается с землёй
function shore(g,cells){const N=MAP.N,dry=(i,j)=>i>=0&&j>=0&&i<N&&j<N&&cells[i*N+j].g!=='water',H=MAP.TW/2;
  const edge=(a,b,inn)=>{const r=b[0]>a[0];for(let k=0;k<H;k++){const x=Math.round(a[0])+(r?k:-1-k),y=inn>0?Math.round(a[1])+(k>>1):Math.round(a[1])-1-(k>>1);
    g.fillStyle='#5c4f30';g.fillRect(x,y,1,1);g.fillStyle='#0d0c07';g.fillRect(x,y+inn,1,1)}};
  cells.forEach(c=>{if(c.g!=='water')return;const{i,j}=c,T=gp(i,j);if(!onScreen(...T))return;const Rr=gp(i+1,j),B=gp(i+1,j+1),L=gp(i,j+1);
    if(dry(i,j-1))edge(T,Rr,1);if(dry(i+1,j))edge(B,Rr,-1);if(dry(i,j+1))edge(B,L,-1);if(dry(i-1,j))edge(T,L,1)})}
// ---------- мелочи: кадр v из ленты одобренных (p_* — assets/props), предмет биома (b_* — assets/biomes) или спрайт атласа ----------
const PIM={};
function pimg(id){if(!(id in PIM)){PIM[id]=null;const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);PIM[id]=stripFrames(c);onKremLoad&&onKremLoad()};
  im.onerror=()=>{PIM[id]=false};im.src=`assets/props/${id}.png`}return PIM[id]}
const setProp=(id,c)=>{PIM[id]=c?stripFrames(c):false}; // мастерская подставляет выбранное сразу
const propSrc=k=>k.startsWith('p_')?pimg(k):k.startsWith('b_')?bimg(k):null;
// мелочь по якорю (низ по центру): рисунок и прямоугольник на экране; null — картинки нет
function drawProp(g,p,x,y){const k=propSrc(p.k);if(k)return drawF(g,k.im,k.fr[p.v%k.fr.length],x,y,p.fl);
  if(!ATLAS[p.k])return;if(!p.fl)return drawA(g,p.k,x,y);g.save();g.translate(Math.round(x),0);g.scale(-1,1);drawA(g,p.k,0,y);g.restore()}
function propRect(p,x,y){const k=propSrc(p.k);if(k){const f=k.fr[p.v%k.fr.length];return{x:Math.round(x)-(p.fl?f.w-f.ax:f.ax),y:Math.round(y)-f.ay+1,w:f.w,h:f.h}}
  const a=ATLAS[p.k];return a?{x:Math.round(x-(p.fl?a[2]-a[4]:a[4])),y:Math.round(y-a[5]),w:a[2],h:a[3]}:null}
// здание по якорю: рисунок и прямоугольник на экране (для клика)
function bldDraw(g,b,x,y){const k=kimg(b.id);if(k)drawK(g,k,x,y,b.fl);else if(b.spr)drawA(g,b.spr,x,y);else kapishche(g,x,y)}
function bldRect(b,x,y){const k=kimg(b.id);if(k)return{x:b.fl?Math.round(x)+k.ax-k.x1-1:Math.round(x)-k.ax+k.x0,y:Math.round(y)-k.ay+k.y0,w:k.x1-k.x0+1,h:k.y1-k.y0+1};
  if(b.spr){const a=ATLAS[b.spr];return{x:x-a[4],y:y-a[5],w:a[2],h:a[3]}}return{x:x-22,y:y-34,w:44,h:42}}
// ---------- мосты ----------
// мост из мастерской (p_most): серединой на пересечении тропы с рекой; наклон «/» или «\\» узнаём по картинке (как у прясла) и отражаем вдоль тропы
function bridgeImg(g,k,f,b,x,y){if(f.slash==null){const c=k.im.getContext('2d'),q=Math.max(1,f.w>>2),top=X=>{try{const d=c.getImageData(f.sx+f.x0+X,f.y0,1,f.h).data;for(let Y=0;Y<f.h;Y++)if(d[Y*4+3]>=10)return Y}catch(e){}return 0};
    let l=0,r=0;for(let i=0;i<q;i++){l+=top(i);r+=top(f.w-1-i)}f.slash=l>r}
  const sx=b.u[0]-b.u[1],sy=b.u[0]+b.u[1];drawF(g,k.im,f,x,y+f.h/2-3,f.slash!==(sx*sy<0))}
// мост через реку там, где её пересекает тропа: от берега до берега по клеткам воды, чуть заходит на сушу. Пока нет выбранного арта (p_most) — настил кодом
function bridgeEnds(b,cells){const N=MAP.N,C=MAP.C,wet=(x,y)=>{const i=Math.floor(x+C),j=Math.floor(y+C);return i>=0&&j>=0&&i<N&&j<N&&cells[i*N+j].g==='water'};
  let a=0,z=0;for(let t=0;t<6&&(wet(b.x[0]-b.u[0]*t,b.x[1]-b.u[1]*t)||wet(b.x[0]-b.u[0]*(t+.25),b.x[1]-b.u[1]*(t+.25)));t+=.25)a=t+.25;
  for(let t=0;t<6&&(wet(b.x[0]+b.u[0]*t,b.x[1]+b.u[1]*t)||wet(b.x[0]+b.u[0]*(t+.25),b.x[1]+b.u[1]*(t+.25)));t+=.25)z=t+.25;
  a+=.35;z+=.35;const v=[-b.u[1],b.u[0]],hw=b.w/2,P=(t,s)=>gp(C+b.x[0]+b.u[0]*t+v[0]*s,C+b.x[1]+b.u[1]*t+v[1]*s);
  const q=[P(-a,-hw),P(z,-hw),P(z,hw),P(-a,hw)];return{q,a,z,P,hw,y:Math.max(...q.map(p=>p[1]))}}
function bridge(g,e){const H=4,{P,a,z,hw}=e,len=a+z,ln=(p,q,c,dy=0)=>{g.strokeStyle=c;g.beginPath();g.moveTo(Math.round(p[0])+.5,Math.round(p[1]-dy)+.5);g.lineTo(Math.round(q[0])+.5,Math.round(q[1]-dy)+.5);g.stroke()};
  g.save();g.lineWidth=1;
  // сваи и задние перила, потом настил с досками поперёк, передний край и передние перила
  const posts=Math.max(2,Math.round(len/.9)),side=s=>{for(let k=0;k<=posts;k++){const p=P(-a+len*k/posts,s);g.fillStyle='#15180c';g.fillRect(Math.round(p[0])-1,Math.round(p[1])-H,2,H+2)}};
  const back=P(0,-hw)[1]<P(0,hw)[1]?-hw:hw,front=-back,rail=s=>{for(let k=0;k<=posts;k++){const p=P(-a+len*k/posts,s);g.fillStyle='#281d13';g.fillRect(Math.round(p[0]),Math.round(p[1])-H-6,1,6)}ln(P(-a,s),P(z,s),'#5c4f30',H+6)};
  side(back);side(front);rail(back);
  const q=e.q.map(p=>[p[0],p[1]-H]);g.fillStyle='#4e3822';g.beginPath();q.forEach((p,k)=>k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill();
  for(let t=-a+.2;t<z;t+=.2)ln(P(t,-hw),P(t,hw),(Math.round(t*5)&1)?'#3c2f1b':'#5c4f30',H);
  ln(P(-a,front),P(z,front),'#1b1d12',H-1);ln(P(-a,back),P(z,back),'#281d13',H);rail(front);g.restore()}
// плитка земли целиком: биом (js/biomes.js), лента из мастерской (кремль, посад, дороги) или атлас
function plain(g,t,v,x,y){const B=BIOMES[t],b=t==='water'?bimg(BIO_WATER):B&&bimg(B.ground);if(b)return g.drawImage(b.im,Math.floor(v*b.n)*MAP.TW,0,MAP.TW,MAP.TH,x-MAP.TW/2,y,MAP.TW,MAP.TH);
  const k=GROUND[t]&&kimg('g_'+t);if(k)return g.drawImage(k.im,Math.floor(v*k.n)*MAP.TW,0,MAP.TW,k.im.height,x-MAP.TW/2,y,MAP.TW,k.im.height);
  const vv=variants(GROUND[t]||'t_'+t);drawA(g,vv[Math.floor(v*vv.length)],x-MAP.TW/2,y)}
// у каждой вершины сетки своя земля: большинство из 12 клеток вокруг (ближние четыре вдвое весомее), ничья — по жребию;
// так граница зон идёт плавной линией, а не лесенкой по клеткам. Рядом дорога — дорога, чтобы поле не съедало тропы
const VNB=[[-1,-1,2],[0,-1,2],[-1,0,2],[0,0,2],[-2,-1,1],[-2,0,1],[1,-1,1],[1,0,1],[-1,-2,1],[0,-2,1],[-1,1,1],[0,1,1]];
function vertices(cells){const N=MAP.N,V=[];
  for(let i=0;i<=N;i++)for(let j=0;j<=N;j++){const n={};let best=null,bn=0,road=false;const r=rnd(hc(i,j)*13+5);
    for(const[da,db,w]of VNB){const a=i+da,b=j+db;if(a<0||b<0||a>=N||b>=N)continue;const t=cells[a*N+b].g;if(w>1&&t==='road')road=true;n[t]=(n[t]||0)+w}
    if(!road)for(const t in n)if(n[t]>bn||n[t]===bn&&r()<.5){best=t;bn=n[t]}
    V.push(road?'road':best)}
  return V}
// клетка слоями по земле её углов t = [NW, NE, SW, SE] (верх, право, лево, низ ромба): сначала обычная земля (своя или соседа),
// поверх — земля биома по маске углов из набора переходов к этой земле, поверх — вода с берегом. Без наборов переходов — плитка клетки целиком (края ромбами)
function ground(g,c,x,y,t){const bit=f=>t.reduce((m,v,k)=>f(v)?m|8>>k:m,0),W=bimg(BIO_WATER),M=W&&BIO_SHORE&&bimg(BIO_SHORE),wet=M&&t.includes('water');
  const bio=t.find(v=>BIOMES[v]&&bimg(BIOMES[v].ground)),B=bio&&BIOMES[bio],land=v=>v!==bio&&!(wet&&v==='water');
  let base=land(c.g)?c.g:null;if(!base){const n={};t.filter(land).forEach(v=>n[v]=(n[v]||0)+1);base=Object.keys(n).sort((a,b)=>n[b]-n[a])[0]||bio||c.g}
  if(base!==bio)plain(g,base,c.v,x,y);
  if(B)bioLand(g,B,c,x,y,bit(v=>v===bio||wet&&v==='water'),B.sets[base]&&bimg(B.sets[base])||Object.values(B.sets).map(bimg).find(Boolean),c.g===bio);
  if(wet){const wm=bit(v=>v==='water'),sx=Math.floor(c.v*W.n)*MAP.TW;
    if(wm===15)g.drawImage(W.im,sx,0,MAP.TW,MAP.TH,x-MAP.TW/2,y,MAP.TW,MAP.TH);else g.drawImage(bioPiece(M,'w'+sx,wm,W.im,sx,'#1b1d12'),x-MAP.TW/2,y)}}
// земля биома на углах fm клетки: виды плиток лежат пятнами (у каждой вершины свой вид по плавному шуму), между видами и с соседней землёй
// граница по маске углов из набора переходов S. Без наборов — плитка клетки целиком, и только если клетка своя (own)
function bioLand(g,B,c,x,y,fm,S,own){const k=bimg(B.ground),X=x-MAP.TW/2,tile=(v,m)=>m===15?g.drawImage(k.im,v*MAP.TW,0,MAP.TW,MAP.TH,X,y,MAP.TW,MAP.TH):g.drawImage(bioPiece(S,B.ground+v,m,k.im,v*MAP.TW),X,y);
  if(!fm)return;if(!S){if(own)tile(bioVar(c.i,c.j,k.n),15);return}
  const vs=[[0,0],[1,0],[0,1],[1,1]].map(([a,b])=>bioVar(c.i+a,c.j+b,k.n)),n={};vs.forEach((v,q)=>{if(fm&8>>q)n[v]=(n[v]||0)+1});
  const order=Object.keys(n).map(Number).sort((a,b)=>n[b]-n[a]);tile(order[0],fm);
  for(const v of order.slice(1))tile(v,vs.reduce((m,w,q)=>fm&8>>q&&w===v?m|8>>q:m,0))}
// вид плитки у вершины: плавный шум с шагом в 3 клетки, поделённый на n видов
function bioVar(i,j,n){i+=24-MAP.C;j+=24-MAP.C;const s=3,a=Math.floor(i/s),b=Math.floor(j/s),fx=i/s-a,fy=j/s-b,h=(p,q)=>rnd(hash(p,q)*31+17)(),l=(u,v,t)=>u+(v-u)*t*t*(3-2*t);
  return Math.min(n-1,Math.floor(l(l(h(a,b),h(a+1,b),fx),l(h(a,b+1),h(a+1,b+1),fx),fy)*n))}
// предмет биома на клетке по её собственному жребию (так видно, что стоит у соседей): картинка, кадр, отражение, сдвиг; null — пусто
function bioPick(i,j,bo){const r=rnd(hc(i,j)*11+7),q=bo.find(([,p])=>r()<p);if(!q)return null;const k=q[0];return{k,f:k.fr[Math.floor(r()*k.fr.length)],fl:r()<.5,ox:(r()-.5)*16,oy:(r()-.5)*7}}
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
// подпись зоны стоит на её тропе, у поворота в лес (ZMARK)
function zoneLabelPos(zi){const W=RV.marks[zi];return gp(MAP.C+W[0],MAP.C+W[1])}
function plate(g,x,y,lines,hot){g.font='9px "Press Start 2P", monospace';const w=Math.max(...lines.map(l=>g.measureText(l).width))+14,h=lines.length*14+8;
  g.fillStyle=hot?'rgba(60,30,16,.92)':'rgba(14,10,8,.82)';g.fillRect(x-w/2,y-h/2,w,h);g.strokeStyle=hot?'#d4a84a':'#6a4a2a';g.lineWidth=1;g.strokeRect(x-w/2+.5,y-h/2+.5,w-1,h-1);
  lines.forEach((l,k)=>{g.fillStyle=k?'#9a8a72':(hot?'#f0d080':'#e8dcc4');g.fillText(l,x-g.measureText(l).width/2,y-h/2+16+k*14)})}

// рамка подписи зоны — для подсветки цели обучения (js/onboarding.js)
const zoneLines=(zi,open)=>open?[ZONES[zi].short]:[ZONES[zi].short,'закрыто'];
function zonePlate(zi){const g=MB.base.getContext('2d'),[x,y]=zoneLabelPos(zi),L=zoneLines(zi,zOpen(zi));g.font='9px "Press Start 2P", monospace';
  const w=Math.max(...L.map(l=>g.measureText(l).width))+14,h=L.length*14+8;return{x:x-w/2,y:y-h/2,w,h}}
// рисует карту на видимом холсте: основа + подсветка + подписи; st.hl — зона-цель обучения
function paintMap(cv,st){const g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(MB.base,0,0);
  const hz=st.hover&&st.hover.type==='zone'?st.hover.zi:-9,sz=st.sel&&st.sel.type==='zone'?st.sel.zi:-9,lz=st.hl!=null?st.hl:-9;
  MB.cells.forEach(c=>{if((c.z===hz||c.z===sz||c.z===lz)&&onScreen(...gp(c.i,c.j),30))diamond(g,c.i,c.j,c.z===lz?'rgba(255,214,120,.2)':c.z===sz?'rgba(255,200,120,.16)':'rgba(255,220,160,.1)')});
  ZONES.forEach((z,zi)=>{const[x,y]=zoneLabelPos(zi);plate(g,x,y,zoneLines(zi,st.open(zi)),zi===hz||zi===sz||zi===lz)});
  // здание под мышью: рамка и плашка «название · зачем»
  const hb=st.hover&&st.hover.type==='bld'?st.hover.id:null;
  if(hb){const r=MB.rects.find(q=>q.id===hb),b=BLD.find(q=>q.id===hb);g.strokeStyle='#d4a84a';g.strokeRect(r.x+.5,r.y+.5,r.w,r.h);plate(g,r.x+r.w/2,Math.max(16,r.y-(b.tip?17:10)),b.tip?[b.name,b.tip]:[b.name],1)}}
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
  // запасной фон из атласа: под пропорции арены — выше арена, выше небо, шире — больше леса; без растяжения
  const as=(cv.clientWidth||440)/(cv.clientHeight||118),W=Math.max(440,Math.round(118*as)),H=Math.max(118,Math.round(W/as)),oy=H-118,g=cv.getContext('2d');cv.width=W;cv.height=H;g.imageSmoothingEnabled=false;
  const sk=g.createLinearGradient(0,0,0,70+oy);sk.addColorStop(0,Z.sky[1]);sk.addColorStop(1,Z.sky[0]);g.fillStyle=sk;g.fillRect(0,0,W,H);
  const r=rnd(zi*977+13),tv=variants('t_'+Z.ground),wv=variants('t_water');
  for(let row=0;row<8;row++)for(let col=-1;col<W/40+1;col++){const n=Z.water&&row<2?wv[Math.floor(r()*wv.length)]:tv[Math.floor(r()*tv.length)];drawA(g,n,col*40+(row%2?20:0),60+oy+row*8)}
  const kinds=Object.keys(Z.trees),objs=[];for(let k=0;k<Math.round(11*W/440);k++){const kind=kinds[Math.floor(r()*kinds.length)],vv=variants(kind);objs.push([vv[Math.floor(r()*vv.length)],r()*W,66+oy+r()*10])}
  objs.sort((a,b)=>a[2]-b[2]).forEach(o=>drawA(g,o[0],o[1],o[2]));
  const fog=g.createLinearGradient(0,0,0,H);fog.addColorStop(0,'rgba(0,0,0,.35)');fog.addColorStop(.6,'rgba(0,0,0,0)');fog.addColorStop(1,'rgba(0,0,0,.45)');g.fillStyle=fog;g.fillRect(0,0,W,H)}
