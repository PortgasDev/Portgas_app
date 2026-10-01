from pathlib import Path
import re, base64

here = Path(__file__).resolve().parent
root = here.parent.parent
manual = (root / 'manual-xuim-art.html').read_text(encoding='utf-8')
html = (here / 'index.html').read_text(encoding='utf-8')
replacements = {
    '/* FONTS */': '\n'.join(re.findall(r'@font-face\s*\{[^}]+\}', manual)),
    '/* CSS */': (here / 'style.css').read_text(encoding='utf-8'),
    '/* JS */': (here / 'app.js').read_text(encoding='utf-8'),
    '__LOGO__': 'data:image/webp;base64,' + base64.b64encode((root / '.prototype-tools/asset-1.webp').read_bytes()).decode(),
    '<!-- LICENSES -->': re.search(r'<script type="application/json" id="font-licenses">.*?</script>', manual, re.S).group(),
}
for token, value in replacements.items():
    html = html.replace(token, value)
(root / 'catalogo-jogos.html').write_text(html, encoding='utf-8')
print(f'catalogo-jogos.html: {len(html.encode()):,} bytes; 10 demonstrations')
