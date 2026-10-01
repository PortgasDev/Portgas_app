const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const manual=fs.readFileSync(path.join(root,'manual-xuim-art.html'),'utf8');
const fonts=manual.match(/@font-face\s*\{[^}]+\}/g);
if(!fonts?.length)throw new Error('Brand fonts unavailable');
const licenses=manual.match(/<script type="application\/json" id="font-licenses">[\s\S]*?<\/script>/);
let html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const sharedCss=fs.readFileSync(path.join(root,'.prototype-tools/olho-regua/style.css'),'utf8');
for(const[marker,content]of[
 ['/* FONTS */',fonts.join('\n')],
 ['/* CSS */',sharedCss+'\n'+fs.readFileSync(path.join(__dirname,'style.css'),'utf8')],
 ['/* MODEL */',fs.readFileSync(path.join(__dirname,'model.js'),'utf8')],
 ['/* APP */',fs.readFileSync(path.join(__dirname,'app.js'),'utf8')],
 ['<!-- LICENSES -->',licenses?.[0]||'']
])html=html.replace(marker,()=>content);
html=html.replace('</head>', '<script id="xuim-shortcuts">'+fs.readFileSync(path.join(root,'.prototype-tools/treino/shortcuts.js'),'utf8')+'</script></head>');
html=html.replace('</head>', '<style>'+fs.readFileSync(path.join(root,'.prototype-tools/treino/training.css'),'utf8')+'</style><script id="xuim-training">'+fs.readFileSync(path.join(root,'.prototype-tools/treino/training.js'),'utf8')+'</script></head>');
fs.writeFileSync(path.join(root,'elipse-perspectiva.html'),html);
console.log(`Built elipse-perspectiva.html: ${Buffer.byteLength(html).toLocaleString()} bytes, standalone.`);
