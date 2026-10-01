import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
manual = (ROOT / 'manual-xuim-art.html').read_text(encoding='utf-8')
images = []
for match in re.finditer(r'<img\b[^>]*>', manual):
    source = re.search(r'src="([^"]*)"', match.group())
    images.append(source.group(1) if source else '')
fonts = '\n'.join(re.findall(r'@font-face\s*\{[^}]+\}', manual))
licenses = re.search(r'<script type="application/json" id="font-licenses">.*?</script>', manual, re.S)
source = (ROOT / '.prototype-tools' / 'prototype.html').read_text(encoding='utf-8')
scripts = '\n'.join((ROOT / '.prototype-tools' / name).read_text(encoding='utf-8') for name in ['app.js', 'management.js', 'sketchbook.js', 'atelier-world.js', 'atelier.js']) + '\ninitManagement();\n'
source = source.replace('/* APP_SCRIPT */', scripts)
source = source.replace('/* MANAGEMENT_CSS */', '\n'.join((ROOT / '.prototype-tools' / name).read_text(encoding='utf-8') for name in ['management.css', 'atelier.css']))
source = source.replace('/* EMBEDDED_FONTS */', fonts)
source = source.replace('<!-- FONT_LICENSES -->', licenses.group() if licenses else '')
for name, index in {'LOGO':1,'VOLUMES':90,'PIXEL':60,'FIGURE':88,'HEADS':92,'PORTRAIT':80,'MASCOT':33}.items():
    source = source.replace('__ASSET_' + name + '__', images[index])
assert '__ASSET_' not in source
(ROOT / 'atelie-xuim.html').write_text(source, encoding='utf-8')
print(f'Built atelie-xuim.html ({len(source.encode("utf-8")) / 1024 / 1024:.2f} MB)')
