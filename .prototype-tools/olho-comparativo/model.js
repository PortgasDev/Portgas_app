(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CompareCore=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const paths={
  bottle:'M35 0 H65 V24 L83 40 V96 Q83 100 78 100 H22 Q17 100 17 96 V40 L35 24 Z',
  bowl:'M0 8 Q50 -4 100 8 Q95 90 64 100 H36 Q5 90 0 8 Z',
  jar:'M16 0 H68 V20 C112 12 115 82 68 74 V100 H0 V20 H16 Z M68 32 V62 C94 67 94 25 68 32 Z',
  fruit:'M50 5 C15 -10 -8 25 3 64 C10 100 45 108 56 93 C80 110 101 84 100 51 C101 17 80 -4 55 8 L58 0 Z',
  cup:'M0 0 H72 V18 C111 10 112 77 72 71 V100 H0 Z M72 30 V59 C95 63 95 25 72 30 Z',
  lamp:'M25 0 H75 L100 43 H56 V93 H86 V100 H14 V93 H44 V43 H0 Z',
  book:'M0 0 H100 V100 H0 Z',
  vase:'M29 0 H71 L62 20 C54 40 105 61 94 89 Q90 100 75 100 H25 Q10 100 6 89 C-5 61 46 40 38 20 Z'
 };
 const scenes=[
  {title:'O desenho entre os objetos',focus:'Compare as larguras e os intervalos. O espaço vazio também tem uma forma.',tip:'Observe o corredor entre a garrafa e a tigela antes de ajustar a terceira peça.',objects:[
   {id:'a',name:'Garrafa · base fixa',kind:'bottle',x:68,y:130,w:92,h:205,locked:true},
   {id:'b',name:'Tigela',kind:'bowl',x:218,y:253,w:142,h:82},
   {id:'c',name:'Vaso',kind:'vase',x:440,y:166,w:90,h:169}],offsets:[[0,0,1,1],[-27,-24,1.22,1.16],[26,18,.83,.82]]},
  {title:'O vazio dentro da forma',focus:'Observe o espaço dentro da alça e o espaço entre os objetos.',tip:'A abertura da alça muda com a largura e a altura da jarra. Compare seu formato, não só a borda externa.',objects:[
   {id:'a',name:'Fruta · base fixa',kind:'fruit',x:64,y:252,w:94,h:86,locked:true},
   {id:'b',name:'Jarra',kind:'jar',x:226,y:114,w:158,h:224},
   {id:'c',name:'Xícara',kind:'cup',x:453,y:238,w:97,h:100}],offsets:[[0,0,1,1],[-33,25,.81,.87],[-27,-28,1.15,1.16]]},
  {title:'As partes e o conjunto',focus:'Compare a altura da luminária, a largura do livro e o intervalo até o vaso.',tip:'Use uma dimensão da luminária como unidade e observe quantas vezes ela cabe nas outras partes.',objects:[
   {id:'a',name:'Luminária · base fixa',kind:'lamp',x:52,y:102,w:158,h:236,locked:true},
   {id:'b',name:'Livro',kind:'book',x:256,y:302,w:151,h:36},
   {id:'c',name:'Vaso',kind:'vase',x:467,y:175,w:79,h:163}],offsets:[[0,0,1,1],[-28,-16,.78,1.48],[14,20,1.26,.78]]}
 ];
 const clone=x=>JSON.parse(JSON.stringify(x));
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function initial(index){return scenes[index].objects.map((o,i)=>{const d=scenes[index].offsets[i];return {...o,x:o.x+d[0],y:o.y+d[1],w:o.w*d[2],h:o.h*d[3]};});}
 function fit(o){o.w=clamp(o.w,30,250);o.h=clamp(o.h,25,300);o.x=clamp(o.x,12,588-o.w);o.y=clamp(o.y,16,398-o.h);return o;}
 function metrics(index,items){const ref=scenes[index].objects;return items.filter(o=>!o.locked).map(o=>{const t=ref.find(r=>r.id===o.id);return {name:o.name,id:o.id,width:(o.w/t.w-1)*100,height:(o.h/t.h-1)*100,dx:o.x-t.x,dy:o.y-t.y,position:Math.hypot(o.x-t.x,o.y-t.y)};});}
 function feedback(index,items){return metrics(index,items).map(m=>{const ds=[{value:Math.abs(m.width),text:m.width>0?'A largura está maior. Estreite a forma.':'A largura está menor. Alargue a forma.'},{value:Math.abs(m.height),text:m.height>0?'A altura está maior. Diminua a altura.':'A altura está menor. Aumente a altura.'},{value:Math.abs(m.dx)/2,text:m.dx>0?'A forma está à direita da referência. Mova para a esquerda e observe o intervalo.':'A forma está à esquerda da referência. Mova para a direita e observe o intervalo.'},{value:Math.abs(m.dy)/2,text:m.dy>0?'A forma está abaixo da referência. Mova para cima.':'A forma está acima da referência. Mova para baixo.'}].sort((a,b)=>b.value-a.value);return {...m,text:ds[0].value<4?'As relações estão próximas da referência. Observe os vazios para conferir.':ds[0].text};});}
 return {paths,scenes,clone,clamp,fit,initial,metrics,feedback};
});
