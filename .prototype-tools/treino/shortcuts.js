(function(root){
  'use strict';
  const defaults={pen:'p',line:'l',eraser:'e',confirm:'Enter',undo:'Ctrl+z',redo:'Ctrl+Shift+z',clear:'Delete',guide:'g',retry:'r'};
  const labels={pen:'Caneta / traço livre',line:'Reta / elipse ajustável',eraser:'Borracha do cubo',confirm:'Avaliar / próxima rodada',undo:'Desfazer',redo:'Refazer no cubo',clear:'Limpar desenho',guide:'Apoio / construção',retry:'Repetir exercício'};
  const storageKey='xuim.shortcuts.v1';
  function token(e){const key=e.key.length===1?e.key.toLowerCase():e.key;if(!/^[a-z0-9]$/.test(key)&&!['Enter','Delete','Backspace'].includes(key))return null;return[(e.ctrlKey||e.metaKey)?'Ctrl':null,e.altKey?'Alt':null,e.shiftKey?'Shift':null,key].filter(Boolean).join('+');}
  function allowed(value){if(typeof value!=='string'||! /^(Ctrl\+)?(Alt\+)?(Shift\+)?([a-z0-9]|Enter|Delete|Backspace)$/.test(value))return false;return !/^Ctrl\+(?:Shift\+)?[rwtlnpqofshd]$/.test(value)&&!/^Alt\+/.test(value);}
  function validate(value){const result={};for(const id of Object.keys(defaults)){if(!allowed(value?.[id]))throw new Error('Escolha uma tecla válida. Atalhos do navegador são reservados.');result[id]=value[id];}if(new Set(Object.values(result)).size!==Object.keys(result).length)throw new Error('Cada ação precisa de um atalho diferente.');return result;}
  function read(){try{return validate(JSON.parse(localStorage.getItem(storageKey)));}catch{return {...defaults};}}
  function save(value){const clean=validate(value);localStorage.setItem(storageKey,JSON.stringify(clean));return clean;}
  function label(value){return value.split('+').map(k=>k.length===1?k.toUpperCase():k).join(' + ');}
  function register(handlers){
    document.addEventListener('pointerdown',()=>{document.documentElement.dataset.input='pointer';},true);
    document.addEventListener('keydown',e=>{
      if(e.key==='Tab'||e.key.startsWith('Arrow'))document.documentElement.dataset.input='keyboard';
      if(e.repeat||e.isComposing||document.querySelector('dialog[open]')||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
      if(e.key==='Enter'&&e.target.closest('button,a'))return;
      const pressed=token(e),map=read(),action=Object.keys(map).find(id=>map[id]===pressed);
      if(action&&handlers[action]?.()!==false&&handlers[action]){e.preventDefault();e.stopImmediatePropagation();}
    },true);
  }
  const api={defaults,labels,token,allowed,validate,read,save,label,register};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.XuimKeys=api;
})(typeof window!=='undefined'?window:globalThis);
