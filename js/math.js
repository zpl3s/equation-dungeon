'use strict';
// ---------- утилиты ----------
const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const nz=(a,b)=>{let v;do v=R(a,b);while(!v);return v};
const co=m=>{let v;do v=R(-m,m);while(Math.abs(v)<2);return v};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const lcm=(a,b)=>a/gcd(a,b)*b;
const M=n=>n<0?'−'+(-n):''+n;
const P=n=>n<0?'('+M(n)+')':''+n;
const term=(a,v)=>a===1?v:a===-1?'−'+v:M(a)+v;
function lx(ts){let s='';for(const[c,v]of ts){if(!c)continue;const a=Math.abs(c),t=v?(a===1?v:a+v):''+a;s+=s?(c<0?' − ':' + ')+t:(c<0?'−':'')+t}return s||'0'}
const xb=b=>lx([[1,'x'],[b,'']]);
const br=(a,inner)=>(a===-1?'−':M(a))+'('+inner+')';
const pm=b=>(b<0?' + ':' − ')+Math.abs(b); // перенос слагаемого b через «=»
const dedup=s=>s.filter((v,i)=>v!==s[i-1]);

// шаги для «ax + b = cx + d» до ответа
function linSteps(a,b,c,d,x){const k=a-c,r=d-b,s=[`${lx([[a,'x'],[-c,'x']])} = ${lx([[d,''],[-b,'']])}`,`${term(k,'x')} = ${M(r)}`];
  if(k!==1)s.push(`x = ${M(r)} : ${P(k)}`);s.push(`x = ${M(x)}`);return dedup(s)}
// шаги для «x² + bx + c = 0» с корнями r, s
function quadSteps(b,c,r,s){if(c===0)return[`x(${xb(b)}) = 0`,`x = 0 или ${xb(b)} = 0`,`x = 0 или x = ${M(-b)}`];
  const D=b*b-4*c,q=Math.abs(r-s);return[`D = ${P(b)}² − 4·${P(c)} = ${D}`,`√D = ${q}`,`x = (${M(-b)} ± ${q}) / 2`,`x = ${M(Math.max(r,s))} или x = ${M(Math.min(r,s))}`]}

// ---------- темы ----------
// d — сложность (множитель урона), par — норма времени в секундах (решение на бумаге)
// gen() → {q: уравнение, a: ответ, h: подсказка-первый шаг, s: шаги решения}
const T=[
{id:'lin1',name:'Простые линейные',d:1,par:25,fmt:'num',gen(){
  const x=R(-9,15),k=R(0,3);
  if(k===0){const a=R(1,20);return{q:`x + ${a} = ${M(x+a)}`,a:x,h:`Вычти ${a} из обеих частей`,s:[`x = ${M(x+a)} − ${a}`,`x = ${M(x)}`]}}
  if(k===1){const a=R(1,20);return{q:`x − ${a} = ${M(x-a)}`,a:x,h:`Прибавь ${a} к обеим частям`,s:[`x = ${M(x-a)} + ${a}`,`x = ${M(x)}`]}}
  if(k===2){const a=co(9);return{q:`${term(a,'x')} = ${M(a*x)}`,a:x,h:`Раздели обе части на ${M(a)}`,s:[`x = ${M(a*x)} : ${P(a)}`,`x = ${M(x)}`]}}
  const a=R(2,9);return{q:`x/${a} = ${M(x)}`,a:x*a,h:`Умножь обе части на ${a}`,s:[`x = ${M(x)} · ${a}`,`x = ${M(x*a)}`]}}},
{id:'lin2',name:'Линейные в два шага',d:2,par:40,fmt:'num',gen(){
  const x=R(-10,10),a=Math.random()<.7?R(2,9):co(9),b=nz(-20,20),c=a*x+b;
  const L=Math.random()<.7?lx([[a,'x'],[b,'']]):lx([[b,''],[a,'x']]);
  return{q:`${L} = ${M(c)}`,a:x,h:`Перенеси ${M(b)} вправо: ${term(a,'x')} = ${M(c-b)}`,s:linSteps(a,b,0,c,x)}}},
{id:'both',name:'Иксы с обеих сторон',d:3,par:55,fmt:'num',gen(){
  const x=R(-10,10);let a,c;do{a=nz(-9,9);c=nz(-9,9)}while(a===c);const b=nz(-20,20),d=a*x+b-c*x;
  return{q:`${lx([[a,'x'],[b,'']])} = ${lx([[c,'x'],[d,'']])}`,a:x,h:`Иксы влево, числа вправо: ${term(a-c,'x')} = ${M(d-b)}`,s:linSteps(a,b,c,d,x)}}},
{id:'brack',name:'Скобки',d:4,par:70,fmt:'num',gen(){
  const k=R(0,2);
  if(k===0){const x=R(-9,9),a=co(7),b=nz(-9,9);return{q:`${br(a,xb(b))} = ${M(a*(x+b))}`,a:x,h:`Раздели обе части на ${M(a)}: ${xb(b)} = ${M(x+b)}`,
    s:[`${xb(b)} = ${M(a*(x+b))} : ${P(a)}`,`${xb(b)} = ${M(x+b)}`,`x = ${M(x+b)}${pm(b)}`,`x = ${M(x)}`]}}
  if(k===1){const x=R(-9,9),a=co(7),b=nz(-9,9);let c;do c=nz(-6,6);while(c===a);const d=a*(x+b)-c*x,E=`${lx([[a,'x'],[a*b,'']])} = ${lx([[c,'x'],[d,'']])}`;
    return{q:`${br(a,xb(b))} = ${lx([[c,'x'],[d,'']])}`,a:x,h:`Раскрой скобки: ${E}`,s:[E,...linSteps(a,a*b,c,d,x)]}}
  for(;;){const x=R(-9,9),a=co(6),c=co(6),b=nz(-9,9);if(a===c)continue;const t=a*(x+b)-c*x;if(t%c)continue;const d=t/c;if(!d)continue;
    const E=`${lx([[a,'x'],[a*b,'']])} = ${lx([[c,'x'],[c*d,'']])}`;
    return{q:`${br(a,xb(b))} = ${br(c,xb(d))}`,a:x,h:`Раскрой обе скобки: ${E}`,s:[E,...linSteps(a,a*b,c,c*d,x)]}}}},
{id:'frac',name:'Дроби',d:4,par:70,fmt:'num',gen(){
  const k=R(0,2);
  if(k===0){const b=R(2,9),c=nz(-9,9),a=nz(-9,9);return{q:`(${xb(a)})/${b} = ${M(c)}`,a:b*c-a,h:`Умножь обе части на ${b}: ${xb(a)} = ${M(b*c)}`,
    s:[`${xb(a)} = ${M(c)} · ${b}`,`${xb(a)} = ${M(b*c)}`,`x = ${M(b*c)}${pm(a)}`,`x = ${M(b*c-a)}`]}}
  if(k===1){let a,b;do{a=R(2,6);b=R(2,6)}while(a===b);const L=lcm(a,b),x=L*nz(-4,4),c=x/a+x/b,m=L/a+L/b;
    return{q:`x/${a} + x/${b} = ${M(c)}`,a:x,h:`Умножь всё на ${L}: ${term(L/a,'x')} + ${term(L/b,'x')} = ${M(c*L)}`,
      s:[`Умножаем всё на ${L}: ${term(L/a,'x')} + ${term(L/b,'x')} = ${M(c*L)}`,`${term(m,'x')} = ${M(c*L)}`,`x = ${M(c*L)} : ${m}`,`x = ${M(x)}`]}}
  for(;;){const b=R(2,6),d=R(2,6);if(b===d)continue;const x=R(-9,9),a=nz(-9,9),t=d*(x+a);if(t%b)continue;const c=t/b-x;if(!c)continue;
    return{q:`(${xb(a)})/${b} = (${xb(c)})/${d}`,a:x,h:`Крест-накрест: ${d}(${xb(a)}) = ${b}(${xb(c)})`,
      s:[`${d}(${xb(a)}) = ${b}(${xb(c)})`,`${lx([[d,'x'],[d*a,'']])} = ${lx([[b,'x'],[b*c,'']])}`,...linSteps(d,d*a,b,b*c,x)]}}}},
{id:'ineq',name:'Неравенства',d:4,par:60,fmt:'ineq',gen(){
  const x0=R(-9,9),op=pick(['<','>','≤','≥']),F={'<':'>','>':'<','≤':'≥','≥':'≤'};
  if(Math.random()<.6){const a=Math.random()<.5?-R(1,6):R(2,6),b=nz(-15,15),c=a*x0+b,rop=a<0?F[op]:op;
    const s=[`${term(a,'x')} ${op} ${M(c)}${pm(b)}`,`${term(a,'x')} ${op} ${M(c-b)}`];
    if(a<0)s.push(`Делим на ${M(a)} — знак переворачивается: x ${rop} ${M(c-b)} : ${P(a)}`);else if(a!==1)s.push(`x ${op} ${M(c-b)} : ${a}`);
    s.push(`x ${rop} ${M(x0)}`);
    return{q:`${lx([[a,'x'],[b,'']])} ${op} ${M(c)}`,a:{op:rop,v:x0},h:a<0?`Перенеси ${M(b)} и раздели на ${M(a)} — знак перевернётся!`:`Перенеси ${M(b)} вправо и раздели на ${a}`,s}}
  let a,c;do{a=nz(-6,6);c=nz(-6,6)}while(a===c);const b=nz(-12,12),k=a-c,d=k*x0+b,rop=k<0?F[op]:op;
  const s=[`${lx([[a,'x'],[-c,'x']])} ${op} ${lx([[d,''],[-b,'']])}`,`${term(k,'x')} ${op} ${M(d-b)}`];
  if(k<0)s.push(`Делим на ${M(k)} — знак переворачивается`);else if(k!==1)s.push(`Делим на ${k}`);s.push(`x ${rop} ${M(x0)}`);
  return{q:`${lx([[a,'x'],[b,'']])} ${op} ${lx([[c,'x'],[d,'']])}`,a:{op:rop,v:x0},h:`Иксы влево, числа вправо: ${term(k,'x')} ${op} ${M(d-b)}`+(k<0?' — при делении на минус знак перевернётся!':''),s}}},
{id:'quad',name:'Квадратные',d:5,par:90,fmt:'set',gen(){
  let r,s;do{r=R(-9,9);s=R(-9,9)}while(r===s||Math.abs(r*s)>60);const b=-(r+s),c=r*s;
  return{q:`${lx([[1,'x²'],[b,'x'],[c,'']])} = 0`,a:[r,s],h:c===0?'Вынеси x за скобку':`Подбери два числа: произведение ${M(c)}, сумма ${M(-b)}. Или через D = b² − 4ac`,s:quadSteps(b,c,r,s)}}},
{id:'abs',name:'Модули',d:5,par:75,fmt:'set',gen(){
  if(Math.random()<.6){const p=nz(-9,9),c=R(1,9),k=Math.random()<.3?R(1,9):0,E=xb(-p);
    return{q:`|${E}|${k?' + '+k:''} = ${c+k}`,a:[p-c,p+c],h:(k?`Перенеси ${k}: |${E}| = ${c}. `:'')+`Два случая: ${E} = ${c} или ${E} = −${c}`,
      s:[...(k?[`|${E}| = ${c+k} − ${k} = ${c}`]:[]),`${E} = ${c} или ${E} = −${c}`,`x = ${M(p+c)} или x = ${M(p-c)}`]}}
  const a=R(2,3);let x1,dd;do{x1=R(-6,8);dd=R(1,6)}while(a*dd%2);const c=a*dd/2,b=c-a*x1,E=lx([[a,'x'],[b,'']]);
  return{q:`|${E}| = ${c}`,a:[x1,x1-dd],h:`Два случая: ${E} = ${c} или ${E} = −${c}`,
    s:[`${E} = ${c} или ${E} = −${c}`,`${term(a,'x')} = ${M(c-b)} или ${term(a,'x')} = ${M(-c-b)}`,`x = ${M(x1)} или x = ${M(x1-dd)}`]}}},
{id:'sys',name:'Системы',d:6,par:120,fmt:'pair',gen(){
  const x=R(-8,8),y=R(-8,8);
  if(Math.random()<.35){let a,b;do{a=co(5);b=nz(-5,5)}while(a+b===0);const k=y-x,C=a*x+b*y,ab=Math.abs(b);
    return{q:[`y = ${xb(k)}`,`${lx([[a,'x'],[b,'y']])} = ${M(C)}`],a:[x,y],h:'Подставь y из первого уравнения во второе',
      s:dedup([`${term(a,'x')} ${b<0?'−':'+'} ${ab===1?'':ab}(${xb(k)}) = ${M(C)}`,`${lx([[a+b,'x'],[b*k,'']])} = ${M(C)}`,`${term(a+b,'x')} = ${M(C-b*k)}`,`x = ${M(x)}`,`y = ${xb(k).replace('x',P(x))} = ${M(y)}`])}}
  let a,b,c,d;do{a=nz(-5,5);b=nz(-5,5);c=nz(-5,5);d=nz(-5,5)}while(a*d-b*c===0);const c1=a*x+b*y,c2=c*x+d*y;
  return{q:[`${lx([[a,'x'],[b,'y']])} = ${M(c1)}`,`${lx([[c,'x'],[d,'y']])} = ${M(c2)}`],a:[x,y],h:'Домножь уравнения так, чтобы коэффициенты при y стали противоположными, и сложи их',
    s:dedup([`Умножим первое на ${P(d)}, второе на ${P(b)} и вычтем:`,`${term(a*d-b*c,'x')} = ${M(c1*d-c2*b)}`,`x = ${M(x)}`,`Подставим в первое: ${P(b)}·y = ${M(c1)} − ${P(a)}·${P(x)} = ${M(c1-a*x)}`,`y = ${M(y)}`])}}},
{id:'quad2',name:'Квадратные+',d:6,par:120,fmt:'set',gen(){
  let r,s;do{r=R(-7,7);s=R(-7,7)}while(r===s);const k=R(0,2);
  if(k===0){const a=pick([2,3,-1,-2]),E=lx([[1,'x²'],[-(r+s),'x'],[r*s,'']]);
    return{q:`${lx([[a,'x²'],[-a*(r+s),'x'],[a*r*s,'']])} = 0`,a:[r,s],h:`Раздели обе части на ${M(a)}`,s:[`Делим на ${M(a)}: ${E} = 0`,...quadSteps(-(r+s),r*s,r,s)]}}
  if(k===1){const p=-(r+s),q=-r*s;if(!p)return{q:`x² = ${M(q)}`,a:[r,s],h:'Извлеки корень из обеих частей',s:[`x = ±√${q}`,`x = ${Math.abs(r)} или x = ${M(-Math.abs(r))}`]};
    return{q:`x(${xb(p)}) = ${M(q)}`,a:[r,s],h:`Раскрой скобку и перенеси всё влево: ${lx([[1,'x²'],[p,'x'],[-q,'']])} = 0`,
      s:[`${lx([[1,'x²'],[p,'x']])} = ${M(q)}`,`${lx([[1,'x²'],[p,'x'],[-q,'']])} = 0`,...quadSteps(p,-q,r,s)]}}
  const p=nz(-7,7),q=R(1,8);return{q:`(${xb(p)})² = ${q*q}`,a:[-p-q,-p+q],h:`Извлеки корень: ${xb(p)} = ±${q}`,
    s:[`${xb(p)} = ${q} или ${xb(p)} = −${q}`,`x = ${M(-p+q)} или x = ${M(-p-q)}`]}}},
];
const TI=Object.fromEntries(T.map((t,i)=>[t.id,i]));
const FH={num:'Ответ — число: 7, -3 или 3/4',set:'Два корня через запятую: 2, -5',pair:'x и y через запятую: 3, -1',ineq:'Например: x > 3 или x <= -2'};

// ---------- проверка ответа ----------
const same=(p,q)=>Math.abs(p-q)<1e-9;
function num(t){const m=t.match(/^(-?\d+(?:\.\d+)?)(?:\/(-?\d+(?:\.\d+)?))?$/);if(!m)return NaN;return m[2]!==undefined?+m[1]/+m[2]:+m[1]}
function check(e,inp){
  let s=inp.toLowerCase().replace(/[−–—]/g,'-').replace(/≤/g,'<=').replace(/≥/g,'>=');
  if(e.fmt==='ineq'){
    s=s.replace(/\s+/g,'').replace(/^x/,'').replace('=>','>=').replace('=<','<=');
    const m=s.match(/^(<=|>=|<|>)(.+)$/);if(!m)return{err:'Формат: x > 3 или x <= -2'};
    const v=num(m[2]);if(isNaN(v))return{err:'Не понял число после знака'};
    const op={'<=':'≤','>=':'≥'}[m[1]]||m[1];return{ok:op===e.a.op&&same(v,e.a.v)}}
  s=s.replace(/[a-zа-я]\s*[₁₂12]?\s*=/g,' ').replace(/-\s+/g,'-');
  const p=s.split(/[,;\s]+/).filter(Boolean).map(num),n=e.fmt==='num'?1:2;
  if(p.some(isNaN))return{err:'Не понял ответ. Пример: '+(n===1?'-3 или 3/4':'2, -5')};
  if(p.length!==n)return{err:n===1?'Нужно одно число':e.fmt==='pair'?'Нужно два числа: x, y':'Нужно два корня через запятую'};
  if(n===1)return{ok:same(p[0],e.a)};
  if(e.fmt==='pair')return{ok:same(p[0],e.a[0])&&same(p[1],e.a[1])};
  const A=[...e.a].sort((a,b)=>a-b),B=p.sort((a,b)=>a-b);return{ok:same(A[0],B[0])&&same(A[1],B[1])}}
function fa(e){const a=e.a;if(e.fmt==='num')return'x = '+M(a);if(e.fmt==='pair')return`x = ${M(a[0])}, y = ${M(a[1])}`;if(e.fmt==='ineq')return`x ${a.op} ${M(a.v)}`;return`x = ${M(a[0])} или x = ${M(a[1])}`}
const eqHTML=q=>Array.isArray(q)?`<span class="sys"><span class="brace">{</span><span>${q.join('<br>')}</span></span>`:q;
