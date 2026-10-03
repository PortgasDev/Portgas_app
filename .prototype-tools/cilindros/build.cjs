const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const manual=read('manual-xuim-art.html');
let html=read('.prototype-tools/cilindros/index.html');
for(const [marker,content]of[
 ['/* FONTS */',manual.match(/@font-face\s*\{[^}]+\}/g).join('\n')],
 ['/* CSS */',read('.prototype-tools/olho-regua/style.css')+'\n'+read('.prototype-tools/cilindros/style.css')],
 ['/* GEOMETRY */',read('.prototype-tools/elipse/model.js')],
 ['/* MODEL */',read('.prototype-tools/cilindros/model.js')],
 ['/* APP */',read('.prototype-tools/cilindros/app.js')],
 ['<!-- LICENSES -->',manual.match(/<script type="application\/json" id="font-licenses">[\s\S]*?<\/script>/)[0]]
])html=html.replace(marker,()=>content);
html=html.replace('</head>',()=>'<style>'+read('.prototype-tools/treino/training.css')+'</style><script>'+read('.prototype-tools/treino/shortcuts.js')+'</script><script>'+read('.prototype-tools/treino/training.js')+'</script></head>');
fs.writeFileSync(path.join(root,'cilindros.html'),html);
console.log('Built cilindros.html: '+Buffer.byteLength(html)+' bytes, standalone.');
