'use strict';
// промпты для PixelLab (Create M-XL image / Pixflux); используются в studio.html
const ART_STYLE='dark slavic folk horror, muted earthy palette, desaturated, pixel art, game sprite, full body, single character';
const ART_NEG='blurry, text, watermark, frame, border, scenery, background, ground, cropped, multiple characters, modern clothes';
// size — холст в PixelLab, dir — куда смотрит (Direction): east — вправо, west — влево
const ART={
strelets:{size:64,dir:'east',p:'russian streltsy musketeer, long red kaftan with gold buttons, tall fur-trimmed red hat, bardiche axe on back, holding matchlock musket, black boots, young tired face'},
kot:{size:64,dir:'south',p:'learned grey cat sitting upright, round spectacles, golden chain around neck, holding a scroll, wise smug expression'},
polevik:{size:64,dir:'west',p:'small field spirit the size of a wheat stalk, dark earthy skin, hair of dry grass and ears of wheat, glowing eyes, mischievous'},
anchutka:{size:64,dir:'west',p:'tiny slavic imp, heelless feet, small horns, scrawny black-red body, wet and muddy, sharp grin'},
mezhevik:{size:64,dir:'west',p:'field boundary spirit, gnarled old man made of soil and stones, carrying a wooden boundary stake, moss beard'},
poludnitsa:{size:96,dir:'west',p:'noon wraith, tall gaunt woman in long white linen dress, loose pale hair, holding a sickle, face lost in harsh sunlight glare, eerie'},
auka:{size:64,dir:'west',p:'forest echo spirit, small pot-bellied creature of bark and leaves, hands cupped at mouth calling out, wide mocking grin'},
mavka:{size:64,dir:'west',p:'mavka forest maiden, pale girl with flower wreath and long green hair, her back is hollow showing ribs, unsettling'},
lesavka:{size:64,dir:'west',p:'small spirit of fallen leaves, swirling pile of autumn leaves with two glowing eyes and twig arms'},
kikimora:{size:96,dir:'west',p:'kikimora, thin hunched old woman with bird-like head and beak, tangled yarn and spindle in hands, ragged peasant clothes'},
rusalka:{size:64,dir:'west',p:'drowned maiden rusalka, pale blue-grey skin, long wet dark hair covering face, torn white shirt, dripping water, no fish tail'},
utoplenik:{size:64,dir:'west',p:'drowned dead man, bloated grey-green corpse, waterweed tangled on body, empty white eyes, reaching forward'},
shishiga:{size:64,dir:'west',p:'small hairy water creature combing long wet hair with a fish-bone comb, frog-like face'},
vodyanoy:{size:96,dir:'west',p:'vodyanoy water lord, fat old man with long beard of green algae, frog-like face, scaly skin, riding a giant catfish'},
volkolak:{size:64,dir:'west',p:'volkolak werewolf, gaunt grey wolf-man on hind legs, remains of a torn peasant shirt, yellow eyes'},
chort:{size:64,dir:'west',p:'slavic chort devil, black fur, goat hooves, small horns, pig snout, thin tail, sly grin, holding a purse of coins'},
blud:{size:64,dir:'west',p:'ghostly silhouette of a peasant made of faint green marsh light, spirit that leads travellers astray'},
leshy:{size:96,dir:'west',p:'leshy ancient forest lord, tall humanoid of bark and moss, antler-like branches growing from head, glowing green eyes, lichen beard, long arms'},
likho:{size:64,dir:'west',p:'likho, gaunt skeletal hag with a single huge eye in the middle of the forehead, grey rags, long bony fingers'},
div:{size:64,dir:'west',p:'div, ominous black bird-demon with a human-like face, ragged feathers, red eyes'},
solovey:{size:64,dir:'west',p:'nightingale the robber, wild bearded brigand in furs and bird feathers, crouching, cheeks puffed whistling, club in hand'},
yaga:{size:96,dir:'west',p:'baba yaga, ancient crone with a bone leg and long hooked nose, riding in a wooden mortar with a pestle, wild grey hair, ragged shawl'},
upyr:{size:64,dir:'west',p:'upyr, vampire corpse risen from a grave, grey skin, blood-stained burial shirt, long nails, red eyes'},
nav:{size:64,dir:'west',p:'restless soul of the dead, translucent grey-blue ghost in a burial shroud, hollow eyes, wisps of mist'},
igosha:{size:64,dir:'west',p:'igosha, small armless and legless pale spirit floating, large dark eyes, crying, unsettling'},
viy:{size:96,dir:'west',p:'viy, monstrous squat underground lord, enormous heavy eyelids hanging to the ground, iron-like face, covered in earth and roots'},
poloz:{size:64,dir:'west',p:'great poloz, giant golden serpent with a small crown, scales of gold ore, coiled, ancient eyes'},
ognenny:{size:64,dir:'west',p:'flying serpent made of flames leaving sparks, glowing ember eyes'},
chud:{size:64,dir:'west',p:'chud, short ancient underground dweller, pale skin, completely white eyes, fur clothes, pickaxe and lantern'},
gorynych:{size:96,dir:'west',p:'zmey gorynych, three-headed green dragon breathing fire, thick scaled body, bat wings'},
kostyanoy:{size:64,dir:'west',p:'skeleton warrior in rusty chainmail and pointed slavic helmet, notched sword and round shield'},
mara:{size:64,dir:'west',p:'mara, spirit of death and nightmares, tall thin woman in black tattered robes, white face, long black hair'},
morok:{size:64,dir:'west',p:'morok, shapeless dark fog creature with many glowing red eyes and shadowy tendrils'},
koschei:{size:96,dir:'west',p:'koschei the deathless, skeletal old king in black armour and tall spiked crown, long white beard, green glowing eyes, holding a sword'},
};
// известные изображения в общественном достоянии — можно класть в Reference images
const ART_REF={
strelets:['гравюры и рисунки стрельцов XVII века','Streltsy'],
yaga:['Иван Билибин, «Баба-Яга» (иллюстрация к «Василисе Прекрасной», 1900)','Bilibin Baba Yaga'],
koschei:['Виктор Васнецов, «Кощей Бессмертный» (1917–1926)','Vasnetsov Koschei'],
gorynych:['Виктор Васнецов, «Бой Добрыни Никитича с семиглавым Змеем Горынычем» (1913–1918)','Vasnetsov Dobrynya Zmey'],
rusalka:['Иван Крамской, «Русалки» (1871)','Kramskoi Mermaids'],
};
// анимации (PixelLab → Animate with text (New)): idle — покой по кругу, attack — удар
const ANIM_ACT={idle:'idle, breathing, subtle sway',attack:'attack, lunging forward',spawn:'emerging, rising up from the ground'};
const ANIM_FOR={ // свои действия для части существ; kot без атаки
strelets:{idle:'idle, breathing, holding musket',attack:'aiming and firing musket, smoke puff from barrel',spawn:null},
kot:{idle:'idle, tail swaying, adjusting spectacles',attack:null,spawn:null},
poludnitsa:{idle:'floating idle, dress and hair drifting in hot wind',attack:'swinging sickle',spawn:'materializing out of shimmering heat haze'},
mavka:{idle:'floating idle, hair drifting',spawn:'materializing out of thin air'},rusalka:{idle:'idle, wet hair swaying',spawn:'rising out of dark water'},blud:{idle:'flickering ghostly idle',spawn:'flaring up out of the darkness'},nav:{idle:'floating idle, wisps drifting',spawn:'materializing out of mist'},
mara:{idle:'floating idle, robes drifting',spawn:'materializing out of shadows'},morok:{idle:'swirling fog idle',spawn:'condensing out of fog'},igosha:{idle:'floating idle, bobbing',spawn:'materializing out of thin air'},
volkolak:{attack:'claw swipe'},chort:{attack:'jumping kick with hooves'},leshy:{attack:'sweeping strike with branch arms'},
vodyanoy:{attack:'slam, splashing water',spawn:'rising out of the water'},yaga:{attack:'swinging pestle from the mortar'},viy:{attack:'eyelids lift, deadly gaze'},
gorynych:{attack:'breathing fire'},koschei:{attack:'sword slash',spawn:'stepping out of darkness'},kostyanoy:{attack:'sword slash'},solovey:{attack:'deafening whistle, shockwave'},
};
const animAct=(id,kind)=>{const o=ANIM_FOR[id];return o&&kind in o?o[kind]:ANIM_ACT[kind]};

// ---------- кремль: PixelLab → Create image Pro (стиль — poludnitsa.png, палитра — palette.png; церковь и палаты — палитра + синие и белые) ----------
// земля — Create tiles Pro: isometric, tile size 40, view angle 30°, depth 0. Основа сохраняется в assets/buildings/<id>.png
const KREM_PRE='isometric game building, 2:1 dimetric view from above at 30 degrees, one corner pointing towards the viewer';
const KREM_SUF='dark slavic folk horror, muted earthy colors, pixel art, transparent background, no ground, no people';
const KREM={
palaty:{size:128,p:'Tsar\'s stone palace (tsarskie palaty) of 17th century Russia: two-storey whitewashed stone chambers with small arched windows in carved stone frames, steep hipped roof of dark scaled shingles, a tall covered external staircase porch (krasnoe kryltso) with a tent roof at the front'},
tserkov:{size:128,p:'white stone Russian Orthodox church in the style of Suzdal: white limestone walls with blind arcades and narrow slit windows, onion domes painted deep blue and covered with small golden stars, golden crosses on top'},
izba:{size:85,p:'old russian log izba used as a reading house: dark weathered horizontal logs, carved wooden window frames (nalichniki), steep wooden shingle roof, small porch with steps, a wooden sign with an open book over the door'},
kapishche:{size:64,p:'pagan slavic shrine (kapishche): a tall carved wooden idol of Perun with a stern bearded face in the center, a ring of grey standing stones around it, a small fire burning at the idol\'s feet'},
kuznica:{size:85,p:'old russian village blacksmith forge (kuznitsa): low dark log workshop with an open front, glowing orange furnace inside, stone chimney with smoke, anvil and a water barrel outside'},
torg:{size:85,p:'small old russian market (torg): two or three wooden trading stalls with plank counters and shingle or canvas awnings, barrels, sacks of grain, clay jugs, rolls of cloth'},
znaharka:{size:64,p:'herbalist witch-healer hut: small crooked log hut with a sagging mossy thatched roof, bundles of dried herbs hanging under the eaves, an animal skull on a fence post, faint green glow from a tiny window'},
banya:{size:64,p:'small russian bathhouse (banya): tiny dark log cabin with a low turf-covered roof, a small smoking stone chimney, a woodpile and a wooden bucket beside the low door'},
korchma:{size:85,p:'russian tavern (korchma): large two-storey dark log house with a wide covered porch, a hanging wooden sign with a jug, warm orange light in small windows, barrels by the entrance'},
wall:{n:'Прясло — вид изнутри',size:64,note:'Стоит на двух задних сторонах кремля: видно внутреннюю сторону с распорками и боевым ходом. Наклон «/» или «\\» игра определит и отразит сама.',
  p:'straight segment of a wooden russian kremlin fortress wall seen from INSIDE the fortress: rough-hewn dark horizontal logs (gorodni), a narrow roofed fighting walkway on top covered with wooden shingles, wooden struts supporting the walkway; the segment runs diagonally from the bottom-left up to the top-right, both ends cut straight'},
wall_out:{n:'Прясло — вид снаружи',size:64,note:'Стоит на двух передних сторонах кремля: глухая стена с бойницами, без распорок. Наклон игра определит и отразит сама.',
  p:'straight segment of a wooden russian kremlin fortress wall seen from OUTSIDE the fortress: a solid tall blank wall of rough-hewn dark horizontal logs (gorodni) with a row of small dark loopholes near the top, the roofed fighting walkway is on the far side so only the edge of its wooden shingle roof shows along the top; no struts, no supports, no ladders; the segment runs diagonally from the bottom-left up to the top-right, both ends cut straight'},
tower_corner:{n:'Угловая башня',size:85,p:'corner tower of a wooden russian kremlin: tall square tower of dark horizontal logs, the upper fighting gallery wider with an overhang and loopholes, steep pyramidal tent roof of wooden shingles with a small watch turret and a dark flag'},
tower_small:{n:'Малая башня',size:64,p:'small wall tower of a wooden russian kremlin: square tower of dark horizontal logs only a little taller than the wall, overhanging upper fighting gallery with loopholes, low four-sided shingle roof'},
tower_gate:{n:'Проезжая башня',size:85,note:'Проезд нужен на левой грани: так ворота смотрят наружу вдоль дороги. На сторонах «/» игра отразит башню сама.',
  p:'gate tower of a wooden russian kremlin: massive square tower of dark horizontal logs, a big arched gateway passage through its lower part on the LEFT face with heavy open plank doors, a small icon above the gate, tall tent roof of wooden shingles'},
g_kreml:{n:'Земля в кремле',tile:1,p:'trodden dark earth with sparse dry grass and small stones'},
g_most:{n:'Мостовая',tile:1,note:'Улицы от ворот и площадь в центре кремля.',p:'old wooden pavement made of half logs laid side by side'},
g_road:{n:'Дорога',tile:1,note:'Дороги из ворот и тропы в зоны.',p:'muddy dirt road with wheel ruts'},
g_posad:{n:'Посад',tile:1,note:'Полоса вокруг стен.',p:'dark trampled meadow grass with dirt patches'},
};
const kremText=id=>{const k=KREM[id];return k.tile?`1). ${k.p}. Dark slavic folk horror, muted earthy colors, pixel art`:`${KREM_PRE}. ${k.p}. ${KREM_SUF}`};
