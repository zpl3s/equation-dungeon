'use strict';
const KEY='eqdungeon.v1',$=s=>document.querySelector(s),app=$('#app');
const GAME_URL='https://zpl3s.github.io/equation-dungeon/';

// ---------- время: игровой день начинается в 4:00; ?days=N в адресе сдвигает часы вперёд (скрытая проверка) ----------
const SHIFT=(parseFloat(new URLSearchParams(location.search).get('days'))||0)*864e5;
const now=()=>Date.now()+SHIFT,pad=n=>String(n).padStart(2,'0');
const gday=(t=now())=>{const d=new Date(t-4*36e5);return Math.round(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5)};
const dkey=n=>{const d=new Date(n*864e5);return d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)+'-'+pad(d.getUTCDate())};
const ldate=t=>{const d=new Date(t);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const ru=k=>k.split('-').reverse().join('.');
const pl=(n,a,b,c)=>{const m=n%10,h=n%100;return m===1&&h!==11?a:m>=2&&m<=4&&(h<12||h>14)?b:c};
const today=()=>dkey(gday()),yday=()=>dkey(gday()-1);

// ---------- сохранение и прогресс ----------
const DEF={xp:0,lvl:1,gold:0,sword:0,armor:0,potions:2,scrolls:3,stats:{},days:{},streak:0,lastDay:'',runs:0,wins:0,bestCombo:0,beaten:[],tut:{},met:{},intro:false,
  name:'',born:0,day:0,hp:null,sat:100,vig:100,spirit:100,water:0,perun:0,far:-1,fallen:[],remind:'19:00',pz:null,wonDay:'',ob:null};
const fresh=()=>JSON.parse(JSON.stringify(DEF));
function load(){let o={};try{o=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){}const s=Object.assign(fresh(),o);delete s.unlocked;return s}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
let S=load(),run=null,tick=null,busy=0,view=null,tut=null,izTab='lessons',beastId=null,note=null;
const mapSt={hover:null,sel:null};
const need=l=>30+20*l;
const maxHP=()=>100+(S.lvl-1)*5+S.armor*10;
const atk=()=>1+(S.lvl-1)*.05+S.sword*.1;
const st=id=>S.stats[id]||(S.stats[id]={n:0,ok:0,t:0,best:0,r:[]});
const acc=q=>q.r.length?q.r.reduce((a,b)=>a+b,0)/q.r.length:.7;
const streak=()=>S.lastDay===today()||S.lastDay===yday()?S.streak:0;
const zOpen=zi=>zi===0||S.beaten.includes(ZONES[zi-1].id);
const zBeaten=zi=>S.beaten.includes(ZONES[zi].id);
const tMastered=t=>{const q=S.stats[t];return!!q&&q.ok>=8&&acc(q)>=.7};
const zMastered=zi=>ZONES[zi].topics.every(tMastered);
const meet=id=>{if(S.met[id]===undefined)S.met[id]=0};
function record(t,ok,s){const q=st(t.id);q.n++;q.r.push(ok?1:0);if(q.r.length>10)q.r.shift();if(ok){q.ok++;q.t+=s;if(!q.best||s<q.best)q.best=s}
  const d=S.days[today()]||(S.days[today()]={n:0,ok:0,t:0});d.n++;if(ok)d.ok++;d.t+=s}
function gainXP(x){S.xp+=x;run.xp+=x;while(S.xp>=need(S.lvl)){S.xp-=need(S.lvl);S.lvl++;S.hp+=5;toast(`Новый уровень ${S.lvl}! +5 HP, +5% урона`)}}

// ---------- выживание: четыре нужды 0–100 (здоровье — это HP), смерть, Книга павших ----------
const SAT_DAY=34;                              // сытость за игровой день: с полной до нуля за 3 дня
const tired=()=>S.vig<50?.5+S.vig/100:1;       // бодрость ниже 50 — урон ниже, на нуле вдвое
const fear=()=>S.spirit>0?1:1.5;               // дух на нуле — нечисть бьёт в полтора раза сильнее
const daysLeft=()=>Math.ceil(S.sat/SAT_DAY);   // сколько рассветов (4:00) стрелец переживёт без еды
const solved=()=>Object.values(S.stats).reduce((a,q)=>a+q.ok,0);
const NAMES=['Федот','Иван','Ерёма','Фома','Данила','Степан','Тимофей','Прохор','Савва','Гаврила','Никита','Емельян','Кузьма','Макар','Лука','Афанасий','Елисей','Митрофан','Яков','Тихон'];
const SURN=['Лыков','Кузьмин','Ершов','Буслаев','Гусев','Хромов','Сорокин','Пищальников','Бердышев','Мельников','Овчинников','Звягин','Колосов','Рябов','Тетерин','Брагин'];
// новые поля (и старые сохранения) дополняем полными значениями
function fill(){if(!S.name)S.name=pick(NAMES)+' '+pick(SURN);if(S.hp==null)S.hp=maxHP();S.hp=Math.min(S.hp,maxHP());if(!S.day)S.day=gday();
  if(!S.born){const k=Object.keys(S.days).sort()[0];S.born=k?Math.min(gday(),Math.round(Date.parse(k+'T00:00Z')/864e5)):gday()}
  if(S.far<0&&S.runs)S.far=ZONES.reduce((a,_,i)=>zOpen(i)?i:a,0);pzFill();obFill()}  // царские приказы — js/prikazy.js, обучение — js/onboarding.js
// обучение переживает смерть: новому стрельцу — короткий пролог, остальное не повторяется
function reborn(){S=Object.assign(fresh(),{fallen:S.fallen,remind:S.remind,ob:obReborn(S.ob)});fill();save();MB=null;mapSt.sel=null}
function vigDown(n){const was=S.vig;S.vig=Math.max(0,S.vig-n);if(was>=50&&S.vig<50)toast('Стрелец устал и бьёт слабее. Баня поможет')}
function fright(n){const was=S.spirit;S.spirit=Math.max(0,S.spirit-n);if(was&&!S.spirit)toast('Дух сломлен: нечисть бьёт сильнее. Церковь или капище помогут')}
// убыль сытости за прошедшие рассветы: при загрузке и раз в минуту, если вкладка открыта в 4:00
function passDays(){const cur=gday(),n=cur-S.day;if(n<=0)return;const was=S.sat;let saved=0;
  for(let i=1;i<=n;i++){S.sat=Math.max(0,S.sat-SAT_DAY);if(S.sat)continue;
    if(S.water){S.water=0;S.sat=35;S.hp=Math.max(S.hp,Math.round(maxHP()*.5));saved=1}else return die('hunger','Голод',S.day+i-1)}
  S.day=cur;note={n,was,sat:S.sat,saved};save()}
// last — последний прожитый игровой день
function die(how,cause,last=gday()){const w=how==='battle'&&run&&run.lastWrong,miss=w?{q:w.q,in:run.lastIn,a:fa(w),s:w.s}:null; // последний неверный ответ — для экрана смерти и Книги павших
  clearInterval(tick);busy=0;run=null;tut=null;
  const f={miss,name:S.name,days:Math.max(1,last-S.born+1),solved:solved(),lvl:S.lvl,rank:rankName(),zone:S.far>=0?ZONES[S.far].name:'',how,cause,date:how==='hunger'?dkey(last+1):ldate(now())};
  S.fallen.unshift(f);reborn();note=null;show(()=>deadView(f));return true}
function fall(m){if(S.water){S.water=0;S.hp=Math.round(maxHP()*.5);S.sat=Math.max(S.sat,35);return endRun(false,'water')}
  die('battle',`${m.name}, ${ZONES[run.zi].short}`)}

// ---------- эффекты боя поверх арены (рендер спрайтов — в js/sprites.js) ----------
onSpriteLoad=()=>paintAll();
onKremLoad=()=>{MB=null;paintAll()};
function fxAt(cls,x,y,w,ms){const a=$('#arena'),d=document.createElement('div');d.className=cls;d.style.cssText=`left:${x}px;top:${y}px;${w}`;a.appendChild(d);setTimeout(()=>d.remove(),ms)}
function tracer(k){const a=$('#arena'),h=$('#hero canvas'),m=$('#m'+k+' canvas');if(!a||!h||!m)return;const ra=a.getBoundingClientRect(),rh=h.getBoundingClientRect(),rm=m.getBoundingClientRect();if(!rh.width)return;
  const x1=rh.left+rh.width*.9-ra.left,y1=rh.top+rh.height*.48-ra.top,x2=rm.left+rm.width*.5-ra.left,y2=rm.top+rm.height*.55-ra.top;
  fxAt('tracer',x1,y1,`width:${Math.hypot(x2-x1,y2-y1)}px;transform:rotate(${Math.atan2(y2-y1,x2-x1)}rad)`,260)}
function slashFx(){const a=$('#arena'),h=$('#hero canvas');if(!a||!h)return;const ra=a.getBoundingClientRect(),rh=h.getBoundingClientRect();if(!rh.width)return;fxAt('slash',rh.left-ra.left+rh.width*.25,rh.top-ra.top+rh.height*.25,'',320)}
function paintAll(){document.querySelectorAll('canvas[data-cr]').forEach(paintCr);document.querySelectorAll('canvas.bpic').forEach(bldPic);const a=$('#arenaBg');if(a&&run)paintArena(a,run.zi);const m=$('#map');if(m){if(!MB)buildMap(zOpen);paintMap(m,mapState())}}
ATL.addEventListener('load',()=>{MB=null;paintAll()});
document.fonts&&document.fonts.ready.then(paintAll);

// ---------- шапка: лицо стрельца (js/faces.js), четыре нужды, предупреждения ----------
const NEEDS=[['sat','Сытость'],['hp','Здоровье'],['vig','Бодрость'],['spirit','Дух']];
// стрелец — верх левой колонки: лицо и справа четыре нужды, ниже имя, уровень, золото и предупреждения о нуждах
function hdr(){const mx=maxHP(),w=needWarn(),dd=S.days[today()]||{ok:0,t:0},bar=([k,n])=>{const v=k==='hp'?S.hp:S[k],m=k==='hp'?mx:100,low=v/m<.25;
    return`<div class="need"><div class="nl"><span class="px small ${low?'bad':''}">${n}</span><span class="small ${low?'bad':'muted'}">${v}${k==='hp'?'/'+mx:''}</span></div><div class="bar ${k}"><i style="width:${v/m*100}%"></i></div></div>`};
  return`<div class="panel hdr"><div class="hrow">${faceBox('strelets_face')}<div class="needs">${NEEDS.map(bar).join('')}</div></div>
    <div class="who"><div class="row" style="flex-wrap:nowrap;gap:6px"><span class="px small gold" style="flex:1">${S.name}</span><button class="gear" data-act="gear" title="Напоминание в календаре">⚙</button></div>
    <div class="small">${rankName()?rankName()+' · ':''}день ${gday()-S.born+1} · ур. ${S.lvl}, опыт ${S.xp}/${need(S.lvl)}</div>
    <div class="small"><span class="gold">${S.gold} зол.</span> · зелья ${S.potions} · свитки ${S.scrolls}${S.water?' · <span class="ok">живая вода</span>':''}${S.perun?' · <span class="gold">Перун благоволит</span>':''}</div>
    <div class="small muted">серия <span class="gold">${streak()} дн.</span> · сегодня ${dd.ok} верно, ${Math.round(dd.t/60)} мин</div>
    ${Object.values(w).map(x=>`<div class="small nw">${x}</div>`).join('')}${SHIFT?`<div class="small bad">Время +${SHIFT/864e5} дн. (проверка)</div>`:''}</div>
    <div class="gearm" hidden><p class="small" style="margin:0 0 8px">Стрельца надо навещать каждый день. Напоминание в календаре — ежедневно в</p>
    <div class="row"><input type="time" id="remind" class="tm" value="${S.remind}"><button data-act="ics">Добавить в календарь</button></div></div></div>`}
// экран: слева колонка (стрелец и панель экрана), справа главное до краёв окна; на телефоне — друг под другом.
// solve — экран задачи: на телефоне стрелец не нужен
const layout=(col,main,solve)=>`<div class="scr${solve?' solve':''}"><div class="lcol">${hdr()}${col}</div><div class="mcol">${main}</div></div>`;
function needWarn(){const w={},d=daysLeft();
  if(d<=1)w.sat='<span class="bad">Голоден: умрёт в 4 утра — в корчму!</span>';else if(d===2)w.sat='<span class="gold">Проголодался: проживёт ещё 2 дня</span>';
  if(S.hp<maxHP()*.3)w.hp='<span class="bad">Тяжело ранен — к знахарке</span>';
  if(tired()<1)w.vig=`Устал: урон ×${tired().toFixed(2)} — в баню`;
  if(!S.spirit)w.spirit='<span class="bad">Дух сломлен: нечисть бьёт ×1,5 — в церковь</span>';return w}
// «пока тебя не было» — долгим тостом поверх экрана, чтобы не сдвигать карту
function noteToast(){if(!note)return;const n=note;note=null;
  toast(`Пока тебя не было, ${pl(n.n,'прошёл','прошло','прошло')} ${n.n} ${pl(n.n,'день','дня','дней')}. Сытость: ${n.was} → ${n.sat}.${n.saved?' Стрелец умирал от голода, но его спасла живая вода. Её больше нет.':''}`,9000)}

// ---------- экраны кремля ----------
function show(fn){view=fn;fn();window.scrollTo(0,0)}
const mapState=()=>({hover:mapSt.hover,sel:mapSt.sel,hl:mapSt.hl,open:zOpen});
// куда идти: первая открытая зона, где хозяин ещё не побеждён (её панель видна сразу)
const frontier=()=>{const k=ZONES.findIndex((_,zi)=>zOpen(zi)&&!zBeaten(zi));return k<0?ZONES.reduce((a,_,i)=>zOpen(i)?i:a,0):k};
// на компьютере карта занимает всё справа от колонки: холст рисуется под размер блока (больше окно — больше леса, а не крупнее картинка);
// один пиксель игры — целое число экранных. Меньше 880×560 пикселей игры не показываем — иначе не видно зон, тогда картинка ужимается
const DESK=()=>innerWidth>=900;
function fitMap(){const w=$('.mapwrap'),c=$('#map');if(!w||!c)return false;let cw,ch;
  if(DESK()){cw=w.clientWidth;ch=w.clientHeight}else{cw=w.clientWidth;ch=Math.round(cw*560/880)}
  if(!cw||!ch)return false; // контейнер ещё нулевой: не делим на ноль
  let k=Math.floor(Math.min(cw/880,ch/560));if(k<1)k=Math.min(cw/880,ch/560);
  const ch2=mapView(cw/k,ch/k);if(ch2)MB=null;if(c.width!==MAP.W||c.height!==MAP.H){c.width=MAP.W;c.height=MAP.H}
  c.style.width=Math.round(MAP.W*k)+'px';c.style.height=Math.round(MAP.H*k)+'px';
  if(!MB&&ATL.complete)buildMap(zOpen);if(MB)paintMap(c,mapState());return ch2}
function mapScreen(){noteToast();if(!mapSt.sel)mapSt.sel={type:'zone',zi:frontier()};
  app.innerHTML=`<div class="scr"><div class="lcol">${hdr()}<div id="info" class="info"></div></div><div class="panel mapwrap"><canvas id="map"></canvas>${faceBox('tsar')}</div></div>`;
  document.querySelectorAll('.hdr canvas[data-cr]').forEach(paintCr);const m=$('#map');fitMap();
  // наведение на здание — в колонке, что в нём можно сделать; ушёл — снова панель зоны
  m.onmousemove=e=>{if(!MB)return;const p=mapPick(m,e);if(JSON.stringify(p)!==JSON.stringify(mapSt.hover)){const was=mapSt.hover;mapSt.hover=p;m.style.cursor=p?'pointer':'default';paintMap(m,mapState());
    if(p&&p.type==='bld')bldInfo(p.id);else if(was&&was.type==='bld')zoneInfo(mapSt.sel.zi)}};
  m.onmouseleave=()=>{const was=mapSt.hover;mapSt.hover=null;if(MB)paintMap(m,mapState());if(was&&was.type==='bld')zoneInfo(mapSt.sel.zi)};
  m.onclick=e=>{if(!MB)return;const p=mapPick(m,e);if(!p)return;if(p.type==='bld')return show(()=>building(p.id));mapSt.sel=p;paintMap(m,mapState());zoneInfo(p.zi,true)};
  zoneInfo(mapSt.sel.zi)}
function zoneInfo(zi,scroll){const Z=ZONES[zi],boss=CR[Z.boss],beat=zBeaten(zi),mast=zMastered(zi);let body;if(!$('#info'))return;
  if(!zOpen(zi))body=`<p class="bad">Путь закрыт. Сначала одолей хозяина зоны «${ZONES[zi-1].name}».</p>`;
  else{const tl=Z.topics.map(t=>{const q=S.stats[t],a=q?acc(q):0,ok=q?q.ok:0;
      return`<div class="topic2"><span class="small">${T[TI[t]].name}</span><div class="bar m"><i style="width:${Math.min(1,ok/8)*Math.min(1,a/.7)*100}%"></i></div><span class="small muted">${Math.min(ok,8)}/8 · ${q&&q.r.length?Math.round(a*100)+'%':'—'}</span></div>`}).join('');
    const bl=beat?`${boss.n} повержен. Можно вернуться за золотом и опытом.`:mast?`${boss.n} ждёт тебя в конце похода.`:`${boss.n} пока не показывается: освой темы зоны (8 верных и 70% точности по каждой).`;
    body=`<div class="zmobs">${[...Z.mobs,Z.boss].map(id=>{const m=S.met[id]!==undefined,b=id===Z.boss;return`<div class="c">${cr(id,64,m?'':'sil')}<div class="small ${b?'gold':'muted'}">${m?CR[id].n:b?'Хозяин':'???'}</div></div>`}).join('')}</div>
      ${tl}<p class="small" style="margin:6px 0 8px">${bl}</p>
      <div class="row"><button class="main" data-act="go" data-zi="${zi}">В поход</button>${Z.topics.filter(t=>S.tut[t]).map(t=>`<button data-act="lesson" data-t="${t}">Урок: ${T[TI[t]].name}</button>`).join('')}</div>`}
  $('#info').innerHTML=`<div class="panel zinfo"><h2>${Z.name}</h2><p class="muted small">${Z.desc}</p>${body}</div>`;
  document.querySelectorAll('#info canvas[data-cr]').forEach(paintCr);if(scroll&&!DESK())$('#info').scrollIntoView({behavior:'smooth',block:'nearest'})}
// что можно сделать в здании — для колонки, пока мышь над ним на карте
const BFUN={izba:()=>['Уроки Кота Учёного — повторить любую открытую тему','Летопись: верные ответы, точность, время, последние 7 дней','Книга павших стрельцов'],
  palaty:()=>{if(!pzOn())return['Задачи царя — после победы над Полуденницей','Приказы и чины'];const T=tsarDay(),st={new:'ждёт тебя',offered:'ждёт тебя',later:'отложено',taken:'начато',ok:'выполнено',bad:'не вышло',no:'отказ'}[T.st];
    return[`Поручение дня: ${st}`,`Приказы: открыто ${PZ.filter(s=>pzOpen(s.id)).length} из ${PZ.length}, задачи в них — сколько хочешь`,`Чин: ${RANKS[S.pz.rank]}, верных поручений ${S.pz.ok}`]},
  kapishche:()=>['Бестиарий: вся нечисть, кто она и где о ней прочесть']};
function bldInfo(id){const b=BLD.find(x=>x.id===id),inf=$('#info');if(!b||!inf)return;
  const L=[...(BSHOP[id]||[]).map(k=>{const it=SHOP[k];return`<b>${it.name}</b> — ${it.c()} зол.<br><span class="muted">${it.d}</span>`}),...(BFUN[id]?BFUN[id]():[])];
  inf.innerHTML=`<div class="panel zinfo"><h2>${b.name}</h2><p class="muted small">${b.desc}</p><ul class="small blist">${L.map(x=>`<li>${x}</li>`).join('')}</ul><p class="small gold">Нажми на здание, чтобы войти · у тебя ${S.gold} зол.</p></div>`}
// товары и услуги зданий: c — цена, ok — можно ли сейчас, act — что делает. Цены и расчёт — в docs/PROJECT.md, раздел 5
const SHOP={
  shchi:{name:'Щи да каша',d:'+35 сытости — еда на день',v:'Заказать',c:()=>20,ok:()=>S.sat<100,act:()=>S.sat=Math.min(100,S.sat+35)},
  bread:{name:'Краюха хлеба',d:'+12 сытости',v:'Купить',c:()=>8,ok:()=>S.sat<100,act:()=>S.sat=Math.min(100,S.sat+12)},
  bandage:{name:'Перевязать раны',d:'+30 здоровья',v:'Перевязать',c:()=>10,ok:()=>S.hp<maxHP(),act:()=>S.hp=Math.min(maxHP(),S.hp+30)},
  heal:{name:'Вылечить всё',d:'Здоровье до полного, 1 зол. за 3 HP',v:'Лечить',c:()=>Math.max(1,Math.ceil((maxHP()-S.hp)/3)),ok:()=>S.hp<maxHP(),act:()=>S.hp=maxHP()},
  potions:{name:'Зелье лечения',d:'В походе: +50% здоровья',v:'Купить',c:()=>15,have:()=>'Есть: '+S.potions,act:()=>S.potions++},
  water:{name:'Живая вода',d:'Один раз спасает от смерти — от голода или в бою. Больше одной не унести',v:'Купить',no:'Уже есть',c:()=>150,have:()=>S.water?'Есть':'Нет',ok:()=>!S.water,act:()=>S.water=1},
  steam:{name:'Попариться с веником',d:'Бодрость до 100',v:'Париться',c:()=>12,ok:()=>S.vig<100,act:()=>S.vig=100},
  candle:{name:'Поставить свечу',d:'Дух до 100',v:'Поставить',c:()=>10,ok:()=>S.spirit<100,act:()=>S.spirit=100},
  treba:{name:'Треба Перуну',d:'Дух до 100 и урон +15% на следующий поход',v:'Принести',c:()=>25,have:()=>S.perun?'Перун уже благоволит':'',ok:()=>S.spirit<100||!S.perun,act:()=>{S.spirit=100;S.perun=1}},
  scrolls:{name:'Свиток подсказки',d:'Показывает первый шаг. Урон этого выстрела ×0.5',v:'Купить',c:()=>10,have:()=>'Есть: '+S.scrolls,act:()=>S.scrolls++},
  sword:{name:'Заточить бердыш',d:'+10% урона навсегда',v:'Заточить',c:()=>40+30*S.sword,have:()=>'Уровень: '+S.sword,act:()=>S.sword++},
  armor:{name:'Железные пластины в кафтан',d:'+10 к макс. HP навсегда',v:'Подогнать',c:()=>40+30*S.armor,have:()=>'Уровень: '+S.armor,act:()=>S.armor++}};
const BSHOP={korchma:['shchi','bread'],znaharka:['bandage','heal','potions','water'],banya:['steam'],tserkov:['candle'],kapishche:['treba'],kuznica:['sword','armor'],torg:['scrolls']};
const BSAY={
  korchma:'Корчмарь протирает кружку: «Голодный стрелец — мёртвый стрелец. Без еды и трёх дней не протянешь». Миски щей хватает на день.',
  znaharka:'Что нечисть отняла, само не зарастёт. Травница перевяжет раны, а за большие деньги нальёт живой воды: она поднимает и мёртвых, но только один раз.',
  banya:'Пар костей не ломит. В лесу каждый выстрел отнимает силы, а усталый стрелец (бодрость ниже 50) бьёт слабее. Выпаришь усталость — рука снова твёрдая.',
  tserkov:'Батюшка вернулся. В лесу с каждой поляной копится страх, а свеча у иконы его гонит. Когда дух на нуле, нечисть бьёт в полтора раза сильнее.',
  kapishche:'Деревянный Перун смотрит поверх головы. Треба дороже свечи: она тоже вернёт дух, а Громовник на один поход даст руке силы.'};
const shopHTML=ids=>`<div class="panel"><p class="px small gold">${S.gold} золота</p><div class="shop">${ids.map(id=>{const it=SHOP[id],c=it.c(),ok=!it.ok||it.ok(),h=it.have&&it.have();
  return`<div class="item"><span class="px small">${it.name}</span><span class="small muted">${it.d}</span>${h?`<span class="small">${h}</span>`:''}<button data-act="buy" data-id="${id}" ${!ok||S.gold<c?'disabled':''}>${ok?it.v+' · '+c:it.no||'Не нужно'}</button></div>`}).join('')}</div></div>`;
function buy(id){const it=SHOP[id],c=it.c();if(S.gold<c||it.ok&&!it.ok())return;S.gold-=c;it.act();save();toast(`${it.name} · −${c} зол.`);view&&view()}
// экран здания: в колонке под стрельцом — название, описание, слово хозяина и само здание; справа лавка (на капище — лавка и бестиарий рядом)
function building(id){const b=BLD.find(x=>x.id===id);let body;obVisit(id);
  if(BSHOP[id])body=id!=='kapishche'?shopHTML(BSHOP[id]):beastId?beastHTML():`<div class="kapcols">${shopHTML(BSHOP[id])}${beastHTML()}</div>`;
  else if(id==='izba')body=izbaHTML();
  else if(id==='palaty')body=palatyHTML();
  else body='<div class="panel"><p class="muted">Скоро здесь что-то будет.</p></div>';
  app.innerHTML=layout(`<div class="panel spk bcol"><div class="row" style="flex-wrap:nowrap;width:100%"><h2 style="flex:1;margin:0">${b.name}</h2><button data-act="map">← В кремль</button></div>
    <p class="muted small">${b.desc}</p>${BSAY[id]?`<p class="small">${BSAY[id]}</p>`:''}<canvas class="bpic" data-bld="${id}"></canvas></div>`,body);paintAll()}
// здание крупно в колонке: целый масштаб, сколько влезает в оставшееся место
function bldPic(cv){const b=BLD.find(x=>x.id===cv.dataset.bld);if(!b)return;const w=cv.clientWidth,h=cv.clientHeight;if(w<40||h<40){cv.width=cv.height=0;return}
  let src,sx=0,sy=0,sw,sh,fl=false;const k=kimg(b.id);
  if(k){src=k.im;sx=k.x0;sy=k.y0;sw=k.x1-k.x0+1;sh=k.y1-k.y0+1;fl=!!b.fl}
  else if(b.spr&&ATLAS[b.spr]&&ATL.complete){const a=ATLAS[b.spr];src=ATL;sx=a[0];sy=a[1];sw=a[2];sh=a[3]}
  else{src=document.createElement('canvas');src.width=48;src.height=44;kapishche(src.getContext('2d'),24,38);sw=48;sh=44}
  const sc=Math.max(1,Math.floor(Math.min(w/sw,h/sh)));cv.width=w;cv.height=h;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;const dw=sw*sc,dh=sh*sc,x=(w-dw)>>1,y=h-dh;
  if(fl){g.translate(w,0);g.scale(-1,1)}g.drawImage(src,sx,sy,sw,sh,x,y,dw,dh)}
// ---------- бестиарий на капище: волхв знает всю нечисть; статьи — js/bestiary.js ----------
// вся нечисть — вкладками по зонам; статья — вместо списка
let bzTab=0;
function beastHTML(){const zn=id=>ZONES.findIndex(z=>z.mobs.includes(id)||z.boss===id);
  if(beastId){const id=beastId,c=CR[id],B=BEAST[id]||{},z=ZONES[zn(id)],met=S.met[id]!==undefined;
    return`<div class="panel beastart"><div class="row"><button data-act="beastback">← Ко всей нечисти</button><span class="small muted">${z.name}</span></div>
      <div class="bart"><div class="baside">${cr(id,128,met?'':'sil')}
      <h2 style="margin:8px 0 4px">${c.n}</h2><p class="small muted" style="margin-top:0">${c.boss?'Хозяин зоны · ':''}${met?'побеждено: '+S.met[id]:'ещё не встречалась'}</p>
      <p><i>${c.lore}</i></p></div><div class="bcols">
      <h3>Кто такой</h3><p>${B.who}</p><h3>Откуда берётся</h3><p>${B.why}</p><h3>Чем занят</h3><p>${B.does}</p>
      <h3>В классике</h3>${B.lit&&B.lit.length?`<ul>${B.lit.map(t=>`<li>${t}</li>`).join('')}</ul>`:'<p class="muted">В классической литературе почти не встречается — ищи в книгах ниже.</p>'}
      <h3>Почитать о мифах</h3><ul>${(B.books||[]).map(k=>`<li>${BK[k]}</li>`).join('')}</ul></div></div></div>`}
  const z=ZONES[bzTab];
  return`<div class="panel beasts"><div class="row" style="margin-bottom:8px"><h2 style="margin:0">Бестиарий</h2><span class="small muted">Волхв знает про каждую тварь, кто она и в каких книгах о ней прочесть. Нажми на любую.</span></div>
    <div class="row tabs">${ZONES.map((q,i)=>`<button data-act="bzt" data-z="${i}" class="${i===bzTab?'on':''}">${q.short}</button>`).join('')}</div>
    <div class="beast">${[...z.mobs,z.boss].map(id=>{const met=S.met[id]!==undefined;
      return`<div data-act="beast" data-id="${id}">${cr(id,64,met?'':'sil')}<div><div class="px small ${CR[id].boss?'gold':''}">${CR[id].n}</div><div class="small">${CR[id].lore}</div><div class="small muted">${met?'Побеждено: '+S.met[id]:'Ещё не встречалась'}</div></div></div>`}).join('')}</div></div>`}
// изба-читальня: уроки, летопись, Книга павших (страницами, последнее уравнение — во всплывающем окне)
let izPage=0;const IZ_PER=5;
function izbaHTML(){if(izTab==='beast')izTab='lessons';const tabs=[['lessons','Уроки'],['stats','Летопись'],['fallen','Книга павших']].map(([k,n])=>`<button data-act="izt" data-t="${k}" class="${izTab===k?'on':''}">${n}</button>`).join('');let b='';
  if(izTab==='lessons'){const ts=ZONES.filter((_,zi)=>zOpen(zi)).flatMap(z=>z.topics);
    b=`<div class="row" style="align-items:flex-start;flex-wrap:nowrap"><div>${cr('kot',128)}</div><div class="bubble"><p>Мур. Какой урок повторим, стрелец?</p><div class="row">${ts.map(t=>`<button data-act="lesson" data-t="${t}">${T[TI[t]].name}</button>`).join('')}</div></div></div>`}
  else if(izTab==='fallen'){const F=S.fallen,pages=Math.max(1,Math.ceil(F.length/IZ_PER));izPage=Math.max(0,Math.min(izPage,pages-1));const pg=F.slice(izPage*IZ_PER,(izPage+1)*IZ_PER);
    b=`<p class="muted">Кот Учёный записывает сюда каждого стрельца, что не вернулся.</p>${F.length?`<div class="tscroll"><table class="tight"><tr><th>Стрелец</th><th>Чин</th><th>Прожил</th><th>Решил</th><th>Дошёл до</th><th>Смерть</th><th>Последнее уравнение</th><th>Дата</th></tr>
      ${pg.map((f,i)=>`<tr><td>${f.name}</td><td>${f.rank||'—'}</td><td>${f.days} ${pl(f.days,'день','дня','дней')}</td><td>${f.solved}</td><td>${f.zone||'—'}</td><td>${f.how==='hunger'?'Голод':'Пал в бою: '+f.cause}</td><td>${f.miss?`<button class="eqbtn" data-act="miss" data-i="${izPage*IZ_PER+i}">${esc(Array.isArray(f.miss.q)?f.miss.q.join('; '):f.miss.q)}</button>`:'—'}</td><td>${ru(f.date)}</td></tr>`).join('')}</table></div>
      ${pages>1?`<div class="row" style="margin-top:10px"><button data-act="izp" data-d="-1" ${izPage?'':'disabled'}>← Раньше</button><span class="small muted">Страница ${izPage+1} из ${pages}</span><button data-act="izp" data-d="1" ${izPage<pages-1?'':'disabled'}>Дальше →</button></div>`:''}`:'<p>Книга пуста. Пусть так и остаётся.</p>'}`}
  else{const days=[...Array(7)].map((_,i)=>dkey(gday()-(6-i)));
    b=`<div class="izstats"><div><table class="tight"><tr><th>Тема</th><th>Верно</th><th>Точность*</th><th>Ср. время</th><th>Рекорд</th><th>Норма</th></tr>${T.map(t=>{const q=S.stats[t.id];if(!q)return'';
      return`<tr><td>${t.name}</td><td>${q.ok}/${q.n}</td><td>${q.r.length?Math.round(acc(q)*100)+'%':'—'}</td><td>${q.ok?Math.round(q.t/q.ok)+' с':'—'}</td><td>${q.best?Math.round(q.best)+' с':'—'}</td><td>${t.par} с</td></tr>`}).join('')}</table>
      <p class="small muted">* по последним 10 попыткам. Слабые темы попадаются чаще.</p></div>
      <div><h2>Последние 7 дней</h2>${days.map(d=>{const x=S.days[d];return`<div class="topic"><span class="small" style="width:60px">${d.slice(5)}</span><div class="bar xp"><i style="width:${x?Math.min(100,x.ok*3):0}%"></i></div><span class="small muted" style="width:150px">${x?x.ok+' верно · '+Math.round(x.t/60)+' мин':'—'}</span></div>`}).join('')}
      <p class="small muted">Походов: ${S.runs} · побед: ${S.wins} · лучшее комбо: ${S.bestCombo}</p>
      <div class="row">${ZONES.some((_,zi)=>!zBeaten(zi))?'<button data-act="skipzone">Открыть следующую зону досрочно</button>':''}<button data-act="reset">Сбросить прогресс</button></div></div></div>`}
  return`<div class="panel"><div class="row tabs" style="margin-bottom:14px">${tabs}</div>${b}</div>`}
// всплывающее окно поверх экрана: закрывается кнопкой или щелчком по тёмному фону
function modal(h){const d=document.createElement('div');d.className='modal';d.innerHTML=`<div class="panel">${h}<div class="row c"><button class="main" data-act="modalx">Закрыть</button></div></div>`;
  d.onclick=e=>{if(e.target===d||e.target.closest('[data-act="modalx"]'))d.remove()};document.body.appendChild(d)}
// последнее уравнение павшего: что было, что ответил, как надо
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const missHTML=m=>`<div class="sol" style="text-align:left;margin:12px 0"><div class="small muted">Последнее уравнение</div><div class="eq">${eqHTML(m.q)}</div>
  <p style="margin:6px 0">Твой ответ: <b class="bad">${esc(m.in)}</b> · верно: <b class="ok">${m.a}</b></p><ol>${m.s.map(stepLi).join('')}</ol></div>`;
function deadView(f){const row=(a,b)=>`<tr><td>${a}</td><td>${b}</td></tr>`,hunger=f.how==='hunger';
  app.innerHTML=`<div class="panel c story dead fill${f.miss?' two':''}"><div><h1>${hunger?'Умер от голода':'Пал в бою'}</h1><div class="row c">${cr('strelets',128,'sil','r')}</div>
  <p>Стрелец ${f.name} ${hunger?'не дождался тебя и умер от голода':`пал в бою: ${f.cause}`}. Кот Учёный вписал его имя в Книгу павших.</p>
  <table>${row('Прожил',f.days+' '+pl(f.days,'день','дня','дней'))}${row('Решил задач',f.solved)}${row('Уровень',f.lvl)}${f.rank?row('Чин',f.rank):''}${row('Дошёл до',f.zone||'не выходил за ворота')}${row('Дата смерти',ru(f.date))}</table>
  <p class="muted" style="margin-top:12px">Всё нажитое пропало: уровень, золото, вещи, открытые пути, освоенные темы, чин и царские приказы.</p>
  <div class="row c"><button class="main" data-act="newhero">Новый стрелец</button></div></div>${f.miss?`<div>${missHTML(f.miss)}</div>`:''}</div>`;paintAll()}

// ---------- напоминание: файл календаря с ежедневным событием ----------
function fold(s){const te=new TextEncoder();let out='',cur='',n=0,lim=75;for(const ch of s){const b=te.encode(ch).length;if(n+b>lim){out+=cur+'\r\n ';cur='';n=0;lim=74}cur+=ch;n+=b}return out+cur}
function ics(){const v=($('#remind')&&$('#remind').value)||S.remind||'19:00';S.remind=v;save();
  const[h,mi]=v.split(':').map(Number),d=new Date();d.setHours(h,mi,0,0);if(d<=new Date())d.setDate(d.getDate()+1);
  const f=x=>''+x.getFullYear()+pad(x.getMonth()+1)+pad(x.getDate())+'T'+pad(x.getHours())+pad(x.getMinutes())+'00';
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//zpl3s//equation-dungeon//RU','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
    'UID:strelets-'+Date.now()+'@zpl3s.github.io','DTSTAMP:'+new Date().toISOString().replace(/[-:]|\.\d+/g,''),'DTSTART:'+f(d),'DURATION:PT15M','RRULE:FREQ=DAILY',
    'SUMMARY:Стрелец ждёт: накормить и в поход','DESCRIPTION:Накорми стрельца и сходи в поход\\, это 15 минут. Без еды он проживёт три дня. '+GAME_URL,'URL:'+GAME_URL,
    'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Стрелец ждёт','TRIGGER:PT0M','END:VALARM','END:VEVENT','END:VCALENDAR'];
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([L.map(fold).join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'}));a.download='strelets-napominanie.ics';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);toast(`Файл календаря скачан: каждый день в ${v}`)}

// ---------- уроки Кота Учёного ----------
const PH={num:'x = ?',set:'x₁, x₂',pair:'x, y',ineq:'x > ?'};
const solHTML=e=>`<div class="sol"><div class="small muted">Решение:</div><ol>${e.s.map(stepLi).join('')}</ol><div class="small">Ответ: ${fa(e)}</div></div>`;
function startTut(q,after,lib){tut={q,i:0,stage:'rules',step:0,done:0,cur:null,after,lib};show(tutView)}
function tutView(){const t=tut.q[tut.i],L=TUT[t],tp=T[TI[t]];let b;
  if(tut.stage==='rules')b=`<h2>${tp.name}</h2><ul>${L.rules.map(r=>`<li>${r}</li>`).join('')}</ul><div class="row"><button class="main" data-act="tnext">Покажи пример</button></div>`;
  else if(tut.stage==='ex')b=`<p class="muted small">Пример</p><div class="eq">${eqHTML(L.ex.q)}</div><ol class="steps">${L.ex.s.slice(0,tut.step).map(stepLi).join('')}</ol>
    <div class="row">${tut.step<L.ex.s.length?'<button class="main" data-act="tstep">Следующий шаг</button>':'<button class="main" data-act="tnext">Теперь сам</button>'}</div>`;
  else{const e=tut.cur;b=`<div class="btcols"><div class="btmain"><p class="muted small">Тренировка ${tut.done+1} из 3 · без урона</p><div class="eq">${eqHTML(e.q)}</div>
    <div class="row" style="flex-wrap:nowrap"><input id="ans" autocomplete="off" spellcheck="false" placeholder="${PH[e.fmt]}"><button class="main" data-act="tcheck">Проверить</button></div>
    <div class="small muted" style="margin-top:6px">${FH[e.fmt]}</div><div class="msg" id="msg"></div></div><div id="sol"></div></div>`}
  app.innerHTML=layout(`<div class="panel spk">${cr('kot',DESK()?192:128)}<div class="px small gold">Кот Учёный</div><p class="small muted">Урок ${tut.i+1} из ${tut.q.length} · ${tp.name}</p>
    <button data-act="tskip">${tut.lib?'Закрыть урок':'Знаю, пропустить'}</button></div>`,`<div class="panel tut"><div class="bubble">${b}</div></div>`,1);
  paintAll();const a=$('#ans');if(a){a.focus();a.onkeydown=ev=>{if(ev.key==='Enter')tCheck()}}}
function tCheck(){const a=$('#ans');if(!a.value.trim())return msg('Сначала впиши ответ','muted');const r=check(tut.cur,a.value);if(r.err)return msg(r.err,'muted');
  if(r.ok){tut.done++;if(tut.done>=3)return tutDone();tut.cur=newEq(TI[tut.q[tut.i]]);tutView();msg(pick(KOT_OK),'ok')}
  else msg(`${pick(KOT_BAD)} <button data-act="tsol">Показать решение</button>`,'bad')}
function tutDone(){S.tut[tut.q[tut.i]]=1;save();tut.i++;if(tut.i<tut.q.length){Object.assign(tut,{stage:'rules',step:0,done:0});return show(tutView)}const f=tut.after;tut=null;f()}

// ---------- поход: 4 поляны, привал, в конце хозяин зоны ----------
const PLAN=[1,2,2,'camp',2,2,'boss'];
const newEq=i=>({...T[i].gen(),ti:i,fmt:T[i].fmt,el:0,at:0,hinted:false});
const el=e=>(e.el+(e.at?Date.now()-e.at:0))/1000;
const spd=(s,p)=>{const r=s/p;return r<=.5?2:r<=1?1+(1-r)*.5:Math.max(.4,1/r)};
const cm=()=>1+.1*Math.min(run.combo,10);
function weighted(pool){const w=pool.map(i=>{const q=S.stats[T[i].id];return 1+(1-(q?acc(q):.7))*4});let x=Math.random()*w.reduce((a,b)=>a+b,0);
  for(let k=0;k<pool.length;k++){x-=w[k];if(x<=0)return pool[k]}return pool[pool.length-1]}
// темы зоны + немного старых для повторения (в Кощеевом царстве — половина)
function pickTopic(zi){const Z=ZONES[zi],own=Z.topics.map(t=>TI[t]),old=T.map((_,i)=>i).filter(i=>TOPIC_ZONE[T[i].id]<zi);
  return weighted(old.length&&Math.random()<(Z.mix?.5:.25)?old:own)}
const bossEq=()=>{const Z=ZONES[run.zi];return newEq(Z.mix&&Math.random()<.5?weighted(T.map((_,i)=>i)):weighted(Z.topics.map(t=>TI[t])))};
function spawn(ti,elite){const t=T[ti],id=pick(ZONES[TOPIC_ZONE[t.id]].mobs),hp=Math.round(16*t.d*(1+.08*run.step)*(elite?2.2:1));meet(id);
  return{id,ti,name:CR[id].n+(elite?' · вожак':''),hp,max:hp,atk:6+3*t.d+run.step+(elite?4:0),eq:newEq(ti)}}
// здоровье в поход не восполняется; благоволение Перуна действует на один поход
function startExp(zi){const mx=maxHP();if(S.hp<mx*.4&&!confirm(`Здоровья мало: ${S.hp} из ${mx}, а само оно не вернётся. Всё равно идти?`))return;
  S.far=Math.max(S.far,zi);run={zi,step:0,combo:0,maxc:0,n:0,ok:0,time:0,crits:0,gold:0,xp:0,mons:[],tg:0,healed:0,newZone:'',lastWrong:null,perun:!!S.perun};S.perun=0;save();
  const q=ZONES[zi].topics.filter(t=>!S.tut[t]);if(q.length)startTut(q,enterRoom);else enterRoom()}
function enterRoom(){view=null;const p=PLAN[run.step],Z=ZONES[run.zi];
  if(p==='camp'){const mx=maxHP();run.healed=Math.max(0,Math.min(mx-S.hp,Math.round(mx*.25)));S.hp+=run.healed;save();return show(campView)}
  if(p==='boss'){if(zMastered(run.zi)){const d=Math.max(...Z.topics.map(t=>T[TI[t]].d)),hp=55*d;meet(Z.boss);
      run.mons=[{id:Z.boss,boss:1,name:CR[Z.boss].n,hp,max:hp,atk:14+4*d,eq:bossEq()}];toast(`Хозяин зоны: ${CR[Z.boss].n}!`)}
    else{run.mons=[spawn(weighted(Z.topics.map(t=>TI[t])),true)];toast('Хозяин не вышел. Вместо него — вожак')}}
  else run.mons=Array.from({length:p},()=>spawn(pickTopic(run.zi)));
  fright(p==='boss'?10:5);  // в лесу растёт страх: каждая поляна −5 духа, хозяин или вожак −10
  save();run.tg=0;battle();sel(0)}
const stageName=()=>{const p=PLAN[run.step];return p==='boss'?'<span class="bad">Хозяин</span>':'Поляна '+PLAN.slice(0,run.step+1).filter(x=>typeof x==='number').length+'/4'};
// бой: сверху сводка, посередине арена (растёт с высотой окна, в высоком окне и спрайты крупнее), снизу уравнение; решение после промаха — справа от него
function battle(){const ah=DESK()?innerHeight-360:0,ms=ah>=720?256:ah>=500?192:128,bs=ms===256?384:ms===192?256:192,sol='<div id="sol"></div>';
  app.innerHTML=`<div class="btwrap fill"><div class="panel row" id="hud"></div>
  <div class="panel arena" id="arena"><canvas id="arenaBg"></canvas><div id="hero">${cr('strelets',ms,'','r')}</div><div class="say" data-who="hero"></div>${DESK()?sol:''}
    <div class="mons">${run.mons.map((m,k)=>`<div class="mon" id="m${k}" data-act="sel" data-i="${k}"><div class="mname px">${m.name}</div>${cr(m.id,m.boss?bs:ms)}<div class="bar m"><i></i></div></div>`).join('')}</div></div>
  <div class="panel btq"><div class="btcols"><div class="btmain">
    <div class="row"><span class="px small muted" id="tinfo" style="flex:1"></span><span id="timer" class="px small"></span></div><div class="eq" id="eq"></div><div class="hintbox" id="hint"></div>
    <div class="row" style="flex-wrap:nowrap;margin-top:8px"><input id="ans" autocomplete="off" spellcheck="false"><button class="main" data-act="hit">Выстрел</button></div>
    <div class="row" style="margin-top:8px"><span class="small muted" id="fh" style="flex:1;min-width:200px"></span><button data-act="scroll" id="bs"></button><button data-act="potion" id="bp"></button></div>
    <div class="msg" id="msg"></div></div>${DESK()?'':sol}</div>
  </div></div>`;
  run.mons.forEach(m=>['idle','attack','spawn'].forEach(k=>strip(m.id,k)));if(window.ResizeObserver)new ResizeObserver(solFit).observe($('#arena'));
  paintAll();updHUD();run.mons.forEach((_,k)=>{updMon(k);spawnFx($('#m'+k+' canvas'),k*180)});
  $('#ans').addEventListener('keydown',e=>{if(e.key==='Enter')hit()});
  clearInterval(tick);tick=setInterval(updTimer,250)}
function updHUD(){const mx=maxHP(),hp=Math.max(0,S.hp),tr=tired(),next=Math.max(...run.mons.filter(q=>q.hp>0).map(q=>Math.round(q.atk*fear())));
  $('#hud').innerHTML=`<span class="px small">${ZONES[run.zi].name} · ${stageName()}</span>
  <span class="px small bad">HP ${hp}/${mx}</span><div class="bar" style="flex:1"><i style="width:${hp/mx*100}%"></i></div>
  <span class="px small">${run.combo>1?'Комбо ×'+cm().toFixed(1):''}</span><span class="px small gold" title="Добыча похода. Отступишь — пропадёт">котомка ${run.gold} з.</span><button data-act="flee">Отступить</button>
  <div class="small muted" style="flex-basis:100%">Бодрость ${S.vig}${tr<1?` <span class="bad">— устал, урон ×${tr.toFixed(2)}</span>`:''} · Дух ${S.spirit}${fear()>1?' <span class="bad">— страх, нечисть бьёт ×1.5</span>':''}${run.perun?' · <span class="gold">Перун благоволит: урон ×1.15</span>':''}${hp<=next?' · <span class="bad">Ещё промах — и смерть. Выпей зелье или отступи</span>':''}</div>`;
  $('#bs').textContent=`Подсказка (${S.scrolls})`;$('#bp').textContent=`Зелье (${S.potions})`;$('#bs').disabled=!S.scrolls;$('#bp').disabled=!S.potions||S.hp>=mx}
function updMon(k){const m=run.mons[k],e=$('#m'+k);e.classList.toggle('sel',k===run.tg&&m.hp>0);e.classList.toggle('dead',m.hp<=0);e.querySelector('.bar i').style.width=Math.max(0,m.hp)/m.max*100+'%'}
function sel(k){const m=run.mons[k];if(!m||m.hp<=0)return;const cur=run.mons[run.tg];if(cur&&cur.eq.at){cur.eq.el+=Date.now()-cur.eq.at;cur.eq.at=0}
  run.tg=k;m.eq.at=Date.now();run.mons.forEach((_,j)=>updMon(j));showEq();$('#ans').focus()}
function showEq(){const e=run.mons[run.tg].eq,t=T[e.ti];
  $('#tinfo').textContent=`${t.name} · норма ${t.par} с`;$('#eq').innerHTML=eqHTML(e.q);
  $('#hint').textContent=e.hinted?'Подсказка: '+e.h:'';$('#fh').textContent=FH[e.fmt];$('#ans').value='';$('#ans').placeholder=PH[e.fmt]}
function updTimer(){const tm=$('#timer');if(!tm||!run)return;const m=run.mons[run.tg];if(!m||m.hp<=0)return;const s=el(m.eq),p=T[m.eq.ti].par;
  tm.textContent=`Время: ${Math.floor(s)} с`;tm.style.color=s<=p/2?'var(--gold)':s<=p?'var(--ok)':'var(--muted)'}
function hit(){if(!run||busy)return;const k=run.tg,m=run.mons[k];if(!m||m.hp<=0)return;const e=m.eq,inp=$('#ans').value;
  if(!inp.trim())return msg('Сначала впиши ответ','muted');
  const res=check(e,inp);if(res.err)return msg(res.err,'muted');
  const s=el(e),t=T[e.ti];e.at=0;record(t,res.ok,s);run.n++;vigDown(1);$('#sol').innerHTML='';
  if(res.ok){
    const sp=spd(s,t.par),crit=sp>=2,dmg=Math.max(1,Math.round(10*t.d*sp*cm()*atk()*tired()*(run.perun?1.15:1)*(e.hinted?.5:1)));
    run.ok++;run.time+=s;run.combo++;run.maxc=Math.max(run.maxc,run.combo);if(crit)run.crits++;
    gainXP(5*t.d+(crit?5:0));m.hp-=dmg;
    attackFx($('#hero canvas'));tracer(k);hurtFx($('#m'+k+' canvas'));anim($('#m'+k+' canvas'),'shake');pop(k,(crit?'КРИТ! ':'')+'−'+dmg,crit);
    let txt=`${crit?'Точно в сердце!':'Попал!'} ${Math.round(s)} с · урон ${dmg}`;
    if(m.hp<=0){$('#m'+k+' canvas')._die=performance.now()+120;const g=m.boss?40:3+2*t.d;run.gold+=g;S.met[m.id]=(S.met[m.id]||0)+1;txt+=` · ${m.name} повержен! +${g} з. в котомку`;
      if(m.boss&&!zBeaten(run.zi)){S.beaten.push(ZONES[run.zi].id);const nz=ZONES[run.zi+1];if(nz){run.newZone=nz.name;toast(`Путь открыт: ${nz.name}`)}}}
    else m.eq=m.boss?bossEq():newEq(m.ti);
    msg(txt,crit?'gold':'ok');
  }else{
    const f=fear(),hurt=Math.round(m.atk*f);run.combo=0;S.hp=Math.max(0,S.hp-hurt);fright(2);run.lastWrong=e;run.lastIn=inp.trim();
    attackFx($('#m'+k+' canvas'));anim($('#m'+k+' canvas'),'lungel');setTimeout(()=>{slashFx();hurtFx($('#hero canvas'))},130);anim($('#arena'),'flash');
    msg(`Мимо. ${m.name} бьёт на ${hurt}${f>1?' — страх, удар ×1.5':''}. <button data-act="sol">Показать решение</button>`,'bad');m.eq=m.boss?bossEq():newEq(m.ti);
  }
  save();updHUD();updMon(k);
  if(S.hp<=0){busy=1;setTimeout(()=>fall(m),1200);return}
  if(m.hp<=0){const nx=run.mons.findIndex(q=>q.hp>0);if(nx<0){busy=1;setTimeout(roomClear,900);return}sel(nx)}
  else{m.eq.at=Date.now();showEq()}}
function useScroll(){const e=run.mons[run.tg].eq;if(!S.scrolls||e.hinted)return;S.scrolls--;e.hinted=true;save();$('#hint').textContent='Подсказка: '+e.h;updHUD();$('#ans').focus()}
function usePotion(){const mx=maxHP();if(!S.potions||S.hp>=mx)return;S.potions--;S.hp=Math.min(mx,S.hp+Math.round(mx*.5));save();updHUD();msg('Выпито зелье: +50% HP','ok');$('#ans').focus()}
function roomClear(){busy=0;clearInterval(tick);if(!run)return;run.step++;if(run.step>=PLAN.length)return endRun(true);toast('Поляна зачищена');enterRoom()}
function campView(){app.innerHTML=layout(`<div class="panel spk">${cr('strelets',DESK()?192:128)}<div class="px small gold">${ZONES[run.zi].name}</div><p class="small muted">Котомка: ${run.gold} зол.</p></div>`,`<div class="panel c story mid"><h1>Привал</h1>
  <p>Костёр, сухари, тишина. Отдых: +${run.healed} HP (сейчас ${S.hp}/${maxHP()}).</p><p class="muted">Дальше — ещё две поляны и ${zMastered(run.zi)?'хозяин зоны':'вожак стаи'}. В котомке ${run.gold} зол.: отступишь — пропадут.</p>
  <div class="row c"><button data-act="flee">Отступить в кремль</button><button class="main" data-act="next">Идти дальше</button></div></div>`);paintAll()}
// how: 'flee' — отступил, 'water' — спасла живая вода. Добыча похода достаётся только победителю
function endRun(win,how){busy=0;clearInterval(tick);const r=run;run=null;S.runs++;if(win){S.wins++;r.gold+=25;S.gold+=r.gold;S.wonDay=today()}  // день победы: в палатах платят жалованье
  S.bestCombo=Math.max(S.bestCombo,r.maxc);if(S.lastDay!==today()){S.streak=S.lastDay===yday()?S.streak+1:1;S.lastDay=today()}save();if(r.newZone){MB=null;mapSt.sel=null}  // на карте сразу панель новой зоны
  const row=(a,b)=>`<tr><td>${a}</td><td>${b}</td></tr>`,water=how==='water';
  show(()=>{app.innerHTML=layout(`<div class="panel spk">${cr(win||water?'strelets':ZONES[r.zi].boss,DESK()?192:128)}<div class="px small gold">${ZONES[r.zi].name}</div></div>`,`<div class="panel c mid"><h1>${win?'С добычей домой':water?'Живая вода':'Пришлось отступить'}</h1>
  <p>${win?`${ZONES[r.zi].name} позади. Царю будет что рассказать.`:water?`Нечисть свалила тебя, но живая вода вернула к жизни. Очнулся у ворот кремля: здоровье ${S.hp}. Добыча похода пропала, живой воды больше нет.`:'Добыча похода пропала, опыт остался с тобой.'}</p>
  <table>${row('Решено верно',`${r.ok} из ${r.n}`)}${row('Точность',r.n?Math.round(r.ok/r.n*100)+'%':'—')}${row('Среднее время',r.ok?Math.round(r.time/r.ok)+' с':'—')}
  ${row('Метких выстрелов',r.crits)}${row('Лучшее комбо',r.maxc)}${row('Золото',win?`+${r.gold}`:`0 (пропало ${r.gold})`)}${row('Опыт',`+${r.xp}`)}${r.newZone?row('Открыта зона',r.newZone):''}</table>
  <p class="px small gold" style="margin-top:16px">Серия: ${S.streak} дн.</p><div class="row c"><button class="main" data-act="map">В кремль</button></div></div>`);paintAll()})}

// решение поверх арены занимает левую часть, нечисть видна; длинное не влезло — во всю арену, в три колонки
// арена сжалась (длинная подсказка, система уравнений) — подбираем заново; не влезло и так — шрифт мельче
function solFit(){const o=$('.arena>#sol'),b=o&&o.querySelector('.sol');if(!b)return;o.classList.remove('wide','tight');
  for(const c of['wide','tight']){if(b.scrollHeight<=b.clientHeight)break;o.classList.add(c)}}
// ---------- эффекты ----------
function anim(e,c){if(!e)return;e.classList.remove(c);void e.offsetWidth;e.classList.add(c);setTimeout(()=>e.classList.remove(c),500)}
function pop(k,text,crit){const d=document.createElement('div');d.className='dmg'+(crit?' crit':'');d.textContent=text;$('#m'+k).appendChild(d);setTimeout(()=>d.remove(),1000)}
function msg(t,c){$('#msg').innerHTML=`<span class="${c}">${t}</span>`}
function toast(t,ms=3500){const d=document.createElement('div');d.className='toast';d.textContent=t;d.style.animationDuration=ms+'ms';$('#toast').appendChild(d);setTimeout(()=>d.remove(),ms)}

document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const d=b.dataset;
  const A={map:()=>show(mapScreen),bld:()=>show(()=>building(d.id)),go:()=>startExp(+d.zi),gear:()=>{const m=$('.gearm');if(m)m.hidden=!m.hidden},
    lesson:()=>{const back=view;startTut([d.t],()=>show(back),true)},izt:()=>{izTab=d.t;view()},beast:()=>{beastId=d.id;view();const a=$('.beastart');a&&!DESK()&&a.scrollIntoView()},beastback:()=>{beastId=null;view()},bzt:()=>{bzTab=+d.z;view()},
    izp:()=>{izPage+=+d.d;view()},miss:()=>{const f=S.fallen[+d.i];if(f&&f.miss)modal(`<h2>${f.name}: последнее уравнение</h2>${missHTML(f.miss)}`)},
    hit,sel:()=>sel(+d.i),scroll:useScroll,potion:usePotion,buy:()=>buy(d.id),next:()=>{run.step++;enterRoom()},
    sol:()=>{if(run&&run.lastWrong){$('#sol').innerHTML=solHTML(run.lastWrong)+'<button class="solx" data-act="solx" title="Закрыть">×</button>';solFit()}},solx:()=>{$('#sol').innerHTML='';const a=$('#ans');a&&a.focus()},
    flee:()=>{if(!busy&&confirm(`Отступить в кремль? Добыча похода (${run.gold} зол.) пропадёт, опыт останется.`))endRun(false,'flee')},
    ics,newhero:()=>show(mapScreen),
    tnext:()=>{if(tut.stage==='rules'){tut.stage='ex';tut.step=0}else{tut.stage='prac';tut.cur=newEq(TI[tut.q[tut.i]])}tutView()},
    tstep:()=>{tut.step++;tutView()},tcheck:tCheck,tskip:tutDone,
    tsol:()=>{$('#sol').innerHTML=solHTML(tut.cur)+'<div class="row" style="margin-top:8px"><button data-act="tnew">Другая задача</button></div>'},
    tnew:()=>{tut.cur=newEq(TI[tut.q[tut.i]]);tutView()},
    skipzone:()=>{const k=ZONES.findIndex((_,zi)=>!zBeaten(zi));if(k>=0&&confirm(`Открыть путь дальше, не побеждая хозяина зоны «${ZONES[k].name}»?`)){S.beaten.push(ZONES[k].id);save();MB=null;view()}},
    reset:()=>{if(confirm('Стереть весь прогресс? Книга павших останется.')){reborn();show(mapScreen)}}};
  A[d.act]&&A[d.act]()});
document.addEventListener('change',e=>{if(e.target.id==='remind'){S.remind=e.target.value||'19:00';save()}});
let rsz=0;addEventListener('resize',()=>{clearTimeout(rsz);rsz=setTimeout(()=>{fitMap();paintAll()},150)});
fill();S.intro=true;save();if(!passDays())show(mapScreen);
// вкладка открыта в 4 утра — новый день наступает без перезагрузки
setInterval(()=>{if(gday()!==S.day&&!passDays()&&!run&&!tut&&view)view()},60000);
