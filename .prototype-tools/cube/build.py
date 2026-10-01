from pathlib import Path
import re
here=Path(__file__).resolve().parent
root=here.parent.parent
manual=(root/'manual-xuim-art.html').read_text(encoding='utf-8')
fonts='\n'.join(re.findall(r'@font-face\s*\{[^}]+\}',manual))
licenses=re.search(r'<script type="application/json" id="font-licenses">.*?</script>',manual,re.S).group()
html=(here/'index.html').read_text(encoding='utf-8')
html=html.replace('</head>','<style>'+fonts+'\n'+(here/'theme.css').read_text(encoding='utf-8')+'</style></head>')
html=html.replace('</head>','<script id="xuim-shortcuts">'+(root/'.prototype-tools/treino/shortcuts.js').read_text(encoding='utf-8')+'</script></head>')
html=html.replace('</head>','<style>'+(root/'.prototype-tools/treino/training.css').read_text(encoding='utf-8')+'</style><script id="xuim-training">'+(root/'.prototype-tools/treino/training.js').read_text(encoding='utf-8')+'</script></head>')
html=html.replace('</body>',licenses+'</body>')
(root/'cube-perspectiva.html').write_text(html,encoding='utf-8')
print('Built cube-perspectiva.html with Xuim theme and tracing.')
