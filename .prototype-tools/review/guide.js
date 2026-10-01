(() => {
  const catalog=JSON.parse(document.getElementById('catalog').textContent);
  const storageKey='xuim-review-2.0-2026-09-20';
  const $=selector=>document.querySelector(selector);
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sectionById=id=>catalog.sections.find(s=>s.id===id);
  let state=ReviewModel.blank(catalog), pendingImport=null, toastTimer, storageBlocked=false;
  const savedLabel=$('#save-status');
  function warn(message) {$('#storage-warning').hidden=false;$('#storage-warning').textContent=message; savedLabel.textContent='Exporte para guardar';}
  try {
    const raw=localStorage.getItem(storageKey);
    if (raw) state=ReviewModel.validate(JSON.parse(raw),catalog);
    savedLabel.textContent=raw?'Respostas recuperadas':'Salvo só neste navegador';
  } catch {
    storageBlocked=true;
    warn('Não foi possível recuperar o armazenamento deste guia. As respostas desta sessão continuam disponíveis para exportação. O registro anterior não será sobrescrito; retome uma cópia JSON válida para recuperá-lo.');
  }
  function persist() {
    state.updatedAt=new Date().toISOString();
    if (storageBlocked) return false;
    try {localStorage.setItem(storageKey,JSON.stringify(state));savedLabel.textContent='Salvo neste navegador · '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});$('#storage-warning').hidden=true;return true;}
    catch {warn('O navegador não conseguiu guardar esta alteração. Suas respostas continuam nesta página: exporte o feedback ou uma cópia JSON antes de fechar.');return false;}
  }
  function toast(message) {clearTimeout(toastTimer);$('#toast').hidden=false;$('#toast').textContent=message;toastTimer=setTimeout(()=>$('#toast').hidden=true,5000);}
  const answeredSections=()=>catalog.sections.filter(s=>ReviewModel.count(state,s)>0);
  const legacyIds=new Set(catalog.sections.filter(s=>s.reviewKind==='legacy').flatMap(ReviewModel.keysFor));
  const proposesChange=(id,answer)=>['change','remove'].includes(answer?.decision)||(legacyIds.has(id)&&answer?.decision==='keep');
  function hasChanges(section) {return ReviewModel.keysFor(section).some(id=>proposesChange(id,state.answers[id]));}
  function renderIndex() {
    const n=answeredSections().length;
    $('#progress-label').textContent=`${n} de ${catalog.sections.length} áreas com resposta`;
    $('#progress').max=catalog.sections.length;$('#progress').value=n;
    const query=$('#search').value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('pt-BR').trim(),filter=$('#filter').value;
    const visible=catalog.sections.filter(s=>{
      const answered=ReviewModel.count(state,s)>0;
      if(filter==='untouched'&&answered||filter==='answered'&&!answered||filter==='changes'&&!hasChanges(s))return false;
      const text=JSON.stringify(s).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('pt-BR');
      return !query||text.includes(query);
    });
    $('#index').innerHTML=catalog.groups.map(group=>{
      const sections=visible.filter(s=>s.group===group);if(!sections.length)return '';
      return `<section class="nav-group"><h2>${escape(group)}</h2>${sections.map(s=>{const answered=ReviewModel.count(state,s)>0;return `<a class="nav-link" href="#${s.id}" ${state.current===s.id?'aria-current="page"':''}><span class="nav-num">${String(catalog.sections.indexOf(s)+1).padStart(2,'0')}</span><span class="nav-name">${escape(s.title)}</span>${answered?`<span class="nav-dot ${hasChanges(s)?'changes':''}" aria-label="${hasChanges(s)?'Com mudanças propostas':'Com resposta'}"></span>`:''}</a>`;}).join('')}</section>`;
    }).join('')||'<p class="no-results">Nenhum assunto com esse filtro. Experimente outra palavra ou selecione Todos os assuntos.</p>';
  }
  function feedback(item,whole=false) {
    const answer=state.answers[item.id]||{decision:'',text:''};
    return `<section class="feedback" data-answer-box="${item.id}" aria-label="Feedback: ${escape(whole?'área inteira':item.title)}"><div class="feedback-heading"><h2>Sua leitura desta área</h2><span class="answer-state" data-answer-state="${item.id}">${ReviewModel.hasAnswer(answer)?'Com resposta':'Sem resposta'}</span></div><fieldset><legend>${item.reviewKind==='legacy'?'O que você quer aproveitar da v1?':whole?'O que você acha da proposta desta área?':'Sua avaliação deste detalhe'} <span class="optional">(opcional)</span></legend><div class="choices">${Object.entries(ReviewModel.choicesFor(item)).map(([value,label])=>`<label class="choice"><input type="radio" name="decision-${item.id}" value="${value}" data-answer="${item.id}" data-field="decision" ${answer.decision===value?'checked':''}><span>${label}</span></label>`).join('')}</div></fieldset><label class="question" for="answer-${item.id}">${escape(item.question)}</label><textarea id="answer-${item.id}" data-answer="${item.id}" data-field="text" maxlength="20000" rows="${whole?4:3}" placeholder="Na realidade, eu imagino assim…">${escape(answer.text)}</textarea><p class="hint">${whole?'Pode repensar a área inteira. Os detalhes abaixo são opcionais.':'Pode corrigir a explicação, propor outra lógica ou deixar uma dúvida.'}</p></section>`;
  }
  function related(ids) {return (ids||[]).filter(id=>sectionById(id)).map(id=>`<a class="related" href="#${id}">${escape(sectionById(id).title)} ↗</a>`).join('');}
  function comparisonHTML(item) {
    if(!item.before)return '';
    return `<div class="version-comparison"><span class="change-tag">${escape(item.changeType)}</span><div class="version-pair"><section><h4>Na versão 1</h4><p>${escape(item.before)}</p></section><section><h4>Na versão 2</h4><p>${escape(item.after)}</p></section></div></div>`;
  }
  function renderChapter(section) {
    const index=catalog.sections.indexOf(section),prev=catalog.sections[index-1],next=catalog.sections[index+1];
    $('#content').innerHTML=`<article class="chapter"><div class="chapter-top"><span class="eyebrow">${escape(section.group)}</span><span class="chapter-num">${String(index+1).padStart(2,'0')} / ${catalog.sections.length}</span></div>${index===0?`<aside class="welcome"><h2>Primeiro, vamos acertar o sentido.</h2><p>Este caderno explica a versão 2.0 e abre espaço para você dizer como ela deveria funcionar. Leia um assunto por vez, corrija a ideia inteira ou abra os detalhes. Não precisa responder tudo nem seguir a ordem.</p><div class="mini-steps"><span>01 · LEIA A PROPOSTA</span><span>02 · CONTE SUA VISÃO</span><span>03 · EXPORTE QUANDO QUISER</span></div></aside>`:''}<header class="chapter-title"><h1>${escape(section.title)}</h1><p class="purpose">${escape(section.purpose)}</p><p class="location"><strong>Onde encontrar:</strong> ${escape(section.path)}</p>${section.reviewKind==='legacy'?'<div class="version-actions"><a class="button" href="atelie-xuim-1.0.html" target="_blank" rel="noopener">Abrir versão 1 ↗</a><a class="button" href="atelie-xuim-2.0.html" target="_blank" rel="noopener">Abrir versão 2 ↗</a><span>Escolha o que recuperar ou adaptar. As plataformas não são alteradas aqui.</span></div>':''}</header><div class="context-grid"><section class="context-block"><span class="label">Como está hoje</span><p>${escape(section.current)}</p></section><section class="context-block interpretation"><span class="label">Interpretação a revisar</span><p>${escape(section.assumption)}</p></section></div>${feedback({id:section.id,title:section.title,question:section.question,reviewKind:section.reviewKind},true)}<div class="detail-heading"><h2>${section.group==='Percursos completos'?'Revise cada momento':'Dentro desta área'}</h2><p>Abra só os pontos que quiser comentar.</p></div><div class="details-list">${section.items.map(item=>`<details class="detail" id="detail-${item.id}"><summary><div><h3>${escape(item.title)}</h3>${item.origin?`<p class="item-origin">${escape(item.origin)}</p>`:''}</div><span class="detail-answer" data-detail-state="${item.id}">${ReviewModel.hasAnswer(state.answers[item.id])?'Com resposta':''}</span></summary><div class="detail-body">${comparisonHTML(item)}<p>${escape(item.description)}</p>${feedback(item)}${item.links?`<div class="related-links">${related(item.links)}</div>`:''}</div></details>`).join('')}</div><section class="connections"><p>ESTE ASSUNTO SE CONECTA A</p><div class="related-links">${related(section.links)}</div></section><nav class="chapter-bottom" aria-label="Percorrer revisão">${prev?`<a class="button" href="#${prev.id}"><small>← ANTERIOR</small>${escape(prev.title)}</a>`:''}${next?`<a class="button next" href="#${next.id}"><small>PRÓXIMO →</small>${escape(next.title)}</a>`:'<a class="button next primary" href="#respostas"><small>RELER E EXPORTAR →</small>Minhas respostas</a>'}</nav><p class="reading-note">Mudar de assunto mantém suas respostas. Itens sem resposta continuam em aberto. O protótipo não é alterado por este guia.</p></article>`;
  }
  function renderSummary() {
    const sections=answeredSections(),answers=Object.values(state.answers).filter(ReviewModel.hasAnswer);
    const changes=Object.entries(state.answers).filter(([id,a])=>proposesChange(id,a)).length;
    $('#content').innerHTML=`<article class="chapter"><span class="eyebrow">SUA LEITURA DA VERSÃO 2.0</span><h1 style="margin-top:20px">O que você trouxe até aqui.</h1><p class="summary-intro">Releia e ajuste o que quiser. Suas respostas não foram enviadas automaticamente. Exporte o arquivo e anexe nesta conversa quando quiser que eu trabalhe a partir delas.</p><button class="button primary" data-export>Exportar feedback</button><div class="summary-stats"><div><strong>${sections.length}/${catalog.sections.length}</strong><span>áreas com resposta</span></div><div><strong>${answers.length}</strong><span>respostas registradas</span></div><div><strong>${changes}</strong><span>recuperações, mudanças ou remoções</span></div></div>${sections.map(s=>`<section class="response-group"><h2><a href="#${s.id}">${escape(s.title)} ↗</a></h2>${[{id:s.id,title:'Área inteira',question:s.question,reviewKind:s.reviewKind},...s.items].filter(item=>ReviewModel.hasAnswer(state.answers[item.id])).map(item=>{const answer=state.answers[item.id];return `<article class="response-entry"><h3>${escape(item.title)}</h3><span class="verdict">${escape(ReviewModel.choicesFor(item)[answer.decision])}</span><p class="prompt">${escape(item.question)}</p><p class="response-text">${escape(answer.text.trim()||'Somente a marcação; sem comentário.')}</p><a class="edit-answer" href="#${s.id}${item.id===s.id?'':'/'+item.id}">Editar esta resposta →</a></article>`;}).join('')}</section>`).join('')||'<p class="empty">Ainda não há respostas. Escolha um assunto no índice e escreva livremente. Você também pode deixar apenas uma marcação.</p>'}<p class="reading-note">${catalog.sections.length-sections.length} áreas ainda sem resposta. Elas não serão tratadas como aprovadas.</p></article>`;
  }
  function renderRoute(initial=false) {
    let route;
    try {route=decodeURIComponent(location.hash.slice(1));}catch{route='';}
    const [requested,detail]=route.split('/');
    const id=requested==='respostas'||sectionById(requested)?requested:state.current;
    state.current=id==='respostas'||sectionById(id)?id:catalog.sections[0].id;
    if(state.current==='respostas')renderSummary();else renderChapter(sectionById(state.current));
    renderIndex();if(!initial)persist();
    $('.sidebar').classList.remove('expanded');$('#mobile-index').setAttribute('aria-expanded','false');
    if(!initial){$('#content').focus({preventScroll:true});window.scrollTo(0,0);}
    if(detail&&sectionById(state.current)?.items.some(item=>item.id===detail)) {
      const node=document.getElementById('detail-'+detail);node.open=true;node.scrollIntoView({block:'start'});document.getElementById('answer-'+detail).focus({preventScroll:true});
    }
  }
  $('#content').addEventListener('input',event=>{
    const control=event.target;if(!control.dataset.answer)return;
    const id=control.dataset.answer,field=control.dataset.field;
    const answer=state.answers[id]||(state.answers[id]={decision:'',text:''});answer[field]=control.value;
    persist();renderIndex();
    const label=document.querySelector(`[data-answer-state="${id}"]`),detail=document.querySelector(`[data-detail-state="${id}"]`);
    if(label)label.textContent=ReviewModel.hasAnswer(answer)?'Com resposta':'Sem resposta';
    if(detail)detail.textContent=ReviewModel.hasAnswer(answer)?'Com resposta':'';
  });
  $('#search').oninput=renderIndex;$('#filter').onchange=renderIndex;
  $('#mobile-index').onclick=()=>{const open=$('.sidebar').classList.toggle('expanded');$('#mobile-index').setAttribute('aria-expanded',String(open));};
  window.addEventListener('hashchange',()=>renderRoute());
  // Notice edits in another tab before writing over them.
  window.addEventListener('storage',event=>{if(event.key===storageKey){storageBlocked=true;warn('Este guia foi alterado em outra aba. Para evitar sobrescrever respostas, exporte esta sessão. Depois recarregue para ver o que foi salvo na outra aba, ou importe uma cópia para escolher qual revisão manter.');}});
  function showExport() {
    $('#export-count').textContent=`${answeredSections().length} áreas · ${Object.values(state.answers).filter(ReviewModel.hasAnswer).length} respostas`;
    $('#export-status').textContent='';$('#copy-fallback').hidden=true;$('#copy-fallback-label').hidden=true;
    $('#export-dialog').showModal();
  }
  $('#export-top').onclick=showExport;
  document.addEventListener('click',event=>{if(event.target.closest('[data-export]'))showExport();if(event.target.closest('[data-close]'))event.target.closest('dialog').close();});
  function download(text,type,name) {
    const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');
    a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
    $('#export-status').textContent='Arquivo preparado para download. Confira os downloads do navegador.';
  }
  const filename=extension=>'xuim-feedback-2.0-'+new Date().toISOString().slice(0,19).replace(/[T:]/g,'-')+'.'+extension;
  $('#download-md').onclick=()=>download(ReviewModel.markdown(state,catalog),'text/markdown;charset=utf-8',filename('md'));
  $('#download-json').onclick=()=>download(JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2),'application/json',filename('json'));
  $('#copy-feedback').onclick=async()=>{
    const text=ReviewModel.markdown(state,catalog);
    try{await navigator.clipboard.writeText(text);$('#export-status').textContent='Feedback copiado. Você pode colar nesta conversa.';}
    catch{const field=$('#copy-fallback');field.hidden=false;$('#copy-fallback-label').hidden=false;field.value=text;field.focus();field.select();$('#export-status').textContent='A cópia automática não está disponível. Copie o texto selecionado.';}
  };
  $('#import-button').onclick=()=>$('#import-file').click();
  $('#import-file').onchange=async event=>{
    const file=event.target.files[0];event.target.value='';if(!file)return;
    if(file.size>8*1024*1024){toast('Use uma cópia de feedback de até 8 MB.');return;}
    try{
      pendingImport=ReviewModel.validate(JSON.parse(await file.text()),catalog);
      const n=Object.values(pendingImport.answers).filter(ReviewModel.hasAnswer).length;
      $('#import-description').textContent=`${file.name} contém ${n} resposta(s) em ${catalog.sections.filter(s=>ReviewModel.count(pendingImport,s)>0).length} área(s).`;
      $('#import-dialog').showModal();
    }catch(error){pendingImport=null;toast(error instanceof SyntaxError?'Este arquivo não contém JSON válido. Nada foi alterado.':error.message);}
  };
  $('#before-import').onclick=()=>{showExport();};
  $('#confirm-import').onclick=()=>{
    if(!pendingImport)return;state=pendingImport;pendingImport=null;storageBlocked=false;persist();$('#import-dialog').close();
    history.replaceState(null,'','#'+state.current);renderRoute(true);$('#content').focus({preventScroll:true});window.scrollTo(0,0);toast('Cópia retomada. Suas respostas estão disponíveis no guia.');
  };
  renderRoute(true);
})();
