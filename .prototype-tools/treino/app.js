(()=>{
  'use strict';
  const games=JSON.parse(document.getElementById('games').textContent);
  const names={regua:'Olho de Régua',cubo:'Cubo em Perspectiva',elipse:'Elipse em Perspectiva',cilindros:'Construindo Cilindros',blobs:'Blobs'};
  const $=id=>document.getElementById(id);
  let current=null,pending=null;
  const keys=window.XuimKeys;
  let capturing=null;
  const scopes={pen:'Cubo, elipse e cilindros',line:'Cubo, elipse e cilindros',eraser:'Cubo',confirm:'Todos os jogos',undo:'Cubo, elipse e cilindros',redo:'Cubo',clear:'Cubo, elipse e parte selecionada do cilindro',guide:'Tutoriais e revisão de cubo, elipse e cilindros',retry:'Tutoriais dos jogos'};
  function renderKeys(){const map=keys.read();$('key-fields').innerHTML=Object.keys(keys.defaults).map(id=>`<div class="key-row"><span>${keys.labels[id]}<small>${scopes[id]}</small></span><button type="button" data-key="${id}" aria-label="Alterar atalho: ${keys.labels[id]}" aria-pressed="${capturing===id}">${capturing===id?'Pressione…':keys.label(map[id])}</button></div>`).join('');}
  $('key-fields').addEventListener('click',e=>{const b=e.target.closest('[data-key]');if(!b)return;capturing=b.dataset.key;renderKeys();$('key-fields').querySelector(`[data-key="${capturing}"]`).focus();$('key-status').textContent='Pressione a nova tecla. Escape cancela.';});
  $('key-fields').addEventListener('keydown',e=>{
    if(!capturing)return;
    if(e.key==='Tab'||e.key==='Escape'){capturing=null;renderKeys();$('key-status').textContent='Alteração cancelada.';return;}
    e.preventDefault();e.stopPropagation();if(e.repeat||['Shift','Control','Alt','Meta'].includes(e.key))return;
    const value=keys.token(e);if(!keys.allowed(value)){$('key-status').textContent='Tecla reservada. Use uma letra, número, Enter, Delete ou uma combinação permitida.';return;}
    try{keys.save({...keys.read(),[capturing]:value});capturing=null;renderKeys();$('key-status').textContent='Atalho salvo. Já vale para os jogos neste navegador.';}catch(error){$('key-status').textContent=error.name==='QuotaExceededError'||error.name==='SecurityError'?'Não foi possível salvar neste navegador.':error.message;}
  });
  $('reset-keys').onclick=()=>{try{keys.save(keys.defaults);capturing=null;renderKeys();$('key-status').textContent='Atalhos padrão restaurados.';}catch{$('key-status').textContent='Não foi possível salvar neste navegador.';}};
  function renderResume(){
    try{const id=localStorage.getItem('xuim.treino.last.v1');if(!Object.hasOwn(names,id))return;$('resume').hidden=false;$('resume').textContent='Jogar novamente: '+names[id]+' ↗';$('resume').dataset.game=id;}catch{/* Playing does not require storage. */}
  }
  function open(id){
    current=id;document.body.classList.toggle('playing',Boolean(id));
    $('lobby').hidden=Boolean(id);$('arena').hidden=!id;$('game-mount').replaceChildren();
    if(id){
      const frame=document.createElement('iframe');frame.title=names[id];
      frame.srcdoc=games[id];$('game-mount').append(frame);
      document.querySelectorAll('.arena-bar [data-game]').forEach(b=>b.setAttribute('aria-current',String(b.dataset.game===id)));
      try{localStorage.setItem('xuim.treino.last.v1',id);}catch{/* Optional preference. */}
      $('back').focus({preventScroll:true});
    }else{renderResume();document.querySelector('[href="#modalidades"]').focus({preventScroll:true});}
    window.scrollTo({top:0,behavior:'instant'});
  }
  function request(id){if(current===id)return;if(!current){open(id);return;}pending=id;$('leave-dialog').showModal();}
  document.addEventListener('click',event=>{const button=event.target.closest('[data-game]');if(button&&Object.hasOwn(names,button.dataset.game))request(button.dataset.game);});
  $('back').onclick=()=>request(null);
  $('stay').onclick=()=>{$('leave-dialog').close();pending=null;};
  $('leave').onclick=()=>{const id=pending;pending=null;$('leave-dialog').close();open(id);};
  renderResume();renderKeys();
})();
