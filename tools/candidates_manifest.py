"""Список вариантов для мастерской: assets/candidates/<id>/*.png -> assets/candidates/index.json.

По этому списку studio.html на сайте показывает варианты без подключённой папки.
Запускать после каждой генерации, перед коммитом: python3 tools/candidates_manifest.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / 'assets' / 'candidates'


def natural(p):
    return [int(t) if t.isdigit() else t for t in re.split(r'(\d+)', p.name)]


m = {d.name: [p.name for p in sorted(d.glob('*.png'), key=natural)] for d in sorted(ROOT.iterdir()) if d.is_dir()}
m = {k: v for k, v in m.items() if v}
(ROOT / 'index.json').write_text(json.dumps(m, ensure_ascii=False) + '\n')
print(f'{len(m)} папок, {sum(map(len, m.values()))} файлов -> {ROOT / "index.json"}')
