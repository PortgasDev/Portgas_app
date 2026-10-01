const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const C=require('./model.js');
const root=path.resolve(__dirname,'../..');
for(let level=0;level<3;level++)for(let i=0;i<100;i++){
 const task=C.generate(level),ellipse=task.ellipse;
 assert(ellipse.a>=ellipse.b&&ellipse.b>0);
 const angle=ellipse.angle*Math.PI/180;
 for(const p of task.target){
  const x=p.x-ellipse.center.x,y=p.y-ellipse.center.y;
  const u=x*Math.cos(angle)+y*Math.sin(angle),v=-x*Math.sin(angle)+y*Math.cos(angle);
  assert(Math.abs(u*u/(ellipse.a*ellipse.a)+v*v/(ellipse.b*ellipse.b)-1)<1e-8,'Projected circle agrees with analytic conic');
  assert(p.x>=0&&p.x<=900&&p.y>=0&&p.y<=620);
 }
 for(const p of task.contacts)assert(Math.min(...task.face.map((a,j)=>C.segmentDistance(p,a,task.face[(j+1)%4])))<1e-8,'Contacts lie on the projected square');
 if(level===0)assert(C.distance(task.center,ellipse.center)<1e-8,'Parallel projection preserves circle center');
 if(i<3){
  assert.equal(C.assess(task,task.target).score,100);
  assert.equal(C.assess(task,C.ellipsePoints(ellipse)).score,100,'Perfect adjustable ellipse scores 100');
  assert.equal(C.assess(task,[]),null);
  assert(C.assess(task,task.target.slice(0,90)).coverage<65,'Incomplete curve loses coverage');
  assert(C.assess(task,task.target.map(p=>({x:p.x+70,y:p.y+40}))).score<65,'Displaced ellipse loses accuracy');
 }
}
console.log('PASS: 300 projected circles, conic decomposition, exact tangencies, center behavior and scoring.');
async function main(){
 const dep=name=>require(path.join(root,'ferramentas/amazon-enxuta/node_modules',name));
 const {ESLint}=dep('eslint'),globals=dep('globals');
 const eslint=new ESLint({overrideConfigFile:true,overrideConfig:[{languageOptions:{ecmaVersion:2022,sourceType:'script',globals:{...globals.node,...globals.browser}},rules:{'no-undef':'error','no-unused-vars':'error','eqeqeq':'error','no-unreachable':'error'}}]});
 for(const file of ['model.js','app.js','build.cjs','validate.cjs']){
  const r=await eslint.lintText(fs.readFileSync(path.join(__dirname,file),'utf8'),{filePath:file});
  if(r.some(x=>x.errorCount))console.log(await(await eslint.loadFormatter('stylish')).format(r));
  assert.equal(r.reduce((n,x)=>n+x.errorCount,0),0,`Lint ${file}`);
 }
 console.log('PASS: ESLint and JavaScript syntax.');
 const html=fs.readFileSync(path.join(root,'elipse-perspectiva.html'),'utf8');
 const {JSDOM,VirtualConsole}=dep('jsdom'),errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 let downloaded='';
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
  w.scrollTo=()=>{};w.Math.random=()=>.6;
  w.ResizeObserver=class{observe(){}};
  w.DOMPoint=class{constructor(x,y){this.x=x;this.y=y;}matrixTransform(){return this;}};
  w.SVGElement.prototype.getScreenCTM=()=>({inverse:()=>({})});
  w.SVGElement.prototype.setPointerCapture=()=>{};
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  w.URL.createObjectURL=()=>'blob:test';w.URL.revokeObjectURL=()=>{};
  w.HTMLAnchorElement.prototype.click=function(){downloaded=this.download;};
 }});
 const doc=dom.window.document;
 const click=s=>{const b=doc.querySelector(s);assert(b,`Exists ${s}`);assert(!b.disabled,`Enabled ${s}`);b.click();};
 const input=(id,value)=>{const el=doc.getElementById(id);el.value=value;el.dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
 click('[data-training-mode="tutorial"]');assert(doc.getElementById('judge-button').disabled,'Empty freehand is not graded');
 click('[data-mode="shape"]');assert(!doc.getElementById('judge-button').disabled);
 input('axis-a','200');assert.equal(doc.getElementById('axis-a').value,'200');click('#undo-button');assert.equal(doc.getElementById('axis-a').value,'170');
 click('[data-action="judge"]');const first=doc.querySelector('.score-value').textContent;
 click('[data-action="construction"]');assert.equal(doc.querySelector('[data-action="construction"]').getAttribute('aria-pressed'),'true');
 click('[data-action="retry"]');input('axis-a','30');input('axis-b','8');click('[data-action="judge"]');assert(doc.querySelector('.revision-note').textContent.includes(`Primeira tentativa: ${first} pontos.`));
 click('#home-button');click('#exit-button');click('[data-training-mode="classic"]');for(let i=0;i<6;i++){click('[data-action="judge"]');click('[data-action="next"]');}
 assert(doc.getElementById('board-label').textContent.includes('CONCLUÍDA'));
 const record=JSON.parse(dom.window.localStorage.getItem('xuim.training.v1.elipse.best.0.classic'));assert(Number.isFinite(record));
 click('[data-action="download"]');assert.equal(downloaded,'xuim-art_elipse_resumo.txt');
 click('[data-action="practice"]');click('[data-action="judge"]');click('#finish-button');assert.deepEqual(JSON.parse(dom.window.localStorage.getItem('xuim.training.v1.elipse.best.0.classic')),record);
 click('#home-button');click('[data-training-mode="classic"]');click('[data-action="judge"]');click('#home-button');click('#partial-button');assert.deepEqual(JSON.parse(dom.window.localStorage.getItem('xuim.training.v1.elipse.best.0.classic')),record);
 click('#home-button');const select=doc.getElementById('tool-select');select.value='free';select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));click('[data-training-mode="tutorial"]');
 const drawing=doc.getElementById('drawing'),perfect=C.generate(0,()=>.6).target;
 const pointer=(type,p)=>{const e=new dom.window.MouseEvent(type,{bubbles:true,clientX:p.x,clientY:p.y,button:0});Object.defineProperty(e,'pointerId',{value:1});drawing.dispatchEvent(e);};
 pointer('pointerdown',perfect[0]);for(const p of perfect.slice(1))pointer('pointermove',p);pointer('pointerup',perfect[perfect.length-1]);
 assert(!doc.getElementById('judge-button').disabled);click('#clear-button');assert(doc.getElementById('judge-button').disabled);click('#undo-button');click('[data-action="judge"]');assert.equal(doc.querySelector('.score-value').textContent,'100','Pointer drawing follows the projected circle exactly');
 assert.equal(doc.querySelectorAll('script[src],link[rel="stylesheet"],img[src^="http"]').length,0);
 const ids=[...doc.querySelectorAll('[id]')].map(x=>x.id);assert.equal(ids.length,new Set(ids).size);
 assert(!html.includes('/* APP */'));assert.deepEqual(errors,[]);dom.window.close();
 console.log('PASS: six rounds, pointer drawing, clear/undo, adjustable ellipse, revisions, construction, records, partial/free summaries, download and offline artifact.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
