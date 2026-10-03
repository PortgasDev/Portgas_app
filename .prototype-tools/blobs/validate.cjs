const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./model.js'),root=path.resolve(__dirname,'../..');
const dep=name=>require(path.join(root,'ferramentas/amazon-enxuta/node_modules',name));
for(let level=0;level<3;level++)for(let i=0;i<120;i++){
 const seed='validation:'+level+':'+i,t=C.generate(level,seed);
 assert(C.simple(t.outline),'Silhouette must not cross itself');
 for(const p of t.outline){assert(Number.isFinite(p.x)&&Number.isFinite(p.y));assert(p.x>=139&&p.x<=761&&p.y>=94&&p.y<=506,'Framing');}
 assert(C.distance(t.outline[0],t.outline.at(-1))<1e-5,'Closed silhouette');
 for(const reading of t.readings){
  assert(reading.front.length>=3&&reading.front.length===reading.back.length,'Enough illustrative cross contours');
  for(let j=0;j<reading.front.length;j++){
   const f=reading.front[j],b=reading.back[j];
   for(const p of [...f,...b])assert(C.inside(p,t.outline),'Example stays inside silhouette');
   assert(C.distance(f[0],b[0])<1e-5&&C.distance(f.at(-1),b.at(-1))<1e-5,'Front and back join');
  }
 }
 if(i===0)assert.deepEqual(C.generate(level,seed),t,'Stable seed');
}
assert.equal(C.validStrokes([{points:[{x:0,y:0},{x:Infinity,y:5}],width:2,dashed:false}]),null);
assert.equal(C.validStrokes([{points:[{x:0,y:0},{x:4,y:5}],width:99,dashed:false}]),null);
console.log('PASS: 360 deterministic silhouettes; no intersections, framed and closed; illustrative curves stay inside and join.');
async function main(){
 const {ESLint}=dep('eslint'),globals=dep('globals');
 const eslint=new ESLint({overrideConfigFile:true,overrideConfig:[{languageOptions:{ecmaVersion:2023,sourceType:'script',globals:{...globals.browser,...globals.node}},rules:{'no-undef':'error','no-unused-vars':'error','eqeqeq':'error','no-unreachable':'error'}}]});
 for(const file of['model.js','app.js','build.cjs','validate.cjs']){
  const reports=await eslint.lintText(fs.readFileSync(path.join(__dirname,file),'utf8'),{filePath:file});
  if(reports.some(r=>r.errorCount))console.log(await(await eslint.loadFormatter('stylish')).format(reports));
  assert.equal(reports.reduce((n,r)=>n+r.errorCount,0),0,'Lint '+file);
 }
 const {JSDOM,VirtualConsole}=dep('jsdom'),html=fs.readFileSync(path.join(root,'blobs.html'),'utf8');
 function boot(saved={},quota=false){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(html,{url:'http://localhost/blobs.html',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
   for(const[k,v]of Object.entries(saved))w.localStorage.setItem(k,v);
   if(quota)w.Storage.prototype.setItem=()=>{throw new Error('Quota');};
   w.DOMPoint=class{constructor(x,y){this.x=x;this.y=y;}matrixTransform(){return this;}};
   w.SVGElement.prototype.getScreenCTM=()=>({inverse:()=>({})});w.SVGElement.prototype.setPointerCapture=()=>{};
   w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
   w.print=()=>{};
  }});
  const w=dom.window,d=w.document,svg=d.querySelector('#drawing');
  const click=selector=>{const e=d.querySelector(selector);assert(e,'Exists '+selector);assert(!e.disabled,'Enabled '+selector);e.click();};
  const pointer=(type,x,y)=>{const e=new w.MouseEvent(type,{bubbles:true,clientX:x,clientY:y,button:0});Object.defineProperty(e,'pointerId',{value:1});svg.dispatchEvent(e);};
  const draw=(y=300)=>{pointer('pointerdown',280,y);pointer('pointermove',380,y-25);pointer('pointermove',480,y-30);pointer('pointerup',590,y);};
  const count=()=>d.querySelectorAll('#ink .student-stroke').length;
  return{w,d,svg,click,pointer,draw,count,errors,close:()=>dom.window.close()};
 }
 let b=boot();const {d,w,click,pointer,draw,count}=b;
 assert.deepEqual([...d.querySelectorAll('[data-level]')].map(e=>e.textContent),['Fácil','Médio','Difícil']);assert.equal(d.querySelectorAll('[data-mode]').length,4);
 click('[data-mode=tutorial]');assert.equal(d.querySelectorAll('#guides path').length,1);
 pointer('pointerdown',300,300);pointer('pointerup',300,300);assert.equal(count(),0,'Tap is not a stroke');
 draw();draw(380);assert.equal(count(),2);click('#undo-button');assert.equal(count(),1);click('#redo-button');assert.equal(count(),2);
 pointer('pointerdown',300,440);pointer('pointermove',500,440);pointer('pointercancel',500,440);assert.equal(count(),2,'Cancelled pen gesture rolls back');
 click('[data-tool=eraser]');pointer('pointerdown',280,300);assert.equal(count(),1);pointer('pointercancel',280,300);assert.equal(count(),2,'Cancelled erase rolls back');
 pointer('pointerdown',280,300);pointer('pointerup',280,300);assert.equal(count(),1);click('#undo-button');assert.equal(count(),2,'Undo entire erase gesture');
 click('[data-tool=pen]');click('#back-button');draw(460);assert(d.querySelector('#ink path:last-child').hasAttribute('stroke-dasharray'));
 click('#clear-button');assert(d.querySelector('#confirm-dialog').open);click('[data-close=confirm-dialog]');assert.equal(count(),3);click('#clear-button');click('#confirm-button');assert.equal(count(),0);click('#undo-button');assert.equal(count(),3);
 click('[data-action=step-next]');assert(d.querySelectorAll('#guides path').length>=3);click('[data-action=step-next]');click('[data-action=review]');
 const note=d.querySelector('#study-notes');note.value='<img src=x onerror=alert(1)> Teste';note.dispatchEvent(new w.Event('input',{bubbles:true}));
 click('[data-action=example]');assert(d.querySelector('#study-notes').value.includes('<img'));assert.equal(d.querySelectorAll('img:not(#export-preview)').length,0,'Note is escaped');
 const seed=w.localStorage.getItem('xuim.blobs.v1.draft');
 b.close();b=boot({'xuim.blobs.v1.draft':seed});b.click('[data-action=resume]');assert.equal(b.count(),3,'Reload restores all strokes');assert.equal(b.d.querySelector('#workspace').dataset.state,'review');
 b.click('[data-action=edit]');b.w.localStorage.setItem('xuim.shortcuts.v1',JSON.stringify({...b.w.XuimKeys.defaults,eraser:'q'}));b.svg.dispatchEvent(new b.w.KeyboardEvent('keydown',{key:'q',bubbles:true}));assert.equal(b.d.querySelector('[data-tool=eraser]').getAttribute('aria-pressed'),'true','Custom shortcut');
 b.click('[data-action=review]');b.click('[data-action=next]');assert.equal(b.d.querySelector('#workspace').dataset.state,'summary');assert.equal(b.d.querySelectorAll('.study-card').length,1);assert.equal(b.w.localStorage.getItem('xuim.blobs.v1.draft'),null,'No draft after completion');
 b.click('[data-study="0"]');assert(b.d.querySelector('#study-note').textContent.includes('<img'));b.click('[data-close=study-dialog]');
 b.click('[data-action=home]');b.click('[data-level="2"]');b.click('[data-mode=classic]');
 for(let i=0;i<6;i++){b.draw(300+i*4);b.click('[data-action=review]');b.click('[data-action=next]');}
 assert.equal(b.d.querySelector('#workspace').dataset.state,'summary');assert.equal(b.d.querySelector('.summary-count').textContent,'6');assert.equal(b.d.querySelectorAll('.study-card').length,6,'Bounded gallery');
 b.click('[data-action=home]');b.click('[data-mode=daily]');const daily=b.d.querySelector('#silhouette').innerHTML;
 b.click('#home-button');b.click('[data-mode=daily]');b.click('#confirm-button');assert.equal(b.d.querySelector('#silhouette').innerHTML,daily,'Daily is deterministic');
 b.click('[data-action=sheet]');const sheet=b.d.querySelector('#sheet-preview').innerHTML;assert.equal(b.d.querySelectorAll('#sheet-preview svg svg').length,6);
 b.click('#new-sheet');assert.notEqual(b.d.querySelector('#sheet-preview').innerHTML,sheet);b.click('[data-close=sheet-dialog]');assert.equal(b.d.querySelector('#silhouette').innerHTML,daily,'Sheet independent from current drawing');
 b.click('#home-button');b.click('[data-mode=endless]');b.click('#confirm-button');b.draw();b.click('[data-action=review]');b.click('[data-action=next]');assert(b.d.querySelector('#board-count').textContent.includes('02'));
 assert.equal(b.d.querySelectorAll('script[src],link[rel=stylesheet],img[src^=http]').length,0,'Standalone');assert.deepEqual(b.errors,[]);b.close();
 b=boot({'xuim.blobs.v1.draft':'{"version":1,"strokes":"broken"}'});assert.equal(b.d.querySelector('[data-action=resume]'),null);b.close();
 b=boot({},true);b.click('[data-mode=classic]');b.draw();assert(b.d.querySelector('#save-status').textContent.includes('Não foi possível salvar'));b.click('#home-button');b.click('[data-action=resume]');assert.equal(b.count(),1,'Memory draft survives storage failure');assert.deepEqual(b.errors,[]);b.close();
 console.log('PASS: lint; drawing, cancellation, erase, undo/redo, dashed strokes, clear confirmation, tutorials, reload, notes, shortcuts, all modes, daily seed, gallery cap, sheet independence and storage failure.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
