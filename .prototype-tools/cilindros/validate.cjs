const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./model.js');
const root=path.resolve(__dirname,'../..'),dep=name=>require(path.join(root,'ferramentas/amazon-enxuta/node_modules',name));
function conicPoint(p,e){const a=e.angle*Math.PI/180,x=p.x-e.center.x,y=p.y-e.center.y;return[(x*Math.cos(a)+y*Math.sin(a))/e.a,(-x*Math.sin(a)+y*Math.cos(a))/e.b];}
for(let level=0;level<3;level++)for(let i=0;i<100;i++){
 const t=C.generate(level);
 t.ellipses.forEach((e,j)=>{
  assert(e.a>=e.b&&e.b>0&&Number.isFinite(e.a));
  for(const p of t.rings[j]){const[x,y]=conicPoint(p,e);assert(Math.abs(x*x+y*y-1)<1e-8);assert(p.x>=100&&p.x<=800&&p.y>=90&&p.y<=470);}
  for(const side of t.sides){
   const p=side[j],q=side[1-j],[x,y]=conicPoint(p,e),[xx,yy]=conicPoint(q,e);
   assert(Math.abs(x*x+y*y-1)<1e-8,'Lateral terminates on ellipse');
   assert(Math.abs(x*(xx-x)+y*(yy-y))<1e-8,'Lateral tangent to both end ellipses');
  }
 });
 if(level===0){assert(Math.abs(t.ellipses[0].a-t.ellipses[1].a)<1e-8);assert(Math.abs(t.ellipses[0].b-t.ellipses[1].b)<1e-8);}
 if(i<2){
  assert.equal(C.assess(t,t.parts).score,100);
  assert.equal(C.assess(t,[...t.rings,t.sides[1],t.sides[0]]).score,100,'Either side order accepted');
  assert.equal(C.assess(t,[[],[],[],[]]).score,0);
  assert.equal(C.assess(t,[t.rings[0],t.rings[1],[],[]]).score,50,'Empty laterals do not get credit');
  assert(C.assess(t,t.parts.map(p=>p.map(v=>({x:v.x+22,y:v.y+22})))).score<45,'Displaced drawing penalized');
  assert(C.assessPart(t.rings[0],t.rings[0].slice(0,60)).score<65,'Incomplete ellipse penalized');
  const dense=t.rings[0].flatMap(p=>Array(8).fill(p));assert.equal(C.assessPart(t.rings[0],dense).score,100,'Duplicate pen events do not affect score');
 }
}
console.log('PASS: 300 cylinders, projected conics, exact common tangents, framing, partial/displaced drawings and side order.');
async function main(){
 const {ESLint}=dep('eslint'),globals=dep('globals');
 const eslint=new ESLint({overrideConfigFile:true,overrideConfig:[{languageOptions:{ecmaVersion:2022,sourceType:'script',globals:{...globals.browser,...globals.node}},rules:{'no-undef':'error','no-unused-vars':'error','eqeqeq':'error','no-unreachable':'error'}}]});
 for(const file of['model.js','app.js','build.cjs','validate.cjs','../treino/training.js']){
  const reports=await eslint.lintText(fs.readFileSync(path.join(__dirname,file),'utf8'),{filePath:file});
  if(reports.some(r=>r.errorCount))console.log(await(await eslint.loadFormatter('stylish')).format(reports));
  assert.equal(reports.reduce((n,r)=>n+r.errorCount,0),0,'Lint '+file);
 }
 const {JSDOM,VirtualConsole}=dep('jsdom'),errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const html=fs.readFileSync(path.join(root,'cilindros.html'),'utf8');let now=0;const timers=[];
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
  w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.Math.random=()=>.6;
  w.setInterval=fn=>{timers.push(fn);return timers.length;};Object.defineProperty(w.performance,'now',{value:()=>now});
  w.DOMPoint=class{constructor(x,y){this.x=x;this.y=y;}matrixTransform(){return this;}};
  w.SVGElement.prototype.getScreenCTM=()=>({inverse:()=>({})});w.SVGElement.prototype.setPointerCapture=()=>{};
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 }});
 const d=dom.window.document,svg=d.querySelector('#drawing'),w=dom.window;
 const click=s=>{const e=d.querySelector(s);assert(e,'Exists '+s);assert(!e.disabled,'Enabled '+s);e.click();};
 const pointer=(type,p)=>{const e=new w.MouseEvent(type,{bubbles:true,clientX:p.x,clientY:p.y,button:0});Object.defineProperty(e,'pointerId',{value:1});svg.dispatchEvent(e);};
 const draw=points=>{pointer('pointerdown',points[0]);points.slice(1).forEach(p=>pointer('pointermove',p));pointer('pointerup',points[points.length-1]);};
 const exit=()=>{click('#home-button');if(d.querySelector('#exit-dialog').open)click('#exit-button');};
 const tick=()=>{now+=91000;timers.forEach(fn=>fn());};
 const score=()=>Number(d.querySelector('.score-value').textContent);
 assert.equal(d.querySelectorAll('[data-training-mode]').length,4);
 assert.deepEqual([...d.querySelectorAll('[data-level]')].map(b=>b.textContent),['Fácil','Médio','Difícil']);
 click('[data-training-mode=tutorial]');assert(d.querySelector('#judge-button').disabled);assert.equal(d.querySelectorAll('.support').length,4);
 click('[data-action=support]');assert.equal(d.querySelectorAll('.support').length,0);click('[data-action=support]');
 const task=C.generate(0,()=>.6);
 for(let i=0;i<4;i++){click('[data-part="'+i+'"]');draw(task.parts[i]);}
 click('[data-action=judge]');assert.equal(score(),100,'Full pointer construction gets 100');
 click('[data-action=sections]');assert.equal(d.querySelectorAll('.section-line').length,3);click('[data-action=solution]');assert.equal(d.querySelectorAll('.solution').length,0);
 click('[data-action=retry]');assert(d.querySelector('#judge-button').disabled);
 draw(task.parts[0]);const previous=d.querySelector('.student').getAttribute('d');
 pointer('pointerdown',{x:1,y:1});pointer('pointermove',{x:40,y:50});pointer('pointercancel',{x:40,y:50});assert.equal(d.querySelector('.student').getAttribute('d'),previous,'Cancelled stroke rolls back');
 click('#clear-button');assert(d.querySelector('#judge-button').disabled);click('#undo-button');assert.equal(d.querySelector('.student').getAttribute('d'),previous);
 click('[data-tool=shape]');assert(d.querySelector('#shape-a'));const input=d.querySelector('#shape-a');input.value=120;input.dispatchEvent(new w.Event('input',{bubbles:true}));
 click('#undo-button');assert.equal(Number(d.querySelector('#shape-a').value),75,'Undo shape adjustment');
 click('#clear-button');assert.equal(d.querySelector('[data-tool=pen]').getAttribute('aria-pressed'),'true','Cleared adjustable shape can be redrawn');
 exit();click('[data-level="2"]');click('[data-training-mode=classic]');assert(d.querySelector('#challenge-time').textContent.includes('90'));
 for(let i=0;i<6;i++){tick();assert.equal(score(),0,'Timeout grades empty parts');click('[data-action=next]');}
 assert(d.querySelector('#side-panel').textContent.includes('MÉDIA DA SESSÃO'));
 assert.equal(JSON.parse(w.localStorage.getItem('xuim.training.v1.cilindros.best.2.classic')),0);
 exit();click('[data-training-mode=endless]');tick();click('[data-action=next]');assert(d.querySelector('#side-panel').textContent.includes('0 cilindros acima da meta'));
 exit();const diagrams=[];
 for(let i=0;i<3;i++){click('[data-training-mode=daily]');diagrams.push(d.querySelector('#diagram').innerHTML);exit();}
 assert.equal(new Set(diagrams).size,1,'Same daily seed');assert(d.querySelector('[data-training-mode=daily]').disabled);
 click('[data-level="0"]');assert(!d.querySelector('[data-training-mode=daily]').disabled);
 click('[data-training-mode=tutorial]');
 w.localStorage.setItem('xuim.shortcuts.v1',JSON.stringify({...w.XuimKeys.defaults,line:'q'}));
 svg.dispatchEvent(new w.KeyboardEvent('keydown',{key:'q',bubbles:true}));assert(d.querySelector('#shape-a'),'Custom shortcut selects shape');
 assert.equal(d.querySelectorAll('script[src],link[rel=stylesheet],img[src^=http]').length,0);
 assert.deepEqual(errors,[]);dom.window.close();
 console.log('PASS: lint, full drawing, cancel/undo, shapes, tutorial, six rounds, timers, daily limits/seeding, records and custom shortcuts.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
