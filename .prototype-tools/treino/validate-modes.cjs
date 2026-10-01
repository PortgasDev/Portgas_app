const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const {JSDOM}=require(path.join(root,'ferramentas/amazon-enxuta/node_modules/jsdom'));
const {Linter}=require(path.join(root,'ferramentas/amazon-enxuta/node_modules/eslint'));
const globals=require(path.join(root,'ferramentas/amazon-enxuta/node_modules/globals'));
const files=['olho-de-regua-aquecimento.html','elipse-perspectiva.html','cube-perspectiva.html'];
for(const file of files){
 const html=fs.readFileSync(path.join(root,file),'utf8');
 for(const [,attrs,js] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){
  if(attrs.includes('application/json'))continue;
  const messages=new Linter().verify(js,[{languageOptions:{ecmaVersion:2023,sourceType:'script',globals:{...globals.browser,...globals.node}},rules:{'no-undef':'error','no-unused-vars':'error','no-unreachable':'error'}}]);
  assert.deepEqual(messages,[],file+' lint');
 }
 let now=0;const timers=[];
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',beforeParse(w){
  w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});
  w.scrollTo=()=>{};w.ResizeObserver=class{observe(){}};w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.setInterval=fn=>{timers.push(fn);};Object.defineProperty(w.performance,'now',{value:()=>now});
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 }});
 const d=dom.window.document,cube=file.startsWith('cube'),ellipse=file.startsWith('elipse');
 const click=s=>{const el=d.querySelector(s);assert(el,'Missing '+s+' in '+file);assert(!el.disabled,'Disabled '+s);el.click();};
 const panel=()=>d.querySelector(cube?'#sidebar':'#side-panel');
 const home=()=>{click(cube?'#homeBtn':'#home-button');const dialog=d.querySelector('dialog[open]');if(dialog)click(cube?'#confirmExit':ellipse?'#exit-button':'#exit-home');};
 assert.deepEqual([...d.querySelectorAll('[data-level]')].map(b=>b.textContent),['Fácil','Médio','Difícil']);
 assert.equal(d.querySelectorAll('[data-training-mode]').length,4);
 click('[data-training-mode=tutorial]');assert(panel().textContent.includes(cube?'Tutorial':'Sem tempo'));
 assert(d.querySelector(cube?'#traceBtn':'.tutorial-overlay, .tutorial-dot'),'Tutorial drawing support');
 click(cube?'#traceBtn':'[data-action=support]');
 if(!cube)assert.equal(d.querySelector('.tutorial-overlay, .tutorial-dot'),null);
 home();click('[data-level="2"]');click('[data-training-mode=classic]');if(cube)click('#skipBtn');
 for(let i=0;i<6;i++){now+=31000;timers.forEach(fn=>fn());assert(d.querySelector(cube?'#nextBtn':'[data-action=next]'),'Expiry submits, even without an answer');click(cube?'#nextBtn':'[data-action=next]');}
 assert(panel().textContent.includes(cube?'SESSÃO CONCLUÍDA':'MÉDIA DA SESSÃO'),'Completed timed session');
 if(cube)click('#backBtn');else home();
 click('[data-training-mode=endless]');now+=36000;timers.forEach(fn=>fn());click(cube?'#nextBtn':'[data-action=next]');
 if(cube)click('#backBtn');else home();
 const dailyDiagrams=[];
 for(let attempt=0;attempt<3;attempt++){click('[data-training-mode=daily]');if(!cube)dailyDiagrams.push(d.querySelector('#diagram').innerHTML);home();}
 if(!cube)assert.equal(new Set(dailyDiagrams).size,1,'Daily starts identically on each attempt');
 assert(d.querySelector('[data-training-mode=daily]').disabled,'Three daily attempts maximum');
 click('[data-level="0"]');assert(!d.querySelector('[data-training-mode=daily]').disabled,'Attempts are scoped to difficulty');
 dom.window.close();console.log('PASS '+file+': four modes, three levels, tutorial support, timers, completion, endless defeat, daily repeatability and limits.');
}
const cubeHtml=fs.readFileSync(path.join(root,'cube-perspectiva.html'),'utf8');
const sandbox={module:{exports:{}}};vm.runInNewContext(cubeHtml.match(/<script>([\s\S]*?)<\/script>/)[1],sandbox);
const {makeCube,seeded}=sandbox.module.exports;
for(let level=0;level<3;level++){const random=seeded(41);for(let i=0;i<500;i++){
 const c=makeCube(random,level);assert.equal(c.targets.length,5);assert(c.hint);assert.equal(c.targets.filter(edge=>edge.includes(c.hint)).length,3);for(const p of c.points)assert(p.x>0&&p.x<1000&&p.y>0&&p.y<1000);
}}
console.log('PASS: 1,500 cube constructions across the three difficulties, including exact hint junction.');
