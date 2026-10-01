import re
from pathlib import Path

SOURCE = Path(__file__).resolve().parent
ROOT = SOURCE.parent.parent
manual = (ROOT / 'manual-xuim-art.html').read_text(encoding='utf-8')
images = []
for match in re.finditer(r'<img\b[^>]*>', manual):
    image = re.search(r'src="([^"]*)"', match.group())
    images.append(image.group(1) if image else '')
fonts = '\n'.join(re.findall(r'@font-face\s*\{[^}]+\}', manual))
licenses = re.search(r'<script type="application/json" id="font-licenses">.*?</script>', manual, re.S)
html = (SOURCE / 'prototype.html').read_text(encoding='utf-8')
names = ['app.js','management.js','sketchbook.js','atelier-world.js','atelier.js','study-model.js','v2.js','v2-spaces.js','v2-profiles.js']
scripts = '\n'.join((SOURCE / name).read_text(encoding='utf-8') for name in names)
html = html.replace('/* APP_SCRIPT */', scripts + '\ninitManagement();\ninitV2();\n')
html = html.replace('/* MANAGEMENT_CSS */', '\n'.join((SOURCE / name).read_text(encoding='utf-8') for name in ['management.css','atelier.css','v2.css','v2-profiles.css']))
html = html.replace('/* EMBEDDED_FONTS */', fonts).replace('<!-- FONT_LICENSES -->', licenses.group() if licenses else '')
for name, index in {'LOGO':1,'VOLUMES':90,'PIXEL':60,'FIGURE':88,'HEADS':92,'PORTRAIT':80,'MASCOT':33}.items():
    html = html.replace('__ASSET_' + name + '__', images[index])
assert '__ASSET_' not in html
(ROOT / 'atelie-xuim-2.0.html').write_text(html, encoding='utf-8')
print(f'Built atelie-xuim-2.0.html ({len(html.encode("utf-8")):,} bytes)')
