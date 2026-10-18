# Промпты для PixelLab

Пока своих картинок нет, игра рисует нечисть временными спрайтами. Как только в папке `assets/sprites/` появится PNG с нужным именем, игра сама начнёт показывать его (достаточно перезагрузить страницу).

## Как генерировать

1. На [pixellab.ai](https://www.pixellab.ai) создай персонажа (Create character).
2. **Размер:** обычная нечисть, стрелец и Кот — **64×64**; хозяева зон (помечены ★) — **96×96**. Если 96 нет, бери 128×128, я подгоню.
3. **Вид:** сбоку (side view). Нечисть смотрит **влево**, стрелец — **вправо**.
4. **Фон:** прозрачный, формат PNG.
5. **В начало каждого промпта** добавляй общий стиль:

   ```
   dark slavic folk horror, muted earthy palette, desaturated, 1px dark outline, pixel art, game sprite, side view, full body, transparent background,
   ```

6. Сохрани файл как `assets/sprites/<id>.png`, где имя файла строго из таблицы. Потом скажи мне, и я закоммичу и выложу.

**Для бесплатной пробы:** `strelets`, `kot`, `poludnitsa`. По ним сразу видно, держится ли стиль.

## Герои

| id | Кто | Размер | Промпт |
|---|---|---|---|
| strelets | Стрелец (смотрит вправо) | 64 | russian streltsy musketeer, long red kaftan with gold buttons, tall fur-trimmed red hat, bardiche axe on back, holding matchlock musket, black boots, young tired face |
| kot | Кот Учёный | 64 | learned grey cat sitting upright, round spectacles, golden chain around neck, holding a scroll, wise smug expression, three-quarter front view |

## Поле с полуденницами

| id | Кто | Размер | Промпт |
|---|---|---|---|
| polevik | Полевик | 64 | small field spirit the size of a wheat stalk, dark earthy skin, hair of dry grass and ears of wheat, glowing eyes, mischievous |
| anchutka | Анчутка | 64 | tiny slavic imp, heelless feet, small horns, scrawny black-red body, wet and muddy, sharp grin |
| mezhevik | Межевик | 64 | field boundary spirit, gnarled old man made of soil and stones, carrying a wooden boundary stake, moss beard |
| poludnitsa | ★ Полуденница | 96 | noon wraith, tall gaunt woman in long white linen dress, loose pale hair, holding a sickle, face lost in harsh sunlight glare, eerie |

## Берёзовая опушка

| id | Кто | Размер | Промпт |
|---|---|---|---|
| auka | Аука | 64 | forest echo spirit, small pot-bellied creature of bark and leaves, hands cupped at mouth calling out, wide mocking grin |
| mavka | Мавка | 64 | mavka forest maiden, pale girl with flower wreath and long green hair, her back is hollow showing ribs, unsettling |
| lesavka | Лесавка | 64 | small spirit of fallen leaves, swirling pile of autumn leaves with two glowing eyes and twig arms |
| kikimora | ★ Кикимора | 96 | kikimora, thin hunched old woman with bird-like head and beak, tangled yarn and spindle in hands, ragged peasant clothes |

## Река и омут

| id | Кто | Размер | Промпт |
|---|---|---|---|
| rusalka | Русалка | 64 | drowned maiden rusalka, pale blue-grey skin, long wet dark hair covering face, torn white shirt, dripping water, no fish tail |
| utoplenik | Утопленник | 64 | drowned dead man, bloated grey-green corpse, waterweed tangled on body, empty white eyes, reaching forward |
| shishiga | Шишига | 64 | small hairy water creature combing long wet hair with a fish-bone comb, frog-like face |
| vodyanoy | ★ Водяной | 96 | vodyanoy water lord, fat old man with long beard of green algae, frog-like face, scaly skin, riding a giant catfish |

## Еловая чаща

| id | Кто | Размер | Промпт |
|---|---|---|---|
| volkolak | Волколак | 64 | volkolak werewolf, gaunt grey wolf-man on hind legs, remains of a torn peasant shirt, yellow eyes |
| chort | Чёрт | 64 | slavic chort devil, black fur, goat hooves, small horns, pig snout, thin tail, sly grin, holding a purse of coins |
| blud | Блуд | 64 | ghostly silhouette of a peasant made of faint green marsh light, spirit that leads travellers astray |
| leshy | ★ Леший | 96 | leshy ancient forest lord, tall humanoid of bark and moss, antler-like branches growing from head, glowing green eyes, lichen beard, long arms |

## Старая дубрава

| id | Кто | Размер | Промпт |
|---|---|---|---|
| likho | Лихо Одноглазое | 64 | likho, gaunt skeletal hag with a single huge eye in the middle of the forehead, grey rags, long bony fingers |
| div | Див | 64 | div, ominous black bird-demon with a human-like face, ragged feathers, red eyes |
| solovey | Соловей-Разбойник | 64 | nightingale the robber, wild bearded brigand in furs and bird feathers, crouching, cheeks puffed whistling, club in hand |
| yaga | ★ Баба Яга | 96 | baba yaga, ancient crone with a bone leg and long hooked nose, riding in a wooden mortar with a pestle, wild grey hair, ragged shawl |

## Курганы

| id | Кто | Размер | Промпт |
|---|---|---|---|
| upyr | Упырь | 64 | upyr, vampire corpse risen from a grave, grey skin, blood-stained burial shirt, long nails, red eyes |
| nav | Навь | 64 | restless soul of the dead, translucent grey-blue ghost in a burial shroud, hollow eyes, wisps of mist |
| igosha | Игоша | 64 | igosha, small armless and legless pale spirit floating, large dark eyes, crying, unsettling |
| viy | ★ Вий | 96 | viy, monstrous squat underground lord, enormous heavy eyelids hanging to the ground, iron-like face, covered in earth and roots |

## Горы и пещеры

| id | Кто | Размер | Промпт |
|---|---|---|---|
| poloz | Полоз | 64 | great poloz, giant golden serpent with a small crown, scales of gold ore, coiled, ancient eyes |
| ognenny | Огненный змей | 64 | flying serpent made of flames leaving sparks, glowing ember eyes |
| chud | Чудь белоглазая | 64 | chud, short ancient underground dweller, pale skin, completely white eyes, fur clothes, pickaxe and lantern |
| gorynych | ★ Змей Горыныч | 96 | zmey gorynych, three-headed green dragon breathing fire, thick scaled body, bat wings |

## Кощеево царство

| id | Кто | Размер | Промпт |
|---|---|---|---|
| kostyanoy | Костяной ратник | 64 | skeleton warrior in rusty chainmail and pointed slavic helmet, notched sword and round shield |
| mara | Мара | 64 | mara, spirit of death and nightmares, tall thin woman in black tattered robes, white face, long black hair |
| morok | Морок | 64 | morok, shapeless dark fog creature with many glowing red eyes and shadowy tendrils |
| koschei | ★ Кощей Бессмертный | 96 | koschei the deathless, skeletal old king in black armour and tall spiked crown, long white beard, green glowing eyes, holding a sword |
