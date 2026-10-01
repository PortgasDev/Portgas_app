from pathlib import Path
import re,json,base64
here=Path(__file__).resolve().parent
root=here.parent.parent
manual=(root/'manual-xuim-art.html').read_text(encoding='utf-8')
fonts='\n'.join(re.findall(r'@font-face\s*\{[^}]+\}',manual))
licenses=re.search(r'<script type="application/json" id="font-licenses">.*?</script>',manual,re.S).group()
games={}
for key,name in [('regua','olho-de-regua-aquecimento.html'),('cubo','cube-perspectiva.html'),('elipse','elipse-perspectiva.html')]:
    game=(root/name).read_text(encoding='utf-8')
    # The parent owns cross-game navigation; help and exercise controls remain visible.
    game=re.sub(r'<a[^>]*href="(?:olho-de-regua|treino-do-olhar)\.html"[^>]*>.*?</a>','',game)
    game=game.replace('</head>','<style>.header .brand{display:none}.header{min-height:58px;justify-content:flex-end;margin-bottom:18px}.intro{padding-top:12px}.intro h1{font-size:44px}.intro-note{display:none}.shell{padding-top:0}@media(max-width:620px){.header{min-height:52px}.intro h1{font-size:38px}}</style></head>')
    games[key]=game
html=(here/'index.html').read_text(encoding='utf-8')
html=html.replace('</head>','<script id="xuim-shortcuts">'+(here/'shortcuts.js').read_text(encoding='utf-8')+'</script></head>')
for token,content in [('/* FONTS */',fonts),('/* CSS */',(here/'style.css').read_text(encoding='utf-8')),('/* JS */',(here/'app.js').read_text(encoding='utf-8')),('<!-- LICENSES -->',licenses),('__GAMES__',json.dumps(games,ensure_ascii=False).replace('<','\\u003c')),('__LOGO__','data:image/webp;base64,'+base64.b64encode((root/'.prototype-tools/asset-1.webp').read_bytes()).decode())]:
    html=html.replace(token,content)
(root/'treino-do-olhar.html').write_text(html,encoding='utf-8')
print(f'Built treino-do-olhar.html: {len(html.encode()):,} bytes; three embedded games.')
