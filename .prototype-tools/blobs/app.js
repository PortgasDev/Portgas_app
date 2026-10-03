(function(){
 'use strict';
 const C=window.BlobCore,$=id=>document.getElementById(id);
 const LEVELS=['Fácil','Médio','Difícil'],MODES={tutorial:'Tutorial',classic:'Desafio clássico',endless:'Infinito',daily:'Desafio diário'};
 const KEY='xuim.blobs.v1.',svg=$('drawing'),panel=$('side-panel');
 const lessons=[
  {title:'Imagine o caminho.',copy:'A linha dourada sugere a direção do corpo. Observe onde a forma muda de direção e de espessura.',tip:'Passe a caneta pelo ar antes de tocar. Imagine que você vai envolver um pedaço de argila.'},
  {title:'Abrace a superfície.',copy:'Desenhe curvas de um lado ao outro, como faixas envolvendo o corpo. O exemplo azul mostra uma possibilidade.',tip:'Varie a abertura das curvas. Uma volta estreita continua arredondada nas extremidades.'},
  {title:'Imagine o lado de trás.',copy:'Ative “Por trás” e complete algumas voltas com traços escondidos. Pense no volume inteiro.',tip:'O tracejado representa o verso. Você pode esconder as guias e testar outra interpretação.'}
 ];
 let level=0,s=null,task=C.generate(0,'blobs-preview'),strokes=[],undo=[],redo=[],gesture=null;
 let tool='pen',dashed=false,width=3.5,axis=false,example=true,backs=true,reading=0;
 let cachedDraft=null,gallery=[],sheetSeed='',selectedStudy=null,confirmAction=null,toastTimer;
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const nonce=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
 const today=()=>{const d=new Date();return[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
 function notify(message){$('live-message').textContent=message;$('live-message').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('live-message').hidden=true;},5200);}
 function getStored(name){try{return JSON.parse(localStorage.getItem(KEY+name));}catch{return null;}}
 function setStored(name,value){try{if(value===null)localStorage.removeItem(KEY+name);else localStorage.setItem(KEY+name,JSON.stringify(value));return true;}catch{return false;}}
 function validRecord(r){
  if(!r||r.version!==1||!Number.isInteger(r.level)||r.level<0||r.level>2||typeof r.seed!=='string'||r.seed.length>120||!Object.hasOwn(MODES,r.mode))return null;
  const clean=C.validStrokes(r.strokes);if(!clean)return null;
  return{...r,strokes:clean,note:typeof r.note==='string'?r.note.slice(0,400):'',checks:Array.from({length:3},(_,i)=>r.checks?.[i]===true)};
 }
 function draft(){
  const r=validRecord(cachedDraft||getStored('draft'));
  if(!r||!Number.isInteger(r.round)||r.round<0||r.round>100000||!Number.isInteger(r.step)||r.step<0||r.step>2||typeof r.base!=='string'||r.base.length>100)return null;
  if(['classic','daily'].includes(r.mode)&&r.round>5)return null;
  return r;
 }
 function record(){return{version:1,level:s.level,mode:s.mode,round:s.round,step:s.step,base:s.base,seed:task.seed,strokes,note:s.note,checks:s.checks,date:s.date,stage:s.stage};}
 function saveDraft(){
  if(!s||s.stage==='summary')return;
  cachedDraft=record();const ok=setStored('draft',cachedDraft);
  $('save-status').textContent=ok?'Rascunho salvo neste navegador.':'Não foi possível salvar. Baixe a imagem para guardar.';
 }
 function ask(title,copy,action,label='Continuar'){$('confirm-title').textContent=title;$('confirm-copy').textContent=copy;$('confirm-button').textContent=label;confirmAction=action;$('confirm-dialog').showModal();}
 function shapeMarkup(t){return'<path d="'+C.linePath(t.outline,true)+'" fill="#f6e5e8" stroke="#242329" stroke-width="2.5" stroke-linejoin="round"/>';}
 function strokeMarkup(list){return list.map(v=>'<path class="student-stroke" d="'+C.smoothPath(v.points)+'" fill="none" stroke="#de2246" stroke-width="'+v.width+'" stroke-linecap="round" stroke-linejoin="round"'+(v.dashed?' stroke-dasharray="8 7"':'')+'/>').join('');}
 function guideMarkup(){
  let out='';const r=task.readings[reading];
  if(axis)out+='<path d="'+C.linePath(task.axis)+'" fill="none" stroke="#b38230" stroke-width="2" stroke-dasharray="4 7"/>';
  if(example){
   out+=r.front.map(p=>'<path d="'+C.linePath(p)+'" fill="none" stroke="#227e9d" stroke-width="2.8"/>').join('');
   if(backs)out+=r.back.map(p=>'<path d="'+C.linePath(p)+'" fill="none" stroke="#227e9d" stroke-width="2" stroke-dasharray="6 7" opacity=".7"/>').join('');
  }
  return out;
 }
 function paintInk(){$('ink').innerHTML=strokeMarkup(gesture?.stroke?[...strokes,gesture.stroke]:strokes);}
 function paint(){
  $('silhouette').innerHTML=shapeMarkup(task);$('guides').innerHTML=guideMarkup();paintInk();
  $('example-legend').hidden=!example;
  svg.style.cursor=!s||s.stage!=='draw'?'default':tool==='eraser'?'cell':'crosshair';
 }
 function toolbar(){
  document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===tool)));
  $('back-button').setAttribute('aria-pressed',String(dashed));$('stroke-width').value=String(width);
  $('back-button').disabled=tool==='eraser';$('stroke-width').disabled=tool==='eraser';
  $('undo-button').disabled=!undo.length;$('redo-button').disabled=!redo.length;$('clear-button').disabled=!strokes.length;
  const review=$('review-button');if(review)review.disabled=!strokes.length;
 }
 function supportControls(){return'<div class="guide-options"><span>APOIOS · LIGUE QUANDO PRECISAR</span><div class="guide-buttons"><button data-action="axis" aria-pressed="'+axis+'">Direção</button><button data-action="example" aria-pressed="'+example+'">Exemplo</button><button data-action="backs" aria-pressed="'+backs+'" '+(!example?'disabled':'')+'>Verso</button>'+(example?'<button data-action="reading">Inverter leitura ↔</button>':'')+'</div><p class="guide-note">'+(example?'Azul: uma leitura possível. A silhueta pode sugerir outros volumes.':'Observe a forma e imagine como suas curvas envolvem a superfície.')+'</p></div>';}
 function homePanel(){
  const r=draft();
  panel.innerHTML='<span class="eyebrow">DA SILHUETA AO VOLUME</span><h2>Encontre suas curvas.</h2><p>Receba uma forma e desenhe linhas que revelem seu volume.</p>'+
   (r?'<div class="resume"><p>'+MODES[r.mode]+' · '+LEVELS[r.level]+' · forma '+(r.round+1)+'</p><button class="button" data-action="resume">Retomar meu desenho →</button></div>':'')+
   '<div class="config"><div><span class="field-label">Dificuldade da forma</span><div class="segmented" role="group" aria-label="Dificuldade">'+LEVELS.map((name,i)=>'<button data-level="'+i+'" aria-pressed="'+(level===i)+'">'+name+'</button>').join('')+'</div><p class="level-description">'+['Formas amplas, com poucas mudanças de direção.','Curvas e estreitamentos mais presentes.','Mudanças de direção e espessura mais acentuadas.'][level]+'</p></div></div>'+
   '<div class="mode-list">'+Object.entries(MODES).map(([id,name])=>'<button class="mode" data-mode="'+id+'"><span><strong>'+name+'</strong><small>'+({tutorial:'Um blob, três passos guiados.',classic:'Seis formas para praticar.',endless:'Novas formas, no seu ritmo.',daily:'As mesmas seis formas do dia.'}[id])+'</small></span><span class="mode-arrow">↗</span></button>').join('')+'</div><button class="text-button sheet-link" data-action="sheet">▧ Gerar folha para aula ↗</button>';
 }
 function drawPanel(){
  const tutorial=s.mode==='tutorial',lesson=lessons[s.step];
  panel.innerHTML='<div class="task-number"><span class="eyebrow">'+MODES[s.mode].toUpperCase()+'</span><span>'+LEVELS[s.level]+'</span></div>'+
   (tutorial?'<div class="tutorial-progress" aria-label="Passo '+(s.step+1)+' de 3">'+[0,1,2].map(i=>'<span class="'+(i<=s.step?'active':'')+'"></span>').join('')+'</div>':'')+
   '<h2>'+(tutorial?lesson.title:'Transforme em volume.')+'</h2><p>'+(tutorial?lesson.copy:'Desenhe algumas curvas envolvendo a forma. Experimente como a direção e a abertura mudam a leitura do corpo.')+'</p>'+
   '<div class="instruction-card"><strong>'+(tutorial?'Experimente':'Um bom começo')+'</strong><p>'+(tutorial?lesson.tip:'Imagine faixas de borracha abraçando a superfície. Elas acompanham as curvas e as mudanças de espessura.')+'</p></div>'+supportControls()+
   '<div class="panel-actions">'+(tutorial&&s.step<2?'<button class="button primary wide" data-action="step-next">'+(s.step===0?'Ver as curvas':'Ver o lado de trás')+' →</button>':'<button class="button primary wide" id="review-button" data-action="review" '+(!strokes.length?'disabled':'')+'>Rever meu desenho →</button>')+
   (tutorial&&s.step>0?'<button class="step-back" data-action="step-back">← Passo anterior</button>':'')+'<button class="text-button" data-action="download">Baixar imagem ↓</button><button class="text-button" data-action="sheet">Folha para aula ↗</button></div>';
 }
 function reviewPanel(){
  panel.innerHTML='<span class="eyebrow">OLHE DE NOVO</span><h2>Que volume você vê?</h2><p>Compare a intenção dos seus traços com a superfície que você imaginou.</p>'+supportControls()+
   '<div class="check-list" role="group" aria-label="Autoavaliação opcional">'+['Minhas curvas acompanham as mudanças de direção.','As voltas mantêm extremidades arredondadas.','Consigo distinguir a frente e o verso.'].map((text,i)=>'<label><input type="checkbox" data-check="'+i+'" '+(s.checks[i]?'checked':'')+'><span>'+text+'</span></label>').join('')+'</div><label class="field-caption" for="study-notes">O que quero experimentar depois? <span>(opcional)</span></label><textarea id="study-notes" maxlength="400" placeholder="Anote algo para o próximo estudo…">'+esc(s.note)+'</textarea><div class="panel-actions"><button class="button primary wide" data-action="next">'+(s.mode==='tutorial'||(['classic','daily'].includes(s.mode)&&s.round===5)?'Guardar e concluir':'Guardar e continuar')+' →</button><button class="button" data-action="edit">Voltar ao desenho</button><button class="text-button" data-action="download">Baixar imagem ↓</button></div><p class="export-note">As perguntas são para sua reflexão; não geram nota. A imagem baixada contém a silhueta e seus traços.</p>';
 }
 function summaryPanel(){panel.innerHTML='<span class="eyebrow">'+MODES[s.mode].toUpperCase()+' CONCLUÍDO</span><h2>Mais formas no seu repertório.</h2><div class="summary-count">'+(s.round+1)+'</div><p>'+((s.round+1)===1?'forma explorada.':'formas exploradas.')+' Seus últimos estudos estão no caderno abaixo.</p><div class="instruction-card"><strong>Leve a pergunta com você.</strong><p>O que muda no volume quando você muda a direção de uma curva? Repita uma forma e experimente outra leitura.</p></div><div class="panel-actions"><button class="button primary wide" data-action="home">Escolher outro treino</button><button class="button" data-action="sheet">Folha para aula</button><button class="text-button" data-action="download">Baixar último estudo ↓</button></div>';}
 function renderPanel(){if(!s)homePanel();else if(s.stage==='review')reviewPanel();else if(s.stage==='summary')summaryPanel();else drawPanel();toolbar();}
 function render(){
  const stage=s?.stage||'home';$('workspace').dataset.state=stage;$('home-button').hidden=!s;$('toolbar').hidden=stage!=='draw';$('session-bar').hidden=!s||stage==='summary';
  $('board-label').textContent=s?MODES[s.mode].toUpperCase():'LABORATÓRIO DE VOLUME';
  $('board-count').textContent=s?(s.mode==='tutorial'?'PASSO '+(s.step+1)+' / 3':'FORMA '+String(s.round+1).padStart(2,'0')+(['classic','daily'].includes(s.mode)?' / 06':'')):'XUIM ART / 05';
  $('board-title').textContent=stage==='home'?'O contorno é só o começo.':stage==='review'?'Volte o olhar para suas curvas.':stage==='summary'?'Um volume que você imaginou.':'Desenhe sobre a forma.';
  $('board-description').textContent=stage==='home'?'Imagine uma forma macia. Suas curvas vão revelar como ela se dobra.':stage==='review'?'Revele o exemplo, compare a intenção e ajuste o que quiser.':stage==='summary'?'Cada curva é uma escolha sobre a superfície.':'Faça curvas que envolvam a superfície, como faixas ao redor do corpo.';
  $('board-hint').textContent=stage==='draw'?'FRENTE CONTÍNUA · VERSO TRACEJADO':'IMAGINE A SUPERFÍCIE';
  if(s){$('session-caption').textContent=MODES[s.mode]+' · '+LEVELS[s.level];$('round-list').innerHTML=['classic','daily'].includes(s.mode)?Array.from({length:6},(_,i)=>'<span class="round-item '+(i<s.round?'done':i===s.round?'current':'')+'"></span>').join(''):'';}
  renderPanel();paint();
 }
 function resetTools(){undo=[];redo=[];gesture=null;tool='pen';dashed=false;width=3.5;reading=0;}
 function lessonGuides(){axis=s.step===0;example=s.step>0;backs=s.step===2;}
 function loadRound(){task=C.generate(s.level,s.base+':'+s.level+':'+s.round);strokes=[];s.stage='draw';s.step=0;s.note='';s.checks=[false,false,false];resetTools();axis=false;example=false;backs=false;if(s.mode==='tutorial')lessonGuides();saveDraft();render();}
 function start(mode){
  const begin=()=>{s={mode,level,base:mode==='daily'?'daily:'+today():nonce(),round:0,step:0,date:today(),note:'',checks:[false,false,false],stage:'draw'};loadRound();};
  if(draft())ask('Começar um novo estudo?','Seu rascunho atual será substituído. Os estudos que você já guardou no caderno continuam disponíveis.',begin,'Começar novo');else begin();
 }
 function resume(){const r=draft();if(!r){notify('Não foi possível recuperar o rascunho.');return;}s={...r,stage:r.stage==='review'?'review':'draw'};level=r.level;task=C.generate(level,r.seed);strokes=r.strokes;resetTools();axis=false;example=false;backs=false;if(s.mode==='tutorial')lessonGuides();render();}
 function home(){if(gesture)cancelGesture();saveDraft();s=null;task=C.generate(level,'blobs-preview');strokes=[];axis=false;example=true;backs=true;resetTools();render();renderGallery();}
 function pushUndo(previous){undo.push(previous);if(undo.length>40)undo.shift();redo=[];}
 function changed(){saveDraft();paintInk();toolbar();}
 function undoStroke(){if(s?.stage!=='draw'||gesture||!undo.length)return false;redo.push(strokes);strokes=undo.pop();changed();return true;}
 function redoStroke(){if(s?.stage!=='draw'||gesture||!redo.length)return false;undo.push(strokes);strokes=redo.pop();changed();return true;}
 function clearDrawing(){if(s?.stage!=='draw'||!strokes.length||gesture)return false;ask('Limpar os traços?','A silhueta continua a mesma. Você ainda poderá usar Desfazer para recuperar o desenho.',()=>{pushUndo(strokes);strokes=[];changed();},'Limpar desenho');return true;}
 function archive(){
  const r={...record(),id:nonce(),saved:Date.now()};gallery=[r,...gallery].slice(0,6);const ok=setStored('gallery',gallery);renderGallery();return ok;
 }
 function advance(){
  const end=s.mode==='tutorial'||(['classic','daily'].includes(s.mode)&&s.round===5);
  if(end){s.stage='summary';cachedDraft=null;setStored('draft',null);axis=false;example=false;backs=false;render();}
  else{s.round++;loadRound();}
 }
 function next(){
  if(s?.stage!=='review')return false;
  if(archive())advance();else{notify('O navegador não conseguiu guardar o estudo. Baixe a imagem antes de continuar.');ask('Continuar sem salvar no navegador?','Seu estudo permanece no caderno enquanto esta página estiver aberta, mas pode ser perdido ao fechar. Você pode cancelar e baixar a imagem.',advance,'Continuar sem salvar');}
  return true;
 }
 function goReview(){if(s?.stage!=='draw'||!strokes.length||gesture)return false;s.stage='review';saveDraft();render();return true;}
 function toggleGuide(name){if(!s||s.stage==='summary'||gesture)return false;if(name==='axis')axis=!axis;if(name==='example')example=!example;if(name==='backs')backs=!backs;if(name==='reading')reading=1-reading;renderPanel();paint();return true;}
 function setTool(name){if(s?.stage!=='draw'||gesture)return false;tool=name;toolbar();paint();return true;}
 function action(name){
  if(gesture)return;
  const actions={resume,home,sheet:openSheet,review:goReview,next,download:()=>downloadImage(task,strokes),edit:()=>{s.stage='draw';saveDraft();render();},'step-next':()=>{s.step=Math.min(2,s.step+1);lessonGuides();saveDraft();render();},'step-back':()=>{s.step=Math.max(0,s.step-1);lessonGuides();saveDraft();render();}};
  if(['axis','example','backs','reading'].includes(name))toggleGuide(name);else actions[name]?.();
 }
 // Coordinates are kept in the SVG's own space, including on tablets and after resize.
 function position(e){
  const matrix=svg.getScreenCTM();if(!matrix)return null;
  const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());
  return{x:Math.round(C.clamp(p.x,0,900)*10)/10,y:Math.round(C.clamp(p.y,0,600)*10)/10};
 }
 function eraseAt(p){const index=strokes.findLastIndex(v=>C.hitStroke(p,v));if(index>=0)strokes=strokes.filter((_,i)=>i!==index);}
 function addPoint(p){const points=gesture.stroke.points;if(C.distance(points[points.length-1],p)<1)return;if(points.length>=2999)gesture.stroke.points=points.filter((_,i)=>i%2===0||i===points.length-1);gesture.stroke.points.push(p);}
 svg.addEventListener('pointerdown',e=>{
  if(s?.stage!=='draw'||gesture||(e.button!==0&&e.button!==5))return;
  if(tool==='pen'&&e.button!==5&&strokes.length>=180){notify('Esta forma já tem 180 traços. Guarde o estudo ou apague alguns para continuar.');return;}
  const p=position(e);if(!p)return;e.preventDefault();svg.focus({preventScroll:true});svg.setPointerCapture(e.pointerId);
  const erasing=tool==='eraser'||e.button===5;gesture={id:e.pointerId,before:strokes,erasing,stroke:erasing?null:{width,dashed,points:[p]}};
  if(erasing)eraseAt(p);paintInk();
 });
 svg.addEventListener('pointermove',e=>{
  if(!gesture||e.pointerId!==gesture.id)return;e.preventDefault();
  for(const sample of(e.getCoalescedEvents?.().length?e.getCoalescedEvents():[e])){const p=position(sample);if(!p)continue;if(gesture.erasing)eraseAt(p);else addPoint(p);}
  paintInk();
 });
 svg.addEventListener('pointerup',e=>{
  if(!gesture||e.pointerId!==gesture.id)return;
  const p=position(e);if(p&&!gesture.erasing)addPoint(p);
  const g=gesture;gesture=null;
  if(g.stroke&&g.stroke.points.length>1){pushUndo(g.before);strokes=[...g.before,g.stroke];}else if(g.erasing&&strokes!==g.before)pushUndo(g.before);
  if(svg.hasPointerCapture?.(e.pointerId))svg.releasePointerCapture(e.pointerId);changed();
 });
 function cancelGesture(){if(!gesture)return;strokes=gesture.before;gesture=null;paintInk();toolbar();}
 svg.addEventListener('pointercancel',cancelGesture);svg.addEventListener('lostpointercapture',cancelGesture);window.addEventListener('blur',cancelGesture);svg.addEventListener('contextmenu',e=>e.preventDefault());
 function artSvg(t,list,caption=''){
  return'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 '+(caption?'660':'600')+'" width="900" height="'+(caption?'660':'600')+'"><rect width="100%" height="100%" fill="#f5f3f0"/>'+shapeMarkup(t)+strokeMarkup(list)+(caption?'<text x="32" y="633" font-family="Arial,sans-serif" font-size="15" fill="#625e66">'+esc(caption)+'</text>':'')+'</svg>';
 }
 function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
 function downloadImage(t,list){
  const source=artSvg(t,list,'XUIM ART / BLOBS · '+LEVELS[t.level]+' · seu estudo'),image=new Image(),url=URL.createObjectURL(new Blob([source],{type:'image/svg+xml'}));
  image.onload=()=>{try{const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=1320;const context=canvas.getContext('2d');context.drawImage(image,0,0,1800,1320);const data=canvas.toDataURL('image/png');$('export-preview').src=data;$('export-link').href=data;$('export-link').download='blobs-'+today()+'.png';$('export-dialog').showModal();}catch{notify('Não foi possível gerar a imagem. Tente novamente.');}finally{URL.revokeObjectURL(url);}};
  image.onerror=()=>{URL.revokeObjectURL(url);notify('Não foi possível gerar a imagem. Tente novamente.');};image.src=url;
 }
 function renderGallery(){
  $('studies').hidden=!gallery.length;$('study-grid').innerHTML=gallery.map((r,i)=>'<button class="study-card" data-study="'+i+'" aria-label="Abrir estudo '+(i+1)+', '+LEVELS[r.level]+'">'+artSvg(C.generate(r.level,r.seed),r.strokes)+'<span>'+LEVELS[r.level]+' · '+(typeof r.date==='string'?esc(r.date.slice(0,10)):'estudo')+'</span></button>').join('');
 }
 function openStudy(index){selectedStudy=gallery[index];if(!selectedStudy)return;const r=selectedStudy;$('study-preview').innerHTML=artSvg(C.generate(r.level,r.seed),r.strokes);$('study-note').textContent=r.note||'Sem anotação neste estudo.';$('study-title').textContent='Seu estudo · '+LEVELS[r.level];$('study-dialog').showModal();}
 function sheetMarkup(){
  const sheetLevel=Number($('sheet-level').value);let cells='';
  for(let i=0;i<6;i++){const t=C.generate(sheetLevel,sheetSeed+':'+i),x=22+(i%2)*388,y=130+Math.floor(i/2)*295;
   cells+='<g transform="translate('+x+' '+y+')"><rect width="364" height="267" rx="6" fill="white" stroke="#d8d3ce"/><text x="14" y="24" font-family="Arial,sans-serif" font-size="12" fill="#777">0'+(i+1)+'</text><svg x="8" y="22" width="348" height="232" viewBox="0 0 900 600">'+shapeMarkup(t).replace('fill="#f6e5e8"','fill="none"')+'</svg></g>';
  }
  return'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100" width="800" height="1100"><rect width="800" height="1100" fill="white"/><text x="28" y="50" font-family="Arial,sans-serif" font-weight="bold" font-size="25" fill="#222">XUIM ART / BLOBS</text><text x="28" y="80" font-family="Arial,sans-serif" font-size="15" fill="#555">Desenhe curvas que envolvam cada forma e sugiram volume.</text><text x="28" y="108" font-family="Arial,sans-serif" font-size="12" fill="#777">'+LEVELS[sheetLevel]+' · Nome: __________________________________  Data: ______________</text>'+cells+'<text x="28" y="1047" font-family="Arial,sans-serif" font-size="13" fill="#555">Imagine a superfície. Arredonde as voltas. Explore mais de uma leitura.</text><text x="28" y="1075" font-family="Arial,sans-serif" font-size="10" fill="#999">Folha '+esc(sheetSeed)+'</text></svg>';
 }
 function renderSheet(){const content=sheetMarkup();$('sheet-preview').innerHTML=content;$('print-sheet-content').innerHTML=content;}
 function openSheet(){$('sheet-level').value=String(s?.level??level);sheetSeed=nonce();renderSheet();$('sheet-dialog').showModal();}
 document.addEventListener('click',e=>{
  const close=e.target.closest('[data-close]');if(close){$(close.dataset.close).close();return;}
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.action)action(b.dataset.action);
  if(b.dataset.level!==undefined&&!s){level=Number(b.dataset.level);task=C.generate(level,'blobs-preview');render();}
  if(b.dataset.mode)start(b.dataset.mode);
  if(b.dataset.tool)setTool(b.dataset.tool);
  if(b.dataset.study!==undefined)openStudy(Number(b.dataset.study));
 });
 panel.addEventListener('input',e=>{if(e.target.id==='study-notes'&&s){s.note=e.target.value;saveDraft();}});
 panel.addEventListener('change',e=>{if(e.target.dataset.check!==undefined&&s){s.checks[Number(e.target.dataset.check)]=e.target.checked;saveDraft();}});
 $('confirm-button').addEventListener('click',()=>{const fn=confirmAction;confirmAction=null;$('confirm-dialog').close();fn?.();});
 $('home-button').addEventListener('click',home);$('help-button').addEventListener('click',()=>{
  const map=window.XuimKeys.read();$('shortcut-list').innerHTML=Object.entries({pen:'Caneta',eraser:'Borracha',undo:'Desfazer',redo:'Refazer',clear:'Limpar desenho',guide:'Mostrar / esconder exemplo',retry:'Recomeçar a mesma forma',confirm:'Rever / continuar'}).map(([id,label])=>'<span>'+label+'</span><kbd>'+esc(window.XuimKeys.label(map[id]))+'</kbd>').join('');$('help-dialog').showModal();
 });
 $('undo-button').addEventListener('click',undoStroke);$('redo-button').addEventListener('click',redoStroke);$('clear-button').addEventListener('click',clearDrawing);
 $('back-button').addEventListener('click',()=>{dashed=!dashed;toolbar();});$('stroke-width').addEventListener('change',e=>{width=Number(e.target.value);});
 $('new-sheet').addEventListener('click',()=>{sheetSeed=nonce();renderSheet();});$('sheet-level').addEventListener('change',renderSheet);
 $('download-sheet').addEventListener('click',()=>downloadBlob(new Blob([sheetMarkup()],{type:'image/svg+xml'}),'blobs-folha-'+LEVELS[Number($('sheet-level').value)].toLowerCase()+'.svg'));
 $('print-sheet').addEventListener('click',()=>window.print());$('download-study').addEventListener('click',()=>{if(selectedStudy)downloadImage(C.generate(selectedStudy.level,selectedStudy.seed),selectedStudy.strokes);});
 window.XuimKeys.register({pen:()=>setTool('pen'),eraser:()=>setTool('eraser'),undo:undoStroke,redo:redoStroke,clear:clearDrawing,guide:()=>toggleGuide('example'),retry:clearDrawing,confirm:()=>{if(!s||gesture)return false;if(s.stage==='review')return next();if(s.stage!=='draw')return false;if(s.mode==='tutorial'&&s.step<2){action('step-next');return true;}return goReview();}});
 gallery=(Array.isArray(getStored('gallery'))?getStored('gallery'):[]).map(validRecord).filter(Boolean).slice(0,6);render();renderGallery();
})();
