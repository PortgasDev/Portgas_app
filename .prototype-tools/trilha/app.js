(()=>{
  const curriculum=JSON.parse(document.getElementById('curriculum').textContent);
  const weeks=curriculum.modules.flatMap(module=>module.weeks.map(([id,title,subtitle])=>({id,title,subtitle,module:module.id,type:title.startsWith('ENTREGA')?'delivery':title.startsWith('PROJETO')?'project':id===48?'bonus':'lesson'})));
  const $=selector=>document.querySelector(selector);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon=name=>`<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const weekById=id=>weeks.find(w=>w.id===Number(id));
  const moduleById=id=>curriculum.modules.find(m=>m.id===Number(id));
  const rec=id=>TrailModel.record(state,id);
  const modDone=module=>module.weeks.filter(([id])=>rec(id).completed).length;
  const weekIcon=week=>week.type==='project'?'flag':week.type==='delivery'?'star':week.type==='bonus'?'star':moduleById(week.module).icon;
  const key='xuim-trilha-48-semanas-v1';
  const mobile=matchMedia('(max-width:960px)');
  let state=TrailModel.blank(),blocked=false,toastTimer,undoAction=null,pendingRestore=null,routeFrame;
  function storageWarning(message){$('#storage-warning').hidden=false;$('#storage-warning').textContent=message;$('#save-status').textContent='Guarde uma cópia antes de fechar.';}
  try{const raw=localStorage.getItem(key);if(raw){state=TrailModel.validate(JSON.parse(raw));$('#save-status').textContent='Percurso recuperado deste navegador.';}}
  catch{blocked=true;storageWarning('Não foi possível recuperar seu percurso. Os dados anteriores não serão sobrescritos. Você pode retomar uma cópia ou guardar os testes desta sessão.');}
  // The selected week owns its module, including after importing older backups.
  state.module=weekById(state.selected).module;
  function save(){
    state.updatedAt=new Date().toISOString();if(blocked)return false;
    try{localStorage.setItem(key,JSON.stringify(state));$('#storage-warning').hidden=true;$('#save-status').textContent='Salvo às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});return true;}
    catch{storageWarning('O navegador não conseguiu guardar esta alteração. Seu percurso continua nesta página; use Guardar percurso antes de fechar.');return false;}
  }
  function toast(message,undo=null){clearTimeout(toastTimer);undoAction=undo;$('#toast-text').textContent=message;$('#undo-button').hidden=!undo;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,undo?12000:5000);}
  $('#undo-button').onclick=()=>{undoAction?.();undoAction=null;$('#toast').hidden=true;};
  function renderNav(){
    $('#module-nav').innerHTML=curriculum.modules.map(module=>{
      const done=modDone(module),all=module.weeks.length,active=state.module===module.id;
      return `<button class="module-link ${active?'active':''}" data-module="${module.id}" style="--module:${module.color}" ${active?'aria-current="step"':''} aria-label="Módulo ${module.id}: ${esc(module.title)}. ${done} de ${all} semanas concluídas"><span class="module-index">${done===all?'✓':String(module.id).padStart(2,'0')}</span><span class="nav-copy"><strong>${esc(module.short)}</strong><small>${String(module.weeks[0][0]).padStart(2,'0')}–${String(module.weeks.at(-1)[0]).padStart(2,'0')} · ${done}/${all} SEMANAS</small><span class="nav-progress"><i style="width:${done/all*100}%"></i></span></span><span class="nav-status">${active?'›':done===all?'✓':''}</span></button>`;
    }).join('');
  }
  function renderSummary(){
    const done=TrailModel.completed(state),next=TrailModel.next(state),review=TrailModel.reviews(state);
    $('#total-completed').textContent=done;$('#course-ring').style.strokeDashoffset=326.73*(1-done/48);
    $('.progress-medal').setAttribute('aria-label',`${done} de 48 semanas concluídas`);
    $('#summary-title').textContent=done===48?'Um caminho inteiro de descobertas.':done===0&&!state.active?'Seu primeiro traço espera.':`${done} ${done===1?'semana concluída':'semanas concluídas'}. Cada passo conta.`;
    $('#summary-note').textContent=next?`Seu próximo passo: semana ${String(next).padStart(2,'0')}.`:'As 48 semanas estão concluídas. Seu desenho continua.';
    $('#continue-button').innerHTML=(done===48?'Revisitar meu percurso':done===0&&!state.active?'Começar minha jornada':'Continuar minha jornada')+' <span>→</span>';
    $('#review-button').hidden=!review.length;$('#review-button').textContent=`↺ ${review.length} ${review.length===1?'semana para revisitar':'semanas para revisitar'}`;
  }
  function renderModule(){
    const module=moduleById(state.module),done=modDone(module),all=module.weeks.length;
    document.documentElement.style.setProperty('--module',module.color);
    $('#module-top').innerHTML=`<div class="module-seal">${icon(module.icon)}</div><div class="module-copy"><span class="eyebrow">MÓDULO ${String(module.id).padStart(2,'0')} · SEMANAS ${module.weeks[0][0]}—${module.weeks.at(-1)[0]}</span><h2>${esc(module.title)}</h2></div><div class="module-count">${done} / ${all}<small>semanas concluídas</small></div><div class="bottom-progress" style="width:${done/all*100}%"></div>`;
    const next=TrailModel.next(state);
    $('#route').innerHTML='<svg class="path-lines" aria-hidden="true"></svg>'+module.weeks.map(([id],index)=>{
      const week=weekById(id),r=rec(id),focus=next===id,shift=[-15,9,22,9,-15,-25][index%6];
      const label=`Semana ${id}: ${week.title}. ${week.subtitle}. ${r.completed?'Concluída':r.started?'Em andamento':'Ainda não iniciada'}${r.review?'. Marcada para revisitar':''}`;
      return `<div class="route-row ${week.type!=='lesson'?'project-row':''}" data-row="${id}"><div class="node-wrap" style="--shift:${shift}px">${focus?`<span class="focus-tag">${state.active===id?'SEU FOCO':'PRÓXIMO PASSO'}</span>`:''}<button class="week-node ${week.type} ${r.completed?'completed':''} ${focus?'active-week':''}" data-week="${id}" aria-label="${esc(label)}" aria-pressed="${state.selected===id}">${icon(r.completed?'check':weekIcon(week))}${r.review?`<span class="review-mark">${icon('review')}</span>`:''}</button></div><button class="week-label" data-week="${id}" aria-label="Abrir ${esc(label)}"><span class="week-kicker">SEMANA ${String(id).padStart(2,'0')}${week.type!=='lesson'?`<span class="type-label">${{project:'PROJETO',delivery:'ENTREGA',bonus:'NOVOS CAMINHOS'}[week.type]}</span>`:r.completed?'<span class="completed-text">✓ CONCLUÍDA</span>':''}</span><h3>${esc(week.title)}</h3><p>${esc(week.subtitle)}</p></button></div>`;
    }).join('');
    $('#module-finish').innerHTML=`<div class="finish-stamp ${done===all?'finished':''}">${icon(done===all?'check':'flag')}<div><strong>${done===all?'Mais um capítulo seu.':'Cada etapa constrói a próxima.'}</strong><small>${done===all?'Módulo concluído. Você pode voltar sempre.':`${all-done} ${all-done===1?'semana para completar este módulo.':'semanas para completar este módulo.'}`}</small></div></div>${module.id<6?`<button class="next-module" data-module="${module.id+1}">Explorar módulo ${module.id+1}: ${esc(moduleById(module.id+1).short)} →</button>`:'<button class="next-module" data-action="projects">Rever meus seis projetos →</button>'}`;
    scheduleLines();
  }
  function scheduleLines(){cancelAnimationFrame(routeFrame);routeFrame=requestAnimationFrame(drawLines);}
  function drawLines(){
    const route=$('#route'),svg=$('.path-lines'),bounds=route.getBoundingClientRect(),nodes=[...route.querySelectorAll('.week-node')];
    if(!svg||!bounds.width)return;svg.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
    svg.innerHTML=nodes.slice(1).map((node,index)=>{
      const previous=nodes[index],a=previous.getBoundingClientRect(),b=node.getBoundingClientRect();
      const x1=a.left+a.width/2-bounds.left,y1=a.top+a.height/2-bounds.top,x2=b.left+b.width/2-bounds.left,y2=b.top+b.height/2-bounds.top,mid=(y1+y2)/2;
      const path=`M${x1},${y1} C${x1},${mid} ${x2},${mid} ${x2},${y2}`;
      const done=rec(previous.dataset.week).completed&&rec(node.dataset.week).completed,focus=Number(node.dataset.week)===TrailModel.next(state);
      return `<path d="${path}"/>${done||focus?`<path d="${path}" class="${done?'completed-line':'focus-line'}"/>`:''}`;
    }).join('');
  }
  function projectStops(project){return `<div class="project-stops">${[[project.start,'Início'],[project.delivery,'Entrega']].map(([id,label])=>`<button data-week="${id}" class="${rec(id).completed?'done':''}">${rec(id).completed?'✓ ':''}${label}<small>SEMANA ${id}</small></button>`).join('')}</div>`;}
  function detailHTML(){
    const week=weekById(state.selected),r=rec(week.id),project=curriculum.projects.find(p=>p.start===week.id||p.delivery===week.id),next=TrailModel.next(state);
    return `<article class="week-detail"><div class="detail-art">${icon(weekIcon(week))}<span class="art-number">${String(week.id).padStart(2,'0')}</span></div><div class="detail-body"><span class="eyebrow">MÓDULO ${week.module} / SEMANA ${String(week.id).padStart(2,'0')}</span><h2>${esc(week.title)}</h2><p class="detail-subtitle">${esc(week.subtitle)}</p><div class="detail-state"><span class="state-chip ${r.completed?'done':''}">${r.completed?'✓ Concluída':r.started?'Em andamento':'Ainda por explorar'}</span>${r.review?'<span class="state-chip review">↺ Para revisitar</span>':''}</div><div class="detail-actions">${r.completed?`<p class="complete-banner">Esse passo já faz parte do seu caminho.</p>${next?`<button class="button primary" data-week="${next}">Ir ao próximo passo ${icon('arrow')}</button>`:'<button class="button primary" data-action="projects">Olhar para meus projetos</button>'}<button class="secondary-action" data-action="reopen">Desmarcar conclusão desta semana</button>`:`${!r.started||state.active!==week.id?`<button class="button ${!r.started?'primary':''}" data-action="start">${r.started?'Focar nesta semana':'Começar esta semana'} ${icon('arrow')}</button>`:''}<button class="button ${r.started?'primary':'quiet'}" data-action="complete">${icon('check')}Marcar semana concluída</button>`}</div><button class="review-action" data-action="review" aria-pressed="${r.review}">${icon('review')}${r.review?'Retirar de “para revisitar”':'Quero revisitar este conteúdo'}</button><label class="notes-field" for="week-note">Meu registro desta semana<textarea id="week-note" maxlength="10000" rows="4" placeholder="Uma descoberta, uma dúvida, algo que quero testar…">${esc(r.note)}</textarea></label><p class="note-caption" id="note-status">Suas anotações acompanham esta semana.</p>${project?`<div class="project-context"><span>UM PROJETO NO SEU PERCURSO</span><strong>${esc(project.title)}</strong>${projectStops(project)}</div>`:''}</div></article>`;
  }
  function renderDetails(){
    if(mobile.matches){$('#week-panel').innerHTML='';$('#mobile-week-content').innerHTML=detailHTML();}
    else{$('#mobile-week-content').innerHTML='';$('#week-panel').innerHTML=detailHTML()+'<p class="panel-note">'+icon('book')+'Seu ritmo não precisa ser uma linha reta. Conclua quando fizer sentido e volte quando precisar.</p>';}
  }
  function render(){renderNav();renderSummary();renderModule();renderDetails();}
  function closeOverview(){if($('#overview-dialog').open)$('#overview-dialog').close();}
  function openWeek(id,{scroll=false}={}){
    const week=weekById(id);if(!week)return;closeOverview();const changed=state.module!==week.module;
    state.module=week.module;state.selected=week.id;save();render();
    if(mobile.matches){if(!$('#week-dialog').open)$('#week-dialog').showModal();}
    else if(scroll||changed){requestAnimationFrame(()=>document.querySelector(`[data-row="${week.id}"]`)?.scrollIntoView({block:'center',behavior:'smooth'}));}
  }
  function openModule(id){
    const module=moduleById(id);if(!module)return;
    if($('#week-dialog').open)$('#week-dialog').close();closeOverview();
    state.module=module.id;state.selected=module.weeks.find(([id])=>!rec(id).completed)?.[0]||module.weeks[0][0];save();render();
    $('.sidebar').classList.remove('expanded');$('#mobile-modules').setAttribute('aria-expanded','false');$('#module-top').scrollIntoView({block:'start',behavior:'smooth'});
  }
  function changeCompletion(value){
    const id=state.selected,before=structuredClone(rec(id)),oldActive=state.active;
    TrailModel.complete(state,id,value);save();render();
    toast(value?`Semana ${id} concluída. Mais um passo no seu caminho.`:`Conclusão da semana ${id} desmarcada.`,()=>{state.records[id]=before;state.active=oldActive;save();render();});
  }
  function showOverview(title,html){$('#overview-title').textContent=title;$('#overview-content').innerHTML=html;if(!$('#overview-dialog').open)$('#overview-dialog').showModal();}
  function showProjects(){
    if($('#week-dialog').open)$('#week-dialog').close();
    showOverview('Seis ideias que ganham forma.',`<p class="overview-intro">Os projetos são pontos de encontro do que você aprende. Aqui você acompanha as semanas de início e entrega; marcar uma semana não envia uma arte ao professor.</p><div class="project-grid">${curriculum.projects.map(project=>`<article class="project-card" style="--module:${moduleById(weekById(project.start).module).color}">${icon(project.icon)}<span>PROJETO ${String(project.id).padStart(2,'0')}</span><h3>${esc(project.title)}</h3>${projectStops(project)}</article>`).join('')}</div>`);
  }
  function showReviews(){showOverview('Voltar também é avançar.',`<p class="overview-intro">Conteúdos que você escolheu revisitar. Essa marcação não apaga uma semana concluída.</p>${TrailModel.reviews(state).map(id=>{const w=weekById(id);return `<button class="review-row" data-week="${id}">${icon('review')}<span><strong>${esc(w.title)}</strong><small>SEMANA ${id} · ${esc(w.subtitle)}</small></span></button>`;}).join('')||'<p class="muted">Nenhuma semana marcada para revisitar.</p>'}`);}
  function showBackup(){showOverview('Guarde o seu caminho.',`<p class="overview-intro">Seu progresso e suas anotações ficam neste navegador. Guarde uma cópia para continuar em outro lugar. O arquivo da trilha permanece independente do ateliê e do caderno de revisão.</p><div class="backup-actions"><button class="button primary" data-action="export">Baixar cópia do percurso (.json)</button><button class="button" data-action="import">Retomar uma cópia</button><button class="text-button" data-action="copy">Copiar meu resumo em texto</button><p>O resumo inclui semanas concluídas, conteúdos para revisitar e suas anotações. Nenhum dado é enviado automaticamente.</p><details><summary>Alternativa: cópia JSON em texto</summary><p>Se o download não estiver disponível, copie este texto e guarde em um arquivo .json para restaurar depois.</p><label class="notes-field">Cópia completa<textarea readonly rows="6">${esc(JSON.stringify(state,null,2))}</textarea></label></details><p id="backup-status" role="status"></p></div>`);}
  function downloadBackup(){
    const text=JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2),url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');
    a.href=url;a.download='xuim-percurso-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);if($('#backup-status'))$('#backup-status').textContent='Cópia preparada. Confira os downloads do navegador.';
  }
  async function copySummary(){
    const text=['Meu percurso Xuim Art',`${TrailModel.completed(state)} de 48 semanas concluídas`,...weeks.filter(w=>rec(w.id).completed||rec(w.id).review||rec(w.id).note.trim()).map(w=>`\nSemana ${w.id} — ${w.title} | ${w.subtitle}\n${rec(w.id).completed?'Concluída':'Em estudo'}${rec(w.id).review?' · Para revisitar':''}${rec(w.id).note?'\n'+rec(w.id).note:''}`)].join('\n');
    try{await navigator.clipboard.writeText(text);$('#backup-status').textContent='Resumo copiado.';}
    catch{$('#backup-status').innerHTML=`<label class="notes-field">Selecione e copie seu resumo<textarea id="copy-summary" rows="6" readonly>${esc(text)}</textarea></label>`;$('#copy-summary').focus();$('#copy-summary').select();}
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('button,a');if(!button)return;
    if(button.dataset.module){openModule(Number(button.dataset.module));return;}
    if(button.dataset.week){openWeek(Number(button.dataset.week));return;}
    if(button.hasAttribute('data-close')){button.closest('dialog').close();return;}
    const action=button.dataset.action;
    if(action==='start'){TrailModel.update(state,state.selected,{started:true});state.active=state.selected;save();render();toast('Seu foco agora é a semana '+state.selected+'.');}
    if(action==='complete')changeCompletion(true);
    if(action==='reopen')changeCompletion(false);
    if(action==='review'){TrailModel.update(state,state.selected,{review:!rec(state.selected).review});save();render();}
    if(action==='projects')showProjects();
    if(action==='export')downloadBackup();
    if(action==='import')$('#backup-file').click();
    if(action==='copy')copySummary();
  });
  document.addEventListener('input',event=>{if(event.target.id!=='week-note')return;TrailModel.update(state,state.selected,{note:event.target.value});const saved=save();$('#note-status').textContent=saved?'Anotação salva neste navegador.':'Anotação disponível nesta sessão. Guarde uma cópia.';});
  $('#continue-button').onclick=()=>{const id=TrailModel.next(state);if(id)openWeek(id,{scroll:true});else openModule(1);};
  $('#brand-home').onclick=event=>{event.preventDefault();const id=TrailModel.next(state)||1;openWeek(id,{scroll:true});};
  $('#projects-button').onclick=showProjects;$('#save-button').onclick=showBackup;$('#review-button').onclick=showReviews;
  $('#mobile-modules').onclick=()=>{const expanded=$('.sidebar').classList.toggle('expanded');$('#mobile-modules').setAttribute('aria-expanded',String(expanded));};
  $('#backup-file').onchange=async event=>{
    const file=event.target.files[0];event.target.value='';if(!file)return;if(file.size>3*1024*1024){toast('Use uma cópia de até 3 MB.');return;}
    try{pendingRestore=TrailModel.validate(JSON.parse(await file.text()));$('#restore-summary').textContent=`Esta cópia tem ${TrailModel.completed(pendingRestore)} semanas concluídas e ${TrailModel.reviews(pendingRestore).length} marcadas para revisitar.`;$('#restore-dialog').showModal();}
    catch(error){pendingRestore=null;toast(error instanceof SyntaxError?'O arquivo não contém JSON válido. Nada foi alterado.':error.message);}
  };
  $('#restore-current').onclick=downloadBackup;
  $('#restore-confirm').onclick=()=>{if(!pendingRestore)return;state=pendingRestore;state.module=weekById(state.selected).module;pendingRestore=null;blocked=false;save();$('#restore-dialog').close();closeOverview();if($('#week-dialog').open)$('#week-dialog').close();render();$('#module-top').scrollIntoView({block:'start'});toast('Seu percurso foi retomado.');};
  window.addEventListener('storage',event=>{if(event.key===key){blocked=true;storageWarning('O percurso mudou em outra aba. Para não sobrescrever suas anotações, guarde uma cópia desta sessão antes de recarregar ou restaurar um arquivo.');}});
  mobile.addEventListener('change',()=>{if($('#week-dialog').open)$('#week-dialog').close();renderDetails();scheduleLines();});
  new ResizeObserver(scheduleLines).observe($('#route'));
  window.addEventListener('resize',scheduleLines);
  document.fonts.ready.then(scheduleLines);
  render();
})();
