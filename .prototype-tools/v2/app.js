'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const assets = {volumes:'__ASSET_VOLUMES__',figure:'__ASSET_FIGURE__',heads:'__ASSET_HEADS__',portrait:'__ASSET_PORTRAIT__',pixel:'__ASSET_PIXEL__'};
const references = [
 {id:'volumes',title:'Volumes em perspectiva',description:'Caixas, cilindro e leitura dos planos.',tag:'CONSTRUÇÃO'},
 {id:'heads',title:'Planos da cabeça',description:'Da estrutura simples à forma complexa.',tag:'ANÁLISE'},
 {id:'figure',title:'Estrutura corporal',description:'Gesto, massas e construção da figura.',tag:'PROCESSO'}
];
const storageKey = 'xuim-atelier-prototype-v2';
const defaults = {version:1,role:'teacher',rhythm:'hero',checks:[],messages:[],submissions:[],feedback:{},strokes:[],boardKey:'volumes',customBoard:null};
function loadState(){
 try {
  const value=JSON.parse(localStorage.getItem(storageKey)||localStorage.getItem('xuim-atelier-prototype-v1'));
  if(!value || value.version!==1) return structuredClone(defaults);
  const next={...structuredClone(defaults),...value};
  next.role=['teacher','student'].includes(next.role)?next.role:'teacher';
  next.rhythm=['adventure','hero','mercenary'].includes(next.rhythm)?next.rhythm:'hero';
  next.checks=Array.isArray(next.checks)?next.checks.filter(x=>Number.isInteger(x)&&x>=0&&x<6):[];
  next.messages=Array.isArray(next.messages)?next.messages.filter(x=>x&&typeof x.text==='string'&&['teacher','student'].includes(x.role)).slice(-80):[];
  next.submissions=Array.isArray(next.submissions)?next.submissions.filter(x=>x&&typeof x.id==='string'&&typeof x.title==='string'&&validImage(x.image)):[];
  next.feedback=next.feedback && typeof next.feedback==='object'&&!Array.isArray(next.feedback)?next.feedback:{};
  next.strokes=Array.isArray(next.strokes)?next.strokes.filter(s=>s&&['pen','eraser'].includes(s.tool)&&['#de2246','#29272d','#327abd'].includes(s.color)&&Number.isFinite(s.size)&&s.size>0&&Array.isArray(s.points)&&s.points.length<20000&&s.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=-10&&n<=10))).slice(-300):[];
  next.boardKey=references.some(r=>r.id===next.boardKey)?next.boardKey:'volumes';
  if(!next.customBoard || !validImage(next.customBoard.image)) next.customBoard=null;
  return next;
 } catch {return structuredClone(defaults);}
}
function validImage(src){return typeof src==='string'&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(src);}
let state=loadState();
let view='classroom', filter='all', brush='pen', color='#de2246', drawing=null, lessonRunning=false, sessionSeconds=0, raisedHand=false, saveWarning=false;
let toastTimer, modalReturnFocus;
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,4500);}
function persist(){
 try{localStorage.setItem(storageKey,JSON.stringify(state));return true;}
 catch{if(!saveWarning){toast('O armazenamento local está indisponível. As alterações continuam abertas nesta sessão.');saveWarning=true;}return false;}
}
function openModal(title,content,footer=''){
 modalReturnFocus=document.activeElement;$('#modal-title').textContent=title;$('#modal-body').innerHTML=content;$('#modal-footer').innerHTML=footer;$('#modal-footer').hidden=!footer;
 if(!$('#modal').open)$('#modal').showModal();
}
function closeModal(){const modal=$('#modal');modal.close();if(modalReturnFocus?.isConnected)modalReturnFocus.focus();}
$('#modal-close').addEventListener('click',closeModal);
$('#modal').addEventListener('click',event=>{if(event.target===$('#modal')){const r=$('#modal').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeModal();}});
function confirmAction(title,description,buttonText,action){
 openModal(title,`<p class="muted">${escapeHTML(description)}</p>`,`<button class="btn" id="confirm-cancel">Cancelar</button><button class="btn primary" id="confirm-action">${escapeHTML(buttonText)}</button>`);
 $('#confirm-cancel').onclick=closeModal;$('#confirm-action').onclick=()=>{closeModal();action();};
}
const viewDetails={classroom:['sala de aula','volume'],atelier:['ateliê virtual','grid'],sketchbooks:['sketchbooks','book'],journey:['trilha & tarefas','route'],overview:['visão geral','grid'],students:['alunos & evolução','users'],schedule:['cronograma','clock'],reviews:['entregas & avaliações','image'],analytics:['presença & evolução','route'],announcements:['mural da turma','hash']};
function navigate(next){
 if(!viewDetails[next])return;
 if(['overview','students','reviews','analytics'].includes(next)&&state.role==='student'){toast('Acompanhamento da turma está na visão de professor.');return;}
 if(view==='atelier')stopAtelier();
 view=next;state.school.lastView=next;syncSchoolChrome();
 $$('.view').forEach(el=>el.hidden=el.id!==`view-${next}`);
 $$('.nav-item').forEach(el=>{const active=el.dataset.view===next;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
 $('#breadcrumb-label').textContent=viewDetails[next][0];$('#breadcrumb-icon').innerHTML=`<use href="#i-${viewDetails[next][1]}"/>`;
 $('#connection-label').textContent=next==='atelier'?'Ateliê de demonstração':'Sala de demonstração';
 ({sketchbooks:renderGallery,journey:renderJourney,atelier:renderAtelier,students:renderStudents,announcements:renderAnnouncements,overview:renderOverview,schedule:renderSchedule,reviews:renderReviews,analytics:renderAnalytics}[next]||(()=>{}))();
 setSidebar(false);setChat(false);
 if(next==='classroom')requestAnimationFrame(resizeCanvas);
 $('#main-content').focus({preventScroll:true});
}
document.addEventListener('click',event=>{
 const nav=event.target.closest('[data-view]');if(nav)navigate(nav.dataset.view);
 if(event.target.closest('[data-action="help"]'))showHelp();
});
function setSidebar(open){$('#sidebar').classList.toggle('open',open);$('#mobile-overlay').classList.toggle('open',open);$('#menu-button').setAttribute('aria-expanded',String(open));}
$('#menu-button').onclick=()=>setSidebar(!$('#sidebar').classList.contains('open'));
$('#mobile-overlay').onclick=()=>setSidebar(false);
function setChat(open){$('#chat-panel').classList.toggle('open',open);$('#chat-toggle').setAttribute('aria-expanded',String(open));}
$('#chat-toggle').onclick=()=>{if(view!=='classroom')navigate('classroom');setChat(!$('#chat-panel').classList.contains('open'));};
$('#chat-close').onclick=()=>setChat(false);
function applyRole(){
 const teacher=state.role==='teacher';$('#role-select').value=state.role;$('#profile-name').textContent=teacher?'Rafael · você':'Artista · você';$('#profile-role').textContent=teacher?'Professor da turma':'Aluno · modo de prévia';$('#students-nav').hidden=!teacher;$('#management-label').hidden=!teacher;$('#lesson-toggle').hidden=!teacher;
 $('#screen-toggle').hidden=!teacher;
 $$('[data-teacher-only]').forEach(el=>el.hidden=!teacher);syncSchoolChrome();if(!teacher&&['overview','students','reviews','analytics'].includes(view))navigate('journey');
 renderMessages();if(view==='atelier')renderAtelier();if(view==='sketchbooks')renderGallery();if(view==='journey')renderJourney();
}
$('#role-select').onchange=event=>{state.role=event.target.value;persist();applyRole();toast(state.role==='teacher'?'Visão de professor ativada.':'Visão de aluno ativada. Você pode desenhar, estudar e entregar.');};
function setLessonTab(tab){
 $$('.lesson-tab').forEach(button=>{const active=button.dataset.tab===tab;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
 $('#board-panel').hidden=tab!=='board';$('#materials-panel').hidden=tab!=='materials';
 if(tab==='board')requestAnimationFrame(resizeCanvas);
}
$$('[data-tab]').forEach(button=>button.onclick=()=>setLessonTab(button.dataset.tab));
function keyboardTabs(selector,activate){
 $$(selector).forEach(button=>button.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const buttons=$$(selector);const index=buttons.indexOf(button);const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;activate(buttons[next]);buttons[next].focus();}));
}
keyboardTabs('.lesson-tab',button=>setLessonTab(button.dataset.tab));
function setChatTab(tab){
 $$('[data-chat-tab]').forEach(button=>{const active=button.dataset.chatTab===tab;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});$('#messages-panel').hidden=tab!=='messages';$('#people-panel').hidden=tab!=='people';
}
$$('[data-chat-tab]').forEach(button=>button.onclick=()=>setChatTab(button.dataset.chatTab));
keyboardTabs('.chat-tab',button=>setChatTab(button.dataset.chatTab));
const seedMessages=[
 {name:'Rafael Bergamo',initials:'RB',tone:'amber',time:'19:02',role:'Professor',text:'Hoje vamos separar luz e sombra em três valores. Sem correr para o acabamento :)'},
 {name:'Lia Andrade',initials:'LA',tone:'pink',time:'19:04',text:'A sombra do cilindro acompanha a curva ou fica mais reta?'},
 {name:'Rafael Bergamo',initials:'RB',tone:'amber',time:'19:05',role:'Professor',text:'Boa! A forma vira aos poucos. Vamos marcar onde a luz deixa de alcançar o volume.'},
 {name:'Pedro Costa',initials:'PC',tone:'green',time:'19:06',text:'Agora fez sentido. Vou tentar na minha prancha.'}
];
function messageHTML(message){return `<article class="message"><span class="avatar ${message.tone||''}">${escapeHTML(message.initials)}</span><div class="message-content"><header><strong>${escapeHTML(message.name)}</strong>${message.role?`<span class="role">${escapeHTML(message.role)}</span>`:''}<time>${escapeHTML(message.time)}</time></header><p>${escapeHTML(message.text)}</p></div></article>`;}
function renderMessages(){
 $('#chat-messages').innerHTML='<div class="chat-date">CENA DE DEMONSTRAÇÃO</div>'+(state.school.activeClass==='aurora'?seedMessages:[]).map(messageHTML).join('')+(state.messages.length?'<div class="chat-date">SUAS MENSAGENS LOCAIS</div>':'')+state.messages.filter(message=>!message.classId||message.classId===state.school.activeClass).map(message=>messageHTML({name:message.role==='teacher'?'Rafael · você':'Artista · você',initials:message.role==='teacher'?'RB':'EU',tone:'purple',time:message.time||'',role:message.role==='teacher'?'Professor':'Aluno',text:message.text})).join('');
 $('#chat-messages').scrollTop=$('#chat-messages').scrollHeight;
}
function sendMessage(event){event.preventDefault();const text=$('#chat-input').value.trim();if(!text)return;state.messages.push({classId:state.school.activeClass,text:text.slice(0,1200),role:state.role,time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})});state.messages=state.messages.slice(-80);persist();$('#chat-input').value='';renderMessages();$('#chat-input').focus();}
$('#chat-form').onsubmit=sendMessage;
$('#chat-input').onkeydown=event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing)sendMessage(event);};
let students=[];
$('#people-panel').innerHTML='<p class="eyebrow">Participantes fictícios</p><div class="person-row"><span class="avatar amber">RB</span><div class="person-meta"><strong>Rafael Bergamo</strong><small>Professor</small></div><span class="tag red">Aula</span></div>'+students.map(student=>`<div class="person-row"><span class="avatar ${student.tone}">${escapeHTML(student.initials)}</span><div class="person-meta"><strong>${escapeHTML(student.name)}</strong><small>Aluno · personagem de exemplo</small></div></div>`).join('');
$('#materials-list').innerHTML=references.map(reference=>`<article class="material-card"><div class="art-preview"><img src="${assets[reference.id]}" alt="${reference.title}"></div><h3>${reference.title}</h3><p>${reference.description}</p><button class="btn small" data-reference="${reference.id}">Abrir na prancha ${icon('arrow')}</button></article>`).join('');
$('#materials-list').onclick=event=>{const button=event.target.closest('[data-reference]');if(button)useReference(button.dataset.reference);};
function replaceBoard(action){if(state.strokes.length)confirmAction('Trocar o desenho de base?','As anotações desta prancha serão removidas. Salve em PNG antes de trocar, se quiser guardar a correção.','Trocar desenho',action);else action();}
function useReference(id){
 if(!references.some(reference=>reference.id===id))return;
 replaceBoard(()=>{state.boardKey=id;state.customBoard=null;state.strokes=[];persist();updateReference();navigate('classroom');setLessonTab('board');toast('Referência aberta. Use o lápis para anotar sobre o desenho.');});
}
function updateReference(){const ref=references.find(reference=>reference.id===state.boardKey);$('#board-reference').src=state.customBoard?.image||assets[state.boardKey];$('#board-reference').alt=state.customBoard?.title||ref.title;$('#board-name').textContent=state.customBoard?.title||ref.title;$('.board-top .tag').textContent=state.customBoard?'ESTUDO ABERTO':'ACERVO XUIM ART';$('.paper-title').hidden=!!state.customBoard;$('.paper-note').textContent=state.customBoard?'SEU DESENHO · ANOTAÇÕES LOCAIS':'RAFAEL BERGAMO · ESTUDO DE CONSTRUÇÃO';renderCanvas();if(state.school)showReturnToReview();}
const canvas=$('#drawing-canvas'),context=canvas.getContext('2d');
let canvasWidth=1,canvasHeight=1;
function resizeCanvas(){
 const rect=$('#board-stage').getBoundingClientRect();if(!rect.width||!rect.height)return;
 canvasWidth=rect.width;canvasHeight=rect.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);context.setTransform(dpr,0,0,dpr,0,0);renderCanvas();
}
new ResizeObserver(resizeCanvas).observe($('#board-stage'));
$('#board-reference').addEventListener('load',renderCanvas);
function referenceFrame(){
 const stage=$('#board-stage').getBoundingClientRect(),image=$('#board-reference'),box=image.getBoundingClientRect();
 if(!image.naturalWidth||!image.naturalHeight)return {x:0,y:0,width:canvasWidth,height:canvasHeight};
 const scale=Math.min(box.width/image.naturalWidth,box.height/image.naturalHeight),width=image.naturalWidth*scale,height=image.naturalHeight*scale;
 return {x:box.left-stage.left+(box.width-width)/2,y:box.top-stage.top+(box.height-height)/2,width,height};
}
function drawStroke(ctx,stroke,width,height){
 if(!stroke.points.length)return;
 ctx.save();ctx.globalCompositeOperation=stroke.tool==='eraser'?'destination-out':'source-over';ctx.strokeStyle=stroke.color;ctx.fillStyle=stroke.color;ctx.lineWidth=stroke.size*width;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();
 if(stroke.points.length===1){const point=stroke.points[0];ctx.arc(point[0]*width,point[1]*height,ctx.lineWidth/2,0,Math.PI*2);ctx.fill();}
 else{stroke.points.forEach((point,index)=>{if(index===0)ctx.moveTo(point[0]*width,point[1]*height);else ctx.lineTo(point[0]*width,point[1]*height);});ctx.stroke();}ctx.restore();
}
function renderCanvas(){
 context.clearRect(0,0,canvasWidth,canvasHeight);const frame=referenceFrame();
 for(const stroke of [...state.strokes,...(drawing?[drawing]:[])]){
  context.save();if(stroke.space==='image'){context.translate(frame.x,frame.y);drawStroke(context,stroke,frame.width,frame.height);}else drawStroke(context,stroke,canvasWidth,canvasHeight);context.restore();
 }
 $('#undo').disabled=!state.strokes.length;$('#clear-board').disabled=!state.strokes.length;
}
function position(event){const rect=canvas.getBoundingClientRect(),frame=referenceFrame();return [Math.max(-10,Math.min(10,(event.clientX-rect.left-frame.x)/frame.width)),Math.max(-10,Math.min(10,(event.clientY-rect.top-frame.y)/frame.height))];}
canvas.addEventListener('pointerdown',event=>{if(event.button!==0||!event.isPrimary)return;event.preventDefault();canvas.setPointerCapture(event.pointerId);drawing={tool:brush,color,space:'image',size:Number($('#brush-size').value)*(brush==='eraser'?6:1)/referenceFrame().width,points:[position(event)]};renderCanvas();});
canvas.addEventListener('pointermove',event=>{if(!drawing||!canvas.hasPointerCapture(event.pointerId))return;event.preventDefault();drawing.points.push(position(event));if(drawing.points.length>15000){endStroke();return;}renderCanvas();});
function endStroke(){if(!drawing)return;state.strokes.push(drawing);state.strokes=state.strokes.slice(-300);drawing=null;persist();renderCanvas();}
canvas.addEventListener('pointerup',endStroke);canvas.addEventListener('pointercancel',endStroke);canvas.addEventListener('lostpointercapture',endStroke);
function selectTool(tool){brush=tool;$$('[data-tool]').forEach(button=>{const active=button.dataset.tool===tool;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});canvas.style.cursor=tool==='eraser'?'cell':'crosshair';}
$$('[data-tool]').forEach(button=>button.onclick=()=>selectTool(button.dataset.tool));
$$('[data-color]').forEach(button=>button.onclick=()=>{color=button.dataset.color;$$('[data-color]').forEach(el=>{const active=el===button;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});selectTool('pen');});
function undo(){if(state.strokes.length){state.strokes.pop();persist();renderCanvas();}}
$('#undo').onclick=undo;
$('#clear-board').onclick=()=>confirmAction('Apagar as anotações?','O desenho de referência continua na prancha. Só os traços que você fez serão apagados.','Apagar anotações',()=>{state.strokes=[];persist();renderCanvas();});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'){setSidebar(false);setChat(false);return;}
 if(view!=='classroom'||$('#modal').open||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)||event.target.isContentEditable)return;
 if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();undo();}
 else if(!event.ctrlKey&&!event.metaKey&&!event.altKey){if(event.key.toLowerCase()==='b')selectTool('pen');if(event.key.toLowerCase()==='e')selectTool('eraser');}
});
function download(url,filename){const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;document.body.append(anchor);anchor.click();anchor.remove();}
async function makeBoardImage(){
 await $('#board-reference').decode();
 const output=document.createElement('canvas'),scale=Math.min(2,1800/canvasWidth);output.width=Math.round(canvasWidth*scale);output.height=Math.round(canvasHeight*scale);const ctx=output.getContext('2d');ctx.fillStyle='#eeece8';ctx.fillRect(0,0,output.width,output.height);
 const frame=referenceFrame();ctx.drawImage($('#board-reference'),frame.x*scale,frame.y*scale,frame.width*scale,frame.height*scale);ctx.drawImage(canvas,0,0,output.width,output.height);ctx.fillStyle='#777078';ctx.font=`${Math.max(10,9*scale)}px sans-serif`;ctx.fillText('XUIM ART · PRANCHA DE ESTUDO',16*scale,output.height-12*scale);return output.toDataURL('image/png');
}
$('#export-board').onclick=async()=>{const button=$('#export-board');button.disabled=true;try{download(await makeBoardImage(),'xuim-prancha-de-estudo.png');toast('Prancha exportada em PNG.');}catch{toast('Não foi possível exportar a imagem. Tente abrir a referência novamente.');}finally{button.disabled=false;}};
async function readImage(file){
 if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Escolha uma imagem PNG, JPG ou WebP.');
 if(file.size>8*1024*1024)throw new Error('Escolha uma imagem de até 8 MB.');
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();image.src=url;await image.decode();if(image.naturalWidth*image.naturalHeight>30000000)throw new Error('A imagem é muito grande. Use uma versão com até 30 megapixels.');
  const scale=Math.min(1,1400/Math.max(image.naturalWidth,image.naturalHeight));const buffer=document.createElement('canvas');buffer.width=Math.round(image.naturalWidth*scale);buffer.height=Math.round(image.naturalHeight*scale);buffer.getContext('2d').drawImage(image,0,0,buffer.width,buffer.height);return buffer.toDataURL('image/webp',.88);
 }catch(error){throw new Error(error.message.includes('megapixels')?error.message:'Não foi possível abrir essa imagem. Tente outro arquivo.');}finally{URL.revokeObjectURL(url);}
}
$('#board-import').onclick=()=>$('#board-file').click();
$('#board-file').onchange=async event=>{const file=event.target.files[0];event.target.value='';if(!file)return;try{const image=await readImage(file);replaceBoard(()=>{state.customBoard={title:file.name,image};state.strokes=[];persist();updateReference();toast('Desenho aberto na prancha.');});}catch(error){toast(error.message);}};
$('#lesson-toggle').onclick=()=>{
 lessonRunning=!lessonRunning;$('#lesson-status').textContent=lessonRunning?'EM AULA · DEMO':'PRÉVIA DA AULA';$('#lesson-status').classList.toggle('live',lessonRunning);$('#lesson-toggle span').textContent=lessonRunning?'Encerrar aula demo':'Iniciar aula demo';toast(lessonRunning?'Aula de demonstração iniciada. Áudio e vídeo são simulados.':'Aula de demonstração encerrada. Sua prancha continua salva.');
};
setInterval(()=>{if(lessonRunning){sessionSeconds++;$('#session-time').textContent=`${String(Math.floor(sessionSeconds/60)).padStart(2,'0')}:${String(sessionSeconds%60).padStart(2,'0')}`;}},1000);
$('#mic-toggle').onclick=()=>{const button=$('#mic-toggle');const muted=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(muted));button.setAttribute('aria-label',`Microfone simulado ${muted?'desligado':'ligado'}`);button.innerHTML=icon(muted?'micoff':'mic');toast(`Microfone ${muted?'desligado':'ligado'} na simulação. Nenhum áudio é capturado.`);};
for(const [id,label] of [['camera-toggle','Câmera'],['screen-toggle','Compartilhamento']])$('#'+id).onclick=()=>{const button=$('#'+id);const active=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(active));toast(`${label} ${active?'ativado':'desativado'} na simulação. Nenhuma imagem é transmitida.`);};
$('#hand-toggle').onclick=()=>{raisedHand=!raisedHand;$('#hand-toggle').setAttribute('aria-pressed',String(raisedHand));$('#hand-toggle span').textContent=raisedHand?'Baixar a mão':'Levantar a mão';toast(raisedHand?'Sua mão está levantada na simulação.':'Sua mão foi baixada.');};
$('#task-shortcut').onclick=()=>{const task=assignmentsForClass().find(a=>a.lessonId===activeLesson()?.id);if(!task&&state.role==='teacher'){editAssignment();return;}state.school.selectedAssignment=task?.id||'';navigate('journey');requestAnimationFrame(()=>$('#weekly-task')?.scrollIntoView({behavior:'smooth',block:'start'}));};
function feedbackFor(id){const value=state.feedback[id];return Array.isArray(value)?value.filter(item=>item&&typeof item.text==='string').slice(-30):[];}
const taskItems=[['Construir três volumes simples','15 min'],['Separar luz e sombra em três valores','20 min'],['Variar a direção da luz','20 min'],['Estudar uma sombra projetada','20 min'],['Criar uma composição com os volumes','30 min'],['Revisar o estudo depois da correção','15 min']];
const rhythms={adventure:{name:'Aventureiro',count:2,time:'35 min'},hero:{name:'Herói',count:4,time:'1h15'},mercenary:{name:'Mercenário',count:6,time:'2h'}};
function showHelp(){
 openModal('Bem-vindo ao Ateliê Xuim Art',`<p class="muted" style="margin-bottom:20px">Um protótipo para testar como a aula, a comunidade e a jornada do artista podem viver no mesmo lugar.</p><div class="help-grid"><article><h3>01 · Experimente uma aula</h3><p>Desenhe sobre a referência, troque o material ou abra uma imagem sua. Use B para lápis, E para borracha e Ctrl+Z para desfazer. Exporte a prancha em PNG.</p></article><article><h3>02 · Continue a prática</h3><p>Na trilha, escolha Aventureiro, Herói ou Mercenário. Os exercícios da semana já aparecem no sketchbook. Envie um estudo em sua etapa, receba a orientação e guarde novas versões junto da primeira tentativa.</p></article><article><h3>03 · Encontre a turma</h3><p>No ateliê 2D, caminhe com as setas, WASD ou clique no chão. Aproxime-se dos colegas, use as mesas para continuar a tarefa e olhe os estudos na galeria. Cada espaço guarda sua conversa local.</p></article><article><h3>04 · Troque de perspectiva</h3><p>O seletor Professor / Aluno permite testar as duas interfaces. Na visão de professor, cadastre turmas e alunos, edite aulas, registre presença e avalie entregas. As alterações atualizam o painel e a jornada do aluno.</p></article></div><p class="help-note"><strong>O que funciona:</strong> desenho, importação e exportação de imagem, mensagens locais, estudos, comentários, tarefas, XP local, movimento do avatar, turmas, cronograma, presença manual e avaliações por critérios.<br><strong>O que é simulado:</strong> participantes conectados, microfone, câmera, compartilhamento e aula ao vivo. As chamadas e a convivência são demonstrações locais; o arquivo ainda não conecta outras pessoas.<br><strong>Onde fica salvo:</strong> no armazenamento deste navegador, quando disponível. Não há conta ou sincronização. Limpar os dados do navegador ou mudar de navegador/endereço pode separar ou remover seus testes. Guarde os arquivos originais.<br>Identidade e artes: manual Xuim Art · Rafael Bergamo.</p>`);
}
$('#modal').addEventListener('close',()=>{if(view==='sketchbooks')renderGallery();});

