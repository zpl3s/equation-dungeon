'use strict';
// ---------- биомы зон: земля, переходы, деревья, предметы, вода и фон боя из PixelLab ----------
// Варианты — assets/candidates/<id>/, основа (выбор пользователя в мастерской, вкладка «Биомы») — assets/biomes/<id>.png.
// kind: tiles — плитки земли 40×20, основа — лента отмеченных плиток; set — угловой набор переходов create_tiles_pro (tile_feature «tileset»):
// 16 плиток 40×20 в ряд, номер плитки = маска углов NW<<3|NE<<2|SW<<1|SE (бит — первая земля набора; NW — верхняя вершина ромба,
// NE — правая, SW — левая, SE — нижняя); obj — предметы на холсте size×size, основа — лента отмеченных; arena — фон боя.
// Из набора переходов игра берёт только форму границы (маску), текстуры — из плиток самих земель: так стык совпадает с обеих сторон.
const BIO_PAL=['#000000','#0d0c07','#15180c','#1b1d12','#202513','#281d13','#253013','#312619','#28361b','#312d1f','#3c2f1b','#43331e','#3e3720','#2f4225','#3f372b','#443a27',
  '#4e3822','#464023','#473f2f','#404e32','#53432b','#5c4f30','#5c5f48','#7a7d75','#0e0a0c','#e8e0c8','#a82822','#6e1418','#e0862a','#d4a84a','#6fc8be','#7a3aa0']; // assets/palette.png
const BIO_SUF='Dark slavic folk horror, muted earthy colors, pixel art';
const BIO_OBJ='isometric game asset seen slightly from above, dark slavic folk horror, muted earthy colors, pixel art, transparent background, no ground';
const BIO_TILES='create_tiles_pro: isometric, tile_size 40, tile_view_angle 30, tile_depth_ratio 0, палитра palette.png';
const BIO_IMG='create_image_pro: стиль — poludnitsa.png (outline, detail, shading), палитра palette.png';
const BIOME={
b_pole_ground:{kind:'tiles',n:'Земля Поля',tool:BIO_TILES,note:'По 4 плитки на каждый из четырёх видов земли. Отметь 2–4 плитки, которые хорошо ложатся рядом: игра будет чередовать их.',
  p:`1). dry yellowed stubble field, short cut straw stalks in rows, dusty earth between 2). sun-scorched field with dry brown grass and small cracks in the earth 3). withered ochre rye flattened by wind 4). trampled dusty field earth with sparse dry weeds and a few small stones. Burnt midday field outside a slavic village, ${BIO_SUF}`},
t_pole_posad:{kind:'set',n:'Переход Поле — посад',a:'field',b:'posad',tool:BIO_TILES+', tile_feature tileset',note:'Граница Поля с посадом вокруг стен и с дорогами. Из набора берётся только форма границы, цвета — из плиток земли.',
  p:`dry dusty stubble field with dull ochre straw to dark trampled meadow grass with dirt patches. ${BIO_SUF}`},
t_pole_opushka:{kind:'set',n:'Переход Поле — Опушка',a:'field',b:'opushka',tool:BIO_TILES+', tile_feature tileset',note:'Граница с Берёзовой опушкой (слева внизу). Из набора берётся только форма границы.',
  p:`dry dusty stubble field with dull ochre straw to dark green birch grove grass with fallen yellow leaves. ${BIO_SUF}`},
t_pole_koschei:{kind:'set',n:'Переход Поле — Кощеево царство',a:'field',b:'koschei',tool:BIO_TILES+', tile_feature tileset',note:'Граница с Кощеевым царством (справа внизу). Из набора берётся только форма границы.',
  p:`dry dusty stubble field with dull ochre straw to dead cracked black ashen earth with dark red stains. ${BIO_SUF}`},
b_pole_water:{kind:'tiles',n:'Вода: пруды и речка',tool:BIO_TILES,note:'Пруды в Поле, речка у бани и река Омута. Отметь 2–4 плитки. Форму берега игра берёт из перехода Поле — Опушка и обводит тёмной кромкой.',
  p:`1). dark still pond water with faint teal ripples 2). dark river water with pale reflections of a hazy sky 3). murky pond water with floating duckweed and a few lily pads 4). deep dark water with small light glints. Water of a slavic river and village pond, ${BIO_SUF}`},
b_pole_trees:{kind:'obj',size:64,n:'Деревья',tool:BIO_IMG,note:'Одинокие ракиты и сухие деревья среди поля. Отметь несколько.',
  p:`lone gnarled tree standing in a dry field: crooked old willow or wild pear tree with a twisted dark trunk, sparse dusty olive foliage, a few dead branches, ${BIO_OBJ}`},
b_pole_bushes:{kind:'obj',size:32,n:'Кусты и бурьян',tool:BIO_IMG,note:'Самое частое на Поле. Отметь 4–8.',
  p:`small dry field shrub: thorny blackthorn bush, clump of grey wormwood, or tall dry thistles and weeds, dusty olive, ochre and grey-green, ${BIO_OBJ}`},
b_pole_snop:{kind:'obj',size:32,n:'Снопы',tool:BIO_IMG,note:'Сжатое поле: снопы и суслоны. Отметь несколько.',
  p:`wheat sheaf (snop) bound with a twisted straw band standing upright, or a small stook of leaning sheaves, golden ochre straw, ${BIO_OBJ}`},
b_pole_pugalo:{kind:'obj',size:64,n:'Пугало',tool:BIO_IMG,note:'Редкость: одно-два на всё Поле. Отметь 1–3.',
  p:`eerie ragged scarecrow on a wooden cross standing in a field: sackcloth head with a crudely stitched face, tattered faded peasant shirt, straw sticking out of the sleeves, a black crow perched on one arm, ${BIO_OBJ}`},
b_pole_kamni:{kind:'obj',size:32,n:'Межевые камни и кости',tool:BIO_IMG,note:'Межевики стерегут камни на меже, полуденница оставляет кости. Отметь несколько.',
  p:`small field prop lying in dry grass: an old weathered grey boundary stone with a carved sign, or bleached animal bones with a horned cow skull, ${BIO_OBJ}`},
b_pole_arena:{kind:'arena',w:170,h:56,n:'Фон боя на Поле',tool:BIO_IMG+', без прозрачного фона',note:'Картинка за стрельцом и нечистью. Игра обрезает её по краям под размер окна, не растягивая.',
  p:`side view battle backdrop for a 2D RPG: a scorched stubble field at harsh noon, pale hazy ochre-grey sky with a white sun glare, a dark line of distant forest along the horizon at mid height, a lone crooked willow and a far scarecrow, a few sheaves standing in the field, empty flat dusty ground in the foreground, no characters, no people, ${BIO_SUF}`},
};
// чем рисуется зона, по её земле (ZONES[].ground): ground — плитки; sets — переходы к соседним землям (без своего — граница резкая);
// objs — что стоит на клетке и с какой вероятностью (пока ни одна основа не выбрана — старые деревья из атласа); ponds — пруды (точка сетки от центра, радиус)
const BIOMES={
field:{ground:'b_pole_ground',sets:{posad:'t_pole_posad',road:'t_pole_posad',opushka:'t_pole_opushka',koschei:'t_pole_koschei'},
  objs:{b_pole_bushes:.07,b_pole_trees:.018,b_pole_snop:.035,b_pole_kamni:.02,b_pole_pugalo:.008},ponds:[[12.6,13,1.8]],arena:'b_pole_arena'},
};
const BIO_WATER='b_pole_water',BIO_SHORE='t_pole_opushka'; // вода — для всех водоёмов карты; форма берега — маски этого набора переходов
const BIO_IDS=Object.keys(BIOME);

// ---------- загрузка основ: assets/biomes/<id>.png ----------
const BIM={};
function prepB(id,im){const B=BIOME[id],c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);
  if(B.kind==='tiles')return{im:c,n:Math.max(1,Math.round(c.width/MAP.TW))};
  if(B.kind==='set')return{im:c,m:bioMasks(g),cache:{}};
  if(B.kind==='arena')return{im:c};
  const f=c.height,n=Math.max(1,Math.round(c.width/f)),fr=[]; // obj: кадры f×f в ряд, у каждого якорь — низ видимой части по центру
  for(let k=0;k<n;k++){let x0=1e9,y0=1e9,x1=-1,y1=-1;
    try{const d=g.getImageData(k*f,0,f,f).data;for(let y=0;y<f;y++)for(let x=0;x<f;x++)if(d[(y*f+x)*4+3]>=10){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}}
    catch(e){x0=y0=0;x1=y1=f-1}
    if(x1>=0)fr.push({sx:k*f,x0,y0,w:x1-x0+1,h:y1-y0+1,ax:Math.round((x1-x0+1)/2),ay:y1-y0+1})}
  return fr.length?{im:c,fr}:false}
function bimg(id){if(!(id in BIM)){BIM[id]=null;const im=new Image();im.onload=()=>{BIM[id]=prepB(id,im);onKremLoad&&onKremLoad()};im.onerror=()=>{BIM[id]=false};im.src=`assets/biomes/${id}.png`}return BIM[id]}
const setBio=(id,c)=>{BIM[id]=c?prepB(id,c):false;for(const k in BIM)if(BIM[k]&&BIM[k].cache)BIM[k].cache={}}; // мастерская подставляет выбранное сразу; куски по маскам собираем заново

// ---------- маски переходов ----------
// какие пиксели плитки набора — первая земля: цвет сравниваем с чистыми плитками набора (15 — вся первая земля, 0 — вся вторая),
// сглаживаем 3×3 и смешиваем с углами плитки; у сторон, где оба угла одной земли, и у самих углов маска равна углу — чтобы соседние плитки сходились
function bioMasks(g){const W=MAP.TW,H=MAP.TH,SW=W*16,cl=v=>v<0?0:v>1?1:v;let d;
  try{d=g.getImageData(0,0,SW,H).data}catch(e){return null} // file:// не даёт читать пиксели — тогда плитки рисуются целиком
  const col=(m,x,y)=>{const o=(y*SW+m*W+x)*4;return d[o+3]?d[o]<<16|d[o+1]<<8|d[o+2]:-1},hA=new Map(),hB=new Map();
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const a=col(15,x,y),b=col(0,x,y);if(a>=0)hA.set(a,(hA.get(a)||0)+1);if(b>=0)hB.set(b,(hB.get(b)||0)+1)}
  return[...Array(16).keys()].map(m=>{const nw=m>>3&1,ne=m>>2&1,sw=m>>1&1,se=m&1,sc=new Float32Array(W*H).fill(.5);let M=new Uint8Array(W*H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=col(m,x,y);if(c<0)continue;const a=hA.get(c)||0,b=hB.get(c)||0;sc[y*W+x]=(a+.5)/(a+b+1)}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){let s=0,n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X>=0&&X<W&&Y>=0&&Y<H){s+=sc[Y*W+X];n++}}
      const X=(x+.5)/(W/2)-1,Y=(y+.5)/(H/2)-1,u=cl((X+Y+1)/2),v=cl((Y-X+1)/2),pr=nw*(1-u)*(1-v)+ne*u*(1-v)+sw*(1-u)*v+se*u*v;
      let k=(s/n+pr)/2>.5?1:0;
      if(v<.1&&nw===ne)k=nw;if(u<.1&&nw===sw)k=nw;if(u>.9&&ne===se)k=ne;if(v>.9&&sw===se)k=sw;
      if(u<.15&&v<.15)k=nw;if(u>.85&&v<.15)k=ne;if(u<.15&&v>.85)k=sw;if(u>.85&&v>.85)k=se;
      M[y*W+x]=m===0?0:m===15?1:k}
    for(let p=0;p<2;p++){const N=M.slice();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){let s=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)s+=M[(y+dy)*W+x+dx];
      if(s>=6)N[y*W+x]=1;else if(s<=3)N[y*W+x]=0}M=N} // большинство 3×3 убирает одиночные пиксели
    const c=document.createElement('canvas');c.width=W;c.height=H;const cg=c.getContext('2d'),id=cg.createImageData(W,H);
    for(let i=0;i<W*H;i++){id.data[i*4+3]=M[i]?255:0}cg.putImageData(id,0,0);c.a=M;return c})}
// кусок плитки по маске: src — лента плиток 40×20, sx — место плитки в ней, m — маска углов; bank — цвет кромки снаружи маски (берег воды); кэшируется
function bioPiece(S,key,m,src,sx,bank){const k=key+'|'+m;if(S.cache[k])return S.cache[k];const W=MAP.TW,H=MAP.TH,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  g.drawImage(src,sx,0,W,H,0,0,W,H);if(!S.m)return S.cache[k]=c;g.globalCompositeOperation='destination-in';g.drawImage(S.m[m],0,0);
  if(bank){const a=S.m[m].a,in_=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&a[y*W+x];g.globalCompositeOperation='source-over';g.fillStyle=bank;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(!a[y*W+x]&&Math.abs(x+.5-W/2)/(W/2)+Math.abs(y+.5-H/2)/(H/2)<=1&&(in_(x-1,y)||in_(x+1,y)||in_(x,y-1)||in_(x,y+1)))g.fillRect(x,y,1,1)}
  return S.cache[k]=c}
