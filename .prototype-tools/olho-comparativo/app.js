(() => {
 'use strict';
 const C=window.CompareCore;
 const $=id=>document.getElementById(id);
 const svgs={reference:$('reference'),copy:$('copy')};
 const state={index:0,items:C.initial(0),selected:'b',mode:'edit',negative:false,align:false,review:false,measure:null,captureCount:0,history:[]};
 let drag=null;
 const scene=()=>C.scenes[state.index];
 const selected=()=>state.items.find(o=>o.id===state.selected);
 const announce=text=>{$('announce').textContent=text;};
 function remember(){state.history.push(C.clone(state.items));if(state.history.length>60)state.history.shift();}
 function scale(svg){return (svg.getBoundingClientRect().width||600)/600;}
 function path(o,extra=''){return `<g transform="translate(${o.x} ${o.y}) scale(${o.w/100} ${o.h/100})"><path d="${C.paths[o.kind]}" fill-rule="evenodd" class="${extra}" ${!o.locked?'data-object="'+o.id+'"':''}/></g>`;}
 function measureMarkup(svg,surface){
  const m=state.measure;if(!m)return '';
  const isHere=m.surface===surface;
  if(!isHere&&surface!=='reference')return '';
  const a=isHere?m.a:m.original?.a,b=isHere?m.b:m.original?.b;
  if(!a||!b)return '';
  const s=scale(svg),r=5/s,hit=28/s;
  const cls=isHere?'measure-line':'measure-ghost';
  return `<g><path class="${cls}" d="M${a.x} ${a.y} L${b.x} ${b.y}"/>${isHere?`<path class="measure-hit" data-bar d="M${a.x} ${a.y} L${b.x} ${b.y}" stroke-width="${hit}"/><circle data-end="a" cx="${a.x}" cy="${a.y}" r="${hit/2}" fill="transparent"/><circle data-end="b" cx="${b.x}" cy="${b.y}" r="${hit/2}" fill="transparent"/>`:''}<circle class="measure-handle" cx="${a.x}" cy="${a.y}" r="${r}" pointer-events="none"/><circle class="measure-handle" cx="${b.x}" cy="${b.y}" r="${r}" pointer-events="none"/><text class="measure-label" x="${(a.x+b.x)/2}" y="${Math.max(25,(a.y+b.y)/2-14/s)}" font-size="${14/s}" text-anchor="middle" pointer-events="none">${m.locked?'X':'…'}</text></g>`;
 }
 function renderBoards(){
  for(const [surface,svg] of Object.entries(svgs)){
   svg.classList.toggle('negative',state.negative);
   const objects=surface==='reference'?scene().objects:state.items;
   let html=state.negative?'<rect class="negative-bg" x="12" y="16" width="576" height="382" rx="4"/>':'';
   if(state.align){const base=scene().objects[0];html+=`<path class="guide" d="M12 ${base.y+base.h} H588 M${base.x+base.w/2} 16 V398"/>`;}
   html+=objects.map(o=>path(o,surface==='copy'&&state.review?'review-art':`art-fill ${surface==='copy'&&!o.locked?'copy-art':''} ${surface==='copy'&&o.id===state.selected&&!state.review?'selected-art':''}`)).join('');
   if(surface==='copy'&&state.review)html+=scene().objects.filter(o=>!o.locked).map(o=>path(o,'review-target')).join('');
   svg.innerHTML=html+measureMarkup(svg,surface);
  }
 }
 function syncControls(){
  const o=selected();
  $('width').value=o.w;$('height').value=o.h;
  $('width').disabled=state.review;$('height').disabled=state.review;
  $('width').setAttribute('aria-valuetext',`Largura de ${o.name}; compare visualmente com a referência`);
  $('height').setAttribute('aria-valuetext',`Altura de ${o.name}; compare visualmente com a referência`);
  document.querySelectorAll('[data-nudge]').forEach(b=>b.disabled=state.review);
  document.querySelectorAll('[data-select]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.select===state.selected)));
  document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(state.mode===b.dataset.tool)));
  $('carry').disabled=!state.measure?.locked;
  $('clear').disabled=!state.measure;
  $('undo').disabled=!state.history.length||state.review;
  $('negative').setAttribute('aria-pressed',String(state.negative));
  $('align').setAttribute('aria-pressed',String(state.align));
  $('compare').hidden=state.review;$('review').hidden=!state.review;
  $('copy-status').textContent=state.review?'REVISÃO DAS RELAÇÕES':'AJUSTE AS RELAÇÕES';
  $('copy-caption').textContent=state.review?'Tracejado: referência. Vermelho: sua tentativa.':'Ajuste tamanho e posição. Compare também os intervalos.';
  $('measure-access').hidden=!state.measure;
  $('lock-measure').hidden=!!state.measure?.locked;
  $('tool-hint').textContent=state.mode==='measure'&&!state.measure?.locked?(state.captureCount===1?'Agora toque no segundo ponto da referência.':'Toque em dois pontos da referência: uma largura, uma altura ou um espaço vazio.'):
   state.mode==='transport'?'Arraste a barra X na cópia. Gire pela ponta. Seu comprimento fica travado.':
   state.review?'Observe o tracejado e os espaços vazios. Depois escolha Ajustar novamente.':
   state.measure?.locked&&state.mode==='measure'?'Medida X capturada. Arraste para comparar na referência ou use Transportar X.':'Na cópia, arraste uma forma ou escolha seu nome abaixo. Largura e altura ficam nos controles.';
 }
 function render(){renderBoards();syncControls();}
 function selectObject(id){if(!state.items.some(o=>o.id===id&&!o.locked))return;state.selected=id;state.mode='edit';render();}
 function load(index){
  Object.assign(state,{index,items:C.initial(index),selected:'b',mode:'edit',review:false,measure:null,captureCount:0,history:[]});
  $('lesson').value=index;$('step').textContent=`ESTUDO ${String(index+1).padStart(2,'0')} / 03`;
  $('title').textContent=scene().title;$('focus').textContent=scene().focus;$('tip').textContent=scene().tip;
  $('objects').innerHTML=scene().objects.filter(o=>!o.locked).map(o=>`<button data-select="${o.id}" aria-pressed="false">${o.name}</button>`).join('');
  $('next').textContent=index===2?'Concluir estudos':'Próximo estudo';$('summary').hidden=true;
  render();
 }
 function coordinates(event,svg){const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse());return {x:C.clamp(p.x,12,588),y:C.clamp(p.y,16,398)};}
 function newMeasure(){state.mode='measure';state.captureCount=0;state.measure={a:{x:120,y:130},b:{x:230,y:130},surface:'reference',locked:false};render();}
 function lockMeasure(){const m=state.measure;if(!m||Math.hypot(m.b.x-m.a.x,m.b.y-m.a.y)<8){announce('Escolha pontos mais afastados.');return;}m.locked=true;m.original={a:{...m.a},b:{...m.b}};announce('Medida X capturada.');render();}
 for(const [surface,svg] of Object.entries(svgs)){
  svg.addEventListener('pointerdown',event=>{
   const p=coordinates(event,svg),m=state.measure;
   if(state.mode==='measure'&&surface==='reference'&&!m?.locked){
    if(state.captureCount===0){m.a=p;m.b={x:C.clamp(p.x+80,12,588),y:p.y};state.captureCount=1;}
    else{m.b=p;lockMeasure();}render();return;
   }
   if(m?.locked&&m.surface===surface&&(event.target.closest('[data-bar]')||event.target.closest('[data-end]'))){
    drag={type:event.target.dataset.end==='b'?'rotate':'bar',a:{...m.a},b:{...m.b},start:p};
   }else if(surface==='copy'&&state.mode==='edit'&&!state.review){
    const id=event.target.dataset.object;if(!id)return;selectObject(id);remember();
    drag={type:'object',start:p,object:{...selected()}};
   }else return;
   svg.setPointerCapture(event.pointerId);event.preventDefault();
  });
  svg.addEventListener('pointermove',event=>{
   if(!drag)return;const p=coordinates(event,svg),dx=p.x-drag.start.x,dy=p.y-drag.start.y;
   if(drag.type==='object'){Object.assign(selected(),C.fit({...drag.object,x:drag.object.x+dx,y:drag.object.y+dy}));}
   else if(drag.type==='rotate'){
    const m=state.measure,len=Math.hypot(drag.b.x-drag.a.x,drag.b.y-drag.a.y),angle=Math.atan2(p.y-m.a.y,p.x-m.a.x);
    m.b={x:m.a.x+Math.cos(angle)*len,y:m.a.y+Math.sin(angle)*len};keepMeasureInside();
   }else{const m=state.measure;m.a={x:drag.a.x+dx,y:drag.a.y+dy};m.b={x:drag.b.x+dx,y:drag.b.y+dy};keepMeasureInside();}
   render();
  });
  const end=()=>{drag=null;};svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
 }
 function keepMeasureInside(){const m=state.measure;const dx=Math.max(12-Math.min(m.a.x,m.b.x),0)+Math.min(588-Math.max(m.a.x,m.b.x),0);const dy=Math.max(16-Math.min(m.a.y,m.b.y),0)+Math.min(398-Math.max(m.a.y,m.b.y),0);m.a.x+=dx;m.b.x+=dx;m.a.y+=dy;m.b.y+=dy;}
 $('objects').addEventListener('click',e=>{if(e.target.dataset.select)selectObject(e.target.dataset.select);});
 document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.tool==='measure')newMeasure();else{state.mode='edit';render();}}));
 $('carry').addEventListener('click',()=>{const m=state.measure;if(!m?.locked)return;m.surface='copy';state.mode='transport';render();announce('A mesma medida está agora na cópia.');});
 $('clear').addEventListener('click',()=>{state.measure=null;state.mode='edit';render();});
 $('negative').addEventListener('click',()=>{state.negative=!state.negative;render();announce(state.negative?'Espaços vazios destacados em azul.':'Formas preenchidas em preto.');});
 $('align').addEventListener('click',()=>{state.align=!state.align;render();});
 for(const [id,key] of [['width','w'],['height','h']]){
  const input=$(id);input.addEventListener('pointerdown',remember);input.addEventListener('keydown',e=>{if(e.key.startsWith('Arrow'))remember();});
  input.addEventListener('input',()=>{if(state.review)return;selected()[key]=Number(input.value);C.fit(selected());render();});
 }
 function nudge(dx,dy){if(state.review)return;remember();const o=selected();o.x+=dx;o.y+=dy;C.fit(o);render();}
 document.querySelectorAll('[data-nudge]').forEach(b=>b.addEventListener('click',()=>nudge(...b.dataset.nudge.split(',').map(Number))));
 $('objects').addEventListener('keydown',event=>{const amount=event.shiftKey?.5:2;const moves={ArrowLeft:[-amount,0],ArrowRight:[amount,0],ArrowUp:[0,-amount],ArrowDown:[0,amount]};if(moves[event.key]){event.preventDefault();nudge(...moves[event.key]);}});
 $('undo').addEventListener('click',()=>{if(state.history.length){state.items=state.history.pop();render();}});
 $('reset').addEventListener('click',()=>{remember();state.items=C.initial(state.index);state.review=false;state.measure=null;state.mode='edit';render();});
 $('lesson').addEventListener('change',()=>load(Number($('lesson').value)));
 $('compare').addEventListener('click',()=>{
  state.review=true;state.mode='edit';
  $('feedback').innerHTML=C.feedback(state.index,state.items).map(f=>`<article class="feedback-item"><h3>${f.name}</h3><p>${f.text}</p><small>Largura ${format(f.width)} · Altura ${format(f.height)}<br>Diferença em relação à referência</small></article>`).join('');
  render();$('review').scrollIntoView({block:'nearest',behavior:'auto'});$('retry').focus({preventScroll:true});announce('Comparação revelada. Duas orientações para revisar.');
 });
 function format(n){return (Math.abs(n)<.5?'0':(n>0?'+':'')+Math.round(n))+'%';}
 $('retry').addEventListener('click',()=>{state.review=false;render();$('copy').scrollIntoView({block:'center',behavior:'auto'});$('objects').querySelector(`[data-select="${state.selected}"]`).focus({preventScroll:true});});
 $('next').addEventListener('click',()=>{if(state.index<2){load(state.index+1);$('title').scrollIntoView({block:'start'});}else{$('summary').hidden=false;$('summary').scrollIntoView({block:'center'});$('restart').focus({preventScroll:true});}});
 $('restart').addEventListener('click',()=>{load(0);$('title').scrollIntoView({block:'start'});});
 $('help').addEventListener('click',()=>$('help-dialog').showModal());
 for(const id of ['close-help','understood'])$(id).addEventListener('click',()=>$('help-dialog').close());
 $('tool-hint').after($('measure-access'));
 $('lock-measure').addEventListener('click',lockMeasure);
 for(const [id,end] of [['point-a','a'],['point-b','b']]){
  $(id).addEventListener('keydown',event=>{
   const moves={ArrowLeft:[-2,0],ArrowRight:[2,0],ArrowUp:[0,-2],ArrowDown:[0,2]};if(!moves[event.key])return;event.preventDefault();
   const m=state.measure;if(!m)return;const step=event.shiftKey?.25:1;const [dx,dy]=moves[event.key].map(n=>n*step);
   if(!m.locked){m[end].x=C.clamp(m[end].x+dx,12,588);m[end].y=C.clamp(m[end].y+dy,16,398);}
   else if(end==='a'){m.a.x+=dx;m.b.x+=dx;m.a.y+=dy;m.b.y+=dy;keepMeasureInside();}
   else{const len=Math.hypot(m.b.x-m.a.x,m.b.y-m.a.y),angle=Math.atan2(m.b.y-m.a.y,m.b.x-m.a.x)+(dx+dy)*Math.PI/180;m.b={x:m.a.x+len*Math.cos(angle),y:m.a.y+len*Math.sin(angle)};keepMeasureInside();}
   render();
  });
 }
 load(0);
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(renderBoards).observe($('reference'));
})();
