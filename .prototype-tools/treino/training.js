(() => {
 'use strict';
 const levels=['Fácil','Médio','Difícil'];
 const modes={tutorial:'Tutorial',classic:'Desafio clássico',endless:'Infinito',daily:'Desafio diário'};
 const today=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();};
 function seeded(text){let a=2166136261;for(const c of text)a=Math.imul(a^c.charCodeAt(0),16777619);return()=>{a+=0x6D2B79F5;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
 function setup(level,descriptions,tries=0,warmup=false){
  return '<div class="training-setup"><div><span class="training-label" id="level-label">Dificuldade</span><div class="training-options" role="group" aria-labelledby="level-label">'+levels.map((name,i)=>'<button type="button" data-level="'+i+'" aria-pressed="'+(level===i)+'">'+name+'</button>').join('')+'</div><p class="training-description">'+descriptions[level]+'</p></div><div><span class="training-label">Modo de jogo</span><div class="training-modes">'+Object.entries(modes).map(([key,name],i)=>'<button class="training-mode" data-training-mode="'+key+'" '+(key==='daily'&&tries>=3?'disabled':'')+'><span class="training-icon" aria-hidden="true">'+['✎','◇','∞','☼'][i]+'</span><span><strong>'+name+'</strong><small>'+['Aprenda com apoio visual. Sem tempo nem recordes.',(warmup?'2 aquecimentos + ':'')+'6 rodadas de 30 segundos.','Meta crescente; o tempo diminui a cada rodada.',Math.max(0,3-tries)+' tentativas hoje · 6 rodadas de 30s. Mesmo desafio nesta dificuldade.'][i]+'</small></span><span aria-hidden="true">↗</span></button>').join('')+'</div></div></div>';
 }
 function create(game,onTimeout){
  const r={mode:'tutorial',level:0,round:0,deadline:0,available:true,random:Math.random,saved:false};
  const key=s=>'xuim.training.v1.'+game+'.'+s;
  function read(s,fallback){try{return JSON.parse(localStorage.getItem(key(s)))??fallback;}catch{r.available=false;return fallback;}}
  function write(s,v){try{localStorage.setItem(key(s),JSON.stringify(v));}catch{r.available=false;}}
  r.daily=(level=r.level)=>{const d=read('daily.'+level,{});return d.date===today()?d:{date:today(),tries:0,best:0};};
  r.best=(level,mode='classic')=>{const n=read('best.'+level+'.'+mode,null);return Number.isFinite(n)?n:null;};
  r.start=(mode,level)=>{
   r.mode=mode;r.level=level;r.date=today();r.round=0;r.deadline=0;r.saved=false;
   if(mode==='daily'){const d=r.daily();if(d.tries>=3)return false;d.tries++;write('daily.'+level,d);}
   r.random=mode==='daily'?seeded(game+':'+r.date+':'+level):Math.random;return true;
  };
  r.next=()=>{r.round++;r.duration=r.mode==='tutorial'?0:r.mode==='endless'?Math.max(8,35-(r.round-1)*1.5):30;r.deadline=r.duration?performance.now()+r.duration*1000:0;};
  r.stop=()=>{r.deadline=0;};
  r.target=()=>Math.min(90,40+(r.round-1)*4);
  r.ended=score=>r.mode==='endless'?score<r.target():r.mode!=='tutorial'&&r.round>=6;
  r.status=()=>'<div class="training-status"><span>'+modes[r.mode]+' · '+levels[r.level]+'</span><strong id="challenge-time">'+(r.duration?Math.ceil(r.duration)+'s':'Sem tempo')+'</strong>'+(r.mode==='endless'?'<small>Meta desta rodada: '+r.target()+' pontos</small>':'')+'</div>';
  r.save=(average,count)=>{
   if(r.saved||r.mode==='tutorial')return;r.saved=true;
   const score=r.mode==='endless'?Math.max(0,count-1):average,previous=r.best(r.level,r.mode);
   r.newBest=previous===null||score>previous;
   if(r.newBest)write('best.'+r.level+'.'+r.mode,score);
   if(r.mode==='daily'){const d=r.daily();if(d.date===r.date){d.best=Math.max(d.best,average);write('daily.'+r.level,d);}}
  };
  setInterval(()=>{if(!r.deadline)return;const seconds=Math.max(0,Math.ceil((r.deadline-performance.now())/1000));const el=document.getElementById('challenge-time');if(el)el.textContent=seconds+'s';if(!seconds){r.stop();onTimeout();}},150);
  return r;
 }
 function tutorial(copy,shown){return '<div class="training-tutorial"><strong>Tutorial · acompanhe a construção</strong><p>'+copy+'</p><button type="button" data-action="support" aria-pressed="'+shown+'">'+(shown?'Ocultar':'Mostrar')+' apoio visual</button><small>1. Observe o apoio. 2. Faça sua tentativa. 3. Compare e repita. Depois, tente sem o apoio.</small></div>';}
 window.XuimTraining={levels,modes,setup,create,seeded,tutorial};
})();
