(() => {
 'use strict';
 const C=window.EllipseCore,$=id=>document.getElementById(id),svg=$('drawing'),diagram=$('diagram'),panel=$('side-panel'),board=document.querySelector('.board');
 const LEVELS=window.XuimTraining.levels;
 const DETAILS=['Inclinações suaves, com lados paralelos. Observe a abertura e a inclinação.','Perspectiva com profundidade: os lados mudam de tamanho aparente.','Planos mais inclinados e elipses mais estreitas.'];
 const state={phase:'home',level:0,mode:'free',session:'guided',round:0,results:[],task:null,points:[],shape:null,undo:[],pointer:null,construction:false,showAttempt:true,showTarget:true,revising:false,result:null};
 const T=window.XuimTraining,run=T.create('elipse',()=>judge(true));
 let scale=1,storageAvailable=true;

 const n=v=>Number(v.toFixed(2));
 const fmt=v=>v.toLocaleString('pt-BR',{maximumFractionDigits:1});
 const tell=message=>{$('live-message').textContent=message;};
 const path=(points,cls='diagram-line',close=false)=>`<path d="${points.map((p,i)=>`${i?'L':'M'}${n(p.x)},${n(p.y)}`).join(' ')}${close?'Z':''}" class="${cls}"/>`;
 const line=(a,b,cls='guide-line')=>path([a,b],cls);
 const dot=(p,cls='diagram-point',radius=4)=>`<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(radius)}" class="${cls}"/>`;
 const label=(p,value,cls='diagram-small')=>`<text x="${n(p.x)}" y="${n(p.y)}" class="${cls}" text-anchor="middle" style="font-size:${n(13/scale)}px">${value}</text>`;
 const copy=object=>JSON.parse(JSON.stringify(object));
 function reveal(){if(typeof board.scrollIntoView==='function')board.scrollIntoView({block:'start',behavior:'instant'});}
 function snapshot(){return{mode:state.mode,points:state.points.map(p=>({...p})),shape:state.shape?copy(state.shape):null};}
 function remember(){state.undo.push(snapshot());if(state.undo.length>40)state.undo.shift();}
 function attempt(){return state.mode==='shape'&&state.shape?C.ellipsePoints(state.shape):state.points;}
 function valid(){return attempt().length>2&&C.resample(attempt(),20).length>4;}
 function initialShape(){return{center:{x:450,y:305},a:170,b:95,angle:0};}
 function handles(shape=state.shape){const angle=shape.angle*Math.PI/180;return[
  {id:'center',point:shape.center},
  {id:'major',point:{x:shape.center.x+Math.cos(angle)*shape.a,y:shape.center.y+Math.sin(angle)*shape.a}},
  {id:'minor',point:{x:shape.center.x-Math.sin(angle)*shape.b,y:shape.center.y+Math.cos(angle)*shape.b}}
 ];}
 function home(){
  run.stop();state.phase='home';state.pointer=null;state.demo=C.generate(1,()=>.63);board.className='board';
  $('home-button').hidden=true;$('toolbar').hidden=true;$('session-bar').hidden=true;$('learning-note').hidden=false;$('target-legend').hidden=true;
  $('board-label').textContent='CÍRCULO EM PERSPECTIVA';$('board-count').textContent='XUIM ART / 02';
  $('board-title').textContent='O círculo mudou. Seu olhar também.';
  $('board-description').textContent='Complete a elipse que toca os quatro lados da face.';
  $('board-hint').textContent='CONSTRUA ANTES DE DETALHAR';
  panel.innerHTML=`<span class="eyebrow">ELIPSES E CILINDROS</span><h2>Encontre a curva<br>dentro da forma.</h2><p>Observe a face, construa sua elipse e compare os pontos de contato.</p>${T.setup(state.level,DETAILS,run.daily(state.level).tries)}<div class="config"><div><label class="field-label" for="tool-select">Ferramenta inicial</label><select class="select" id="tool-select"><option value="free">Traço livre · desenhar à mão</option><option value="shape">Elipse ajustável · construir com alças</option></select></div></div><div class="record"><span>Recorde clássico · ${LEVELS[state.level]}</span><strong>${run.best(state.level)===null?'Seu primeiro estudo':`${run.best(state.level)} / 100`}</strong></div>`;
  $('tool-select').value=state.mode;draw();
 }
 function begin(session){const selected={guided:'classic',practice:'tutorial'}[session]||session;if(!run.start(selected,state.level)){tell('Você já usou as três tentativas de hoje nesta dificuldade.');return home();}state.session=selected==='tutorial'?'practice':'guided';state.results=[];state.round=0;state.saved=false;window.scrollTo?.(0,0);$('home-button').hidden=false;$('learning-note').hidden=true;$('session-bar').hidden=false;newRound();}
 function newRound(){
  state.round++;run.next();state.support=true;state.ended=false;state.task=C.generate(state.level,run.random);state.revising=false;state.result=null;state.showAttempt=true;state.showTarget=true;state.construction=false;
  resetAttempt();state.phase='playing';renderPlay();updateBoard();updateProgress();draw();reveal();tell(`Rodada ${state.round}. Construa uma elipse dentro da face.`);
 }
 function resetAttempt(){state.points=[];state.shape=state.mode==='shape'?initialShape():null;state.undo=[];state.pointer=null;}
 function updateBoard(){
  const review=state.phase==='review';board.className=`board ${review?'reviewing':'playing'}`;
  $('board-label').textContent=`ELIPSES / ${LEVELS[state.level].toUpperCase()}`;
  $('board-count').textContent=state.session==='guided'&&run.mode!=='endless'?`${String(state.round).padStart(2,'0')} / 06`:`ESTUDO ${String(state.round).padStart(2,'0')}`;
  $('board-title').textContent=review?'Compare a curva e os contatos.':'Imagine o círculo neste plano.';
  $('board-description').textContent=review?'Vermelho: sua tentativa. Preto tracejado: a elipse projetada.':'A elipse deve encostar nos quatro lados, sem cruzar a borda.';
  $('board-hint').textContent=review?'OBSERVE A DIFERENÇA':state.mode==='shape'?'ARRASTE O CENTRO E AS ALÇAS':'DESENHE UMA VOLTA CONTÍNUA';
  $('target-legend').hidden=!review;$('toolbar').hidden=review;
 }
 function renderPlay(){
  panel.innerHTML=`<div class="task-number"><span class="step-label">${state.revising?'REVISÃO DA RODADA':'01 / CONSTRUIR'}</span><span>${LEVELS[state.level]}</span></div><h2>Observe o plano.<br>Complete a curva.</h2><p>${state.mode==='free'?'Desenhe uma elipse em um único movimento. Você pode refazer o traço antes de avaliar.':'Mova o centro, gire a alça lateral e ajuste a abertura pela segunda alça.'}</p><div class="instruction-card"><strong>${state.mode==='free'?'Uma volta, sem pressa':'Três relações para observar'}</strong><p>${state.mode==='free'?'Olhe para os quatro lados antes de começar. Imagine onde a curva vai encostar em cada um.':'Posição, inclinação e abertura. Compare a elipse inteira com a face, e não apenas um ponto.'}</p></div>${state.mode==='shape'?shapeControls():'<p class="mode-description">Mouse, toque ou caneta. Um novo traço substitui o anterior. A ferramenta Elipse ajustável está logo abaixo da prancheta.</p>'}<div class="action-stack"><button class="button primary" data-action="judge" id="judge-button">Avaliar minha elipse →</button><span id="attempt-status" class="control-help"></span></div>${state.revising?'<p class="revision-note">Revisão: a primeira tentativa continua no resumo.</p>':''}`;
  panel.insertAdjacentHTML('afterbegin',run.status());
  if(run.mode==='tutorial')panel.querySelector('.instruction-card').outerHTML=T.tutorial('Observe os quatro pontos azuis onde a curva toca a face. Acompanhe o contorno pontilhado com o traço ou ajuste sua elipse até ele. Depois, oculte o apoio e repita.',state.support);
  updateControls();
 }
 function shapeControls(){return`<div class="shape-adjustments"><div class="range-row"><label for="axis-a">Comprimento <output id="axis-a-value"></output></label><input id="axis-a" data-property="a" type="range" min="20" max="320" step="1" aria-label="Comprimento da elipse"></div><div class="range-row"><label for="axis-b">Abertura <output id="axis-b-value"></output></label><input id="axis-b" data-property="b" type="range" min="8" max="300" step="1" aria-label="Abertura da elipse"></div><div class="range-row"><label for="rotation">Inclinação <output id="rotation-value"></output></label><input id="rotation" data-property="angle" type="range" min="-180" max="180" step="1" aria-label="Inclinação da elipse"></div><div class="center-pad"><span>Mover centro</span><div><button data-move="left" aria-label="Mover para a esquerda">←</button><button data-move="up" aria-label="Mover para cima">↑</button><button data-move="down" aria-label="Mover para baixo">↓</button><button data-move="right" aria-label="Mover para a direita">→</button></div></div></div>`;}
 function updateControls(){
  const judge=$('judge-button');if(judge){judge.disabled=!valid();$('attempt-status').textContent=valid()?'Sua elipse está pronta para comparar.':'Desenhe uma curva para continuar.';}
  $('undo-button').disabled=state.undo.length===0;$('clear-button').disabled=state.points.length===0&&state.shape===null;
  for(const b of document.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode));
  if(state.mode==='shape'&&state.shape&&$('axis-a')){
   for(const[id,property]of[['axis-a','a'],['axis-b','b'],['rotation','angle']]){$(id).value=String(state.shape[property]);$(`${id}-value`).textContent=property==='angle'?`${fmt(state.shape[property])}°`:fmt(state.shape[property]*2);}
  }
 }
 function setMode(mode){
  if(state.phase!=='playing'||mode===state.mode)return;remember();state.mode=mode;state.points=[];state.shape=mode==='shape'?initialShape():null;state.pointer=null;renderPlay();updateBoard();draw();
 }
 function undo(){if(state.phase!=='playing'||!state.undo.length)return;const previous=state.undo.pop();Object.assign(state,previous);state.pointer=null;renderPlay();updateBoard();draw();}
 function clear(){if(state.phase!=='playing')return;remember();state.points=[];state.shape=state.mode==='shape'?initialShape():null;updateControls();draw();}
 function feedback(){const r=state.result;if(r.gap>45&&state.mode==='free')return{title:'A curva ficou aberta.',copy:'Há uma abertura entre o começo e o fim do traço. Observe esse trecho e feche a volta na próxima tentativa.'};if(r.coverage<55)return{title:'Compare a curva inteira.',copy:'Parte da elipse esperada ficou distante do seu desenho. Observe a posição, a abertura e os quatro contatos antes de refazer.'};if(r.precision<65)return{title:'Observe os trechos que escapam.',copy:'Algumas partes do traço se afastaram do alvo. Compare onde a curva encosta na face e onde ela passa além da borda.'};if(r.score>=95)return{title:'A curva encontrou o plano.',copy:'Sua elipse acompanha de perto a construção projetada. Observe os contatos para levar essa relação ao próximo desenho.'};return{title:'Você está perto da construção.',copy:'Compare a largura e a inclinação das duas curvas. Um pequeno ajuste pode aproximar os contatos dos quatro lados.'};}
 function judge(expired=false){
  if(state.phase!=='playing'||(!valid()&&!expired))return;run.stop();state.pointer=null;state.result=C.assess(state.task,attempt())||{score:0,coverage:0,precision:0,gap:0};if(!state.revising)state.ended=run.ended(state.result.score);
  if(!state.revising)state.results.push({task:state.task,points:attempt().map(p=>({...p})),result:state.result});
  state.phase='review';state.construction=false;updateBoard();renderReview();updateProgress();draw();reveal();tell(`${state.result.score} pontos. ${feedback().copy}`);
 }
 function renderReview(){
  const r=state.result,info=feedback(),first=state.results[state.round-1];
  panel.innerHTML=`<span class="step-label">02 / COMPARAR</span><h2>${info.title}</h2><div class="score-row"><strong class="score-value">${r.score}</strong><span class="score-label">DE 100 PONTOS</span></div><div class="metrics">${[['Cobertura da curva',r.coverage],['Proximidade do traço',r.precision]].map(([name,value])=>`<div class="category-row"><div class="category-label"><span>${name}</span><strong>${value}%</strong></div><div class="meter"><div style="width:${value}%"></div></div></div>`).join('')}</div><p class="feedback-copy">${info.copy}</p><div class="action-stack"><button class="button toggle-button" data-action="construction" aria-pressed="${state.construction}">${state.construction?'Ocultar':'Ver'} construção</button><button class="button toggle-button" data-action="attempt" aria-pressed="${state.showAttempt}">${state.showAttempt?'Ocultar':'Mostrar'} minha elipse</button><button class="button primary" data-action="next">${state.ended?'Ver resumo da sessão':'Próxima elipse'} →</button>${run.mode==='tutorial'?'<button class="text-button" data-action="retry">Tentar esta elipse novamente</button>':''}</div>${state.revising?`<p class="revision-note">Primeira tentativa: ${first.result.score} pontos. Revisão: ${r.score} pontos.</p>`:''}<p class="minor-note">${state.construction?'Azul: diagonais da face, que encontram o centro da face. Verde: eixos de simetria da elipse, que passam pelo centro da elipse. Na perspectiva, esses centros podem não coincidir.':'A comparação mede a proximidade com uma construção geométrica. Use-a para orientar o próximo ajuste.'}</p>`;
 }
 function next(){if(state.phase!=='review')return;if(state.session==='guided'&&state.round===6)return summary(true);newRound();}
 function retry(){if(state.phase!=='review'||run.mode!=='tutorial')return;state.revising=true;state.phase='playing';state.construction=false;state.showAttempt=true;resetAttempt();renderPlay();updateBoard();draw();reveal();}
 function updateProgress(){
  $('session-caption').textContent=state.session==='guided'&&run.mode!=='endless'?`${state.results.length} DE 6 RESPONDIDAS`:`${state.results.length} ELIPSES RESPONDIDAS`;
  $('round-list').innerHTML=state.session==='guided'&&run.mode!=='endless'?Array.from({length:6},(_,i)=>`<span class="round-item ${i===state.round-1?'current':i<state.results.length?'done':''}" title="Elipse ${i+1}${state.results[i]?`: ${state.results[i].result.score} pontos`:''}"></span>`).join(''):'';
  $('finish-button').hidden=state.session!=='practice'||!state.results.length;
 }
 function summary(complete=false){
  if(!state.results.length)return home();run.stop();state.phase='summary';state.pointer=null;state.average=Math.round(state.results.reduce((s,r)=>s+r.result.score,0)/state.results.length);
  let record=false;if(complete&&!state.saved){run.save(state.average,state.results.length);record=run.newBest;state.saved=true;}storageAvailable=run.available;
  $('storage-warning').hidden=storageAvailable;$('toolbar').hidden=true;$('session-bar').hidden=true;$('target-legend').hidden=false;board.className='board';
  $('board-label').textContent=complete?'SESSÃO CONCLUÍDA':'RESUMO DO TREINO';$('board-count').textContent=`${state.results.length} ${state.results.length===1?'ELIPSE':'ELIPSES'}`;$('board-title').textContent='Cada curva deixa uma descoberta.';$('board-description').textContent='Suas primeiras tentativas, com o alvo para comparação.';$('board-hint').textContent='SEU PROCESSO IMPORTA';
  panel.innerHTML=`<span class="eyebrow">03 / CONTINUAR</span><h2>O plano começa<br>a fazer sentido.</h2><div class="score-row"><strong class="score-value">${state.average}</strong><span class="score-label">MÉDIA DA SESSÃO</span></div><p class="feedback-copy">${record?'Esta é sua melhor sessão neste nível.':'Compare as tentativas: posição, abertura e inclinação trabalham juntas.'}</p><div class="feedback-tip"><strong>Leve para o sketchbook</strong>Desenhe três caixas e coloque uma elipse em cada face. Depois, transforme uma delas em um cilindro.</div><div class="action-stack"><button class="button primary" data-action="again">Jogar novamente →</button><button class="button" data-action="practice">Voltar ao tutorial</button><button class="text-button" data-action="download">Baixar resumo do treino ↗</button></div><p class="minor-note">${complete?'Resultado salvo neste navegador.':'Treinos e sessões parciais não alteram o recorde.'}</p>`;
  panel.insertAdjacentHTML('afterbegin',`<p class="training-description">${T.modes[run.mode]} · ${LEVELS[state.level]}${run.mode==='endless'?' · '+Math.max(0,state.results.length-1)+' rodadas superadas':''}</p>`);
  draw();reveal();tell(`Sessão concluída. Média de ${state.average} pontos.`);
 }
 function draw(){
  const bounds=svg.getBoundingClientRect();scale=Math.min(bounds.width/900,bounds.height/620)||1;
  if(state.phase==='summary')return drawSummary();
  const task=state.phase==='home'?state.demo:state.task;if(!task)return;
  let markup=path(task.face,'face-fill',true)+path(task.face,'diagram-line',true);
  if(state.phase==='home'){
   markup+=path(task.target,'attempt-line')+label({x:450,y:565},'O MESMO CÍRCULO, VISTO EM PERSPECTIVA');
   for(const p of task.contacts)markup+=dot(p,'attempt-point',5/scale);
  }else{
   const review=state.phase==='review';
   if(review&&state.construction){
    markup+=line(task.face[0],task.face[2],'face-diagonal')+line(task.face[1],task.face[3],'face-diagonal');
    const h=handles(task.ellipse),c=task.ellipse.center;
    for(const handle of h.slice(1)){const p=handle.point;markup+=line({x:c.x-(p.x-c.x)*1.2,y:c.y-(p.y-c.y)*1.2},{x:c.x+(p.x-c.x)*1.2,y:c.y+(p.y-c.y)*1.2},'ellipse-axis');}
    markup+=dot(task.center,'face-center',4/scale)+dot(c,'ellipse-center',3/scale);
    for(const p of task.contacts)markup+=dot(p,'target-contact',4/scale);
   }
   if(state.showAttempt)markup+=path(attempt(),'attempt-line');
   if(review&&state.showTarget)markup+=path(task.target,'target-line');
   if(!review&&run.mode==='tutorial'&&state.support){markup+=path(task.target,'tutorial-overlay');for(const p of task.contacts)markup+=dot(p,'tutorial-dot',6/scale);}
   if(!review&&state.mode==='shape'&&state.shape){
    const h=handles();for(const handle of h.slice(1))markup+=line(state.shape.center,handle.point,'diagram-soft');
    markup+=dot(h[0].point,'center-handle',6/scale)+dot(h[1].point,'handle',6/scale)+dot(h[2].point,'handle',6/scale);
   }
   if(!review&&state.mode==='free'&&state.points.length===0)markup+=label({x:450,y:570},'DESENHE UMA VOLTA DENTRO DA FACE');
  }
  diagram.innerHTML=markup;
  $('construction-legend').hidden=!(state.phase==='review'&&state.construction);
 }
 function drawSummary(){
  const recent=state.results.slice(-6),cols=Math.min(recent.length,window.innerWidth<=520?2:3),rows=Math.ceil(recent.length/cols),cellW=820/cols,cellH=Math.min(recent.length===1?470:245,540/rows);
  let markup='';for(let i=0;i<recent.length;i++){
   const r=recent[i],cx=40+(i%cols)*cellW+cellW/2,cy=35+Math.floor(i/cols)*cellH+cellH/2;
   const allPoints=[...r.task.face,...r.points],minX=Math.min(...allPoints.map(p=>p.x)),maxX=Math.max(...allPoints.map(p=>p.x)),minY=Math.min(...allPoints.map(p=>p.y)),maxY=Math.max(...allPoints.map(p=>p.y));
   const thumbScale=Math.min((cellW-32)/(maxX-minX),(cellH-64)/(maxY-minY));
   markup+=`<g transform="translate(${cx-(minX+maxX)/2*thumbScale},${cy-18-(minY+maxY)/2*thumbScale}) scale(${thumbScale})">`+path(r.task.face,'diagram-line',true)+path(r.points,'attempt-line')+path(r.task.target,'target-line')+'</g>';
   markup+=label({x:cx,y:cy+cellH/2-8},`${state.results.length-recent.length+i+1} · ${r.result.score} pts`);
  }
  diagram.innerHTML=markup;
  $('construction-legend').hidden=!(state.phase==='review'&&state.construction);
 }
 function position(e){const matrix=svg.getScreenCTM();if(!matrix)return null;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());return{x:C.clamp(p.x,0,900),y:C.clamp(p.y,0,620)};}
 function moveShape(direction,step=4){if(state.phase!=='playing'||state.mode!=='shape'||!state.shape)return;remember();const p=state.shape.center;if(direction==='left')p.x-=step;if(direction==='right')p.x+=step;if(direction==='up')p.y-=step;if(direction==='down')p.y+=step;p.x=C.clamp(p.x,30,870);p.y=C.clamp(p.y,30,590);draw();updateControls();}
 svg.addEventListener('pointerdown',e=>{
  if(state.phase!=='playing'||state.pointer||e.button!==0)return;
  const p=position(e);if(!p)return;e.preventDefault();svg.focus({preventScroll:true});
  if(state.mode==='shape'){
   if(!state.shape)state.shape=initialShape();
   const nearest=handles().sort((a,b)=>C.distance(p,a.point)-C.distance(p,b.point))[0];
   if(C.distance(p,nearest.point)>24/scale)return;
   remember();state.pointer={id:e.pointerId,handle:nearest.id,start:p,shape:copy(state.shape)};
  }else{remember();state.points=[p];state.pointer={id:e.pointerId,handle:'free'};}
  svg.setPointerCapture(e.pointerId);draw();updateControls();
 });
 svg.addEventListener('pointermove',e=>{
  if(state.phase!=='playing'||state.pointer?.id!==e.pointerId)return;
  const p=position(e);if(!p)return;
  if(state.pointer.handle==='free'){
   const events=e.getCoalescedEvents?.()||[e];for(const ev of events.length?events:[e]){const q=position(ev);if(q&&state.points.length<2400&&C.distance(q,state.points[state.points.length-1])>1.5)state.points.push(q);}
  }else{
   const sh=state.shape,base=state.pointer.shape;
   if(state.pointer.handle==='center'){sh.center={x:C.clamp(base.center.x+p.x-state.pointer.start.x,30,870),y:C.clamp(base.center.y+p.y-state.pointer.start.y,30,590)};}
   else if(state.pointer.handle==='major'){sh.a=C.clamp(C.distance(p,sh.center),20,320);sh.angle=Math.atan2(p.y-sh.center.y,p.x-sh.center.x)*180/Math.PI;}
   else{const angle=sh.angle*Math.PI/180;sh.b=C.clamp(Math.abs(-(p.x-sh.center.x)*Math.sin(angle)+(p.y-sh.center.y)*Math.cos(angle)),8,300);}
  }
  draw();updateControls();
 });
 function finishPointer(e){
  if(state.pointer?.id!==e.pointerId)return;
  if(state.pointer.handle==='free'&&state.points.length>12&&C.distance(state.points[0],state.points[state.points.length-1])<24)state.points.push({...state.points[0]});
  state.pointer=null;draw();updateControls();
 }
 svg.addEventListener('pointerup',finishPointer);svg.addEventListener('lostpointercapture',finishPointer);
 svg.addEventListener('pointercancel',e=>{if(state.pointer?.id===e.pointerId){state.pointer=null;if(state.undo.length)Object.assign(state,state.undo.pop());draw();updateControls();}});
 document.addEventListener('keydown',e=>{
  if(document.querySelector('dialog[open]'))return;
  if(e.target===svg&&e.key.startsWith('Arrow')&&state.mode==='shape'){e.preventDefault();moveShape(e.key.slice(5).toLowerCase(),e.shiftKey?1:4);}
 });
 window.XuimKeys.register({
  pen:()=>{if(state.phase!=='playing')return false;setMode('free');},
  line:()=>{if(state.phase!=='playing')return false;setMode('shape');},
  confirm:()=>{if(state.phase==='playing')judge();else if(state.phase==='review')next();else return false;},
  undo:()=>{if(state.phase!=='playing')return false;undo();},
  clear:()=>{if(state.phase!=='playing')return false;clear();},
  guide:()=>{if(state.phase==='playing'&&run.mode==='tutorial'){state.support=!state.support;renderPlay();draw();return;}if(state.phase!=='review')return false;state.construction=!state.construction;renderReview();draw();},
  retry:()=>{if(state.phase!=='review')return false;retry();}
 });
 $('toolbar').addEventListener('click',e=>{const mode=e.target.closest('[data-mode]');if(mode)setMode(mode.dataset.mode);});
 $('undo-button').addEventListener('click',undo);$('clear-button').addEventListener('click',clear);
 panel.addEventListener('input',e=>{const property=e.target.dataset.property;if(property&&state.shape&&state.phase==='playing'){remember();state.shape[property]=Number(e.target.value);draw();updateControls();}});
 panel.addEventListener('change',e=>{if(e.target.id==='tool-select')state.mode=e.target.value;});
 function download(){
  const contents=['XUIM ART — ELIPSE EM PERSPECTIVA',new Date().toLocaleString('pt-BR'),`Nível: ${LEVELS[state.level]}`,`Média: ${state.average}/100`,'',...state.results.map((r,i)=>`Elipse ${i+1} | ${r.result.score}/100 | cobertura ${r.result.coverage}% | proximidade ${r.result.precision}%`),'','Resultados da primeira tentativa de cada rodada. A nota é uma orientação geométrica para estudo.'];
  const url=URL.createObjectURL(new Blob(['\ufeff'+contents.join('\n')],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='xuim-art_elipse_resumo.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 panel.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.trainingMode){begin(b.dataset.trainingMode);return;}
  if(b.dataset.level!==undefined){state.level=Number(b.dataset.level);home();return;}
  if(b.dataset.move){moveShape(b.dataset.move);return;}
  switch(b.dataset.action){case'support':state.support=!state.support;renderPlay();draw();break;case'session':begin('classic');break;case'again':begin(run.mode);break;case'practice':begin('practice');break;case'judge':judge();break;case'next':next();break;case'retry':retry();break;case'construction':state.construction=!state.construction;renderReview();draw();reveal();break;case'attempt':state.showAttempt=!state.showAttempt;renderReview();draw();reveal();break;case'download':download();break;}
 });
 $('home-button').addEventListener('click',()=>{if(state.phase==='summary')return home();$('partial-button').disabled=!state.results.length;$('exit-dialog').showModal();});
 $('exit-button').addEventListener('click',()=>{$('exit-dialog').close();home();});
 $('partial-button').addEventListener('click',()=>{$('exit-dialog').close();summary();});
 $('finish-button').addEventListener('click',()=>summary());
 $('help-button').addEventListener('click',()=>$('help-dialog').showModal());
 for(const b of document.querySelectorAll('[data-close]'))b.addEventListener('click',()=>b.closest('dialog').close());
 new ResizeObserver(draw).observe(svg);$('storage-warning').hidden=storageAvailable;home();
})();
