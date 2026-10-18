"""Собирает атлас окружения из скачанных CC0-паков.

Источники (в репозиторий не входят, лежат в папке SRC):
  isometric_trees_pack.zip (rubberduck) -> trees/
  wooden_buildings_01.png (rubberduck)
  sbs_-_isometric_overworld_pack_-_small.zip (Screaming Brain Studios) -> sbs/
  watchtower_wooden_full_size.png (feudalwars)

Запуск: python3 tools/build_assets.py /путь/к/SRC
Результат: assets/env/atlas.png и assets/env/atlas.js
"""
import sys, os, json
from PIL import Image, ImageEnhance, ImageDraw

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'env')
TW, TH = 40, 20  # размер изометрического тайла в игре

def grade(im):
    """Мрачная фолк-гамма: приглушить цвет, чуть темнее и контрастнее."""
    rgb = im.convert('RGB')
    rgb = ImageEnhance.Color(rgb).enhance(0.78)
    rgb = ImageEnhance.Brightness(rgb).enhance(0.88)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.12)
    out = rgb.convert('RGBA'); out.putalpha(im.getchannel('A')); return out

def tint(im, mul):
    r, g, b, a = im.split()
    r = r.point(lambda v: int(v * mul[0])); g = g.point(lambda v: int(v * mul[1])); b = b.point(lambda v: int(v * mul[2]))
    return Image.merge('RGBA', (r, g, b, a))

sprites = {}  # name -> (RGBA image, anchor x, anchor y)

# ---------- тайлы земли ----------
SBS = os.path.join(SRC, 'sbs', 'Overworld - Small', 'Flat')
sheets = {k: Image.open(os.path.join(SBS, f'Overworld - {v} - Flat 128x64.png')).convert('RGB')
          for k, v in {'F': 'Forest', 'T1': 'Terrain 1', 'T2': 'Terrain 2', 'T3': 'Terrain 3', 'W': 'Water'}.items()}
mask = Image.new('L', (128, 64), 0)
ImageDraw.Draw(mask).polygon([(64, 0), (127, 32), (64, 63), (0, 32)], fill=255)
TILES = {
    'field': [('T1', 0), ('T1', 1), ('T1', 2)],
    'opushka': [('F', 9), ('F', 10), ('F', 11)],
    'shore': [('F', 3), ('F', 4)],
    'water': [('W', 13), ('W', 16)],
    'chascha': [('F', 6), ('F', 7), ('F', 16)],
    'dubrava': [('F', 0), ('F', 1), ('F', 2)],
    'kurgany': [('T1', 16), ('T1', 17), ('T1', 11)],
    'gory': [('T3', 3), ('T3', 4), ('T3', 13)],
    'koschei': [('W', 8), ('W', 11), ('T3', 12)],
    'kremlin': [('T1', 6), ('T1', 7)],
    'posad': [('T1', 3), ('T1', 4), ('T1', 5)],
    'road': [('T2', 9), ('T2', 10)],
}
for name, lst in TILES.items():
    for k, (sh, n) in enumerate(lst):
        cell = sheets[sh].crop(((n % 3) * 128, (n // 3) * 64, (n % 3) * 128 + 128, (n // 3) * 64 + 64)).convert('RGBA')
        cell.putalpha(mask)
        t = grade(cell.resize((TW, TH), Image.LANCZOS))
        if name == 'koschei': t = tint(t, (0.75, 0.5, 0.55))
        if name in ('road', 'posad', 'kremlin'): t = tint(t, (0.72, 0.66, 0.6))
        if name == 'field': t = tint(t, (0.86, 0.76, 0.5))
        sprites[f't_{name}_{k}'] = (t, 0, 0)

# ---------- деревья (70-75 под CC-BY-SA, их не берём) ----------
TREES = {'birch': ([12, 13, 14], 52), 'spruce': ([21, 22, 24, 26, 27, 29], 58), 'oak': ([76, 77, 79, 81, 83, 84], 54),
         'autumn': ([3, 6, 9], 52), 'dead': ([47, 49, 52, 55, 58, 61, 64, 67], 48), 'bush': ([15, 16, 18, 30, 33, 36], 22)}
TD = os.path.join(SRC, 'trees', 'single')
for kind, (ids, hgt) in TREES.items():
    for k, n in enumerate(ids):
        sh = Image.open(os.path.join(TD, 'trees_128x64_shaded', f'trees_128x64_shaded-{n}.png')).convert('RGBA')
        ns = Image.open(os.path.join(TD, 'trees_128x64_no_shadow', f'trees_128x64_no_shadow-{n}.png')).convert('RGBA')
        nb = ns.getbbox(); bb = sh.getbbox()
        base_y = nb[3]; a = ns.getchannel('A').load()
        xs = [x for y in range(base_y - 4, base_y) for x in range(nb[0], nb[2]) if a[x, y] > 128] or [(nb[0] + nb[2]) // 2]
        base_x = sum(xs) / len(xs)
        sc = hgt / (nb[3] - nb[1])
        crop = sh.crop(bb)
        im = grade(crop.resize((max(1, round(crop.width * sc)), max(1, round(crop.height * sc))), Image.LANCZOS))
        sprites[f'{kind}_{k}'] = (im, round((base_x - bb[0]) * sc), round((base_y - bb[1]) * sc))

# ---------- избы и башня ----------
B = Image.open(os.path.join(SRC, 'wooden_buildings_01.png')).convert('RGBA')
HOUSES = {'shed_a': (0, 0, 56), 'shed_b': (0, 3, 56), 'thatch_a': (1, 0, 76), 'thatch_b': (1, 2, 76),
          'porch_a': (2, 1, 76), 'porch_b': (2, 3, 76), 'big_a': (3, 0, 92), 'big_b': (3, 2, 92)}
for name, (r, c, w) in HOUSES.items():
    cell = B.crop((c * 768, r * 768, c * 768 + 768, r * 768 + 768)); bb = cell.getbbox(); cell = cell.crop(bb)
    sc = w / cell.width
    im = grade(cell.resize((w, round(cell.height * sc)), Image.LANCZOS))
    sprites[name] = (im, im.width // 2, im.height - round(im.height * 0.18))
T = Image.open(os.path.join(SRC, 'watchtower_wooden_full_size.png')).convert('RGBA'); T = T.crop(T.getbbox())
sc = 76 / T.height; im = grade(T.resize((round(T.width * sc), 76), Image.LANCZOS))
sprites['tower'] = (im, round(im.width * 0.62), im.height - 8)

# ---------- общая палитра и жёсткие края ----------
allw = sum(s[0].width for s in sprites.values()); maxh = max(s[0].height for s in sprites.values())
combo = Image.new('RGB', (allw, maxh)); x = 0
for im, _, _ in sprites.values(): combo.paste(im.convert('RGB'), (x, 0), im); x += im.width
pal = combo.quantize(colors=64, method=Image.Quantize.MEDIANCUT)
def pixelize(im):
    q = im.convert('RGB').quantize(palette=pal, dither=Image.Dither.NONE).convert('RGBA')
    q.putalpha(im.getchannel('A').point(lambda v: 255 if v > 200 else (110 if v > 60 else 0)))
    return q

# ---------- упаковка в атлас ----------
items = sorted(sprites.items(), key=lambda kv: -kv[1][0].height)
AW = 1024; x = y = row_h = 0; place = {}
for name, (im, ax, ay) in items:
    if x + im.width > AW: x = 0; y += row_h + 1; row_h = 0
    place[name] = (x, y, im.width, im.height, ax, ay); x += im.width + 1; row_h = max(row_h, im.height)
atlas = Image.new('RGBA', (AW, y + row_h), (0, 0, 0, 0))
for name, (im, _, _) in items:
    px, py = place[name][:2]; atlas.paste(pixelize(im), (px, py))
os.makedirs(OUT, exist_ok=True)
atlas.save(os.path.join(OUT, 'atlas.png'), optimize=True)
with open(os.path.join(OUT, 'atlas.js'), 'w') as f:
    f.write('// сгенерировано tools/build_assets.py: имя -> [x, y, w, h, якорь_x, якорь_y]\n')
    f.write('window.ATLAS=' + json.dumps(place, separators=(',', ':')) + ';\n')
print('sprites:', len(place), 'atlas:', atlas.size, 'bytes:', os.path.getsize(os.path.join(OUT, 'atlas.png')))
