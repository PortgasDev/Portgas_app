(()=>{
 'use strict';
 const C=window.CylinderCore,T=window.XuimTraining,K=window.XuimKeys,$=id=>document.getElementById(id);
 const timing={seconds:90,endlessStart:90,minSeconds:45,step:5};
 const run=T.create('cilindros',()=>judge(true),timing);
 const NAMES=['Elipse A','Elipse B','Lateral 1','Lateral 2'];
 const DETAILS=['Extremidades iguais, sem redução por distância. Comece entendendo as conexões.','Perspectiva e direções variadas. Compare o tamanho e a abertura das duas elipses.','Mais escorço: as extremidades se aproximam e podem se sobrepor. Leia o volume inteiro.'];
 const TIPS=['Envolva a cruz A com uma curva contínua. As marcas curtas indicam a abertura: mantenha as pontas arredondadas.','Agora envolva a cruz B. Compare as duas elipses: elas pertencem ao mesmo volume, mas podem parecer diferentes.','Ligue as elipses por fora. A lateral deve encostar nas duas curvas sem atravessá-las. Pode começar por qualquer lado.','Feche o outro lado do volume. Procure uma conexão contínua, sem quinas nas curvas.'];
 const state={phase:'home',level:0,selected:0,tool:'pen',task:null,parts:[null,null,null,null],history:[],pointer:null,results:[],support:true,solution:true,student:true,sections:false};
 const board=document.querySelector('.board'),svg=$('drawing'),panel=$('side-panel');
 const clone=value=>JSON.parse(JSON.stringify(value));
 const path=points=>points?.length?points.map((p,i)=>(i?'L':'M')+p.x.toFixed(2)+','+p.y.toFixed(2)).join(' '):'';
 const stroke=(points,cls)=>'<path class="'+cls+'" d="'+path(points)+'"/>';
 const dot=(p,r,cls)=>'<circle class="'+cls+'" cx="'+p.x+'" cy="'+p.y+'" r="'+r+'"/>';
 const position=(e,axis,sign)=>{const a=e.angle*Math.PI/180+(axis==='b'?Math.PI/2:0),r=e[axis]*sign;return{x:e.center.x+r*Math.cos(a),y:e.center.y+r*Math.sin(a)};};
 const valid=part=>part?.points.length>=2&&part.points.some(p=>C.distance(p,part.points[0])>4);
 const count=()=>state.parts.filter(valid).length;
 const announce=copy=>{$('live-message').textContent=copy;};
 function snapshot(){state.history.push({parts:clone(state.parts),selected:state.selected});if(state.history.length>40)state.history.shift();}
 function setBoard(title,description){$('board-title').textContent=title;$('board-description').textContent=description;}
 function controlsState(){
  $('toolbar').hidden=state.phase!=='draw';$('home-button').hidden=state.phase==='home';
  document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(state.tool===b.dataset.tool)));
  $('undo-button').disabled=!state.history.length;$('clear-button').disabled=!state.parts[state.selected];
  board.classList.toggle('playing',state.phase==='draw');board.classList.toggle('reviewing',state.phase==='review');
 }
 function draw(){
  const t=state.task;if(!t)return;
  let markup=stroke(t.axis,'guide center-axis');
  t.ellipses.forEach((e,i)=>{
   const a=position(e,'a',-1),b=position(e,'a',1),m=position(e,'b',-1),n=position(e,'b',1);
   markup+=stroke([a,b],'guide');
   const angle=e.angle*Math.PI/180,dx=Math.cos(angle)*7,dy=Math.sin(angle)*7;
   for(const p of[m,n])markup+=stroke([{x:p.x-dx,y:p.y-dy},{x:p.x+dx,y:p.y+dy}],'opening');
   const label={x:a.x-10,y:a.y-18};
   markup+=dot(e.center,3,'guide')+'<text class="end-label" x="'+label.x+'" y="'+label.y+'">'+['A','B'][i]+'</text>';
  });
  const home=state.phase==='home'||state.phase==='summary';
  if(home||(state.phase==='draw'&&run.mode==='tutorial'&&state.support))t.parts.forEach((p,i)=>{markup+=stroke(p,home?'solution':'support'+(i===state.selected?' active':''));});
  if(state.phase==='review'&&state.sections)t.sections.forEach(p=>{markup+=stroke(p,'section-line');});
  if(state.student&&!home)state.parts.forEach((part,i)=>{if(part)markup+=stroke(part.points,'student'+(state.phase==='draw'&&i!==state.selected?' inactive':''));});
  if(state.phase==='review'&&state.solution){t.parts.forEach(p=>{markup+=stroke(p,'solution');});t.sides.flat().forEach(p=>{markup+=dot(p,4,'tangent');});}
  if(state.phase==='draw'&&state.tool==='shape'&&state.parts[state.selected]?.shape)markup+=dot(state.parts[state.selected].shape.center,7,'center-handle');
  if(home)markup+='<text class="preview-label" x="450" y="530" text-anchor="middle">01 · ELIPSES    →    02 · LATERAIS    →    03 · VOLUME</text>';
  $('diagram').innerHTML=markup;controlsState();
 }
 function progress(){
  $('session-bar').hidden=state.phase==='home';
  const total=run.mode==='classic'||run.mode==='daily'?6:run.round;
  $('session-caption').textContent=T.modes[run.mode]+' · '+T.levels[state.level];
  $('board-count').textContent=state.phase==='home'?'XUIM ART / 04':'CILINDRO '+run.round+(total===6?' / 6':'');
  $('round-list').innerHTML=Array.from({length:Math.min(total,40)},(_,i)=>'<span class="round-item '+(i<state.results.length?'done':i===run.round-1?'current':'')+'" aria-label="Rodada '+(i+1)+'"></span>').join('');
 }
 function home(){
  run.stop();state.phase='home';state.pointer=null;state.task=C.generate(state.level,T.seeded('cilindros-preview'));state.parts=[null,null,null,null];state.history=[];
  $('board-label').textContent='CONSTRUÇÃO DE VOLUME';setBoard('O volume começa nas extremidades.','As guias indicam direção e abertura. Você desenha as curvas e as conexões.');
  const best=run.best(state.level);
  panel.innerHTML='<span class="eyebrow">DO PLANO AO VOLUME</span><h2>Construa por partes.</h2><p class="panel-copy">Dê a volta em cada guia e una as curvas. Comece pelo tutorial para ver a construção.</p>'+T.setup(state.level,DETAILS,run.daily(state.level).tries,false,timing)+'<div class="record"><span>Recorde clássico · '+T.levels[state.level]+'</span><strong>'+(best===null?'—':best+' / 100')+'</strong></div><p class="home-caption">Caneta, mouse ou toque. Se preferir, use “Forma / reta” para ajustar as elipses e traçar as laterais.</p>'+(run.available?'':'<p class="storage-warning">O navegador não permitiu salvar os resultados.</p>');
  draw();progress();
 }
 function begin(mode){
  if(!run.start(mode,state.level))return home();
  state.results=[];state.support=true;state.tool='pen';nextRound();
 }
 function resetDrawing(){state.parts=[null,null,null,null];state.selected=0;state.history=[];state.pointer=null;state.sections=false;state.solution=true;state.student=true;}
 function nextRound(){
  run.next();state.task=C.generate(state.level,run.random);resetDrawing();state.phase='draw';renderPlay();progress();
  if(window.innerWidth<821)board.scrollIntoView({block:'start',behavior:'instant'});
 }
 function shapeControls(){
  const shape=state.parts[state.selected]?.shape;
  if(state.tool!=='shape'||state.selected>1||!shape)return'';
  return '<div class="shape-controls"><label>Largura <input id="shape-a" aria-label="Largura da elipse" type="range" min="15" max="240" step="1" value="'+shape.a+'"></label><label>Abertura <input id="shape-b" aria-label="Abertura da elipse" type="range" min="8" max="230" step="1" value="'+shape.b+'"></label><label>Inclinação <input id="shape-angle" aria-label="Inclinação da elipse" type="range" min="-180" max="180" step="1" value="'+shape.angle+'"></label><div class="move-pad"><span>Centro</span>'+[['←',-4,0],['↑',0,-4],['↓',0,4],['→',4,0]].map(([label,x,y])=>'<button data-move="'+x+','+y+'" aria-label="Mover centro '+label+'">'+label+'</button>').join('')+'</div></div>';
 }
 function ensureShape(){
  if(state.tool==='shape'&&state.selected<2&&!state.parts[state.selected]?.shape){
   snapshot();const shape={center:{...state.task.ellipses[state.selected].center},a:75,b:45,angle:0};state.parts[state.selected]={shape,points:C.ellipsePoints(shape)};
  }
 }
 function renderPlay(){
  const index=state.selected,n=count();
  $('board-label').textContent=T.modes[run.mode].toUpperCase()+' · '+T.levels[state.level].toUpperCase();
  setBoard(['Comece pela curva A.','Dê forma à outra extremidade.','Encontre a primeira conexão.','Complete o outro lado.'][index],index<2?'Desenhe uma elipse inteira envolvendo a cruz '+['A','B'][index]+'.':'Ligue uma curva à outra sem cortar as elipses.');
  panel.innerHTML=run.status()+'<span class="eyebrow">'+(run.mode==='tutorial'?'TUTORIAL · UM PASSO DE CADA VEZ':'SUA CONSTRUÇÃO')+'</span><h2>'+NAMES[index]+'.</h2><div class="parts" role="group" aria-label="Parte do cilindro">'+NAMES.map((name,i)=>'<button class="part '+(valid(state.parts[i])?'done':'')+'" data-part="'+i+'" aria-pressed="'+(index===i)+'"><b>0'+(i+1)+'</b><span>'+name+'<small>'+(valid(state.parts[i])?'Desenhada · pode refazer':'Ainda por desenhar')+'</small></span></button>').join('')+'</div><p class="step-copy">'+TIPS[index]+'</p>'+shapeControls()+(run.mode==='tutorial'?'<button class="support-toggle" data-action="support" aria-pressed="'+state.support+'">'+(state.support?'Ocultar':'Mostrar')+' apoio pontilhado</button>':'')+'<div class="action-stack">'+(index<3?'<button class="button '+(n===4?'':'primary')+' wide" data-action="part-next">Próxima parte →</button>':'')+'<button id="judge-button" class="button '+(index===3||n===4?'primary':'')+' wide" data-action="judge" '+(!n?'disabled':'')+'>Comparar construção <span>'+n+'/4</span></button></div><p class="micro-note">'+(state.tool==='pen'?'Um gesto por parte. Para refazer, desenhe de novo com essa parte selecionada.':index<2?'Ajuste a forma nos controles. Arraste o centro vermelho para reposicionar.':'Arraste do início ao fim para traçar uma lateral reta.')+'</p>'+(run.mode==='tutorial'?'<p class="micro-note">Sem cronômetro. Faça as quatro partes e compare; as partes vazias contam como zero.</p>':'');
  draw();
 }
 function setTool(tool){if(state.phase!=='draw'||state.pointer)return false;state.tool=tool;ensureShape();renderPlay();return true;}
 function selectPart(index){if(state.pointer)return;state.selected=index;ensureShape();renderPlay();announce(NAMES[index]+' selecionada.');}
 function judge(expired=false){
  if(state.phase!=='draw'||(!count()&&!expired))return false;
  if(state.pointer)endPointer(null,false);
  run.stop();state.phase='review';state.result=C.assess(state.task,state.parts.map(p=>p?.points||[]));state.results.push(state.result.score);state.expired=expired;
  renderReview();progress();announce('Construção avaliada: '+state.result.score+' de 100.');return true;
 }
 function renderReview(){
  const result=state.result,weak=result.parts.reduce((idx,p,i)=>p.score<result.parts[idx].score?i:idx,0);
  $('board-label').textContent='OBSERVAR · COMPARAR · AJUSTAR';setBoard('Agora, veja as conexões.','Vermelho: sua construção. Verde: referência e pontos de tangência.');
  const missing=count()<4;
  panel.innerHTML='<span class="eyebrow">'+(state.expired?'TEMPO ENCERRADO':'CONSTRUÇÃO COMPARADA')+'</span><h2>'+(result.score>=85?'O volume faz sentido.':result.score>=60?'As partes estão se encontrando.':'Observe uma parte de cada vez.')+'</h2><div class="score-row"><strong class="score-value">'+result.score+'</strong><span class="score-label">DE 100 PONTOS</span></div><p class="panel-copy">'+(missing?'Faltaram partes. Cada uma corresponde a um quarto da nota.':result.score>=85?'Compare os encaixes e a continuidade das curvas.':'Repare em '+NAMES[weak]+': '+(weak<2?'compare abertura, posição e arredondamento.':'procure o ponto em que a reta apenas toca a curva.'))+'</p><div class="metric-list">'+result.parts.map((p,i)=>'<div class="metric-row"><span>'+NAMES[i]+'</span><strong>'+p.score+'</strong><small>'+(p.error===null?'Sem traço suficiente.':'Desvio médio: '+(p.error/900*100).toFixed(1).replace('.',',')+'% da largura da prancha · cobertura '+p.coverage+'%')+'</small></div>').join('')+'</div><div class="review-toggles"><button data-action="solution" aria-pressed="'+state.solution+'">Referência</button><button data-action="student" aria-pressed="'+state.student+'">Meu desenho</button><button data-action="sections" aria-pressed="'+state.sections+'">Cortes internos</button></div>'+(state.sections?'<p class="micro-note section-note">As curvas ocres mostram três cortes do mesmo cilindro, entre as extremidades.</p>':'')+'<div class="action-stack"><button class="button primary wide" data-action="next">'+(run.ended(result.score)?'Ver resultado da sessão':'Próximo cilindro →')+'</button>'+(run.mode==='tutorial'?'<button class="button wide" data-action="retry">Refazer este cilindro</button>':'')+'</div><p class="micro-note">A nota compara o traçado com esta referência. As guias de abertura definem a elipse esperada; não há encaixe automático do traço.</p>';
  draw();
 }
 function summary(){
  state.phase='summary';run.stop();const average=Math.round(state.results.reduce((a,b)=>a+b,0)/state.results.length);run.save(average,state.results.length);
  $('board-label').textContent='SESSÃO CONCLUÍDA';setBoard('Cada construção treina seu olhar.','Compare as rodadas e volte ao tutorial para praticar as conexões.');
  panel.innerHTML='<span class="eyebrow">'+T.modes[run.mode].toUpperCase()+' · '+T.levels[state.level].toUpperCase()+'</span><h2>Um volume de cada vez.</h2><div class="score-row"><strong class="score-value">'+average+'</strong><span class="score-label">MÉDIA DA SESSÃO</span></div>'+(run.mode==='endless'?'<p class="panel-copy">'+Math.max(0,state.results.length-1)+' cilindros acima da meta. A última rodada ficou abaixo de '+run.target()+'.</p>':'')+'<div class="summary-bars">'+state.results.map((score,i)=>'<div><span>0'+(i+1)+'</span><progress max="100" value="'+score+'" aria-label="Cilindro '+(i+1)+': '+score+' pontos"></progress><strong>'+score+'</strong></div>').join('')+'</div><p class="micro-note">'+(!run.available?'Não foi possível salvar o resultado neste navegador.':run.newBest?'Novo recorde neste modo e dificuldade.':'Resultado registrado neste navegador.')+'</p><div class="action-stack"><button class="button primary wide" data-action="home">Escolher próximo treino</button><button class="button wide" data-action="tutorial">Praticar sem tempo</button></div>';
  draw();progress();announce('Sessão concluída. Média de '+average+' pontos.');
 }
 function retry(){if(state.phase!=='review'||run.mode!=='tutorial')return false;state.results.pop();resetDrawing();state.phase='draw';renderPlay();progress();return true;}
 function undo(){if(state.phase!=='draw'||state.pointer||!state.history.length)return false;const previous=state.history.pop();state.parts=previous.parts;state.selected=previous.selected;renderPlay();return true;}
 function clear(){if(state.phase!=='draw'||state.pointer||!state.parts[state.selected])return false;snapshot();state.parts[state.selected]=null;state.tool='pen';renderPlay();return true;}
 function toggleSupport(){if(state.phase!=='draw'||run.mode!=='tutorial')return false;state.support=!state.support;renderPlay();return true;}
 function next(){if(state.phase!=='review')return false;if(run.ended(state.result.score))summary();else nextRound();return true;}
 function toPoint(event){const matrix=svg.getScreenCTM();return matrix?new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse()):null;}
 function inBoard(p){return p&&p.x>=0&&p.x<=900&&p.y>=0&&p.y<=560;}
 svg.addEventListener('pointerdown',event=>{
  if(state.phase!=='draw'||state.pointer||event.button!==0||event.isPrimary===false)return;
  const p=toPoint(event);if(!inBoard(p))return;event.preventDefault();snapshot();svg.focus({preventScroll:true});
  const part=state.parts[state.selected];
  if(state.tool==='shape'&&state.selected<2){
   // Grabbing anywhere preserves the offset; a tap does not teleport the ellipse.
   if(!part?.shape){state.history.pop();return;}
   state.pointer={id:event.pointerId,start:p,center:{...part.shape.center},moving:true};
  }else{state.pointer={id:event.pointerId,start:p};state.parts[state.selected]={points:[{x:p.x,y:p.y}]};}
  svg.setPointerCapture(event.pointerId);draw();
 });
 function appendPointer(event){
  const pointer=state.pointer;if(!pointer||event.pointerId!==pointer.id)return;
  const p=toPoint(event);if(!p)return;const part=state.parts[state.selected];
  if(pointer.moving){part.shape.center={x:C.clamp(pointer.center.x+p.x-pointer.start.x,20,880),y:C.clamp(pointer.center.y+p.y-pointer.start.y,20,540)};part.points=C.ellipsePoints(part.shape);}
  else if(inBoard(p)){
   if(state.tool==='shape')part.points=[{x:pointer.start.x,y:pointer.start.y},{x:p.x,y:p.y}];
   else if(C.distance(p,part.points[part.points.length-1])>.4&&part.points.length<8000)part.points.push({x:p.x,y:p.y});
  }
 }
 svg.addEventListener('pointermove',event=>{
  if(!state.pointer||event.pointerId!==state.pointer.id)return;event.preventDefault();
  const events=event.getCoalescedEvents?.();for(const point of events?.length?events:[event])appendPointer(point);draw();
 });
 function endPointer(event,cancelled){
  if(!state.pointer||(event&&event.pointerId!==state.pointer.id))return;
  if(event&&!cancelled)appendPointer(event);
  const id=state.pointer.id;state.pointer=null;
  if(cancelled||!valid(state.parts[state.selected])){const previous=state.history.pop();state.parts=previous.parts;}
  if(svg.hasPointerCapture?.(id))svg.releasePointerCapture(id);
  renderPlay();
 }
 svg.addEventListener('pointerup',event=>endPointer(event,false));svg.addEventListener('pointercancel',event=>endPointer(event,true));
 svg.addEventListener('lostpointercapture',event=>{if(state.pointer)endPointer(event,true);});
 svg.addEventListener('contextmenu',e=>e.preventDefault());
 panel.addEventListener('input',event=>{
  if(!event.target.id.startsWith('shape-')||state.phase!=='draw')return;
  const part=state.parts[state.selected];if(!part?.shape)return;
  snapshot();const field=event.target.id.slice(6);part.shape[field]=Number(event.target.value);part.points=C.ellipsePoints(part.shape);draw();
 });
 document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.close){$(button.dataset.close).close();return;}
  if(state.pointer)return;
  if(button.dataset.level!==undefined&&state.phase==='home'){state.level=Number(button.dataset.level);home();return;}
  if(button.dataset.trainingMode&&state.phase==='home'){begin(button.dataset.trainingMode);return;}
  if(button.dataset.tool){setTool(button.dataset.tool);return;}
  if(button.dataset.part!==undefined&&state.phase==='draw'){selectPart(Number(button.dataset.part));return;}
  if(button.dataset.move&&state.phase==='draw'){
   const shape=state.parts[state.selected]?.shape;if(!shape)return;snapshot();const[x,y]=button.dataset.move.split(',').map(Number);shape.center.x=C.clamp(shape.center.x+x,20,880);shape.center.y=C.clamp(shape.center.y+y,20,540);state.parts[state.selected].points=C.ellipsePoints(shape);draw();return;
  }
  const action=button.dataset.action;
  if(action==='part-next'&&state.phase==='draw')selectPart(Math.min(3,state.selected+1));
  else if(action==='judge')judge();else if(action==='support')toggleSupport();else if(action==='next')next();else if(action==='retry')retry();
  else if(['solution','student','sections'].includes(action)&&state.phase==='review'){state[action]=!state[action];renderReview();}
  else if(action==='home')home();else if(action==='tutorial')begin('tutorial');
 });
 $('undo-button').onclick=undo;$('clear-button').onclick=clear;
 $('help-button').onclick=()=>$('help-dialog').showModal();
 $('home-button').onclick=()=>{if(state.phase==='summary')home();else $('exit-dialog').showModal();};
 $('exit-button').onclick=()=>{$('exit-dialog').close();home();};
 K.register({pen:()=>setTool('pen'),line:()=>setTool('shape'),undo,clear,retry,guide:()=>state.phase==='review'?(state.solution=!state.solution,renderReview(),true):toggleSupport(),confirm:()=>state.phase==='draw'?judge():next()});
 home();
})();
