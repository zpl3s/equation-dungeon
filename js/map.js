'use strict';
// ---------- изометрическая карта: кремль в центре, зоны секторами вокруг ----------
// сетка больше окна: лес уходит за края, кремль в центре
const MAP={N:49,TW:40,TH:20,C:24.5,W:880,H:560};
const ATL=new Image();ATL.src='assets/env/atlas.png';
function drawA(g,name,x,y,sc=1){const a=ATLAS[name];if(!a||!ATL.complete)return;g.drawImage(ATL,a[0],a[1],a[2],a[3],Math.round(x-a[4]*sc),Math.round(y-a[5]*sc),a[2]*sc,a[3]*sc)}
const VAR={};const variants=p=>VAR[p]||(VAR[p]=Object.keys(ATLAS).filter(k=>k.startsWith(p+'_')));
const rnd=seed=>{let s=(seed>>>0)||1;return()=>(s=(s*1664525+1013904223)>>>0)/4294967296};
const hash=(i,j)=>((i*73856093)^(j*19349663)^0x5bd1e995)>>>0;
const gp=(i,j)=>[MAP.W/2+(i-j)*MAP.TW/2,MAP.H/2+(i+j-2*MAP.C)*MAP.TH/2]; // точка сетки → экран
const onScreen=(x,y,m=60)=>x>-m&&x<MAP.W+m&&y>-m&&y<MAP.H+m*2;
const RAY=k=>Math.PI/2+k*Math.PI/4; // направление на зону k (0 — вниз, дальше по часовой)

function cellInfo(i,j){
  const dx=i+.5-MAP.C,dy=j+.5-MAP.C,r=Math.hypot(dx,dy),h=rnd(hash(i,j))();
  if(Math.abs(dx)<4&&Math.abs(dy)<4)return{z:-1,g:'kremlin'};
  const sx=(dx-dy)*MAP.TW/2,sy=(dx+dy)*MAP.TH/2,a=Math.atan2(sy,sx)+(h-.5)*.3;
  const zi=Math.floor(((a-Math.PI/2+Math.PI/8)%(2*Math.PI)+4*Math.PI)%(2*Math.PI)/(Math.PI/4));
  const perp=k=>{const t=RAY(k);return{along:sx*Math.cos(t)+sy*Math.sin(t),d:Math.abs(sx*Math.sin(t)-sy*Math.cos(t))/MAP.TW}};
  if(r<8.6){for(let k=0;k<8;k++){const p=perp(k);if(p.along>0&&p.d<.45)return{z:r<6.3?-2:zi,g:'road'}}}
  if(r<6.3)return{z:-2,g:'posad'};
  const Z=ZONES[zi];let g=Z.ground;
  if(Z.water&&perp(zi).d<1.1+h*.4)g='water';
  return{z:zi,g};
}

let MB=null; // {cells, base canvas, rects}
function buildMap(open){
  const cells=[],objs=[],rects=[];
  for(let i=0;i<MAP.N;i++)for(let j=0;j<MAP.N;j++){
    const c=cellInfo(i,j),r=rnd(hash(i,j)*7+3),v=variants('t_'+c.g);c.i=i;c.j=j;c.t=v[Math.floor(r()*v.length)];cells.push(c);
    if(c.g==='road'||c.g==='water'||c.z===-1)continue;
    const [x,y]=gp(i+.5,j+.5);if(!onScreen(x,y))continue;const ox=()=>(r()-.5)*16,oy=()=>(r()-.5)*7;
    const trees=c.z===-2?{bush:.05}:ZONES[c.z].trees;
    for(const k in trees)if(r()<trees[k]){const vv=variants(k),n=vv[Math.floor(r()*vv.length)],px=x+ox(),py=y+oy();objs.push({y:py,f:g=>drawA(g,n,px,py)})}
    if(c.z>=0&&ZONES[c.z].mounds&&r()<.08){const px=x+ox(),py=y+oy();objs.push({y:py,f:g=>mound(g,px,py)})}
    if(c.z>=0&&ZONES[c.z].rocks&&r()<.14){const px=x+ox(),py=y+oy(),s=.7+r()*.6;objs.push({y:py,f:g=>rock(g,px,py,s)})}
  }
  // частокол с воротами посередине каждой стены и башнями по углам
  const k0=MAP.C-4,k1=MAP.C+4,K=[[k0,k0],[k1,k0],[k1,k1],[k0,k1]];
  for(let e=0;e<4;e++){const[a,b]=[K[e],K[(e+1)%4]];for(let t=0;t<=1.0001;t+=.028){if(t>.44&&t<.56)continue;
    const[px,py]=gp(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);objs.push({y:py,f:g=>pole(g,px,py)})}}
  K.forEach(([i,j])=>{const[px,py]=gp(i,j);objs.push({y:py+1,f:g=>drawA(g,'tower',px,py)})});
  BLD.forEach(b=>{const[px,py]=gp(b.i+k0-7,b.j+k0-7);objs.push({y:py,f:g=>{if(b.spr){drawA(g,b.spr,px,py);const a=ATLAS[b.spr];rects.push({id:b.id,x:px-a[4],y:py-a[5],w:a[2],h:a[3]})}
    else{kapishche(g,px,py);rects.push({id:b.id,x:px-22,y:py-34,w:44,h:42})}}})});
  const cv=document.createElement('canvas');cv.width=MAP.W;cv.height=MAP.H;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
  g.fillStyle='#07060a';g.fillRect(0,0,MAP.W,MAP.H);
  cells.forEach(c=>{const[x,y]=gp(c.i,c.j);if(onScreen(x,y))drawA(g,c.t,x-MAP.TW/2,y)});
  objs.sort((a,b)=>a.y-b.y).forEach(o=>o.f(g));
  cells.forEach(c=>{if(c.z>=0&&!open(c.z))diamond(g,c.i,c.j,'rgba(6,4,8,.66)')});
  const vg=g.createRadialGradient(MAP.W/2,MAP.H/2,MAP.H*.35,MAP.W/2,MAP.H/2,MAP.W*.62);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(4,3,6,.85)');
  g.fillStyle=vg;g.fillRect(0,0,MAP.W,MAP.H);
  MB={cells,base:cv,rects};
}
function diamond(g,i,j,col){const[x,y]=gp(i,j);g.fillStyle=col;g.beginPath();g.moveTo(x,y);g.lineTo(x+MAP.TW/2,y+MAP.TH/2);g.lineTo(x,y+MAP.TH);g.lineTo(x-MAP.TW/2,y+MAP.TH/2);g.closePath();g.fill()}
function pole(g,x,y){g.fillStyle='#1e130b';g.fillRect(x-2,y-15,4,15);g.beginPath();g.moveTo(x-2,y-15);g.lineTo(x+2,y-15);g.lineTo(x,y-19);g.fill();g.fillStyle='#6b4a2e';g.fillRect(x-1,y-14,2,13)}
function mound(g,x,y){g.fillStyle='#1e1610';g.beginPath();g.ellipse(x,y-2,15,7,0,0,7);g.fill();g.fillStyle='#3e3022';g.beginPath();g.ellipse(x-1,y-5,10,4,0,0,7);g.fill()}
function rock(g,x,y,s){g.fillStyle='#2e2e34';g.beginPath();g.moveTo(x-9*s,y);g.lineTo(x-5*s,y-11*s);g.lineTo(x+3*s,y-14*s);g.lineTo(x+9*s,y-4*s);g.lineTo(x+6*s,y+2*s);g.closePath();g.fill();
  g.fillStyle='#55555c';g.beginPath();g.moveTo(x-5*s,y-11*s);g.lineTo(x+3*s,y-14*s);g.lineTo(x+1*s,y-3*s);g.lineTo(x-7*s,y-1*s);g.closePath();g.fill()}
function kapishche(g,x,y){for(let k=0;k<7;k++){const a=k/7*Math.PI*2;g.fillStyle='#55555c';g.beginPath();g.ellipse(x+Math.cos(a)*17,y+Math.sin(a)*8,3,2.5,0,0,7);g.fill()}
  g.fillStyle='#e8862a';g.fillRect(x-2,y+3,4,3);g.fillStyle='#1e130b';g.fillRect(x-4,y-29,8,29);g.fillStyle='#5a3a22';g.fillRect(x-3,y-28,6,27);
  g.fillStyle='#1e130b';g.fillRect(x-2,y-24,1,2);g.fillRect(x+1,y-24,1,2);g.fillRect(x-2,y-19,4,1);g.fillRect(x-4,y-14,8,1)}
function zoneLabelPos(zi){const t=RAY(zi),r=zi%4?10.5:9.6,rho=r*Math.SQRT2/Math.hypot(Math.cos(t)/(MAP.TW/2),Math.sin(t)/(MAP.TH/2)),[cx,cy]=gp(MAP.C,MAP.C);return[cx+rho*Math.cos(t),cy+rho*Math.sin(t)]}
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
function paintArena(cv,zi){const Z=ZONES[zi],W=440,H=118,g=cv.getContext('2d');cv.width=W;cv.height=H;g.imageSmoothingEnabled=false;
  const sk=g.createLinearGradient(0,0,0,70);sk.addColorStop(0,Z.sky[1]);sk.addColorStop(1,Z.sky[0]);g.fillStyle=sk;g.fillRect(0,0,W,H);
  const r=rnd(zi*977+13),tv=variants('t_'+Z.ground),wv=variants('t_water');
  for(let row=0;row<8;row++)for(let col=-1;col<12;col++){const n=Z.water&&row<2?wv[Math.floor(r()*wv.length)]:tv[Math.floor(r()*tv.length)];drawA(g,n,col*40+(row%2?20:0),60+row*8)}
  const kinds=Object.keys(Z.trees),objs=[];for(let k=0;k<11;k++){const kind=kinds[Math.floor(r()*kinds.length)],vv=variants(kind);objs.push([vv[Math.floor(r()*vv.length)],r()*W,66+r()*10])}
  objs.sort((a,b)=>a[2]-b[2]).forEach(o=>drawA(g,o[0],o[1],o[2]));
  const fog=g.createLinearGradient(0,0,0,H);fog.addColorStop(0,'rgba(0,0,0,.35)');fog.addColorStop(.6,'rgba(0,0,0,0)');fog.addColorStop(1,'rgba(0,0,0,.45)');g.fillStyle=fog;g.fillRect(0,0,W,H)}
