const v2Legacy = {navigate, applyRole, syncSchoolChrome, showReview, showUpload, renderSchedule, renderStudents, renderAnalytics, editAssignment, showBackup, validateBackup, switchClass, updateReference};
let v2Ready=false, notebookFilter='task', inboxFilter='attention', selectedStudy='', studyBack='sketchbooks';
const v2 = () => state.v2;
const viewerId = () => state.role==='teacher'?'teacher':currentLearner()?.id || 'none';
const viewerKey = () => currentClass().id+'|'+viewerId();
const threadById = id => v2().threads.find(t=>t.id===id);
const visibleThreads = () => v2().threads.filter(t=>t.classId===currentClass().id && (state.role==='teacher' || t.studentId===currentLearner()?.id));
const threadWorks = t => allDeliveries().filter(d=>(d.rootId||d.id)===t.id).sort((a,b)=>(a.version||1)-(b.version||1));
const newestWork = t => threadWorks(t).at(-1);
const taskForThread = t => school().assignments.find(a=>a.id===t.assignmentId);
const unreadThread = t => StudyModel.unread(t,viewerId(),v2().seen);
const stamp = date => new Date(date).toLocaleString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
const phaseTag = t => `<span class="v2-status ${t.status}">${StudyModel.statuses[t.status]}</span>`;
const v2Button = (label, action, extra='', primary=false) => `<button class="btn ${primary?'primary':''}" data-v2="${action}" ${extra}>${label}</button>`;
function accessibleThread(id) {
  const t=threadById(id);
  return t && t.classId===currentClass().id && (state.role==='teacher'||t.studentId===currentLearner()?.id) ? t : null;
}
function ensureV2() {
  if (!state.v2 || state.v2.version!==2) {
    state.v2={version:2, threads:StudyModel.migrate(allDeliveries()), seen:{}, drafts:{}, locations:{}, roomMessages:{}, publications:{}, boards:{}, liveLessons:{}};
    for (const t of v2().threads) {
      for (const d of threadWorks(t)) for (const c of feedbackFor(d.id)) t.posts.push({id:uid('post'),role:c.role,authorId:c.role==='teacher'?'teacher':t.studentId,text:c.text,kind:'message',createdAt:new Date().toISOString()});
    }
  }
}
function initV2() {
  ensureV2();v2Ready=true;
  document.title='Xuim Art · Ateliê 2.0';document.body.classList.add('v2');
  for (const [id,label] of [['today','Hoje'],['study','Conversa do estudo'],['correction','Anotação do professor']]) {
    const section=document.createElement('section');section.className='view';section.id='view-'+id;section.hidden=true;section.setAttribute('aria-label',label);$('#main-content').append(section);viewDetails[id]=[label,id==='today'?'grid':'book'];
  }
  viewDetails.schedule=['Aulas','book'];viewDetails.sketchbooks=['Sketchbook','book'];viewDetails.reviews=['Acompanhamento','chat'];viewDetails.students=['Alunos','users'];
  $('.nav-scroll').hidden=true;
  const nav=document.createElement('nav');nav.id='v2-nav';nav.setAttribute('aria-label','Navegação principal');$('.nav-scroll').before(nav);
  $('.demo-label').textContent='2.0 · LOCAL';$('.rail .guild.brand').dataset.view='today';$('.rail .guild.selected').dataset.view='today';
  const notice=document.createElement('div');notice.id='v2-save-warning';notice.hidden=true;notice.setAttribute('role','alert');notice.textContent='Não foi possível guardar no navegador. Exporte uma cópia antes de fechar.';$('.topbar').after(notice);
  renderGallery=renderNotebook;renderJourney=renderNotebook;renderReviews=renderInbox;renderOverview=renderToday;
  showReview=id=>{const d=allDeliveries().find(w=>w.id===id);const t=threadById(id)||threadById(d?.rootId||d?.id);if(t)openStudy(t.id);};
  showUpload=(fromTask,context={})=>{if(context.parentId){const d=allDeliveries().find(w=>w.id===context.parentId);if(d){openStudy(d.rootId||d.id);$('#study-message')?.focus();return;}}showNewStudy(fromTask?context.assignmentId||activeAssignment()?.id:'',context.stepId,context.studentId);};
  showReturnToReview=()=>{$('#return-review')?.remove();};
  navigate=function(next) {
    if(!v2Ready)return v2Legacy.navigate(next);
    next=({overview:'today',journey:'sketchbooks'})[next]||next;
    if(!viewDetails[next])return;
    if(['students','reviews','analytics','correction'].includes(next)&&state.role!=='teacher')next='today';
    if(next==='study'&&!accessibleThread(selectedStudy))next='sketchbooks';
    if(view==='classroom')saveLessonBoard();
    if(view==='atelier')captureAtelierLocation();
    if(view==='atelier')stopAtelier();
    view=next;school().lastView=next;syncSchoolChrome();
    $$('.view').forEach(el=>el.hidden=el.id!=='view-'+next);
    $('#breadcrumb-label').textContent=viewDetails[next][0];$('#breadcrumb-icon').innerHTML=`<use href="#i-${viewDetails[next][1]}"/>`;
    ({today:renderToday,study:renderStudy,correction:renderCorrection,sketchbooks:renderNotebook,atelier:renderAtelier,schedule:renderSchedule,reviews:renderInbox,students:renderStudents,analytics:renderAnalytics,announcements:renderAnnouncements,classroom:renderLessonV2}[next]||(()=>{}))();
    renderV2Nav();renderPresence();setSidebar(false);setChat(false);persist();$('#main-content').focus({preventScroll:true});
  };
  syncSchoolChrome=function(){v2Legacy.syncSchoolChrome();if(v2Ready){renderV2Nav();renderPresence();if(saveWarning)$('#v2-save-warning').hidden=false;}};
  applyRole=function(){if(!v2Ready)return v2Legacy.applyRole();selectedStudy='';v2Legacy.applyRole();navigate('today');};
  switchClass=function(id){captureAtelierLocation();saveLessonBoard();selectedStudy='';v2Legacy.switchClass(id);navigate('today');};
  $('#learner-select').onchange=e=>{captureAtelierLocation();school().learnerId=e.target.value;selectedStudy='';persist();navigate('today');};
  $('#role-select').onchange=e=>{captureAtelierLocation();state.role=e.target.value;persist();applyRole();};
  $('#task-shortcut').onclick=()=>{const task=assignmentsForClass().find(a=>a.lessonId===activeLesson()?.id);if(!task){if(state.role==='teacher')editAssignment();else toast('Esta aula ainda não tem exercício publicado.');return;}school().selectedAssignment=task.id;notebookFilter='task';navigate('sketchbooks');};
  document.addEventListener('click',handleV2Action);
  configureV2Spaces();configureV2Lessons();configureV2Backup();initProfiles();
  persist();navigate('today');maybeOnboarding();
}
function renderV2Nav() {
  if(!$('#v2-nav'))return;
  const count=visibleThreads().filter(t=>state.role==='teacher'?StudyModel.needsTeacher(t):unreadThread(t)).length;
  const nav=[['today','Hoje','grid'],['schedule','Aulas','book'],...(state.role==='teacher'?[['students','Alunos','users'],['reviews','Acompanhamento','chat']]:[['sketchbooks','Meu sketchbook','pen']]),['atelier','Ateliê','grid']];
  const active=({study:state.role==='teacher'?'reviews':'sketchbooks',correction:'reviews',classroom:'schedule',analytics:'students'})[view]||view;
  $('#v2-nav').innerHTML=nav.map(([id,label,i])=>`<button class="nav-item ${active===id?'active':''}" data-view="${id}" ${active===id?'aria-current="page"':''}>${icon(i)}<span>${label}</span>${['reviews','sketchbooks'].includes(id)&&count?`<span class="badge">${count}</span>`:''}</button>`).join('')+`<div class="v2-nav-secondary"><button class="nav-item" data-view="announcements">${icon('hash')}Avisos da turma</button><button class="nav-item" data-v2="chat">${icon('chat')}Conversas</button><button class="nav-item" data-v2="backup">${icon('download')}Guardar uma cópia</button></div>`;
}
function studyRow(t, compact=false) {
  const d=newestWork(t), person=getStudent(t.studentId), last=t.posts.at(-1), unread=unreadThread(t);
  return `<button class="v2-study-row ${compact?'compact':''}" data-v2="study" data-id="${escapeHTML(t.id)}">${d?`<img src="${deliveryImage(d)}" alt="">`:`<span class="v2-text-art">${icon('pen')}</span>`}<span class="v2-study-summary"><span class="v2-row-meta">${escapeHTML(person?.name||'Artista')} ${unread?`<b>${unread} nova(s)</b>`:''}</span><strong>${escapeHTML(t.title)}</strong><span class="v2-preview">${last?.role==='teacher'?'Professor: ':''}${escapeHTML(last?.text||'Imagem do processo')}</span><small>${threadWorks(t).length} imagem(ns) · ${t.posts.length} mensagem(ns)</small></span>${phaseTag(t)}${icon('arrow')}</button>`;
}
function renderToday() {
  const teacher=state.role==='teacher', threads=visibleThreads().sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  const priorities=threads.filter(t=>teacher?StudyModel.needsTeacher(t):unreadThread(t)||t.status==='revision');
  const lesson=activeLesson(), task=activeAssignment();
  $('#view-today').innerHTML=`<div class="v2-page"><header class="v2-page-head"><div><span class="eyebrow">${escapeHTML(currentClass().name)} / ATELIÊ 2.0</span><h1>${teacher?'Um olhar muda o próximo traço.':'O que vamos desenhar hoje?'}</h1><p>${teacher?'Acompanhe uma dúvida enquanto o desenho acontece.':'Seu processo, suas perguntas e o próximo passo estão aqui.'}</p></div><span class="v2-edition">XUIМ / 02</span></header><div class="v2-today-layout"><section><div class="v2-section-head"><h2>${teacher?'Pedindo seu olhar':'Para continuar'}</h2><span>${priorities.length} ${teacher?'estudo(s)':'conversa(s)'}</span></div><div class="v2-list">${priorities.slice(0,5).map(t=>studyRow(t)).join('')||blankState('Tudo acompanhado por aqui',teacher?'Novas dúvidas e entregas aparecem nesta lista.':'Você pode continuar seu desenho ou começar um estudo livre.')}</div><div class="v2-section-head"><h2>Últimas conversas</h2>${v2Button(teacher?'Ver acompanhamento':'Abrir meu sketchbook',teacher?'inbox':'notebook')}</div>${threads.slice(0,3).map(t=>studyRow(t,true)).join('')}</section><aside class="v2-today-aside"><article class="v2-lesson-card"><span class="eyebrow">${v2().liveLessons[currentClass().id]?'ENCONTRO ABERTO':'AULA EM FOCO'}</span><h2>${escapeHTML(lesson?.title||'Vamos preparar a primeira aula')}</h2><p>${lesson?lessonLabel(lesson)+' · '+dateLabel(lesson.date)+' · '+lesson.time:'Organize os encontros da turma.'}</p>${v2Button('Consultar aula','lesson',`data-id="${escapeHTML(lesson?.id||'')}"`)}${v2Button(teacher?'Iniciar encontro':'Participar do encontro','join-lesson','',true)}</article>${task?`<article class="v2-task-mini"><span class="eyebrow">EXERCÍCIO EM ANDAMENTO</span><h3>${escapeHTML(task.title)}</h3><p>Até ${dateLabel(task.due)} · pode compartilhar antes de terminar.</p>${v2Button(teacher?'Ver estudos da tarefa':'Continuar no sketchbook','task',`data-id="${task.id}"`)}</article>`:''}<article class="v2-task-mini"><h3>Um lugar para desenhar junto.</h3><p>Abra seu estudo sem perder a mesa, as pessoas e a conversa.</p>${v2Button('Encontrar a turma','atelier')}</article></aside></div></div>`;
}
function renderNotebook() {
  const person=state.role==='teacher'?getStudent(sketchbookStudent)||currentLearner():currentLearner();
  if(!person){$('#view-sketchbooks').innerHTML=blankState('Nenhum artista nesta turma','Matricule um aluno para abrir seu sketchbook.');return;}
  const tasks=assignmentsForClass(), task=activeAssignment(), all=visibleThreads().filter(t=>t.studentId===person.id);
  const works=all.filter(t=>notebookFilter==='all'||(notebookFilter==='free'?!t.assignmentId:t.assignmentId===task?.id)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  const progress=task?progressFor(person,task):null, stepCount=task?.rhythms[progress?.rhythm]||task?.steps.length||0;
  $('#view-sketchbooks').innerHTML=`<div class="v2-page"><header class="v2-page-head"><div><span class="eyebrow">${escapeHTML(currentClass().name)} / CADERNO DO ARTISTA</span><h1>Sketchbook de ${escapeHTML(person.name.split(' ')[0])}</h1><p>Pode chegar com um desenho pela metade e uma pergunta.</p></div>${v2Button('Novo estudo','new-study',`data-person="${person.id}"`,true)}</header><div class="v2-notebook-toolbar"><div class="pill-group">${[['task','Exercício'],['all','Todo o percurso'],['free','Estudos livres']].map(([k,l])=>`<button class="pill ${notebookFilter===k?'active':''}" data-v2="notebook-filter" data-id="${k}" aria-pressed="${notebookFilter===k}">${l}</button>`).join('')}</div>${state.role==='teacher'?`<label>Artista<select id="v2-notebook-person">${classStudents().map(p=>`<option value="${p.id}" ${p.id===person.id?'selected':''}>${escapeHTML(p.name)}</option>`).join('')}</select></label>`:''}${notebookFilter==='task'?`<label>Exercício<select id="v2-task-select">${tasks.map(a=>`<option value="${a.id}" ${a.id===task?.id?'selected':''}>${escapeHTML(a.title)}</option>`).join('')||'<option>Nenhum exercício</option>'}</select></label>`:''}</div><div class="v2-notebook-layout"><aside class="v2-exercise">${notebookFilter==='task'&&task?`<span class="eyebrow">${escapeHTML(lessonLabel(school().lessons.find(l=>l.id===task.lessonId)))}</span><h2>${escapeHTML(task.title)}</h2><p>${escapeHTML(task.description)}</p><small>Até ${dateLabel(task.due,{day:'2-digit',month:'long'})}</small><label class="v2-rhythm">Ritmo de prática<select id="v2-rhythm">${Object.entries(rhythms).map(([key,r])=>`<option value="${key}" ${key===progress.rhythm?'selected':''}>${r.name} · ${task.rhythms[key]} etapas</option>`).join('')}</select></label><div class="v2-steps">${task.steps.slice(0,stepCount).map((step,i)=>{const related=all.filter(t=>t.assignmentId===task.id&&t.stepId===step.id);return `<div><span class="mono">${String(i+1).padStart(2,'0')}</span><div><strong>${escapeHTML(step.title)}</strong><small>${related.length?related.length+' estudo(s) · '+related.filter(t=>t.status==='complete').length+' concluído(s)':'Pode começar com uma dúvida'}</small>${v2Button(related.length?'Abrir conversa':'Começar estudo',related.length?'study':'new-step',related.length?`data-id="${related[0].id}"`:`data-id="${step.id}" data-person="${person.id}"`)}</div></div>`;}).join('')}</div>${v2Button('Consultar aula de origem','lesson',`data-id="${task.lessonId}"`)}`:`<span class="eyebrow">SEU PERCURSO</span><h2>Ideias em construção.</h2><p>Guarde tentativas, faça perguntas e veja o que mudou no desenho.</p><p class="muted">${all.length} estudos · ${all.filter(t=>t.status==='complete').length} concluídos</p><details><summary>Ritmo e evolução</summary><p>${studentXP(person)} XP · ${studentAttendance(person).present} presenças</p></details>`}</aside><section><div class="v2-section-head"><h2>${notebookFilter==='free'?'Estudos livres':'Desenhos & conversas'}</h2><span>${works.length} estudo(s)</span></div><div class="v2-list">${works.map(t=>studyRow(t)).join('')||blankState('O primeiro traço pode ser uma pergunta.','Abra uma etapa ou comece um estudo. Não precisa estar pronto para compartilhar.',v2Button('Começar estudo','new-study',`data-person="${person.id}"`,true))}</div></section></div></div>`;
  if($('#v2-task-select'))$('#v2-task-select').onchange=e=>{school().selectedAssignment=e.target.value;persist();renderNotebook();};
  if($('#v2-notebook-person'))$('#v2-notebook-person').onchange=e=>{sketchbookStudent=e.target.value;renderNotebook();};
  if($('#v2-rhythm'))$('#v2-rhythm').onchange=e=>{progress.rhythm=e.target.value;persist();renderNotebook();};
}
function openStudy(id) {
  const t=accessibleThread(id);if(!t){toast('Este estudo não está disponível nesta visão.');return;}
  if(view!=='study'&&view!=='correction')studyBack=view;
  selectedStudy=id;navigate('study');
}
function renderStudy() {
  const t=accessibleThread(selectedStudy);if(!t)return;
  const teacher=state.role==='teacher', task=taskForThread(t), step=task?.steps.find(s=>s.id===t.stepId), person=getStudent(t.studentId), works=threadWorks(t), d=works.at(-1), draft=v2().drafts[viewerKey()+'|'+t.id]||{};
  v2().seen[viewerId()+'|'+t.id]=t.posts.length;persist();
  $('#view-study').innerHTML=`<div class="v2-study-page"><header class="v2-study-head"><div><button class="button-text" data-v2="study-back">← ${studyBack==='reviews'?'Acompanhamento':studyBack==='today'?'Hoje':'Voltar'}</button><div class="v2-title-line"><h1>${escapeHTML(t.title)}</h1>${phaseTag(t)}</div><p>${escapeHTML(person.name)} · ${escapeHTML(task?.title||'Estudo livre')}${step?' / '+escapeHTML(step.title):''}</p></div><div class="v2-head-tools">${teacher&&d?v2Button('Anotar no desenho','annotate',`data-id="${t.id}"`):''}${teacher?v2Button('Avaliar estudo','assess',`data-id="${t.id}"`):''}<button class="btn quiet" data-v2="publish" data-id="${t.id}">${v2().publications[t.id]?'Retirar da galeria':'Compartilhar na galeria'}</button></div></header><div class="v2-study-layout"><section class="v2-art-panel" aria-label="Desenho e versões"><div class="v2-art-stage">${d?`<img id="study-art" src="${deliveryImage(d)}" alt="${escapeHTML(t.title)} · versão ${d.version||1}">`:`<div class="v2-no-art">${icon('pen')}<h2>O desenho ainda está acontecendo.</h2><p>Você pode começar pela conversa e adicionar uma imagem depois.</p></div>`}</div><div class="v2-art-footer"><span id="v2-image-caption">${d?'Versão '+(d.version||1)+' · '+stamp(d.date):'Sem imagem por enquanto'}</span><span>${works.length} imagem(ns)</span></div>${works.length?`<div class="v2-filmstrip" aria-label="Versões do desenho">${works.map(w=>`<button data-v2="version" data-id="${w.id}" class="${w.id===d.id?'active':''}" aria-label="Ver versão ${w.version||1}" aria-pressed="${w.id===d.id}"><img src="${deliveryImage(w)}" alt=""><span>V${w.version||1}</span></button>`).join('')}</div>`:''}<details class="v2-brief"><summary>Proposta & contexto</summary><p>${escapeHTML(task?.description||'Exploração livre do artista.')}</p>${task?v2Button('Consultar aula de origem','lesson',`data-id="${task.lessonId}"`):''}<p>Compartilhado com ${escapeHTML(person.name.split(' ')[0])} e o professor. ${v2().publications[t.id]?'A imagem escolhida também está na galeria.':'A conversa não aparece na galeria.'}</p></details></section><section class="v2-conversation" aria-label="Conversa deste estudo"><div class="v2-conversation-title"><h2>Durante o desenho</h2><span>Você e ${teacher?escapeHTML(person.name.split(' ')[0]):'o professor'}</span></div><div class="v2-thread-log" id="study-log" role="log" aria-label="Histórico da conversa">${t.posts.map(p=>postHTML(p,t)).join('')}</div><form class="v2-composer" id="study-compose"><label for="study-message">${teacher?'Responda enquanto o estudo acontece':'O que você está tentando resolver?'}</label><textarea id="study-message" rows="3" maxlength="3000" placeholder="${teacher?'Uma observação, uma pergunta, uma direção…':'Estou preso nisso… / Testei outra construção…'}">${escapeHTML(draft.text||'')}</textarea><div id="v2-attachment-preview">${draft.image?`<img src="${draft.image}" alt="Imagem anexada ao rascunho"><span>Imagem pronta para compartilhar</span><button type="button" data-v2="remove-attachment" aria-label="Remover imagem anexada">×</button>`:''}</div><div class="v2-compose-actions"><label class="btn small v2-attach">${icon('image')}${teacher?'Anexar imagem':'Adicionar imagem'}<input id="study-attachment" type="file" accept="image/png,image/jpeg,image/webp" aria-label="Anexar imagem ao estudo"></label><label class="sr-only" for="study-intent">Intenção da mensagem</label><select id="study-intent">${(teacher?[['message','Responder'],['guidance','Orientar próximo passo']]:[['process','Compartilhar processo'],['help','Pedir ajuda'],['submit','Entregar para avaliação'],['resolve','Dúvida resolvida']]).map(([k,l])=>`<option value="${k}" ${draft.kind===k?'selected':''}>${l}</option>`).join('')}</select><button class="btn primary" type="submit" id="study-send">Enviar</button></div><div class="v2-compose-note"><span id="draft-status">${draft.text||draft.image?'Rascunho salvo neste navegador':'Pode enviar antes de terminar.'}</span><span id="study-error" role="alert"></span></div></form></section></div></div>`;
  const saveDraft=()=>{v2().drafts[viewerKey()+'|'+t.id]={...(v2().drafts[viewerKey()+'|'+t.id]||{}),text:$('#study-message').value,kind:$('#study-intent').value};const saved=persist();$('#draft-status').textContent=saved?'Rascunho salvo neste navegador':'Rascunho somente nesta sessão';};
  $('#study-message').oninput=saveDraft;$('#study-intent').onchange=saveDraft;
  $('#study-attachment').onchange=async e=>{const file=e.target.files[0];if(!file)return;const key=viewerKey()+'|'+t.id;$('#study-send').disabled=true;try{const image=await readImage(file);v2().drafts[key]={...(v2().drafts[key]||{}),image};persist();renderStudy();}catch(error){$('#study-error').textContent=error.message;$('#study-send').disabled=false;}};
  $('#study-compose').onsubmit=e=>sendStudyPost(e,t);
  requestAnimationFrame(()=>{const log=$('#study-log');if(log)log.scrollTop=log.scrollHeight;});
}
function postHTML(p,t) {
  const work=allDeliveries().find(d=>d.id===p.deliveryId), image=p.kind==='correction'?(p.image||work?.correction):p.image;
  const author=p.role==='teacher'?currentClass().teacher:artistDisplayName(t.studentId);
  const assessment=p.assessment&&typeof p.assessment==='object'?p.assessment:work?.review;
  const label={help:'PEDIDO DE AJUDA',submit:'ENTREGUE PARA AVALIAÇÃO',guidance:'PRÓXIMO PASSO',complete:'AVALIAÇÃO CONCLUÍDA',correction:'ANOTAÇÃO VISUAL',resolve:'DÚVIDA RESOLVIDA'}[p.kind];
  return `<article class="v2-post ${p.role}"><header><span class="avatar ${p.role==='teacher'?'amber':'pink'}">${escapeHTML(initials(author||'Artista'))}</span><strong>${escapeHTML(author||'Artista')}</strong><time>${stamp(p.createdAt)}</time></header>${label?`<span class="v2-post-kind">${label}</span>`:''}<p>${escapeHTML(p.text)}</p>${p.deliveryId&&!p.assessment&&p.kind!=='correction'?`<button class="v2-post-image" data-v2="version" data-id="${p.deliveryId}">${icon('image')}Ver imagem · V${work?.version||1}</button>`:''}${image?`<button class="v2-post-thumb" data-v2="post-image" data-id="${p.id}"><img src="${image}" alt="Imagem de orientação do professor"></button>`:''}${p.assessment&&assessment?`<details><summary>Critérios da avaliação · ${assessment.xp} XP</summary>${assessmentCriteria.map(([k,l])=>`<p>${l}: ${assessment.criteria[k]}/3</p>`).join('')}</details>`:''}</article>`;
}
function sendStudyPost(event,t) {
  event.preventDefault();const key=viewerKey()+'|'+t.id,draft=v2().drafts[key]||{},text=$('#study-message').value.trim(),kind=$('#study-intent').value;
  if(!text&&!draft.image){$('#study-error').textContent='Escreva uma mensagem ou adicione uma imagem.';return;}
  if(kind==='submit'&&!draft.image&&!newestWork(t)){$('#study-error').textContent='Adicione uma imagem do estudo antes de entregar para avaliação.';return;}
  const post={id:uid('post'),role:state.role,authorId:viewerId(),text,kind,createdAt:new Date().toISOString()};
  if(draft.image) {
    if(state.role==='teacher')post.image=draft.image;
    else {const works=threadWorks(t),d={id:uid('study'),rootId:t.id,parentId:works.at(-1)?.id||'',version:Math.max(0,...works.map(w=>w.version||1))+1,studentId:t.studentId,classId:t.classId,assignmentId:t.assignmentId,stepId:t.stepId,title:t.title,note:text,image:draft.image,date:post.createdAt,review:null,task:!!t.assignmentId};state.submissions.push(d);post.deliveryId=d.id;}
  }
  StudyModel.addPost(t,post);delete v2().drafts[key];v2().seen[viewerId()+'|'+t.id]=t.posts.length;
  saveSchool(kind==='help'?'Pedido de ajuda enviado ao professor.':kind==='submit'?'Estudo entregue para avaliação.':'Mensagem adicionada à conversa.');renderStudy();renderV2Nav();
}
function showNewStudy(assignmentId='',stepId='',studentId='') {
  const person=state.role==='teacher'?getStudent(studentId)||getStudent(sketchbookStudent)||currentLearner():currentLearner();if(!person)return;
  const task=school().assignments.find(a=>a.id===assignmentId),step=task?.steps.find(s=>s.id===stepId);
  openModal('Começar um estudo',`<form id="v2-new-study"><p class="form-intro">${escapeHTML(person.name)} · Abra uma conversa para este desenho. A imagem pode vir depois.</p><label class="field">Exercício<select id="new-study-task"><option value="">Estudo livre</option>${assignmentsForClass().map(a=>`<option value="${a.id}" ${a.id===assignmentId?'selected':''}>${escapeHTML(a.title)}</option>`).join('')}</select></label><label class="field" id="new-study-step-field">Etapa<select id="new-study-step"></select></label><label class="field">Nome do estudo<input id="new-study-title" maxlength="100" required value="${escapeHTML(step?.title||'')}" placeholder="Ex.: Tentando entender a sombra do cilindro"></label><label class="field">Por onde você quer começar?<textarea id="new-study-note" maxlength="3000" rows="3" placeholder="Conte o que está tentando desenhar ou onde travou."></textarea></label><label class="field">Intenção<select id="new-study-intent"><option value="process">Compartilhar meu processo</option><option value="help">Pedir ajuda ao professor</option></select></label><div class="form-actions"><button class="btn primary" type="submit">Abrir conversa do estudo</button></div></form>`);
  const steps=()=>{const a=school().assignments.find(x=>x.id===$('#new-study-task').value);$('#new-study-step-field').hidden=!a;$('#new-study-step').innerHTML=a?a.steps.map(s=>`<option value="${s.id}" ${s.id===stepId?'selected':''}>${escapeHTML(s.title)}</option>`).join(''):'';};steps();$('#new-study-task').onchange=steps;
  $('#v2-new-study').onsubmit=e=>{e.preventDefault();const title=$('#new-study-title').value.trim();if(!title)return;const kind=$('#new-study-intent').value,text=$('#new-study-note').value.trim()||(kind==='help'?'Preciso de ajuda para começar este estudo.':'Comecei este estudo. Vou compartilhar meu processo por aqui.');const taskId=$('#new-study-task').value;const t={id:uid('thread'),title,classId:currentClass().id,studentId:person.id,assignmentId:taskId,stepId:taskId?$('#new-study-step').value:'',status:kind==='help'?'help':'process',posts:[],updatedAt:new Date().toISOString()};StudyModel.addPost(t,{id:uid('post'),role:state.role,authorId:viewerId(),text,kind,createdAt:t.updatedAt});v2().threads.push(t);persist();closeModal();openStudy(t.id);$('#study-message')?.focus();};
}
function renderInbox() {
  const threads=visibleThreads().sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  const filters={attention:t=>StudyModel.needsTeacher(t),help:t=>t.status==='help',submitted:t=>t.status==='submitted',all:()=>true};
  const list=threads.filter(filters[inboxFilter]||filters.attention);
  $('#view-reviews').innerHTML=`<div class="v2-page"><header class="v2-page-head"><div><span class="eyebrow">OLHAR DO PROFESSOR</span><h1>O desenho não precisa esperar.</h1><p>Responda uma dúvida, acompanhe o processo ou avalie uma entrega.</p></div></header><div class="v2-notebook-toolbar"><div class="pill-group">${[['attention','Pedindo seu olhar'],['help','Dúvidas'],['submitted','Para avaliar'],['all','Todos os estudos']].map(([id,label])=>`<button class="pill ${inboxFilter===id?'active':''}" data-v2="inbox-filter" data-id="${id}" aria-pressed="${inboxFilter===id}">${label} <span class="badge">${threads.filter(filters[id]).length}</span></button>`).join('')}</div></div><div class="v2-list">${list.map(t=>studyRow(t)).join('')||blankState('Nenhum estudo nesta seleção','Novos pedidos de ajuda e entregas aparecem automaticamente aqui.')}</div></div>`;
}
function assessStudy(id) {
  const t=accessibleThread(id),work=t&&newestWork(t);if(state.role!=='teacher'||!t)return;
  if(!work){toast('Você pode responder agora. A avaliação por critérios fica disponível quando houver uma imagem.');return;}
  openModal('Avaliar · '+t.title,`<form id="v2-assess"><p class="form-intro">${escapeHTML(getStudent(t.studentId).name)} · Versão ${work.version||1}. Esta avaliação entra na conversa do estudo.</p>${assessmentCriteria.map(([key,label])=>`<label class="field">${label}<select id="v2-criterion-${key}" required><option value="">Selecionar</option>${[1,2,3].map(n=>`<option value="${n}" ${work.review?.criteria[key]===n?'selected':''}>${n} · ${['','Em construção','Desenvolvendo','Consistente'][n]}</option>`).join('')}</select></label>`).join('')}<label class="field">Orientação<textarea id="v2-assess-text" required maxlength="3000">${escapeHTML(work.review?.feedback||'')}</textarea></label><div class="field-row"><label class="field">Próximo passo<select id="v2-assess-status"><option value="revision">Pedir uma revisão</option><option value="approved">Concluir este estudo</option></select></label><label class="field">XP<input id="v2-assess-xp" type="number" min="0" max="200" step="10" value="${work.review?.xp||60}"></label></div><button class="btn primary" type="submit">Publicar orientação no estudo</button></form>`);
  $('#v2-assess').onsubmit=e=>{e.preventDefault();const feedback=$('#v2-assess-text').value.trim();if(!feedback)return;const status=$('#v2-assess-status').value,now=new Date().toISOString();work.review={status,feedback,xp:Number($('#v2-assess-xp').value),criteria:Object.fromEntries(assessmentCriteria.map(([k])=>[k,Number($('#v2-criterion-'+k).value)])),date:now};StudyModel.addPost(t,{id:uid('assessment'),role:'teacher',authorId:'teacher',kind:status==='approved'?'complete':'guidance',text:feedback,assessment:structuredClone(work.review),deliveryId:work.id,createdAt:now});saveSchool('Avaliação publicada na conversa.');closeModal();openStudy(t.id);};
}
function handleV2Action(event) {
  const button=event.target.closest('[data-v2]');if(!button||!v2Ready)return;
  const action=button.dataset.v2,id=button.dataset.id;
  const actions={study:()=>openStudy(id),notebook:()=>navigate('sketchbooks'),inbox:()=>navigate('reviews'),atelier:()=>navigate('atelier'),task:()=>{school().selectedAssignment=id;notebookFilter='task';navigate('sketchbooks');},'new-study':()=>showNewStudy(notebookFilter==='task'?activeAssignment()?.id:'','',button.dataset.person),'new-step':()=>showNewStudy(activeAssignment()?.id,id,button.dataset.person),'notebook-filter':()=>{notebookFilter=id;renderNotebook();},'inbox-filter':()=>{inboxFilter=id;renderInbox();},'study-back':()=>navigate(studyBack),'remove-attachment':()=>{delete v2().drafts[viewerKey()+'|'+selectedStudy]?.image;persist();renderStudy();},assess:()=>assessStudy(id),annotate:()=>openCorrection(id),version:()=>showStudyVersion(id),'post-image':()=>showPostImage(id),publish:()=>publishStudy(id),lesson:()=>{if(id)selectLesson(id,true);},'join-lesson':()=>joinLesson(),chat:()=>openRoomChat(),backup:()=>showBackup()};
  actions[action]?.();
}
function showStudyVersion(id) {
  const t=accessibleThread(selectedStudy),d=t&&threadWorks(t).find(w=>w.id===id);if(!d)return;
  $('#study-art').src=deliveryImage(d);$('#study-art').alt=t.title+' · versão '+(d.version||1);$('#v2-image-caption').textContent='Versão '+(d.version||1)+' · '+stamp(d.date);
  $$('.v2-filmstrip button').forEach(b=>{b.classList.toggle('active',b.dataset.id===id);b.setAttribute('aria-pressed',String(b.dataset.id===id));});
}
function showPostImage(id) {const t=accessibleThread(selectedStudy),p=t?.posts.find(p=>p.id===id),work=allDeliveries().find(w=>w.id===p?.deliveryId),img=p?.image||work?.correction;if(img)openModal('Orientação visual',`<img class="v2-full-image" src="${img}" alt="Anotação visual do professor">`);}
function publishStudy(id) {
  const t=accessibleThread(id),selected=$('.v2-filmstrip button.active')?.dataset.id,d=t&&(threadWorks(t).find(w=>w.id===selected)||newestWork(t));if(!t)return;
  if(v2().publications[id]){delete v2().publications[id];saveSchool('Estudo retirado da galeria.');renderStudy();return;}
  if(!d){toast('Adicione uma imagem antes de compartilhar na galeria.');return;}
  openModal('Compartilhar na galeria',`<p class="form-intro">A turma verá a versão ${d.version||1} de “${escapeHTML(t.title)}”. A conversa e as orientações continuam no sketchbook.</p><img class="v2-publication-preview" src="${deliveryImage(d)}" alt="Imagem escolhida para exposição">`,`<button class="btn" id="v2-cancel-publish">Cancelar</button><button class="btn primary" id="v2-confirm-publish">Compartilhar esta imagem</button>`);
  $('#v2-cancel-publish').onclick=closeModal;$('#v2-confirm-publish').onclick=()=>{v2().publications[id]=d.id;saveSchool('Imagem compartilhada na galeria da turma.');closeModal();renderStudy();};
}
