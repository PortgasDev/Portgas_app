(() => {
  'use strict';
  const C = window.EyeCore;
  const $ = id => document.getElementById(id);
  const svg = $('drawing');
  const diagram = $('diagram');
  const board = document.querySelector('.board');
  const panel = $('side-panel');
  const LEVELS = window.XuimTraining.levels;
  const LEVEL_INFO = ['Inclinações suaves e relações mais simples.', 'Inclinações variadas e novas relações entre as partes.', 'Mais rotações e proporções menos familiares.'];
  const state = {phase: 'home', mode: 'session', focus: 'mix', level: 0, task: null, guess: null, index: 0, sequence: [], rounds: [], result: null, revising: false, pointer: null};
  const T=window.XuimTraining,run=T.create('regua',()=>confirm(true));
  let history = [];
  let storageAvailable = true;
  try { history = C.sanitizeHistory(JSON.parse(localStorage.getItem('xuim.olho-regua.sessions.v3') || '[]')); }
  catch { storageAvailable = false; }
  const fmt = n => n.toLocaleString('pt-BR', {maximumFractionDigits: 1, minimumFractionDigits: 1});
  const f = n => Number(n.toFixed(2));
  const line = (a, b, cls = 'diagram-line') => `<line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}" class="${cls}"/>`;
  const point = (p, cls = 'diagram-point', r = 5) => `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${r}" class="${cls}"/>`;
  let diagramScale = 1;
  // SVG scales geometry with its viewBox; labels retain their readable screen size.
  const text = (p, value, cls = 'diagram-label', anchor = 'middle') => {
    const pixels = cls.includes('diagram-emphasis') ? 24 : cls.includes('summary-chart-number') ? 20 : cls.includes('diagram-small') ? 13 : 14;
    return `<text x="${f(p.x)}" y="${f(p.y)}" class="${cls}" style="font-size:${f(pixels/diagramScale)}px" text-anchor="${anchor}">${value}</text>`;
  };
  const compact = () => svg.getBoundingClientRect().width < 540;
  const tell = message => { $('live-message').textContent = message; };
  function revealBoard() {
    if (window.innerWidth <= 820 && typeof board.scrollIntoView === 'function') board.scrollIntoView({block:'start',behavior:'instant'});
  }
  function arc(p, radius, start, end, cls = 'diagram-line') {
    const a = C.polar(p, radius, start), b = C.polar(p, radius, end);
    return `<path d="M${f(a.x)},${f(a.y)} A${radius},${radius} 0 ${end - start > 180 ? 1 : 0} 1 ${f(b.x)},${f(b.y)}" class="${cls}"/>`;
  }
  function targetMark(p, angle = 0) {
    return line(C.polar(p, 20, angle + 90), C.polar(p, 20, angle - 90), 'target-line');
  }
  function bracket(a, b, label, dy = 48) {
    const p = {x: a.x, y: a.y + dy}, q = {x: b.x, y: b.y + dy};
    return line(p, q, 'diagram-soft') + line({x:p.x,y:p.y-8},{x:p.x,y:p.y+8},'diagram-soft') + line({x:q.x,y:q.y-8},{x:q.x,y:q.y+8},'diagram-soft') + text({x:(p.x+q.x)/2,y:p.y+32},label,'diagram-small');
  }
  function angleLayout() {
    return compact() ? {reference: {x: 285, y: 200}, answer: {x: 620, y: 450}, radius: 165} : {reference: {x: 230, y: 345}, answer: {x: 635, y: 345}, radius: 172};
  }
  function best() {
    return run.best(state.level);
  }
  function recordText() {
    const score = best();
    return score === null ? 'Seu primeiro estudo' : `${score} / 100`;
  }
  function home() {
    run.stop();
    state.phase = 'home'; state.pointer = null; state.guess = null;
    board.className = 'board';
    $('home-button').hidden = true;
    $('session-bar').hidden = true;
    $('learning-note').hidden = false;
    $('board-kicker').textContent = 'ESTUDO DE OBSERVAÇÃO';
    $('board-counter').textContent = 'XUIM ART / 01';
    $('exercise-heading').textContent = 'Onde fica um terço do caminho?';
    $('exercise-description').textContent = 'O primeiro instrumento do desenho é o seu olhar.';
    $('board-hint').textContent = 'OBSERVE AS RELAÇÕES';
    $('legend').innerHTML = '<span class="legend-reference">Referência</span><span class="legend-attempt">Sua marca</span>';
    panel.innerHTML = `<span class="eyebrow">A BASE DO DESENHO</span><h2>Treine uma decisão<br>de cada vez.</h2><p>Encontre frações, copie ou divida ângulos e compare comprimentos.</p>${T.setup(state.level,LEVEL_INFO,run.daily(state.level).tries)}<div class="config"><div><label class="field-label" for="focus-select">Habilidade do tutorial</label><select class="select" id="focus-select"><option value="mix">As três habilidades</option>${C.TYPES.map(t=>`<option value="${t}">${C.META[t].name}</option>`).join('')}</select></div></div><div class="record"><span>Recorde clássico · ${LEVELS[state.level]}</span><strong id="best-score">${recordText()}</strong></div>`;
    $('focus-select').value = state.focus;
    draw();
  }
  function begin(mode) {
    const selected={session:'classic',practice:'tutorial'}[mode]||mode;
    if(!run.start(selected,state.level)){tell('Você já usou as três tentativas de hoje nesta dificuldade.');return home();}
    state.mode=selected==='tutorial'?'practice':'session';
    state.sequence = C.plan('mix', 6, run.random);
    state.rounds = []; state.index = 0; state.summarySaved = false;
    window.scrollTo?.(0,0);
    $('home-button').hidden = false;
    $('learning-note').hidden = true;
    $('session-bar').hidden = false;
    newTask();
  }
  function newTask() {
    const type = state.mode === 'session' ? state.sequence[state.index%6] : state.focus === 'mix' ? C.TYPES[state.index % 3] : state.focus;
    state.task = C.generate(type, state.level, run.random, state.rounds.findLast(r=>r.task.type===type)?.task);
    state.support=true;state.ended=false;state.expiredNoAnswer=false;run.next();
    state.guess = null; state.result = null; state.revising = false; state.pointer = null;
    state.phase = 'playing';
    playPanel(); updateBoard(); updateSession(); draw();
    revealBoard();
    tell(`Rodada ${state.index + 1}. ${C.META[type].name}. ${C.describe(state.task).description}`);
  }
  function updateBoard() {
    const task = state.task, review = state.phase === 'review';
    board.className = `board ${review ? 'reviewing' : 'playing'}`;
    $('board-kicker').textContent = `${C.META[task.type].name.toUpperCase()} · ${LEVELS[state.level].toUpperCase()}`;
    $('board-counter').textContent = state.mode === 'session'&&run.mode!=='endless' ? `${String(state.index+1).padStart(2,'0')} / 06` : `ESTUDO ${String(state.index+1).padStart(2,'0')}`;
    $('exercise-heading').textContent = review ? 'Compare sua marca com o alvo.' : C.describe(task).verb;
    $('exercise-description').textContent = review ? 'Linha vermelha: sua resposta. Marca preta tracejada: posição exata.' : C.describe(task).description;
    $('board-hint').textContent = review ? 'A DIFERENÇA ENSINA' : 'TOQUE OU ARRASTE PARA MARCAR';
    $('legend').innerHTML = `<span class="legend-reference">Referência</span><span class="legend-attempt">Sua marca</span>${review?'<span class="legend-target">Alvo</span>':''}`;
    $('drawing-title').textContent = C.META[task.type].name;
    $('drawing-desc').textContent = C.describe(task).description;
  }
  function taskHint() {
    if (state.task.type === 'midpoint') return ['Pense em partes iguais', `Divida o segmento em ${state.task.fraction[1]} partes iguais e conte ${state.task.fraction[0]} a partir de A.`];
    if (state.task.type === 'angle') return state.task.divide?['Divida o espaço entre os braços','Imagine uma linha dividindo a abertura em duas partes iguais. Reproduza uma dessas partes.']:['Compare a abertura', 'A base pode estar girada. Observe o espaço entre os braços, não a direção de uma linha isolada.'];
    return ['Pense em partes iguais', `Divida mentalmente a referência em ${state.task.fraction[1]} partes. Use ${state.task.fraction[0]} dessas partes no segmento abaixo.`];
  }
  function playPanel() {
    const [title, tip] = taskHint();
    panel.innerHTML = `<div class="task-number"><span class="step-label">${state.revising?'REVISÃO DA RODADA':'01 / OBSERVAR'}</span><span>${LEVELS[state.level]}</span></div><h2>${state.revising?'Observe mais uma vez.':'Sua marca, seu olhar.'}</h2><p>Toque na prancheta para posicionar sua resposta. Ajuste até ficar satisfeito.</p><div class="instruction-card"><strong>${title}</strong><p>${tip}</p></div><div class="game-controls"><div class="adjust-section"><span class="field-label" id="adjust-label">Ajustar sua marca</span><div class="adjust-row"><button data-action="minus" aria-label="Diminuir marca">−</button><div class="adjust-track unset" id="adjust-track" role="slider" tabindex="0" aria-labelledby="adjust-label" aria-describedby="adjust-help" aria-valuemin="0" aria-valuemax="100" aria-valuenow="20" aria-valuetext="Nenhuma resposta marcada"><span class="adjust-knob" id="adjust-knob" aria-hidden="true"></span></div><button data-action="plus" aria-label="Aumentar marca">+</button></div><p class="adjust-caption" id="adjust-help">Setas: ajustar · Shift + seta: ajuste fino.</p></div><div class="action-stack"><button class="button primary wide" id="confirm-button" data-action="confirm" disabled>Confirmar minha marca →</button><p class="control-help" id="answer-status">Faça uma marca para continuar.</p></div></div>${state.revising?'<p class="revision-note">Esta é uma revisão. A primeira tentativa permanece no resumo da sessão.</p>':''}`;
    panel.insertAdjacentHTML('afterbegin',run.status());
    if(run.mode==='tutorial')panel.querySelector('.instruction-card').outerHTML=T.tutorial(tutorialCopy(),state.support);
    updateControls();
  }
  function tutorialCopy(){const t=state.task;return t.type==='midpoint'?`As marcas azuis dividem o caminho em ${t.fraction[1]} partes iguais. Conte ${t.fraction[0]} a partir de A e coloque sua marca no círculo azul.`:t.type==='angle'?(t.divide?'A linha azul divide a abertura em duas. Copie uma dessas metades no segundo desenho.':'A linha pontilhada mostra a abertura que você deve copiar. Arraste a ponta até ela; depois experimente sem a ajuda.'):`As marcas dividem a referência em partes iguais. A linha azul de baixo mostra ${C.fractionWords(t.fraction)} desse comprimento. Ajuste sua linha vermelha para comparar.`;}
  function setGuess(value) {
    if (state.phase !== 'playing') return;
    state.guess = C.clamp(value);
    updateControls(); draw();
  }
  function updateControls() {
    const track = $('adjust-track');
    if (!track) return;
    const unset = state.guess === null;
    const value = unset ? .2 : state.guess;
    track.classList.toggle('unset', unset);
    track.setAttribute('aria-valuenow', String(Math.round(value*100)));
    track.setAttribute('aria-valuetext', unset ? 'Nenhuma resposta marcada' : `${Math.round(value*100)} de 100 posições do controle`);
    $('adjust-knob').style.left = `calc(16px + (100% - 32px) * ${value})`;
    $('confirm-button').disabled = unset;
    $('answer-status').textContent = unset ? 'Faça uma marca para continuar.' : 'Marca pronta. Você ainda pode ajustar.';
  }
  function confirm(expired=false) {
    if (state.phase !== 'playing' || (state.guess === null&&!expired)) return;
    state.pointer = null;
    run.stop();state.expiredNoAnswer=state.guess===null;
    state.result = C.assess(state.task, state.guess??0);
    if(state.expiredNoAnswer)state.result.score=0;
    if(!state.revising)state.ended=run.ended(state.result.score);
    if (!state.revising) state.rounds.push({task: state.task, result: state.result});
    state.phase = 'review';
    updateBoard(); feedbackPanel(); updateSession(); draw();
    revealBoard();
    tell(`${state.result.score} pontos. Desvio de ${fmt(state.result.error)}${state.result.unit}. ${feedback().description}`);
  }
  function feedback() {
    const r = state.result, t = state.task;
    if(state.expiredNoAnswer)return {heading:'O tempo terminou.',description:'Nenhuma resposta foi enviada nesta rodada. Experimente o tutorial para entender o exercício com calma.',tip:'No tutorial, as marcas azuis mostram como comparar as medidas.',unitLabel:'Sem resposta'};
    const heading = r.score >= 96 ? 'Um olhar preciso.' : r.score >= 80 ? 'Você chegou perto.' : 'A diferença dá uma pista.';
    if (t.type === 'midpoint') return {heading, description: `O pedido era ${C.fractionWords(t.fraction)} do caminho. Sua marca ficou ${r.delta<0?'antes':r.delta>0?'depois':'na posição'} do alvo.`, tip: `Compare ${t.fraction[0]} de ${t.fraction[1]} partes iguais. A ordem sempre começa em A, mesmo quando o segmento está inclinado.`, unitLabel: 'Desvio no segmento'};
    if (t.type === 'angle') return {heading, description: `A referência tem ${fmt(t.degrees)}°. ${t.divide?'A metade pedida é':'O alvo é'} ${fmt(t.target*180)}°. Sua abertura ficou em ${fmt(r.guess*180)}°.`, tip: t.divide?'Imagine uma linha separando duas aberturas iguais. Cada uma corresponde à metade do ângulo.':'Imagine girar as duas bases até ficarem alinhadas. Compare a abertura entre os braços.', unitLabel: 'Diferença de abertura'};
    return {heading, description: `O pedido era ${C.fractionWords(t.fraction)} da referência. Sua linha ficou ${r.delta<0?'mais curta':r.delta>0?'mais longa':'do tamanho esperado'}.`, tip: `Imagine ${t.fraction[1]} trechos iguais dentro da referência. Compare seu segmento com ${t.fraction[0]} desses trechos, sem contar pixels.`, unitLabel: 'Desvio na referência'};
  }
  function feedbackPanel() {
    const r=state.result, info=feedback(), previous=state.rounds[state.index];
    const comparison=state.revising&&previous?`Primeira tentativa: ${previous.result.score} pontos. Revisão: ${r.score} pontos.`:'';
    panel.innerHTML = `<span class="step-label">02 / COMPARAR</span><h2 class="feedback-heading">${info.heading}</h2><div class="score-row"><strong class="score-value">${r.score}</strong><span class="score-label">DE 100 PONTOS</span></div><div class="error-detail"><span>${info.unitLabel}</span><strong>${state.expiredNoAnswer?'—':fmt(r.error)+r.unit}</strong></div><p class="feedback-copy">${info.description}</p><div class="feedback-tip"><strong>Na próxima tentativa</strong>${info.tip}</div>${comparison?`<p class="revision-note">${comparison}</p>`:''}<div class="action-stack"><button class="button primary" data-action="next">${state.ended?'Ver meu resumo':'Próxima rodada'} →</button>${run.mode==='tutorial'?'<button class="button" data-action="retry">Tentar este exercício de novo</button>':''}</div>`;
  }
  function next() {
    if (state.phase !== 'review') return;
    if (state.ended) return summary(true);
    state.index++; newTask();
  }
  function retry() {
    if (state.phase !== 'review'||run.mode!=='tutorial') return;
    state.revising = true; state.phase = 'playing'; state.guess = null; state.result = null;
    updateBoard(); playPanel(); draw();
    revealBoard();
    tell('Revisão da mesma rodada. Posicione uma nova marca.');
  }
  function updateSession() {
    $('session-caption').textContent = state.mode === 'session'&&run.mode!=='endless' ? `${state.rounds.length} DE 6 RESPONDIDAS` : `${state.rounds.length} ESTUDOS RESPONDIDOS`;
    $('round-list').innerHTML = state.mode === 'session'&&run.mode!=='endless' ? Array.from({length:6},(_,i)=>`<span class="round-item ${i===state.index?'current':i<state.rounds.length?'done':''}" title="Rodada ${i+1}${state.rounds[i]?`: ${state.rounds[i].result.score} pontos`:''}"></span>`).join('') : '';
    $('finish-button').hidden = state.mode !== 'practice' || state.rounds.length === 0;
  }
  function summary(complete = false) {
    if (!state.rounds.length) return home();
    run.stop();
    if(complete)run.save(C.summarize(state.rounds).average,state.rounds.length);
    state.phase = 'summary'; state.pointer = null;
    state.summary = C.summarize(state.rounds);
    if (complete && run.mode === 'classic' && !state.summarySaved) {
      state.newBest = run.newBest;
      history.push({date:new Date().toISOString(),average:state.summary.average,level:state.level,focus:state.focus});
      history=history.slice(-20);
      try {localStorage.setItem('xuim.olho-regua.sessions.v3',JSON.stringify(history));}
      catch {storageAvailable=false;}
      state.summarySaved = true;
    } else state.newBest = false;
    $('storage-warning').hidden = storageAvailable;
    $('session-bar').hidden = true;
    board.className = 'board';
    $('board-kicker').textContent = complete ? 'SESSÃO CONCLUÍDA' : 'RESUMO DO TREINO';
    $('board-counter').textContent = `${state.rounds.length} ESTUDOS`;
    $('exercise-heading').textContent = 'Seu olhar, em perspectiva.';
    $('exercise-description').textContent = 'Cada marca é uma informação para o próximo desenho.';
    $('legend').innerHTML = '<span class="legend-attempt">Primeira tentativa de cada rodada</span>';
    $('board-hint').textContent = LEVELS[state.level].toUpperCase();
    const available = state.summary.categories.filter(c=>c.score!==null).sort((a,b)=>a.score-b.score);
    state.suggestedFocus = available[0].type;
    const note = complete ? state.newBest ? 'Esta é sua melhor sessão nesta combinação de nível e habilidade.' : 'Sessão registrada no seu histórico local.' : 'Treino e sessões parciais não alteram seu recorde.';
    panel.innerHTML = `<span class="eyebrow">03 / CONTINUAR</span><h2>O processo fica visível.</h2><div class="score-row"><strong class="score-value">${state.summary.average}</strong><span class="score-label">MÉDIA DA SESSÃO</span></div><div class="summary-metrics">${state.summary.categories.filter(c=>c.score!==null).map(c=>`<div class="category-row"><div class="category-label"><span>${C.META[c.type].name}</span><strong>${c.score} / 100</strong></div><div class="meter"><div style="width:${c.score}%"></div></div></div>`).join('')}</div><p class="feedback-copy">Que tal observar <strong>${C.META[state.suggestedFocus].name.toLowerCase()}</strong> mais uma vez? Você pode isolar essa habilidade no tutorial.</p><div class="action-stack"><button class="button primary" data-action="focus-practice">Treinar ${C.META[state.suggestedFocus].name.toLowerCase()} →</button><button class="button" data-action="new-session">Jogar novamente</button><button class="text-button" data-action="download">Baixar resumo do treino ↗</button></div><p class="recent-note">${note}</p>`;
    panel.insertAdjacentHTML('afterbegin',`<p class="training-description">${T.modes[run.mode]} · ${LEVELS[state.level]}${run.mode==='endless'?' · '+Math.max(0,state.rounds.length-1)+' rodadas superadas':''}</p>`);
    draw(); revealBoard(); tell(`Sessão finalizada. Média de ${state.summary.average} pontos.`);
  }
  function draw() {
    const bounds=svg.getBoundingClientRect();
    diagramScale=Math.min(bounds.width/900,bounds.height/620)||1;
    if (state.phase === 'home') {
      $('drawing-title').textContent='Um exercício de divisão do segmento';
      $('drawing-desc').textContent='Segmento de A até B com uma marca vermelha entre as extremidades.';
      const a={x:160,y:360},b={x:740,y:255},p=C.mix(a,b,.38);
      diagram.innerHTML=line(a,b)+point(a)+point(b)+text({x:a.x-10,y:a.y+50},'A')+text({x:b.x+10,y:b.y+50},'B')+point(p,'attempt-point',12)+line({x:p.x,y:p.y-80},{x:p.x,y:p.y-28},'attempt-line')+text({x:p.x,y:p.y-104},'ONDE FICA UM TERÇO?','diagram-small red-label')+text({x:450,y:520},'UMA RELAÇÃO. UMA DECISÃO.','diagram-small');
      return;
    }
    if(state.phase==='summary') return drawSummary();
    const t=state.task, g=state.guess, review=state.phase==='review';
    let markup='';
    if(t.type==='midpoint') {
      markup=line(t.a,t.b)+point(t.a)+point(t.b)+text({x:t.a.x-24,y:t.a.y+42},'A')+text({x:t.b.x+24,y:t.b.y+42},'B');
      if(g!==null) markup+=point(C.mix(t.a,t.b,g),'attempt-point',11);
      if(review) {
        const target=C.mix(t.a,t.b,t.target),tilt=Math.atan2(t.b.y-t.a.y,t.b.x-t.a.x)*180/Math.PI;
        markup+=targetMark(target,tilt)+text({x:450,y:565},`${compact()?'':'SUAS PARTES: '}${fmt(g*100)}% / ${fmt((1-g)*100)}%`,'diagram-small');
        markup+=text({x:target.x,y:target.y-48},`${fmt(t.target*100)}% + ${fmt((1-t.target)*100)}%`,'diagram-small');
      } else if(g===null) markup+=text({x:450,y:555},'TOQUE NO SEGMENTO PARA MARCAR','diagram-small');
    } else if(t.type==='angle') {
      const layout=angleLayout(),a=layout.reference,b=layout.answer,r=layout.radius;
      markup+=text({x:a.x,y:a.y-r-28},t.divide?'REFERÊNCIA · DIVIDA AO MEIO':'REFERÊNCIA','diagram-small');
      markup+=line(a,C.polar(a,r,t.base))+line(a,C.polar(a,r,t.base+t.degrees))+arc(a,48,t.base,t.base+t.degrees)+point(a);
      markup+=text({x:b.x,y:b.y-r-28},'SUA ABERTURA','diagram-small');
      markup+=line(b,C.polar(b,r,t.answerBase))+point(b);
      if(g!==null) markup+=line(b,C.polar(b,r,t.answerBase+g*180),'attempt-line')+point(C.polar(b,r,t.answerBase+g*180),'attempt-point',9)+arc(b,55,t.answerBase,t.answerBase+Math.max(.1,g*180),'attempt-line');
      if(review) markup+=line(b,C.polar(b,r,t.answerBase+t.target*180),'target-line')+text({x:a.x,y:a.y+95},`${fmt(t.degrees)}°`,'diagram-emphasis')+text({x:b.x,y:b.y+95},`${fmt(g*180)}°`,'diagram-emphasis red-label');
      else if(g===null) markup+=arc(b,80,t.answerBase,t.answerBase+80,'diagram-soft');
    } else {
      const a={x:150,y:220},b={x:150+t.reference,y:220},origin={x:150,y:405};
      markup+=text({x:150,y:160},'REFERÊNCIA','diagram-small','start')+line(a,b)+point(a)+point(b);
      markup+=text({x:150,y:348},C.fractionWords(t.fraction).toUpperCase()+' DA REFERÊNCIA','diagram-small','start')+point(origin);
      if(g!==null) markup+=line(origin,{x:origin.x+g*t.maxLength,y:origin.y},'attempt-line')+point({x:origin.x+g*t.maxLength,y:origin.y},'attempt-point',10);
      else markup+=line(origin,{x:750,y:origin.y},'diagram-soft');
      if(review) {
        const end={x:origin.x+t.target*t.maxLength,y:origin.y};
        markup+=line(origin,end,'target-line')+targetMark(end)+bracket(origin,end,`${t.fraction[0]}/${t.fraction[1]} DA REFERÊNCIA`);
        for(let i=1;i<t.fraction[1];i++){const p=C.mix(a,b,i/t.fraction[1]);markup+=line({x:p.x,y:p.y-12},{x:p.x,y:p.y+12},'target-line');}
      }
    }
    if(run.mode==='tutorial'&&state.support&&!review){
      if(t.type==='midpoint'){for(let i=1;i<t.fraction[1];i++)markup+=point(C.mix(t.a,t.b,i/t.fraction[1]),'tutorial-dot',5);markup+=point(C.mix(t.a,t.b,t.target),'tutorial-dot',12);}
      else if(t.type==='angle'){const {reference:a,answer:b,radius:r}=angleLayout();markup+=line(b,C.polar(b,r,t.answerBase+t.target*180),'tutorial-overlay');if(t.divide)markup+=line(a,C.polar(a,r,t.base+t.degrees/2),'tutorial-overlay');}
      else{const origin={x:150,y:405},end={x:150+t.target*t.maxLength,y:405};markup+=line(origin,end,'tutorial-overlay')+point(end,'tutorial-dot',8);for(let i=1;i<t.fraction[1];i++)markup+=line({x:150+t.reference*i/t.fraction[1],y:207},{x:150+t.reference*i/t.fraction[1],y:233},'tutorial-overlay');}
    }
    diagram.innerHTML=markup;
  }
  function drawSummary() {
    const rounds=state.rounds.slice(-9), width=640, start=130, gap=width/rounds.length;
    $('drawing-title').textContent='Pontuação por rodada';
    $('drawing-desc').textContent=rounds.map((r,i)=>`Rodada ${state.rounds.length-rounds.length+i+1}: ${r.result.score} pontos`).join('. ');
    let markup=text({x:450,y:112},state.rounds.length>9?'ÚLTIMAS 9 RODADAS':'CADA TENTATIVA CONTA','diagram-small');
    markup+=line({x:110,y:480},{x:790,y:480},'diagram-soft');
    for(let i=0;i<rounds.length;i++) {
      const score=rounds[i].result.score,x=start+i*gap+gap/2,h=Math.max(3,score/100*250);
      markup+=`<rect x="${f(x-gap*.24)}" y="${480-h}" width="${f(gap*.48)}" height="${h}" fill="var(--red)"/>`+text({x,y:480-h-22},String(score),'summary-chart-number')+text({x,y:525},String(state.rounds.length-rounds.length+i+1).padStart(2,'0'),'diagram-small');
    }
    diagram.innerHTML=markup;
  }
  function svgPosition(e) {
    const matrix=svg.getScreenCTM();
    if(!matrix) return null;
    return new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());
  }
  function chooseAt(e) {
    const p=svgPosition(e);if(!p)return;
    if(p.x<0||p.x>900||p.y<0||p.y>620)return;
    const t=state.task;
    if(t.type==='midpoint')setGuess(C.project(p,t.a,t.b));
    else if(t.type==='ratio')setGuess((p.x-150)/t.maxLength);
    else {
      const pivot=angleLayout().answer;
      if(Math.hypot(p.x-pivot.x,p.y-pivot.y)<12)return;
      let angle=(Math.atan2(p.y-pivot.y,p.x-pivot.x)*180/Math.PI-t.answerBase+360)%360;
      if(angle>180)angle=angle<270?180:0;
      setGuess(angle/180);
    }
  }
  svg.addEventListener('pointerdown',e=>{
    if(state.phase!=='playing'||state.pointer!==null||e.button!==0)return;
    e.preventDefault();state.pointer={id:e.pointerId,source:'svg'};svg.setPointerCapture(e.pointerId);chooseAt(e);
  });
  svg.addEventListener('pointermove',e=>{if(state.pointer?.source==='svg'&&e.pointerId===state.pointer.id)chooseAt(e);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(event,e=>{if(e.pointerId===state.pointer?.id)state.pointer=null;});
  function trackAt(e,track) {const r=track.getBoundingClientRect();setGuess((e.clientX-r.left-16)/(r.width-32));}
  panel.addEventListener('pointerdown',e=>{
    const track=e.target.closest('#adjust-track');if(!track||state.phase!=='playing'||state.pointer!==null||e.button!==0)return;
    e.preventDefault();track.focus();state.pointer={id:e.pointerId,source:'track'};track.setPointerCapture(e.pointerId);trackAt(e,track);
  });
  panel.addEventListener('pointermove',e=>{if(state.pointer?.source==='track'&&state.pointer.id===e.pointerId){const track=$('adjust-track');if(track)trackAt(e,track);}});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])panel.addEventListener(event,e=>{if(e.pointerId===state.pointer?.id)state.pointer=null;});
  panel.addEventListener('keydown',e=>{
    if(e.target.id!=='adjust-track'||state.phase!=='playing')return;
    const amount=e.shiftKey?.001:.01,current=state.guess??.2;
    if(['ArrowRight','ArrowUp','ArrowLeft','ArrowDown','Home','End'].includes(e.key)){
      e.preventDefault();setGuess(e.key==='Home'?0:e.key==='End'?1:current+(['ArrowRight','ArrowUp'].includes(e.key)?amount:-amount));
    }
  });
  function download() {
    const summary=C.summarize(state.rounds);
    const lines=['XUIM ART — OLHO DE RÉGUA',new Date().toLocaleString('pt-BR'),`Nível: ${LEVELS[state.level]}`,`Média: ${summary.average}/100`,'',...state.rounds.map((r,i)=>`Rodada ${i+1} | ${C.META[r.task.type].name} | ${r.result.score}/100 | desvio ${fmt(r.result.error)}${r.result.unit}`),'','Os resultados registram a primeira tentativa de cada rodada.','Proporções: desvio em relação ao comprimento da referência.','Divisões: desvio em relação ao segmento inteiro.','Ângulos: diferença em graus.'];
    const url=URL.createObjectURL(new Blob(['\ufeff'+lines.join('\n')],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='xuim-art_olho-de-regua_resumo.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  panel.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.trainingMode){begin(b.dataset.trainingMode);return;}
    if(b.dataset.level!==undefined){state.level=Number(b.dataset.level);home();return;}
    switch(b.dataset.action){
      case'support':state.support=!state.support;playPanel();draw();break;
      case'session':begin('classic');break;
      case'practice':begin('practice');break;
      case'plus':setGuess((state.guess??.2)+.01);break;
      case'minus':setGuess((state.guess??.2)-.01);break;
      case'confirm':confirm();break;
      case'next':next();break;
      case'retry':retry();break;
      case'focus-practice':state.focus=state.suggestedFocus;begin('practice');break;
      case'new-session':begin(run.mode);break;
      case'download':download();break;
    }
  });
  panel.addEventListener('change',e=>{if(e.target.id==='focus-select'){state.focus=e.target.value;$('best-score').textContent=recordText();}});
  function exitPrompt() {
    if(state.phase==='summary'||state.phase==='home')return home();
    $('exit-summary').disabled=!state.rounds.length;$('exit-dialog').showModal();
  }
  $('home-button').addEventListener('click',exitPrompt);
  $('finish-button').addEventListener('click',()=>summary(false));
  $('exit-home').addEventListener('click',()=>{$('exit-dialog').close();home();});
  $('exit-summary').addEventListener('click',()=>{$('exit-dialog').close();summary(false);});
  $('help-button').addEventListener('click',()=>$('help-dialog').showModal());
  for(const b of document.querySelectorAll('[data-close]'))b.addEventListener('click',()=>b.closest('dialog').close());
  window.XuimKeys.register({guide:()=>{if(run.mode!=='tutorial'||state.phase!=='playing')return false;state.support=!state.support;playPanel();draw();},confirm:()=>{if(state.phase==='playing')confirm();else if(state.phase==='review')next();else return false;},retry:()=>{if(state.phase!=='review')return false;retry();}});
  new ResizeObserver(draw).observe(svg);
  $('storage-warning').hidden=storageAvailable;
  home();
})();
