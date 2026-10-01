"""Generate a standalone learning path. Existing prototypes are never written."""
import base64
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
manual = (ROOT / 'manual-xuim-art.html').read_text(encoding='utf-8')
fonts = '\n'.join(re.findall(r'@font-face\s*\{[^}]+\}', manual))
licenses = re.search(r'<script type="application/json" id="font-licenses">.*?</script>', manual, re.S)
catalog = json.loads((HERE / 'curriculum.json').read_text(encoding='utf-8'))
html = (HERE / 'index.html').read_text(encoding='utf-8')
html = html.replace('/* FONTS */', fonts).replace('/* CSS */', (HERE / 'style.css').read_text(encoding='utf-8'))
html = html.replace('/* JS */', '\n'.join((HERE / name).read_text(encoding='utf-8') for name in ['model.js', 'app.js']))
html = html.replace('__CURRICULUM__', json.dumps(catalog, ensure_ascii=False).replace('<', '\\u003c'))
html = html.replace('<!-- LICENSES -->', licenses.group() if licenses else '')
html = html.replace('__MASCOT__', 'data:image/webp;base64,' + base64.b64encode((HERE.parent / 'asset-60.webp').read_bytes()).decode('ascii'))
(ROOT / 'trilha-xuim.html').write_text(html, encoding='utf-8')
print(f'Built trilha-xuim.html: {len(html.encode("utf-8")):,} bytes; 6 modules, 48 weeks.')
