"""Check the portable deliverable rather than only the component sources."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import re
import subprocess
import tempfile


class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.external = []
        self.scripts = []
        self.script = None

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        for key in ['src', 'href']:
            value = attrs.get(key, '')
            if tag in ['script', 'link', 'img', 'iframe', 'source'] and value and not value.startswith(('data:', '#')):
                self.external.append((tag, value))
        if tag == 'script' and attrs.get('type', '') not in ['application/json']:
            self.script = []

    def handle_data(self, data):
        if self.script is not None:
            self.script.append(data)

    def handle_endtag(self, tag):
        if tag == 'script' and self.script is not None:
            self.scripts.append(''.join(self.script))
            self.script = None


root = Path(__file__).resolve().parent.parent
html = (root / 'atelie-xuim.html').read_text(encoding='utf-8')
document = Document()
document.feed(html)
duplicates = [name for name, count in Counter(document.ids).items() if count > 1]
assert not duplicates, duplicates
assert not document.external, document.external
assert not re.search(r'url\(\s*[\'"]?(?:https?:|//)', html), 'Remote CSS dependency'
assert not any(marker in html for marker in ['__ASSET_', '/* APP_SCRIPT */', '/* MANAGEMENT_CSS */'])
assert len(document.scripts) == 1
with tempfile.TemporaryDirectory(prefix='xuim-validation-') as folder:
    script = Path(folder) / 'embedded.js'
    script.write_text(document.scripts[0], encoding='utf-8')
    subprocess.run(['node', '--check', str(script)], check=True)
print(f'PASS: {len(document.ids)} unique static IDs; embedded JS syntax; no external assets; all build markers resolved.')
print(f'Deliverable: {len(html.encode("utf-8")):,} bytes.')
