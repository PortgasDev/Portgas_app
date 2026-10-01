const v2SpaceLegacy={renderAtelier,renderAtelierContext,updateAtelierPosition,atelierPeople};
let correctionObserver=null, correctionDraft=null, roomChatScope='', v2BoardLesson='';
function locationFor(id=viewerId()) {return v2()?.locations[currentClass().id+'|'+id];}
function spaceName(location) {if(location?.space==='classroom'&&location.lessonId)return 'Encontro · '+lessonLabel(school().lessons.find(l=>l.id===location.lessonId));return location?.group==='table-1'?'Mesa 1':location?.group==='table-2'?'Mesa 2':ATELIER_ROOMS[location?.space]?.name||'Turma';}
function captureAtelierLocation() {
  if(!v2Ready||!atelierSession)return;
  const old=locationFor(),space=atelierSession.room||'hall',group=old?.space===space?old.group:space;
  v2().locations[viewerKey()]={space,group:group||space,joined:true,position:{...atelierSession.position},...(space==='classroom'?{lessonId:old?.lessonId||v2().liveLessons[currentClass().id]||activeLesson()?.id}:{})};
}
function groupPeople(location) {
  if(!location?.joined)return [];
  const people=[{id:'teacher',name:currentClass().teacher},...classStudents().map(p=>({...p,name:artistDisplayName(p.id)}))];
  return people.filter(p=>{const l=locationFor(p.id);return l?.joined&&l.group===location.group;});
}
function renderPresence() {
  if(!v2Ready)return;
  let bar=$('#v2-presence');if(!bar){bar=document.createElement('aside');bar.id='v2-presence';bar.setAttribute('aria-label','Sua participação no ateliê');$('.topbar').after(bar);}
  const l=locationFor();bar.hidden=!l?.joined;
  if(!l?.joined){$('#connection-label').textContent='Consultando o ateliê';return;}
  const people=groupPeople(l),names=people.map(p=>p.id===viewerId()?'você':p.name.split(' ')[0]).join(', ');
  bar.innerHTML=`<span class="v2-presence-mark">${icon('users')}</span><div><strong>${spaceName(l)}</strong><span>${escapeHTML(names||'você')} · presença simulada</span></div><div class="v2-presence-actions"><button class="btn small" data-v2="chat">${icon('chat')}Conversar</button><button class="btn small quiet" data-v2="atelier">Ver mapa</button><button class="icon-btn" id="v2-leave-space" aria-label="Sair deste espaço">${icon('close')}</button></div>`;
  $('#v2-leave-space').onclick=()=>{v2().locations[viewerKey()]={...l,joined:false};persist();renderPresence();toast('Você saiu do espaço. Seus estudos continuam abertos.');};
  $('#connection-label').textContent=spaceName(l)+' · prévia local';
}
function joinTable(group) {
  if(atelierSession)stopAtelier();
  const position=group==='table-1'?{x:656,y:192}:{x:880,y:192};
  v2().locations[viewerKey()]={space:'desks',group,joined:true,position};atelierState().positions[atelierIdentity()]=position;
  persist();if(view==='atelier')renderAtelier();renderPresence();
}
function configureV2Spaces() {
  for(const [i,p] of classStudents().entries())if(!locationFor(p.id)){const group=i%2?'table-2':'table-1';v2().locations[currentClass().id+'|'+p.id]={space:'desks',group,joined:true,position:{x:i%2?880:656,y:i<2?192:304}};}
  renderAtelier=function(){
    v2SpaceLegacy.renderAtelier();
    $('#studio-chat-toggle').onclick=()=>openRoomChat();$('#studio-local-chat').hidden=true;
    if($('#studio-gather')){$('#studio-gather').textContent='Abrir encontro da turma';$('#studio-gather').onclick=()=>joinLesson();}
    $('.studio-simulation-note').textContent='Mapa e presença simulados. A conversa acompanha o espaço, mesmo com seu sketchbook aberto.';
    captureAtelierLocation();renderPresence();
  };
  atelierPeople=function(){return v2SpaceLegacy.atelierPeople().map(p=>{const id=p.teacher?'teacher':p.id,l=locationFor(id);return l?.position?{...p,position:l.position}:p;});};
  updateAtelierPosition=function(){const before=locationFor()?.space;v2SpaceLegacy.updateAtelierPosition();if(v2Ready&&atelierSession){captureAtelierLocation();const people=groupPeople(locationFor()).filter(p=>p.id!==viewerId());$('#studio-nearby-count').textContent=people.length;$('.studio-nearby .studio-section-label>span').textContent='NESTE ESPAÇO';$('#studio-nearby-list').innerHTML=people.map(p=>`<div class="studio-neighbor"><div><strong>${escapeHTML(p.name)}</strong><span>${p.id==='teacher'?'Professor':'Colega de turma'} · ${spaceName(locationFor())}</span></div></div>`).join('')||'<p class="studio-empty-near">Só você neste espaço por enquanto.</p>';if(before!==locationFor()?.space){renderPresence();persist();}}};
  renderAtelierContext=function(){
    v2SpaceLegacy.renderAtelierContext();if(!v2Ready)return;
    const room=atelierSession.room;
    if(room==='desks'){
      $('#studio-context-body').insertAdjacentHTML('beforeend',`<div class="v2-table-picker"><button class="btn small" id="v2-table-1">Sentar na mesa 1</button><button class="btn small" id="v2-table-2">Sentar na mesa 2</button></div>`);
      $('#v2-table-1').onclick=()=>joinTable('table-1');$('#v2-table-2').onclick=()=>joinTable('table-2');
      $('#studio-context-action').onclick=()=>{captureAtelierLocation();if(!['table-1','table-2'].includes(locationFor()?.group))joinTable('table-1');notebookFilter='task';navigate(state.role==='teacher'?'reviews':'sketchbooks');};
      $('#studio-context-action').textContent=state.role==='teacher'?'Acompanhar estudos':'Abrir meu sketchbook';
    }
    if(room==='classroom'){$('#studio-context-action').textContent='Participar do encontro';$('#studio-context-action').onclick=()=>joinLesson();}
    if(room==='cafe')$('#studio-context-action').onclick=()=>openRoomChat();
    if(room==='gallery'){$('#studio-context-body p').textContent='Imagens que os artistas escolheram compartilhar com a turma.';$('#studio-context-action').onclick=()=>showAtelierGallery();}
  };
  atelierExhibits=()=>Object.entries(v2().publications).map(([id,workId])=>({t:threadById(id),d:allDeliveries().find(w=>w.id===workId)})).filter(x=>x.t?.classId===currentClass().id&&x.d).map(x=>x.d).slice(0,3);
  showAtelierGallery=function(){const works=atelierExhibits();openModal('Galeria da turma',works.length?`<div class="v2-gallery">${works.map(w=>`<article><img src="${deliveryImage(w)}" alt="${escapeHTML(w.title)}"><h3>${escapeHTML(w.title)}</h3><p>${escapeHTML(getStudent(w.studentId)?.name||'Artista')} · V${w.version||1}</p></article>`).join('')}</div>`:blankState('A galeria espera o primeiro estudo','No sketchbook, escolha uma imagem e use “Compartilhar na galeria”. As conversas permanecem no estudo.'));};
  showAtelierArtwork=()=>showAtelierGallery();
  $('#chat-toggle').onclick=()=>openRoomChat();
  renderMessages=function(){if(!v2Ready)return;const scope=classroomScope();$('#chat-messages').innerHTML=roomMessageHTML(scope);$('#chat-messages').scrollTop=$('#chat-messages').scrollHeight;};
  $('#chat-form').onsubmit=e=>{e.preventDefault();appendRoomMessage(classroomScope(),$('#chat-input').value);$('#chat-input').value='';renderMessages();};
  $('#chat-input').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('#chat-form').requestSubmit();}};
}
function classroomScope(id=activeLesson()?.id) {return currentClass().id+'|lesson|'+(id||'room');}
function currentChatScope() {const l=locationFor();if(l?.joined&&l.space==='classroom')return classroomScope(l.lessonId||v2().liveLessons[currentClass().id]||activeLesson()?.id);return currentClass().id+'|'+(l?.joined?l.group:'turma');}
function roomMessageHTML(scope) {
  const messages=v2().roomMessages[scope]||[];
  return messages.length?messages.map(m=>`<article class="v2-room-message"><header><strong>${escapeHTML(m.name)}</strong><time>${stamp(m.createdAt)}</time></header><p>${escapeHTML(m.text)}</p></article>`).join(''):'<p class="v2-empty-chat">A conversa pode começar com uma ideia ou uma dúvida.</p>';
}
function appendRoomMessage(scope,text) {
  if(!text.trim())return;
  const messages=v2().roomMessages[scope]||(v2().roomMessages[scope]=[]);messages.push({id:uid('message'),name:atelierName(),role:state.role,text:text.trim().slice(0,2000),createdAt:new Date().toISOString()});saveSchool('Mensagem adicionada à conversa deste espaço.');
}
function openRoomChat() {
  const l=locationFor();roomChatScope=currentChatScope();
  openModal('Conversa · '+(l?.joined?spaceName(l):'Turma'),`<p class="form-intro">${l?.joined?'Pessoas neste espaço: '+escapeHTML(groupPeople(l).map(p=>p.name.split(' ')[0]).join(', '))+'.':'Conversa geral da turma.'} Mensagens locais; nenhuma chamada é transmitida.</p><div id="v2-room-log" class="v2-room-log" role="log" aria-label="Conversa do espaço">${roomMessageHTML(roomChatScope)}</div><form id="v2-room-form"><label class="field">Mensagem<textarea id="v2-room-input" maxlength="2000" rows="3" required placeholder="Continue a conversa…"></textarea></label><button class="btn primary" type="submit">Enviar mensagem</button></form>`);
  $('#v2-room-form').onsubmit=e=>{e.preventDefault();appendRoomMessage(roomChatScope,$('#v2-room-input').value);$('#v2-room-input').value='';$('#v2-room-log').innerHTML=roomMessageHTML(roomChatScope);$('#v2-room-log').scrollTop=$('#v2-room-log').scrollHeight;if(view==='classroom')renderMessages();};
}
function saveLessonBoard() {
  if(!v2Ready||view!=='classroom'||!v2BoardLesson)return;
  v2().boards['lesson|'+v2BoardLesson]={strokes:structuredClone(state.strokes),customBoard:state.customBoard,boardKey:state.boardKey};
}
function renderLessonV2() {
  v2BoardLesson=activeLesson()?.id||'';
  const board=v2().boards['lesson|'+activeLesson()?.id];state.strokes=structuredClone(board?.strokes||[]);state.customBoard=board?.customBoard||null;state.boardKey=board?.boardKey||'volumes';delete school().boardDeliveryId;
  updateReference();renderMessages();requestAnimationFrame(resizeCanvas);
  const joined=locationFor()?.space==='classroom'&&locationFor()?.joined,live=v2().liveLessons[currentClass().id]===activeLesson()?.id;
  $('#lesson-status').textContent=live?'ENCONTRO ABERTO · SIMULADO':'CONSULTANDO MATERIAL';
  $('.chat-pin strong').textContent='Conversa · '+lessonLabel(activeLesson());
  $('#lesson-toggle').hidden=false;$('#lesson-toggle span').textContent=state.role==='teacher'?(live?'Encerrar encontro':'Iniciar encontro'):'Participar do encontro';
  $('.callbar-note span:last-child').textContent=joined?'· participação simulada':'· consultando materiais';
  if(!$('#v2-lesson-back'))$('.lesson-tabs').insertAdjacentHTML('beforebegin',`<div id="v2-lesson-back" class="v2-lesson-links"><button class="button-text" data-view="schedule">← Todas as aulas</button>${state.role==='teacher'?'<button class="button-text" id="v2-lesson-attendance">Registrar presença</button>':''}</div>`);
  if($('#v2-lesson-attendance'))$('#v2-lesson-attendance').onclick=()=>showAttendance(activeLesson()?.id);
}
function joinLesson() {
  let lesson=activeLesson();const live=v2().liveLessons[currentClass().id];
  if(state.role==='student'&&!live){toast('O professor ainda não abriu um encontro. Você pode consultar os materiais e estudar nas mesas.');return;}
  if(live)lesson=school().lessons.find(l=>l.id===live)||lesson;
  if(!lesson)return;
  if(atelierSession)stopAtelier();
  if(state.role==='teacher')v2().liveLessons[currentClass().id]=lesson.id;
  const position={x:272,y:272};v2().locations[viewerKey()]={space:'classroom',group:'classroom',lessonId:lesson.id,joined:true,position};atelierState().positions[atelierIdentity()]=position;
  school().selectedLesson=lesson.id;lessonRunning=true;persist();navigate('classroom');
}
function configureV2Lessons() {
  const oldSelect=selectLesson;
  selectLesson=function(id,open=false){saveLessonBoard();oldSelect(id,open);};
  $('#lesson-toggle').onclick=()=>{
    if(state.role==='teacher'&&v2().liveLessons[currentClass().id]===activeLesson()?.id){delete v2().liveLessons[currentClass().id];lessonRunning=false;persist();renderLessonV2();toast('Encontro encerrado. O exercício e as conversas continuam disponíveis.');}
    else joinLesson();
  };
  renderSchedule=function(){v2Legacy.renderSchedule();const root=$('#view-schedule .school-page');if(!root)return;root.insertAdjacentHTML('afterbegin',`<div class="v2-section-head"><h2>Aulas & exercícios</h2>${state.role==='teacher'?'<button class="btn" data-school-action="new-task">Publicar exercício</button>':''}</div><div class="v2-assignment-strip">${assignmentsForClass().map(a=>`<article><span class="eyebrow">${escapeHTML(lessonLabel(school().lessons.find(l=>l.id===a.lessonId)))}</span><strong>${escapeHTML(a.title)}</strong><small>Disponível nos sketchbooks · até ${dateLabel(a.due)}</small><div>${v2Button('Abrir estudos','task',`data-id="${a.id}"`)}${state.role==='teacher'?`<button class="btn quiet" data-edit-v2-task="${a.id}">Editar</button>`:''}</div></article>`).join('')}</div>`);$$('[data-edit-v2-task]').forEach(b=>b.onclick=()=>editAssignment(b.dataset.editV2Task));};
  renderStudents=function(){v2Legacy.renderStudents();$('#view-students .school-page')?.insertAdjacentHTML('afterbegin',`<div class="v2-section-head"><span>Sketchbooks e evolução da turma</span><button class="btn" data-view="analytics">Presença & relatórios</button></div><div class="v2-student-books">${classStudents().map(p=>`<button class="btn" data-student-book="${p.id}">${avatar(p)} Sketchbook de ${escapeHTML(p.name.split(' ')[0])}</button>`).join('')}</div>`);$$('[data-student-book]').forEach(b=>b.onclick=()=>{sketchbookStudent=b.dataset.studentBook;navigate('sketchbooks');});};
  renderAnalytics=function(){v2Legacy.renderAnalytics();$('#view-analytics .school-page')?.insertAdjacentHTML('afterbegin','<button class="button-text" data-view="students">← Alunos</button>');};
  editAssignment=function(id){v2Legacy.editAssignment(id);const submit=$('#assignment-form button[type="submit"]');if(submit)submit.textContent=id?'Atualizar exercício nos sketchbooks':'Publicar nos sketchbooks';};
  showHelp=()=>openModal('Experimentar o Ateliê 2.0',`<div class="help-grid"><article><h3>Compartilhe o processo</h3><p>Abra um exercício no sketchbook e comece um estudo. Envie uma imagem inacabada ou apenas uma pergunta. “Pedir ajuda” coloca a conversa na atenção do professor.</p></article><article><h3>Responda no momento</h3><p>Troque para Professor. Em Acompanhamento, abra o pedido e responda sem nota. Você também pode anotar no desenho. Volte para Aluno para continuar a conversa.</p></article><article><h3>Mantenha o histórico</h3><p>Novas imagens na conversa são versões do mesmo estudo. Use “Entregar para avaliação” quando quiser uma avaliação. A galeria só recebe a imagem que você escolher compartilhar.</p></article><article><h3>Fique com a turma</h3><p>Escolha uma mesa no ateliê e abra seu sketchbook. A faixa de participação e a conversa continuam disponíveis. Consultar materiais não entra automaticamente em uma aula.</p></article></div><p class="help-note">Protótipo local: áudio, vídeo e presença são simulados. Use o mesmo navegador e endereço para manter os dados. “Guardar uma cópia” exporta as conversas, imagens e registros. Os controles Professor/Aluno servem para experimentar os dois papéis.</p>`);
}
function openCorrection(id) {
  const t=accessibleThread(id);if(!t||state.role!=='teacher')return;
  const selected=$('.v2-filmstrip button.active')?.dataset.id;
  const work=threadWorks(t).find(w=>w.id===selected)||newestWork(t);if(!work)return;
  selectedStudy=id;const key='correction|'+t.id+'|'+work.id;
  if(!v2().boards[key])v2().boards[key]={strokes:[],note:''};
  correctionDraft={key,workId:work.id,color:'#de2246',drawing:null};navigate('correction');
}
function renderCorrection() {
  correctionObserver?.disconnect();
  const t=accessibleThread(selectedStudy),work=allDeliveries().find(w=>w.id===correctionDraft?.workId);if(!t||!work)return;
  const draft=v2().boards[correctionDraft.key];
  $('#view-correction').innerHTML=`<div class="v2-page"><header class="v2-page-head"><div><button class="button-text" data-v2="study" data-id="${t.id}">← Voltar à conversa</button><h1>Um traço para orientar.</h1><p>${escapeHTML(t.title)} · V${work.version||1} · apenas neste estudo</p></div></header><div class="v2-correction-layout"><section><div class="v2-correction-stage"><img id="v2-correction-image" src="${deliveryImage(work)}" alt="Desenho para anotar"><canvas id="v2-correction-canvas" aria-label="Desenhar orientação sobre o estudo"></canvas></div><div class="v2-correction-tools"><button class="btn small" id="v2-red">Vermelho</button><button class="btn small" id="v2-blue">Azul</button><button class="btn small" id="v2-correction-undo">Desfazer traço</button></div></section><form id="v2-correction-form"><label class="field">O que este traço ajuda a perceber?<textarea id="v2-correction-note" rows="6" maxlength="3000" placeholder="Explique a direção que você marcou…">${escapeHTML(draft.note)}</textarea></label><p class="muted">A anotação será uma mensagem com imagem. A versão original do aluno é preservada.</p><button class="btn primary" type="submit">Enviar orientação visual</button><p id="v2-correction-error" role="alert"></p></form></div></div>`;
  const image=$('#v2-correction-image'),c=$('#v2-correction-canvas'),ctx=c.getContext('2d');
  const draw=()=>{const r=image.getBoundingClientRect();if(!r.width||!r.height)return;const ratio=Math.min(devicePixelRatio||1,2);c.width=r.width*ratio;c.height=r.height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);for(const s of [...draft.strokes,...(correctionDraft.drawing?[correctionDraft.drawing]:[])])drawStroke(ctx,s,r.width,r.height);$('#v2-correction-undo').disabled=!draft.strokes.length;};
  const point=e=>{const r=c.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))];};
  c.onpointerdown=e=>{if(e.button!==0)return;c.setPointerCapture(e.pointerId);correctionDraft.drawing={tool:'pen',color:correctionDraft.color,size:.004,points:[point(e)]};draw();};
  c.onpointermove=e=>{if(!correctionDraft.drawing)return;correctionDraft.drawing.points.push(point(e));draw();};
  const finish=()=>{if(!correctionDraft.drawing)return;draft.strokes.push(correctionDraft.drawing);correctionDraft.drawing=null;persist();draw();};
  c.onpointerup=finish;c.onpointercancel=finish;c.onlostpointercapture=finish;
  $('#v2-red').onclick=()=>correctionDraft.color='#de2246';$('#v2-blue').onclick=()=>correctionDraft.color='#327abd';$('#v2-correction-undo').onclick=()=>{draft.strokes.pop();persist();draw();};
  $('#v2-correction-note').oninput=e=>{draft.note=e.target.value;persist();};
  correctionObserver=new ResizeObserver(draw);correctionObserver.observe(image);image.onload=draw;requestAnimationFrame(draw);
  $('#v2-correction-form').onsubmit=async e=>{e.preventDefault();finish();if(!draft.strokes.length&&!draft.note.trim()){$('#v2-correction-error').textContent='Adicione um traço ou uma orientação.';return;}const button=$('#v2-correction-form button[type="submit"]');button.disabled=true;try{await image.decode();const out=document.createElement('canvas');out.width=Math.min(1400,image.naturalWidth);out.height=Math.round(out.width*image.naturalHeight/image.naturalWidth);const context=out.getContext('2d');context.drawImage(image,0,0,out.width,out.height);for(const s of draft.strokes)drawStroke(context,s,out.width,out.height);StudyModel.addPost(t,{id:uid('correction'),role:'teacher',authorId:'teacher',kind:'correction',text:draft.note.trim()||'Observe os planos que marquei no desenho.',image:out.toDataURL('image/webp',.9),deliveryId:work.id,createdAt:new Date().toISOString()});delete v2().boards[correctionDraft.key];saveSchool('Orientação visual enviada nesta conversa.');openStudy(t.id);}catch{$('#v2-correction-error').textContent='Não foi possível preparar a imagem. Tente novamente.';button.disabled=false;}};
}
function configureV2Backup() {
  showBackup=function(){openModal('Guardar os testes da versão 2.0',`<p class="form-intro">A cópia inclui turmas, estudos, imagens, conversas, rascunhos e sua posição no ateliê.</p><p class="school-note">A versão 1.0 tem armazenamento separado e permanece intacta.</p><div class="v2-backup-actions"><button class="btn primary" id="v2-export">Exportar cópia 2.0</button><button class="btn" id="v2-import">Restaurar uma cópia</button></div>`);$('#v2-export').onclick=()=>{const blob=new Blob([JSON.stringify({format:'xuim-atelier',schema:2,edition:'2.0',state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);download(url,'xuim-atelie-2.0-'+localDate()+'.json');setTimeout(()=>URL.revokeObjectURL(url),2000);};$('#v2-import').onclick=()=>$('#backup-file').click();};
  $('#backup-file').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;if(file.size>40*1024*1024){toast('Use uma cópia de até 40 MB.');return;}try{const parsed=JSON.parse(await file.text());const next=v2Legacy.validateBackup(parsed);if(next.v2){StudyModel.validate(next.v2,next.school,[...next.school.deliveries,...next.submissions]);validateProfiles(next.v2,next.school);}openModal('Restaurar esta cópia na 2.0?',`<p>Serão carregados ${next.school.students.length} alunos e ${next.v2?.threads.length||'os'} estudos desta cópia. Os testes atuais da 2.0 serão substituídos. A versão 1.0 permanece intacta.</p>`,`<button class="btn" id="v2-restore-cancel">Cancelar</button><button class="btn primary" id="v2-restore-confirm">Restaurar na 2.0</button>`);$('#v2-restore-cancel').onclick=closeModal;$('#v2-restore-confirm').onclick=()=>{stopAtelier();state=next;ensureV2();ensureProfiles();selectedStudy='';closeModal();saveWarning=false;persist();v2Legacy.applyRole();navigate('today');};}catch(error){toast(error instanceof SyntaxError?'Arquivo JSON inválido.':error.message);}};
}
