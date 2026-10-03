const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const manual=read('manual-xuim-art.html');
let html=read('.prototype-tools/blobs/index.html');
for(const [marker,content]of[
 ['/* FONTS */',manual.match(/@font-face\s*\{[^}]+\}/g).join('\n')],
 ['/* CSS */',read('.prototype-tools/olho-regua/style.css')+'\n'+read('.prototype-tools/blobs/style.css')],
 ['/* SHORTCUTS */',read('.prototype-tools/treino/shortcuts.js')],
 ['/* MODEL */',read('.prototype-tools/blobs/model.js')],
 ['/* APP */',read('.prototype-tools/blobs/app.js')],
 ['<!-- LICENSES -->',manual.match(/<script type="application\/json" id="font-licenses">[\s\S]*?<\/script>/)[0]]
])html=html.replace(marker,()=>content);
fs.writeFileSync(path.join(root,'blobs.html'),html);
console.log('Built blobs.html: '+Buffer.byteLength(html)+' bytes, standalone.');
