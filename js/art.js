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
const ANIM_ACT={idle:'idle, breathing, subtle sway',attack:'attack, lunging forward'};
const ANIM_FOR={ // свои действия для части существ; kot без атаки
strelets:{idle:'idle, breathing, holding musket',attack:'aiming and firing musket, smoke puff from barrel'},
kot:{idle:'idle, tail swaying, adjusting spectacles',attack:null},
poludnitsa:{idle:'floating idle, dress and hair drifting in hot wind',attack:'swinging sickle'},
mavka:{idle:'floating idle, hair drifting'},rusalka:{idle:'idle, wet hair swaying'},blud:{idle:'flickering ghostly idle'},nav:{idle:'floating idle, wisps drifting'},
mara:{idle:'floating idle, robes drifting'},morok:{idle:'swirling fog idle'},igosha:{idle:'floating idle, bobbing'},
volkolak:{attack:'claw swipe'},chort:{attack:'jumping kick with hooves'},leshy:{attack:'sweeping strike with branch arms'},
vodyanoy:{attack:'slam, splashing water'},yaga:{attack:'swinging pestle from the mortar'},viy:{attack:'eyelids lift, deadly gaze'},
gorynych:{attack:'breathing fire'},koschei:{attack:'sword slash'},kostyanoy:{attack:'sword slash'},solovey:{attack:'deafening whistle, shockwave'},
};
const animAct=(id,kind)=>{const o=ANIM_FOR[id];return o&&kind in o?o[kind]:ANIM_ACT[kind]};
