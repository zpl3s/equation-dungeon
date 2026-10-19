'use strict';
// ---------- лица: стрелец в шапке (как в Doom) и царь над картой; оба говорят раёшником ----------
// Картинки 64×64: assets/sprites/<id>_<state>.png, моргание и взгляд — <id>_blink / _look_left / _look_right
// (для другого состояния — <id>_<state>_blink). Чего нет в FACE_HAS — берём основу <id>.png, а пока нет и её — временную.
// Разметку даёт faceBox(id); холсты и облачка обновляет тик раз в 100 мс и сразу после перерисовки экрана.
const FACE_HAS=new Set([                              // какие картинки состояний лежат в assets/sprites
  ...['hp2','hp3','hp4','hp5','hungry','tired','scared','blink','look_left','look_right'].map(s=>'strelets_face_'+s),
  ...['hp2','hp3'].flatMap(s=>['blink','look_left','look_right'].map(e=>`strelets_face_${s}_${e}`)),
  ...['angry','pleased','blink'].map(s=>'tsar_'+s)]);
const FACE_BASE={strelets_face:'hp1',tsar:'neutral'}; // состояние, которое рисует основа
const FIMG={};
function fimg(n){if(!(n in FIMG)){FIMG[n]=null;const im=new Image();im.onload=()=>{FIMG[n]=im;faceSync()};im.onerror=()=>{FIMG[n]=false};im.src=`assets/sprites/${n}.png`}return FIMG[n]}
Object.keys(FACE_BASE).forEach(png);FACE_HAS.forEach(fimg); // грузим заранее, чтобы первое моргание не пропало

// ---------- реплики: строки разделены « / » ----------
const SAY={
first:['Здравствуй, барин-грамотей! / Подсоби считать чертей.','Я стрелец, а ты — мой счёт: / вместе нечисть не уйдёт.'],
same:['Ты вернулся? Вот те на! / Мне без счёта не до сна.','Снова здравствуй, грамотей! / Ну, садись, считай скорей.','Не успел я задремать — / а уж надо в бой шагать.','Глядь — опять ты у ворот! / Значит, будет нам поход.'],
day:['Где ж ты сутки пропадал? / Я все щели обыскал.','День прошёл — тебя не видно. / Мне, стрельцу, весьма обидно.','Был денёк — да без тебя: / ни задачки, ни рубля.','Ты вчера куда пропал? / Я ворон пересчитал.'],
away:['Два денька ни крошки в рот! / Так стрелец и упадёт.','Караул! Беда! Ау! / Я ж без каши не живу!','Ты меня совсем забыл: / я уж ремешок сварил!','Где ж ты, батюшка, гулял? / Я уж завещанье написал.','Ещё денёк — и, знаешь сам, / пойду я в гости к праотцам.'],
idle:['Ты заснул там, грамотей? / Нечисть ждёт, считай скорей!','Что притих, как мышь в норе? / Я замёрз тут во дворе.','Долго думать — вредно, брат: / мухи в голове гудят.','Эй, хозяин, ты живой? / Хоть кивни мне головой!',
  'Я стою, скучаю тут, / а часы-то всё идут.','Сидишь, молчишь, не шелохнёшься — / гляди, к обеду не проснёшься.','Не пора ли нам в поход? / Нечисть там давно уж ждёт.','Шапку дважды поправлял, / пуговки пересчитал… / Что ж ты, барин, задремал?',
  'Кто считает — тот стреляет, / кто зевает — тот рыдает.','Скука, барин, хуже Лиха: / в кремле тихо… слишком тихо.','Я бы спел, да голос сиплый, / я б сплясал, да пол-то липкий.','Был бы я учёный кот — / сам решил бы наперёд.'],
hungry:['Брюхо воет на луну — / знать, пора нам в корчму.','Без каши я не воин: / ни сыт, ни спокоен.','Щи да каша — пища наша! / Где ж она? Пустая чаша.','Краюху б мне, хоть сухую, — / я б и нечисть съел живую!','Жую шапку, жую мех — / голод, барин, хуже всех!'],
starving:['Если к ночи не поем — / к четырём утра помрём!','Ты корми меня, корми, / а не то к утру — аминь.'],
tired:['Отстрелялся до мозолей — / баньку б мне, да с паром вволю!','Глаз слипается, рука дрожит — / так и пуля мимо пролетит.','Я устал, как вол в упряжке: / в баню бы — да в чистой рубашке.','Веник, шайка, жаркий пар — / вот бы мне такой товар!','Пищаль — как бревно, тяжела, / а бодрость давно уплыла.'],
scared:['Что-то зябко мне, браток: / в лесу то вой, то шепоток.','Кто там шепчет за спиной? / Свечку б мне — и бес долой.','Душа в пятках, сердце в горле — / мне б к Перуну, на подворье.','Не боюсь я ни черта… / Ой, совру — боюсь, беда!','Ночью снился мне Кощей: / звал на чай без кренделей.'],
hurt:['Ох, болит и там, и тут! / К знахарке меня ведут?','Нечисть шибко мне наддала — / знахарка бы подлатала.','Само не заживёт, хоть плачь: / знахарка мне нынче врач.','Бок помят, расквашен нос — / вот такой с похода спрос.'],
dying:['Еле-еле душа в теле — / мне б живой воды на деле.','Ещё удар — и мне хана. / Налей хоть зелья, старина!'],
};
// диалоги царя (t) и стрельца (s); у царя — выражение лица: neutral, angry, pleased
const TALK=[
[['t','Эй, стрелец! Чего стоишь? / Ты мне службу сослужишь?'],['s','Сослужу, коль не помру, — / только кашу дай к утру.'],['t','Каши? Ишь, какой нахал! / Ты ещё не воевал.','angry']],
[['t','Слышал я, в лесу опять / нечисть стала озорничать.'],['s','Озорничает — не беда: / сосчитаю — и айда!'],['t','То-то, молодец, стрелец! / Не сосчитаешь — тут конец.','pleased']],
[['t','Я с утра не в духе, брат: / всё не так и всё не в лад.','angry'],['s','Ты, царь-батюшка, не злись — / лучше щами угостись.'],['t','Щи? Опять?! Да я ж не смерд! / Мне б икры, да на десерт.','angry']],
[['t','Сосчитай мне звёзды, брат, / все до штуки, все подряд!'],['s','Звёзды, царь, считать — не мёд: / ночь пройдёт, а счёт идёт.'],['t','Вот и славно: ты считай, / а я вздремну, не замай.','pleased']],
[['t','Говорят, ты нечисть бьёшь? / Что ж мне шкурки не несёшь?'],['s','Нечисть, царь, — как дым и прах: / дунешь — нет её в руках.'],['t','Всё-то вывернешь, хитрец! / Ну, ступай уж, молодец.']],
[['t','Нынче ночью снился сон: / будто в лес ушёл мой трон.'],['s','Трон без ног, царь, не сбежит — / он, как ты, весь день лежит.'],['t','Это ты про что, нахал?!','angry']],
[['t','Сосчитай-ка мне казну: / сколько стало? Я вздремну.'],['s','Было сто, а стало пять: / мыши, царь, взялись считать.'],['t','Ну так мышь и посадить! / А тебе — в поход ходить.','angry']],
[['t','Ты, стрелец, мне как родной… / Если сгинешь — что ж, другой.','pleased'],['s','Вот спасибо, царь, утешил — / прямо камень с плеч повесил.']],
[['t','Отчего такой худой? / Аль не балуют едой?'],['s','Кормят, царь, — да раз на дню, / а в лесу я сам в меню.']],
[['t','Что-то скучно мне, стрелец. / Удиви-ка, наконец!'],['s','Удивлю: я жив пока! / Чудо, царь, наверняка.'],['t','Хм… И впрямь. Ну, не зевай: / чудо завтра повторяй.','pleased']],
[['t','Мне бояре всё твердят: / мол, стрелец-то трусоват.','angry'],['s','Пусть бояре сходят в лес — / поглядим, кто там исчез.'],['t','Ишь, остёр! Ну, так и быть: / будем их в поход водить.','pleased']],
[['t','Посчитай-ка, сколько дней / ты мне служишь, дуралей?'],['s','Дней-то много, спору нет, / а вот жалованья — нет.'],['t','Жалованье? Что за зверь? / Не слыхал о нём досель.','angry']],
[['t','Видел я с окна палат: / ты из леса шёл помят.'],['s','Леший, царь, мне руку жал — / крепко, аж весь лес дрожал.']],
[['t','Кот Учёный мне сказал: / ты дробей не сосчитал!','angry'],['s','Кот, надёжа, тот ещё: / сам считает лишь лещей.'],['t','Кота не тронь! Он мне — свой, / а ты — так, стрелец простой.','angry']],
];
const BAG={}; // реплики из группы идут по кругу в случайном порядке, без повторов подряд
function line(k){const a=k==='talk'?TALK:SAY[k];let b=BAG[k];if(!b||!b.length)b=BAG[k]=a.map((_,i)=>i).sort(()=>Math.random()-.5);return a[b.pop()]}

// ---------- состояние лица: ранения → страх → голод → усталость → норма ----------
const hpStage=()=>{const r=S.hp/maxHP();return r>.8?1:r>.6?2:r>.4?3:r>.2?4:5};
function mood(){const h=hpStage();if(h>1)return'hp'+h;if(S.spirit<25)return'scared';if(S.sat<=2*SAT_DAY)return'hungry';if(S.vig<50)return'tired';return'hp1'}
// нужды, о которых стрелец говорит, в том же порядке
function needs(){const h=hpStage(),n=[];if(h===5)n.push('dying');else if(h>=3)n.push('hurt');if(S.spirit<25)n.push('scared');
  if(S.sat<=SAT_DAY)n.push('starving');else if(S.sat<=2*SAT_DAY)n.push('hungry');if(S.vig<50)n.push('tired');return n}

// ---------- кадр и отрисовка ----------
const FS={strelets_face:{st:'hp1',ev:null,evEnd:0,evNext:0},tsar:{st:'neutral',ev:null,evEnd:0,evNext:0}};
function frame(id,st,ev){const L=[];if(ev){L.push(`${id}_${st}_${ev}`);if(st===FACE_BASE[id])L.push(`${id}_${ev}`)}L.push(`${id}_${st}`);
  for(const n of L)if(FACE_HAS.has(n)){const im=fimg(n);if(im)return im}return null}
function drawFace(cv){const id=cv.dataset.face,F=FS[id],g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,64,64);
  let im=frame(id,F.st,F.ev);
  if(!im){const b=png(id);if(b)im=b;
    else if(b===false&&id==='strelets_face'){const s=source('strelets'),w=s.width;return g.drawImage(s,w*.25,0,w*.5,w*.5,0,0,64,64)} // пока нет основы — голова со спрайта
    else if(b===false&&CR[id])im=source(id)}
  if(!im)return;const k=64/Math.max(im.width,im.height);g.drawImage(im,(64-im.width*k)/2,64-im.height*k,im.width*k,im.height*k)}
const faceBox=id=>{const w=id==='tsar'?'tsar':'strelets';
  return`<div class="fbox f-${w}"><canvas class="face" data-face="${id}" width="64" height="64" title="${w==='tsar'?'Царь':'Стрелец'}"></canvas><div class="say" data-who="${w}"></div></div>`};

// ---------- речь: очередь реплик, облачко у портрета ----------
const SPK={q:[],cur:null,end:0,gap:0};
const say=(who,text,m,grp)=>SPK.q.push({who,text,m,grp});
const box=who=>document.querySelector(`.say[data-who="${who}"]`);
const saying=()=>SPK.cur||SPK.q.length;
function talk(){const d=line('talk'),g=Math.random();d.forEach(([w,t,m])=>say(w==='t'?'tsar':'strelets',t,m,g));TK.last=Date.now()}
function needLine(n){say('strelets',line(n[0]))}
function faceSync(){const t=Date.now();
  document.querySelectorAll('canvas.face').forEach(cv=>{drawFace(cv);cv.classList.toggle('talk',!!SPK.cur&&SPK.cur.who===(cv.dataset.face==='tsar'?'tsar':'strelets'))});
  document.querySelectorAll('.say').forEach(el=>{const on=SPK.cur&&SPK.cur.who===el.dataset.who,h=on?SPK.cur.text.split(' / ').join('<br>'):'';
    if(on&&el.innerHTML!==h)el.innerHTML=h;el.classList.toggle('on',!!on)})}

// ---------- когда говорят ----------
const SEEN='eqdungeon.seen'; // когда игрок был в игре последний раз (по часам игры, со сдвигом ?days=N)
const seenGet=()=>{try{return+localStorage.getItem(SEEN)||0}catch(e){return 0}};
const seenSet=()=>{try{localStorage.setItem(SEEN,String(now()))}catch(e){}};
function greetKind(){const t=seenGet();if(!t)return'first';if(now()-t<10*6e4)return null;const g=gday()-gday(t);return g<=0?'same':g===1?'day':'away'}
const IDLE={t:Date.now(),n:0},TK={next:0,last:0};let greet=undefined,prevNeeds=null,needCd=0,seenAt=0,hero='';
['pointermove','pointerdown','keydown','wheel','touchstart'].forEach(e=>addEventListener(e,()=>{IDLE.t=Date.now();IDLE.n=0},{passive:true}));
document.addEventListener('visibilitychange',()=>{if(document.hidden)return seenSet();if(now()-seenGet()>3*36e5)greet=greetKind()});
addEventListener('pagehide',seenSet);
document.addEventListener('click',e=>{const c=e.target.closest('canvas.face');if(!c||saying())return;
  if(c.dataset.face==='tsar')talk();else{const n=needs();n.length&&Math.random()<.7?needLine(n):say('strelets',line('idle'))}});
function faceTick(){if(typeof S==='undefined')return;             // game.js ещё грузится
  const t=Date.now(),hidden=document.hidden;
  if(greet===undefined){greet=greetKind();seenSet()}                 // первый тик: игра уже загружена
  if(hero!==S.name){if(hero)greet='first',prevNeeds=null;hero=S.name}   // прежний стрелец погиб — новый здоровается заново
  if(!hidden&&t-seenAt>6e4){seenAt=t;seenSet()}
  // моргание раз в 3–6 с, стрелец ещё и косится по сторонам
  for(const id in FS){const F=FS[id];if(F.ev&&t>=F.evEnd)F.ev=null;
    if(t>=F.evNext){const r=Math.random();F.ev=id==='tsar'||r<.65?'blink':r<.825?'look_left':'look_right';F.evEnd=t+(F.ev==='blink'?150:800);
      F.evNext=t+(F.ev==='blink'&&Math.random()<.15?350:3000+Math.random()*3000)}}
  FS.strelets_face.st=mood();
  // очередь реплик: облачка нет на экране — реплика (и весь её диалог) пропадает
  if(SPK.cur&&t>=SPK.end){SPK.cur=null;SPK.gap=t+500;if(!SPK.q.length)FS.tsar.st='neutral'}
  while(!SPK.cur&&SPK.q.length&&t>=SPK.gap){const it=SPK.q.shift();if(!box(it.who)){if(it.grp)SPK.q=SPK.q.filter(x=>x.grp!==it.grp);continue}
    SPK.cur=it;SPK.end=t+2600+it.text.length*55;if(it.who==='tsar')FS.tsar.st=it.m||'neutral'}
  const sb=box('strelets'),tb=box('tsar');
  if(sb&&!hidden){const n=needs();
    if(greet){say('strelets',line(greet));if(n.length)needLine(n);greet=null;prevNeeds=n}
    else if(prevNeeds){const f=n.filter(x=>!prevNeeds.includes(x));prevNeeds=n;if(f.length&&t>needCd&&!saying()){needLine(f);needCd=t+2e4}}  // появилась новая нужда
    else prevNeeds=n;
    const idle=t-IDLE.t;   // минута без мыши и клавиш, потом ещё через 2 и 4 минуты
    if(!saying()&&IDLE.n<3&&idle>=6e4+IDLE.n*12e4){IDLE.n++;if(tb&&Math.random()<.4)talk();else if(n.length&&Math.random()<.5)needLine(n);else say('strelets',line('idle'))}}
  // над картой царь иногда заговаривает сам: через 20–40 с на карте, не чаще раза в 3 минуты
  if(tb&&!hidden){if(!TK.next)TK.next=Math.max(t+2e4+Math.random()*2e4,TK.last+18e4);if(t>=TK.next&&!saying()){talk();TK.next=0;TK.last=t}}else TK.next=0;
  faceSync()}
setInterval(faceTick,100);
// экран перерисован — сразу рисуем лица и облачка, без мигания
new MutationObserver(()=>{if(document.querySelector('canvas.face:not([data-on])')){document.querySelectorAll('canvas.face').forEach(c=>c.dataset.on=1);faceSync()}}).observe(document.getElementById('app'),{childList:true,subtree:true});
