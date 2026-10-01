const atelierWorld=new AtelierWorld();
const atelierCoats={red:'Vermelho',sage:'Verde',blue:'Azul',ochre:'Ocre',plum:'Ameixa'};
const atelierStatuses={available:'Disponível',drawing:'Desenhando',away:'Ausente'};
let atelierSession=null;

function atelierState(){
  if(!state.atelier||state.atelier.version!==1)state.atelier={version:1,coat:'red',status:'available',positions:{},chats:{},gathered:{}};
  const data=state.atelier;
  if(!Object.hasOwn(atelierCoats,data.coat))data.coat='red';
  if(!Object.hasOwn(atelierStatuses,data.status))data.status='available';
  for(const key of ['positions','chats','gathered'])if(!data[key]||typeof data[key]!=='object'||Array.isArray(data[key]))data[key]={};
  return data;
}
function atelierIdentity(){return currentClass().id+'|'+(state.role==='teacher'?'teacher':currentLearner()?.id||'visitor');}
function atelierName(){return state.role==='teacher'?currentClass().teacher:currentLearner()?.name||'Visitante';}
function atelierPeople(){
  const positions=[{x:144,y:272},{x:400,y:272},{x:656,y:192},{x:880,y:560},{x:656,y:560},{x:880,y:192},{x:144,y:560},{x:400,y:560}];
  const gathered=atelierState().gathered[currentClass().id];
  const gathering=[{x:144,y:272},{x:400,y:272},{x:208,y:272},{x:336,y:272},{x:144,y:176},{x:400,y:176},{x:80,y:272},{x:432,y:272}];
  const people=classStudents().filter(person=>state.role==='teacher'||person.id!==currentLearner()?.id).slice(0,8).map((person,index)=>({...person,position:(gathered?gathering:positions)[index],coat:['plum','sage','ochre','blue'][index%4]}));
  if(state.role==='student')people.unshift({id:'atelier-teacher',name:currentClass().teacher,teacher:true,position:{x:272,y:176},coat:'red'});
  return people;
}
function atelierSprite(coat='red',variant=0){
  return `<svg viewBox="0 0 32 44" aria-hidden="true" class="pixel-person coat-${coat}" shape-rendering="crispEdges"><ellipse class="person-shadow" cx="16" cy="41" rx="12" ry="3"/><g class="person-body"><path class="person-hair" d="M8 3h16v4h3v15H5V7h3z"/><path class="person-skin skin-${variant%3}" d="M8 10h16v13H8zM12 23h8v4h-8z"/><path class="person-hair" d="M8 7h16v7h-4v-3h-8v3H8z"/><path class="person-eyes" d="M10 16h3v3h-3zM19 16h3v3h-3z"/><path class="person-shirt" d="M8 25h16v3h4v11h-5v-5H9v5H4V28h4z"/><path class="person-apron" d="M11 27h10v10H11z"/><path class="person-pocket" d="M13 30h6v4h-6z"/><path class="person-pants" d="M10 36h12v6h-5v-4h-2v4h-5z"/><path class="person-shoes" d="M8 40h7v3H8zM17 40h7v3h-7z"/></g></svg>`;
}
function atelierFurniture(item){
  const {kind,x,y,w,h}=item;
  if(kind==='plant')return `<g transform="translate(${x} ${y})"><ellipse class="f-shadow" cx="16" cy="27" rx="17" ry="8"/><rect class="pot" x="7" y="15" width="18" height="15" rx="3"/><path class="leaf" d="M16 23C-8 17 2-2 15 8C15-10 36 0 25 14C42 7 40 26 18 25Z"/><path class="leaf-line" d="M16 25V7M16 20L7 11M18 20L29 14"/></g>`;
  if(kind==='board')return `<g><rect class="f-shadow" x="${x-5}" y="${y-5}" width="${w+10}" height="${h+17}" rx="3"/><rect class="chalkboard" x="${x}" y="${y}" width="${w}" height="${h+7}" rx="2"/><path class="chalk" d="M150 72h55m14 0h38m16 0h74M153 82h25m6 0h13"/></g>`;
  if(kind==='sofa')return `<g transform="translate(${x} ${y})"><rect class="f-shadow" y="6" width="${w}" height="${h}" rx="9"/><rect class="sofa-base" width="${w}" height="${h}" rx="9"/><rect class="sofa-back" x="5" y="4" width="${w-10}" height="12" rx="5"/><rect class="sofa-cushion" x="12" y="21" width="38" height="23" rx="3"/><rect class="sofa-cushion" x="60" y="21" width="38" height="23" rx="3"/></g>`;
  if(kind==='shelf')return `<g transform="translate(${x} ${y})"><rect class="table-edge" width="${w}" height="${h+6}" rx="2"/><rect class="table-top" width="${w}" height="${h}" rx="2"/>${[0,1,2,3,4,5,6].map(i=>`<rect class="book book-${i%3}" x="${7+i*9}" y="6" width="6" height="20"/>`).join('')}</g>`;
  return `<g transform="translate(${x} ${y})"><rect class="f-shadow" x="-3" y="7" width="${w+6}" height="${h}" rx="5"/><rect class="table-edge" y="4" width="${w}" height="${h}" rx="4"/><rect class="table-top" width="${w}" height="${h}" rx="4"/>${['desk','drafting','teacher'].includes(kind)?`<rect class="desk-paper" x="12" y="7" width="${Math.min(w-40,60)}" height="${h-15}" transform="rotate(-6 40 24)"/><path class="paper-line" d="M25 16l14 3 7 10-22-2z"/><rect class="pencil" x="${w-21}" y="8" width="3" height="23" transform="rotate(17 ${w-20} 20)"/><rect class="stool" x="${w/2-13}" y="${h+14}" width="26" height="16" rx="7"/>`:kind==='coffee'||kind==='counter'?`<circle class="cup" cx="${w/2}" cy="${h/2}" r="8"/><circle class="drink" cx="${w/2}" cy="${h/2}" r="5"/><path class="cup-handle" d="M${w/2+7} ${h/2-4}q10 4 0 8"/>`:''}</g>`;
}
function atelierExhibits(){return latestDeliveries(classDeliveries()).filter(item=>deliveryStatus(item)==='approved').slice(0,3);}
function atelierScene(){
  const exhibits=atelierExhibits();
  return `<svg class="studio-plan" viewBox="0 0 1024 704" aria-hidden="true"><defs><pattern id="studio-floor" width="96" height="32" patternUnits="userSpaceOnUse"><rect class="floor-fill" width="96" height="32"/><path class="floor-seam" d="M0 0h96M0 32h96M0 0v32M48 0v4"/></pattern><pattern id="studio-tile" width="32" height="32" patternUnits="userSpaceOnUse"><rect class="tile-fill" width="32" height="32"/><path class="tile-line" d="M0 0h32v32"/></pattern></defs><rect class="building-shadow" x="18" y="30" width="988" height="662" rx="10"/><rect class="building-floor" x="16" y="16" width="992" height="672" rx="8"/><rect x="32" y="32" width="448" height="288" fill="url(#studio-floor)"/><rect x="544" y="32" width="448" height="288" fill="url(#studio-floor)"/><rect class="gallery-floor" x="32" y="416" width="448" height="256"/><rect x="544" y="416" width="448" height="256" fill="url(#studio-tile)"/><rect class="class-rug" x="64" y="96" width="384" height="190" rx="8"/><rect class="cafe-rug" x="592" y="456" width="368" height="134" rx="20"/><path class="rug-line" d="M608 467h336v108H608z"/><path class="window-light" d="M556 52h145l-26 151H556zM848 52h110v155l-74-17z"/>${ATELIER_WALLS.map(([x,y,w,h])=>`<rect class="wall-shadow" x="${x}" y="${y+7}" width="${w}" height="${h}" rx="1"/><rect class="wall" x="${x}" y="${y}" width="${w}" height="${h}" rx="1"/>`).join('')}<path class="window" d="M592 39h160m48 0h144"/><path class="window-bar" d="M645 33v13m54-13v13m151-13v13m46-13v13"/>${ATELIER_FURNITURE.map(atelierFurniture).join('')}<g class="room-floor-name"><text x="76" y="132">AULA</text><text x="580" y="83">ESTUDO</text><text x="73" y="641">GALERIA</text><text x="862" y="643">CAFÉ</text></g><g class="hall-brand"><rect x="440" y="351" width="144" height="34" rx="4"/><text x="512" y="374" text-anchor="middle">XUIM ART</text></g><path class="door-threshold" d="M232 312h80m432 0h80M232 424h80m432 0h80"/>${[0,1,2].map((i)=>`<g class="gallery-frame"><rect class="frame-shadow" x="${78+i*126}" y="453" width="100" height="78" rx="3"/><rect class="frame" x="${76+i*126}" y="448" width="100" height="78" rx="2"/><rect class="frame-paper" x="${82+i*126}" y="454" width="88" height="66"/><image href="${exhibits[i]?deliveryImage(exhibits[i]):assets[references[i].id]}" x="${86+i*126}" y="457" width="80" height="60" preserveAspectRatio="xMidYMid meet"/></g>`).join('')}<g class="entry-mat"><rect x="28" y="343" width="86" height="51" rx="3"/><path d="M38 351v34m9-34v34m9-34v34m9-34v34m9-34v34m9-34v34m9-34v34m9-34v34"/></g></svg>`;
}
function stopAtelier(){
  if(!atelierSession)return;
  const session=atelierSession;
  session.abort.abort();session.resize?.disconnect();cancelAnimationFrame(session.frame);clearTimeout(session.waveTimer);
  atelierState().positions[session.identity]={...session.position};persist();atelierSession=null;
}
function renderAtelier(){
  stopAtelier();const data=atelierState(),identity=atelierIdentity(),saved=data.positions[identity];
  atelierSession={identity,position:saved&&atelierWorld.walkable(saved.x,saved.y)?{...saved}:{x:512,y:368},people:atelierPeople(),path:[],keys:new Set(),frame:0,last:0,scale:1,zoom:1,room:'',contextKey:'',near:[],chatOpen:false,abort:new AbortController()};
  const session=atelierSession;
  $('#view-atelier').innerHTML=`<div class="studio-page"><header class="studio-heading"><div><span class="eyebrow">${escapeHTML(currentClass().name)} · ESPAÇO COMPARTILHADO</span><h1>O ateliê está aberto.</h1></div><div class="studio-heading-actions"><span class="studio-demo">Prévia local</span><button class="btn small quiet" id="studio-roster">${icon('users')}<span>${session.people.length+1} no mapa</span></button>${state.role==='teacher'?`<button class="btn small" id="studio-gather" aria-pressed="${!!data.gathered[currentClass().id]}">${icon('volume')}${data.gathered[currentClass().id]?'Liberar turma':'Reunir na aula'}</button>`:''}</div></header><div class="studio-layout"><section class="studio-space" aria-label="Espaço do ateliê"><nav class="studio-destinations" aria-label="Caminhar até um espaço">${Object.entries(ATELIER_ROOMS).filter(([key])=>key!=='hall').map(([key,room])=>`<button data-studio-destination="${key}">${icon({classroom:'volume',desks:'pen',gallery:'image',cafe:'coffee'}[key])}<span>${room.name}</span></button>`).join('')}</nav><div class="studio-viewport" id="studio-viewport" tabindex="0" role="group" aria-label="Mapa do ateliê. Clique no chão, use as setas ou WASD para caminhar. Escape interrompe o caminho." aria-describedby="studio-controls-hint"><div class="studio-world" id="studio-world">${atelierScene()}<svg class="studio-route" viewBox="0 0 1024 704" aria-hidden="true"><polyline id="studio-route-line" points=""/><circle id="studio-target" cx="512" cy="368" r="8" hidden/></svg><div class="studio-proximity" id="studio-proximity" aria-hidden="true"></div>${session.people.map((person,index)=>`<button class="studio-avatar studio-peer" data-studio-person="${escapeHTML(person.id)}" style="left:${person.position.x/1024*100}%;top:${person.position.y/704*100}%" aria-label="Caminhar até ${escapeHTML(person.name)}">${atelierSprite(person.coat,index)}<span class="sprite-name">${escapeHTML(person.name.split(' ')[0])}${person.teacher?' · prof.':''}</span></button>`).join('')}<div class="studio-avatar studio-self" id="studio-self">${atelierSprite(data.coat)}<span class="sprite-name">Você</span><span class="studio-wave" id="studio-wave" hidden>👋</span></div>${[0,1,2].map(index=>`<button class="studio-art-hit" data-studio-art="${index}" style="left:${(76+index*126)/1024*100}%;top:${448/704*100}%;width:${100/1024*100}%;height:${78/704*100}%" aria-label="Aproximar-se do estudo ${index+1} da galeria"></button>`).join('')}</div></div><div class="studio-map-tools"><span id="studio-controls-hint">Clique para andar <span>· setas ou WASD</span></span><div><button class="icon-btn" id="studio-center" aria-label="Localizar meu avatar" title="Localizar você">◎</button><button class="icon-btn" id="studio-zoom-out" aria-label="Diminuir mapa">−</button><output id="studio-zoom-value" aria-label="Zoom do mapa">100%</output><button class="icon-btn" id="studio-zoom-in" aria-label="Ampliar mapa">+</button></div></div><footer class="studio-selfbar"><button class="studio-profile" id="studio-customize" aria-label="Personalizar meu avatar">${atelierSprite(data.coat)}<span><strong>${escapeHTML(atelierName().split(' ')[0])}</strong><small>seu avatar</small></span></button><label class="sr-only" for="studio-status">Seu estado no ateliê</label><select id="studio-status">${Object.entries(atelierStatuses).map(([key,name])=>`<option value="${key}" ${data.status===key?'selected':''}>${name}</option>`).join('')}</select><button class="btn small quiet" id="studio-wave-button" aria-label="Acenar para quem está perto">👋 <span>Acenar</span></button><div class="studio-dpad" aria-label="Controles de movimento">${[['left','←','esquerda'],['up','↑','cima'],['down','↓','baixo'],['right','→','direita']].map(([key,symbol,label])=>`<button data-studio-move="${key}" aria-label="Caminhar para ${label}">${symbol}</button>`).join('')}</div></footer></section><aside class="studio-context" aria-label="Seu espaço e pessoas próximas"><div id="studio-context-body"></div><section class="studio-nearby" aria-label="Pessoas próximas"><div class="studio-section-label"><span>POR PERTO</span><span id="studio-nearby-count">0</span></div><div id="studio-nearby-list"></div></section><button class="btn quiet studio-talk" id="studio-chat-toggle" aria-expanded="false">${icon('hash')}Conversar aqui</button><section class="studio-local-chat" id="studio-local-chat" hidden><div class="studio-section-label"><span id="studio-chat-title"></span><span>LOCAL</span></div><div id="studio-chat-log" role="log" aria-label="Mensagens do espaço"></div><form id="studio-chat-form"><label class="sr-only" for="studio-chat-input">Mensagem neste espaço</label><textarea id="studio-chat-input" maxlength="500" rows="2" placeholder="Deixe uma mensagem…" required></textarea><button class="icon-btn" aria-label="Enviar mensagem neste espaço">${icon('send')}</button></form></section><p class="studio-simulation-note">Pessoas e proximidade simuladas.<br>Mensagens ficam neste navegador.</p></aside></div><p class="sr-only" id="studio-announcement" aria-live="polite"></p></div>`;
  const signal=session.abort.signal,viewport=$('#studio-viewport');
  viewport.addEventListener('click',event=>{
    if(event.target.closest('button'))return;
    const rect=$('#studio-world').getBoundingClientRect();walkAtelierTo({x:(event.clientX-rect.left)/session.scale,y:(event.clientY-rect.top)/session.scale});viewport.focus({preventScroll:true});
  },{signal});
  viewport.addEventListener('keydown',event=>{
    if(event.target!==viewport)return;
    const key=event.key.toLowerCase();
    if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(key)){
      event.preventDefault();session.path=[];delete session.pendingArt;
      // A short tap must still move even when keyup arrives before the next frame.
      if(!event.repeat&&!session.keys.has(key)){
        const [dx,dy]={arrowup:[0,-8],w:[0,-8],arrowdown:[0,8],s:[0,8],arrowleft:[-8,0],a:[-8,0],arrowright:[8,0],d:[8,0]}[key];
        session.position=atelierWorld.move(session.position,dx,dy);updateAtelierPosition();centerAtelier();
      }
      session.keys.add(key);startAtelierFrame();
    }
    if(key==='escape'){session.path=[];session.keys.clear();delete session.pendingArt;updateAtelierRoute();}
  },{signal});
  window.addEventListener('keyup',event=>session.keys.delete(event.key.toLowerCase()),{signal});
  window.addEventListener('blur',()=>{session.keys.clear();session.path=[];updateAtelierRoute();},{signal});
  viewport.addEventListener('blur',()=>session.keys.clear(),{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){session.keys.clear();session.path=[];}},{signal});
  $$('[data-studio-destination]').forEach(button=>button.onclick=()=>{walkAtelierTo(ATELIER_ROOMS[button.dataset.studioDestination]);viewport.focus({preventScroll:true});});
  $$('[data-studio-person]').forEach(button=>button.onclick=()=>{const person=session.people.find(item=>item.id===button.dataset.studioPerson);walkAtelierTo({x:person.position.x+32,y:person.position.y});viewport.focus({preventScroll:true});});
  $$('[data-studio-art]').forEach(button=>button.onclick=()=>{const index=Number(button.dataset.studioArt);walkAtelierTo({x:128+index*126,y:560},index);viewport.focus({preventScroll:true});});
  $$('[data-studio-move]').forEach(button=>button.onclick=()=>{const [dx,dy]={left:[-64,0],up:[0,-64],down:[0,64],right:[64,0]}[button.dataset.studioMove];walkAtelierTo(atelierWorld.move(session.position,dx,dy));});
  $('#studio-center').onclick=()=>centerAtelier(true);
  $('#studio-zoom-in').onclick=()=>{session.zoom=Math.min(2,session.zoom+.25);sizeAtelier();};
  $('#studio-zoom-out').onclick=()=>{session.zoom=Math.max(1,session.zoom-.25);sizeAtelier();};
  $('#studio-status').onchange=event=>{data.status=event.target.value;persist();updateAtelierPosition();};
  $('#studio-wave-button').onclick=()=>{clearTimeout(session.waveTimer);$('#studio-wave').hidden=false;$('#studio-announcement').textContent='Você acenou no ateliê.';session.waveTimer=setTimeout(()=>{if(atelierSession===session)$('#studio-wave').hidden=true;},2400);};
  $('#studio-customize').onclick=customizeAtelier;
  $('#studio-roster').onclick=showAtelierRoster;
  if($('#studio-gather'))$('#studio-gather').onclick=()=>{data.gathered[currentClass().id]=!data.gathered[currentClass().id];persist();renderAtelier();toast(data.gathered[currentClass().id]?'Os avatares da demonstração se reuniram na aula.':'Os avatares voltaram aos seus espaços.');};
  $('#studio-chat-toggle').onclick=()=>{session.chatOpen=!session.chatOpen;$('#studio-local-chat').hidden=!session.chatOpen;$('#studio-chat-toggle').setAttribute('aria-expanded',String(session.chatOpen));renderAtelierChat();if(session.chatOpen)$('#studio-chat-input').focus();};
  $('#studio-chat-form').onsubmit=event=>{event.preventDefault();const text=$('#studio-chat-input').value.trim();if(!text)return;const key=currentClass().id+'|'+session.room;const messages=Array.isArray(data.chats[key])?data.chats[key]:[];messages.push({name:atelierName(),text,date:new Date().toISOString()});data.chats[key]=messages.slice(-40);persist();$('#studio-chat-input').value='';renderAtelierChat();};
  session.resize=new ResizeObserver(sizeAtelier);session.resize.observe(viewport);sizeAtelier();updateAtelierPosition();
}
function sizeAtelier(){
  const session=atelierSession,viewport=$('#studio-viewport');if(!session||!viewport)return;
  const fit=Math.min(viewport.clientWidth/1024,viewport.clientHeight/704);
  session.scale=Math.max(viewport.clientWidth<600?.57:.4,fit)*session.zoom;
  const world=$('#studio-world');world.style.width=1024*session.scale+'px';world.style.height=704*session.scale+'px';world.style.setProperty('--scene-scale',session.scale);
  $('#studio-zoom-value').textContent=Math.round(session.zoom*100)+'%';$('#studio-zoom-out').disabled=session.zoom===1;$('#studio-zoom-in').disabled=session.zoom===2;centerAtelier(true);
}
function centerAtelier(force=false){
  const s=atelierSession,v=$('#studio-viewport');if(!s||!v)return;
  const x=s.position.x*s.scale,y=s.position.y*s.scale;
  if(force||x-v.scrollLeft<70||x-v.scrollLeft>v.clientWidth-70)v.scrollLeft=x-v.clientWidth/2;
  if(force||y-v.scrollTop<70||y-v.scrollTop>v.clientHeight-70)v.scrollTop=y-v.clientHeight/2;
}
function walkAtelierTo(target,artIndex){
  const session=atelierSession;if(!session)return;
  if(artIndex===undefined)delete session.pendingArt;else session.pendingArt=artIndex;
  session.keys.clear();session.path=atelierWorld.path(session.position,target);
  if(!session.path.length){toast('Não há um caminho livre até esse ponto.');return;}
  updateAtelierRoute();startAtelierFrame();
}
function updateAtelierRoute(){
  const s=atelierSession;if(!s)return;
  $('#studio-route-line').setAttribute('points',s.path.length?[s.position,...s.path].map(p=>p.x+','+p.y).join(' '):'');
  const target=$('#studio-target');target.hidden=!s.path.length;target.style.display=s.path.length?'':'none';if(s.path.length){target.setAttribute('cx',s.path.at(-1).x);target.setAttribute('cy',s.path.at(-1).y);}
}
function startAtelierFrame(){const s=atelierSession;if(!s||s.frame)return;s.last=0;s.frame=requestAnimationFrame(stepAtelier);}
function stepAtelier(time){
  const s=atelierSession;if(!s||view!=='atelier')return;
  const dt=s.last?Math.min((time-s.last)/1000,.04):.016;s.last=time;s.frame=0;
  const before={...s.position},speed=175*dt;
  let dx=(s.keys.has('arrowright')||s.keys.has('d')?1:0)-(s.keys.has('arrowleft')||s.keys.has('a')?1:0),dy=(s.keys.has('arrowdown')||s.keys.has('s')?1:0)-(s.keys.has('arrowup')||s.keys.has('w')?1:0);
  if(dx||dy){const magnitude=Math.hypot(dx,dy);s.position=atelierWorld.move(s.position,dx/magnitude*speed,dy/magnitude*speed);}
  else if(s.path.length){const target=s.path[0],distance=Math.hypot(target.x-s.position.x,target.y-s.position.y);if(distance<=speed){s.position={...target};s.path.shift();}else s.position=atelierWorld.move(s.position,(target.x-s.position.x)/distance*speed,(target.y-s.position.y)/distance*speed);}
  const moving=Math.hypot(s.position.x-before.x,s.position.y-before.y)>.1;
  $('#studio-self').classList.toggle('walking',moving);if(moving){$('#studio-self').classList.toggle('facing-left',s.position.x<before.x);updateAtelierPosition();centerAtelier();}
  updateAtelierRoute();
  if(s.keys.size||s.path.length)s.frame=requestAnimationFrame(stepAtelier);
  else{atelierState().positions[s.identity]={...s.position};persist();$('#studio-self').classList.remove('walking');if(s.pendingArt!==undefined){const index=s.pendingArt;delete s.pendingArt;if(s.room==='gallery')showAtelierArtwork(index);}}
}
function updateAtelierPosition(){
  const s=atelierSession;if(!s)return;
  for(const selector of ['#studio-self','#studio-proximity']){const el=$(selector);el.style.left=s.position.x/1024*100+'%';el.style.top=s.position.y/704*100+'%';}
  $('#studio-self').dataset.status=atelierState().status;
  const room=atelierWorld.room(s.position),near=s.people.filter(person=>atelierWorld.room(person.position)===room&&Math.hypot(person.position.x-s.position.x,person.position.y-s.position.y)<112);
  if(s.room!==room){s.room=room;$('#studio-announcement').textContent='Você chegou: '+ATELIER_ROOMS[room].name;renderAtelierContext();if(s.chatOpen)renderAtelierChat();}
  const key=near.map(person=>person.id).join('|');
  if(s.contextKey!==key||!$('#studio-nearby-list').children.length){s.contextKey=key;s.near=near;$('#studio-nearby-count').textContent=near.length;$('#studio-nearby-list').innerHTML=near.length?near.map(person=>`<div class="studio-neighbor">${atelierSprite(person.coat)}<div><strong>${escapeHTML(person.name)}</strong><span>${person.teacher?'Professor':'Colega de turma'}</span></div><i class="studio-near-dot"></i></div>`).join(''):'<p class="studio-empty-near">Aproxime-se de alguém para compartilhar este espaço.</p>';}
  $$('[data-studio-person]').forEach(button=>button.classList.toggle('near',near.some(person=>person.id===button.dataset.studioPerson)));
  $$('[data-studio-destination]').forEach(button=>{const active=button.dataset.studioDestination===room;button.classList.toggle('active',active);button.setAttribute('aria-current',active?'location':'false');});
}
function renderAtelierContext(){
  const room=atelierSession.room,lesson=activeLesson(),assignment=activeAssignment();
  const content={
    hall:{label:'BEM-VINDO',title:'Um lugar para ficar.',description:'Escolha um espaço e caminhe até a turma. Há uma mesa esperando seu próximo desenho.',action:'Encontrar a turma'},
    classroom:{label:'JUNTOS NA AULA',title:lesson?.title||'Sala pronta para criar',description:lesson?lessonLabel(lesson)+' · '+dateLabel(lesson.date)+' · '+lesson.time:'O próximo encontro aparece aqui quando for planejado.',action:'Entrar na aula'},
    desks:{label:'NO SEU RITMO',title:assignment?.title||'Abra seu sketchbook',description:assignment?'A proposta da turma já está no seu caderno. Continue a etapa em que parou.':'Uma mesa para experimentar, registrar dúvidas e desenhar.',action:state.role==='teacher'?'Abrir sketchbooks':'Continuar meu estudo'},
    gallery:{label:'PROCESSO EM EXPOSIÇÃO',title:'Estudos que ficam.',description:'Uma pequena seleção dos estudos avaliados da turma. Clique em uma obra para olhar de perto.',action:'Explorar a galeria'},
    cafe:{label:'ENTRE UM ESTUDO E OUTRO',title:'Pausa para uma ideia.',description:'Chegue mais perto, acene e deixe uma mensagem neste espaço.',action:'Conversar no café'}
  }[room];
  $('#studio-context-body').innerHTML=`<span class="studio-location">${icon({hall:'grid',classroom:'volume',desks:'pen',gallery:'image',cafe:'coffee'}[room])}${ATELIER_ROOMS[room].name}</span><div class="studio-context-copy"><span class="eyebrow">${content.label}</span><h2>${escapeHTML(content.title)}</h2><p>${escapeHTML(content.description)}</p></div><button class="btn primary" id="studio-context-action">${content.action}${icon('arrow')}</button>`;
  $('#studio-context-action').onclick=()=>{
    if(room==='hall')showAtelierRoster();
    if(room==='classroom')navigate('classroom');
    if(room==='desks'){sketchbookStudent=currentLearner()?.id||'';sketchbookMode=assignment?'week':'all';navigate('sketchbooks');}
    if(room==='gallery')showAtelierGallery();
    if(room==='cafe'){if(!atelierSession.chatOpen)$('#studio-chat-toggle').click();else $('#studio-chat-input').focus();}
  };
}
function renderAtelierChat(){
  const s=atelierSession;if(!s)return;const key=currentClass().id+'|'+s.room,messages=atelierState().chats[key]||[];
  $('#studio-chat-title').textContent=ATELIER_ROOMS[s.room].name;
  $('#studio-chat-log').innerHTML=messages.length?messages.map(message=>`<article><strong>${escapeHTML(message.name.split(' ')[0])}</strong><time>${new Date(message.date).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</time><p>${escapeHTML(message.text)}</p></article>`).join(''):'<p class="studio-chat-empty">A primeira conversa pode começar com um desenho que você está tentando resolver.</p>';
  $('#studio-chat-log').scrollTop=$('#studio-chat-log').scrollHeight;
}
function showAtelierRoster(){
  const people=atelierSession.people;
  openModal('Pelo ateliê',`<p class="form-intro">Avatares da turma ${escapeHTML(currentClass().name)} nesta demonstração. Escolha alguém para caminhar até a pessoa.</p><div class="studio-roster-list">${people.map(person=>`<button data-meet-person="${escapeHTML(person.id)}">${atelierSprite(person.coat)}<span><strong>${escapeHTML(person.name)}</strong><small>${ATELIER_ROOMS[atelierWorld.room(person.position)].name}${person.teacher?' · professor':''}</small></span>${icon('arrow')}</button>`).join('')||'<p class="muted">Você tem o ateliê inteiro para explorar. Os alunos matriculados aparecerão aqui.</p>'}</div>`);
  $$('[data-meet-person]').forEach(button=>button.onclick=()=>{const person=people.find(p=>p.id===button.dataset.meetPerson);closeModal();walkAtelierTo({x:person.position.x+32,y:person.position.y});$('#studio-viewport').focus();});
}
function customizeAtelier(){
  const data=atelierState();
  openModal('Seu lugar no ateliê',`<div class="studio-avatar-preview">${atelierSprite(data.coat)}<div><h3>${escapeHTML(atelierName())}</h3><p class="muted">Escolha a cor do seu avental.</p></div></div><div class="studio-coats">${Object.entries(atelierCoats).map(([key,name])=>`<button data-atelier-coat="${key}" class="coat-${key}" aria-label="Avental ${name.toLowerCase()}" aria-pressed="${data.coat===key}"><i></i>${name}</button>`).join('')}</div>`);
  $$('[data-atelier-coat]').forEach(button=>button.onclick=()=>{data.coat=button.dataset.atelierCoat;persist();$('#studio-self .pixel-person').outerHTML=atelierSprite(data.coat);$('#studio-customize .pixel-person').outerHTML=atelierSprite(data.coat);$('.studio-avatar-preview .pixel-person').outerHTML=atelierSprite(data.coat);$$('[data-atelier-coat]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));});
}
function showAtelierGallery(){
  const works=atelierExhibits();
  openModal('Na parede do ateliê',`<p class="form-intro">${works.length?'Estudos avaliados de '+escapeHTML(currentClass().name)+'.':'Enquanto os primeiros estudos chegam, conheça referências do acervo Xuim Art.'}</p><div class="studio-exhibit-list">${(works.length?works:references).map((item,index)=>`<button data-open-exhibit="${index}"><img src="${works.length?deliveryImage(item):assets[item.id]}" alt="${escapeHTML(item.title)}"><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(works.length?getStudent(item.studentId)?.name||'Artista':'Rafael Bergamo · acervo')}</small></button>`).join('')}</div>`);
  $$('[data-open-exhibit]').forEach(button=>button.onclick=()=>showAtelierArtwork(Number(button.dataset.openExhibit)));
}
function showAtelierArtwork(index){
  const item=atelierExhibits()[index];if(!item){showArt(references[index]?.id||'volumes');return;}
  const task=school().assignments.find(a=>a.id===item.assignmentId),person=getStudent(item.studentId);
  openModal(item.title,`<figure class="studio-exhibit"><img src="${deliveryImage(item)}" alt="${escapeHTML(item.title)}"><figcaption><strong>${escapeHTML(person?.name||'Artista')}</strong><span>${escapeHTML(task?.title||'Estudo livre')}</span></figcaption></figure><p class="school-note">${item.demo?'Exemplo de estudo: imagem do acervo de Rafael Bergamo / Xuim Art.':'Imagem enviada ao sketchbook nesta prévia local.'}</p>`,state.role==='teacher'?'<button class="btn primary" id="studio-review-exhibit">Abrir avaliação</button>':item.studentId===currentLearner()?.id?'<button class="btn primary" id="studio-own-exhibit">Abrir meu sketchbook</button>':'');
  if($('#studio-review-exhibit'))$('#studio-review-exhibit').onclick=()=>showReview(item.id);
  if($('#studio-own-exhibit'))$('#studio-own-exhibit').onclick=()=>{sketchbookMode='all';closeModal();navigate('sketchbooks');};
}
function validateAtelierBackup(data){
  if(data===undefined)return true;
  const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
  return object(data)&&data.version===1&&Object.hasOwn(atelierCoats,data.coat)&&Object.hasOwn(atelierStatuses,data.status)&&object(data.positions)&&Object.values(data.positions).every(p=>object(p)&&atelierWorld.walkable(p.x,p.y))&&object(data.gathered)&&Object.values(data.gathered).every(value=>typeof value==='boolean')&&object(data.chats)&&Object.values(data.chats).every(messages=>Array.isArray(messages)&&messages.length<=40&&messages.every(m=>object(m)&&typeof m.name==='string'&&typeof m.text==='string'&&m.text.length<=500&&typeof m.date==='string'&&!Number.isNaN(Date.parse(m.date))));
}
