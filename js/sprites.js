'use strict';
// ---------- общий рендер спрайтов для игры и мастерской ----------
// PNG из assets/sprites/<id>.png, иначе временный спрайт кодом.
// Оживляем процедурно из одной картинки: дыхание, покачивание, парение, замах, вспышка от попадания, рассыпание при гибели.
// Если появятся настоящие анимации <id>_idle.png / <id>_attack.png (кадры в ряд), берём их.
const IMG={},SRC={},ANIM={};
let onSpriteLoad=null; // игра перерисовывает экран, когда догрузилась картинка
function png(id){if(!(id in IMG)){IMG[id]=null;const im=new Image();im.onload=()=>{IMG[id]=im;delete SRC[id];onSpriteLoad&&onSpriteLoad()};im.onerror=()=>{IMG[id]=false};im.src=`assets/sprites/${id}.png`}return IMG[id]}
// мастерская подставляет только что загруженные картинки, не дожидаясь файлов
const setSprite=(id,c)=>{IMG[id]=c;delete SRC[id]};
const setStrip=(id,kind,c)=>{ANIM[id+'_'+kind]={im:c,f:c.height,n:Math.max(1,Math.round(c.width/c.height))}};
function strip(id,kind){const k=id+'_'+kind;if(!(k in ANIM)){ANIM[k]=null;const im=new Image();im.onload=()=>{ANIM[k]={im,f:im.height,n:Math.max(1,Math.round(im.width/im.height))}};im.onerror=()=>{ANIM[k]=false};im.src=`assets/sprites/${k}.png`}return ANIM[k]}
// исходник в родном разрешении: PNG как есть (квадрат, по низу), временный спрайт — 16×16 ×2
function source(id){if(SRC[id])return SRC[id];const im=png(id),c=document.createElement('canvas'),g=c.getContext('2d');
  if(im){c.width=c.height=Math.max(im.width,im.height);g.drawImage(im,(c.width-im.width)/2,c.height-im.height)}
  else{c.width=c.height=32;const o=CR[id],sw=o.sw||{};SPR[o.b].split('|').forEach((r,y)=>[...r+[...r].reverse().join('')].forEach((ch,x)=>{if(ch!=='.'){g.fillStyle=sw[ch]||PAL[ch];g.fillRect(x*2,y*2,2,2)}}))}
  if(im!==null)SRC[id]=c;return c}
const FR=document.createElement('canvas'),FG=FR.getContext('2d');
function blit(g,sz,im,sx,f){let sc=sz/f;if(sc>=1)sc=Math.floor(sc);const w=f*sc;g.drawImage(im,sx,0,f,f,(sz-w)/2,sz-w,w,w)}
function renderCr(cv,t){const id=cv.dataset.cr,sz=+cv.dataset.sz,g=cv.getContext('2d');if(cv.width!==sz){cv.width=sz;cv.height=sz}g.imageSmoothingEnabled=false;g.clearRect(0,0,sz,sz);
  const idle=strip(id,'idle'),p=cv._play;
  if(p){const a=strip(id,p.kind),i=Math.floor((t-p.t0)/1000*12);if(a&&i<a.n)return i<0?0:blit(g,sz,a.im,i*a.f,a.f);cv._play=null}
  if(idle&&!cv._hurt&&!cv._die&&!cv._spawn)return blit(g,sz,idle.im,(Math.floor(t/1000*7)%idle.n)*idle.f,idle.f);
  const s=source(id),f=s.width,k=f/64,m=motion(id),tt=Math.floor(t/83)*.083,face=cv.dataset.face==='r'?1:-1;
  let lean=0,aq=-1;if(cv._atk){aq=(t-cv._atk)/450;if(aq>=1){cv._atk=0;aq=-1}else lean=(aq<.3?-3*aq/.3:aq<.55?6:6*(1-(aq-.55)/.45))*face}
  const sw=m.sway*Math.sin(tt*m.spd)*k,br=m.br*Math.sin(tt*m.spd*1.7),fl=Math.round(m.fl*Math.sin(tt*m.spd*.8)*k);
  FR.width=FR.height=f;
  for(let y=0;y<f;y++){const h=(f-1-y)/f,sy=f-1-Math.round((f-1-y)/(1+br));if(sy<0)continue;  // h: 0 у ног, 1 у макушки
    const dx=Math.round(sw*h*h+lean*k*h+m.hem*k*Math.sin(tt*3+y*.3/k)*(1-h)*(1-h));FG.drawImage(s,0,sy,f,1,dx,y-fl,f,1)}
  let alpha=m.flick?.75+.25*Math.sin(t/60):1;
  if(cv._spawn){const q=(t-cv._spawn)/650;if(q>=1)cv._spawn=0;else if(q<0)alpha=0;else{alpha*=m.fl?q:Math.min(1,q*1.6);   // парящие проявляются, остальные вырастают из земли
    if(!m.fl){FG.globalCompositeOperation='destination-out';FG.fillRect(0,0,f,Math.round(f*(1-q)));FG.globalCompositeOperation='source-over'}}}
  if(cv._hurt){const q=(t-cv._hurt)/200;if(q>=1)cv._hurt=0;else{FG.globalCompositeOperation='source-atop';FG.fillStyle=`rgba(255,255,255,${.85*(1-q)})`;FG.fillRect(0,0,f,f);FG.globalCompositeOperation='source-over'}}
  if(cv._die)dissolve(f,Math.min(1,(t-cv._die)/900));
  if(face>0&&aq>=0){if(aq>.28&&aq<.55){FG.fillStyle='#fff6c0';FG.fillRect(f*.86,f*.46,3*k+1,3*k+1);FG.fillStyle='#e8862a';FG.fillRect(f*.86-k,f*.46+k,2*k+1,2*k+1)}   // вспышка выстрела
    else if(aq>=.55){FG.fillStyle=`rgba(170,160,150,${1-aq})`;FG.beginPath();FG.arc(f*.9+aq*8*k,f*.42-aq*10*k,(2+aq*6)*k,0,7);FG.fill()}}                       // дымок
  const sc=sz/f>=1?Math.floor(sz/f):sz/f,w=f*sc;g.globalAlpha=alpha;g.drawImage(FR,(sz-w)/2,sz-w,w,w);g.globalAlpha=1}
// рассыпание на пиксели; если картинка открыта с диска (file://), читать пиксели браузер не даёт — тогда просто тает
function dissolve(f,q){let d;try{d=FG.getImageData(0,0,f,f).data}catch(e){FG.globalCompositeOperation='destination-out';FG.fillStyle=`rgba(0,0,0,${q})`;FG.fillRect(0,0,f,f);FG.globalCompositeOperation='source-over';return}
  const o=FG.createImageData(f,f);
  for(let y=0;y<f;y++)for(let x=0;x<f;x++){const i=(y*f+x)*4;if(!d[i+3]||((x*73+y*151)%97)/97<q)continue;const ny=y-Math.round(q*q*f*.3*((x*31)%7)/7);if(ny<0)continue;
    const j=(ny*f+x)*4;o.data.set(d.subarray(i,i+4),j);o.data[j+3]*=1-q*.6}
  FG.putImageData(o,0,0)}
const paintCr=cv=>renderCr(cv,performance.now());
const attackFx=cv=>{if(!cv)return;if(strip(cv.dataset.cr,'attack'))cv._play={kind:'attack',t0:performance.now()};else cv._atk=performance.now()};
const hurtFx=cv=>{if(cv)cv._hurt=performance.now()};
const spawnFx=(cv,delay=0)=>{if(!cv)return;const t0=performance.now()+delay;if(strip(cv.dataset.cr,'spawn'))cv._play={kind:'spawn',t0};else cv._spawn=t0};
let lastT=0;function animLoop(t){if(t-lastT>=83){lastT=t;document.querySelectorAll('canvas[data-cr]').forEach(cv=>renderCr(cv,t))}requestAnimationFrame(animLoop)}
requestAnimationFrame(animLoop);
const cr=(id,sz=128,cls='',face='l')=>`<canvas data-cr="${id}" data-sz="${sz}" data-face="${face}" class="${cls}" style="width:${sz}px;height:${sz}px"></canvas>`;
