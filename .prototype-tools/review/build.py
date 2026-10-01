"""Build the independent review guide without changing the platform."""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
catalog = json.loads((HERE / 'content.json').read_text(encoding='utf-8'))
legacy = json.loads((HERE / 'legacy.json').read_text(encoding='utf-8'))
catalog['groups'].insert(catalog['groups'].index('Fechamento'), legacy['group'])
for section in legacy['sections']:
    section['group'] = legacy['group']
    section['reviewKind'] = 'legacy'
    for item in section['items']:
        item['reviewKind'] = 'legacy'
closing_index = next(i for i, section in enumerate(catalog['sections']) if section['id'] == 'fechamento')
catalog['sections'][closing_index:closing_index] = legacy['sections']
manual = (ROOT / 'manual-xuim-art.html').read_text(encoding='utf-8')
fonts = '\n'.join(re.findall(r'@font-face\s*\{[^}]+\}', manual))
licenses = re.search(r'<script type="application/json" id="font-licenses">.*?</script>', manual, re.S)
html = (HERE / 'guide.html').read_text(encoding='utf-8')
html = html.replace('/* EMBEDDED_FONTS */', fonts)
html = html.replace('/* REVIEW_CSS */', (HERE / 'guide.css').read_text(encoding='utf-8'))
html = html.replace('/* REVIEW_SCRIPT */', '\n'.join((HERE / name).read_text(encoding='utf-8') for name in ['model.js', 'guide.js']))
html = html.replace('__CATALOG__', json.dumps(catalog, ensure_ascii=False).replace('<', '\\u003c'))
html = html.replace('<!-- FONT_LICENSES -->', licenses.group() if licenses else '')
target = ROOT / 'revisao-atelie-2.0.html'
target.write_text(html, encoding='utf-8')
print(f'Built {target.name}: {len(catalog["sections"])} areas, {sum(len(s["items"]) for s in catalog["sections"])} details.')
