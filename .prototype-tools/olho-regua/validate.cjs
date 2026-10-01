const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('./model.js');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'olho-de-regua-aquecimento.html'), 'utf8');
for (const type of C.TYPES) for (let level = 0; level < 3; level++) for (let i = 0; i < 200; i++) {
  const task = C.generate(type, level);
  assert.equal(C.assess(task, task.target).score, 100);
  assert.equal(C.assess(task, null), null);
  assert.equal(C.assess(task, NaN), null);
  assert(C.assess(task, C.clamp(task.target + .1)).score < 100);
  assert(task.target >= 0 && task.target <= 1);
  if (type === 'midpoint') {
    for (const p of [task.a, task.b]) assert(p.x > 0 && p.x < 900 && p.y > 0 && p.y < 620);
    assert(Math.abs(C.project(C.mix(task.a, task.b, .5), task.a, task.b) - .5) < 1e-10);
  }
  if (type === 'angle') assert(task.degrees >= 25 && task.degrees <= 160);
  if (type === 'ratio') assert(Math.abs(task.target * task.maxLength - task.reference * task.fraction[0] / task.fraction[1]) < 1e-10);
}
const planned = C.plan('mix', 9);
for (const type of C.TYPES) assert.equal(planned.filter(t => t === type).length, 3);
assert.deepEqual(C.sanitizeHistory([{average:300},null,'bad']), []);
assert.equal(C.project({x:5,y:100},{x:0,y:0},{x:10,y:0}), .5);
assert.equal(C.project({x:100,y:100},{x:0,y:0},{x:10,y:0}), 1);
const midpoint = {type:'midpoint',target:.5,fraction:[1,2]};
assert.equal(C.assess(midpoint,.55).score,80);
const angle = {type:'angle',target:.5};
assert(Math.abs(C.assess(angle,.55).error - 9) < 1e-10);
assert.equal(C.summarize([]).average,null);
console.log('PASS: 1,800 exercises, projection, bounds, scoring, ratios, mixed distribution and stored-data validation.');

async function main() {
  const dependency = name => require(path.join(root, 'ferramentas/amazon-enxuta/node_modules', name));
  const {ESLint} = dependency('eslint'), globals = dependency('globals');
  const eslint = new ESLint({overrideConfigFile:true,overrideConfig:[{languageOptions:{ecmaVersion:2022,sourceType:'script',globals:{...globals.node,...globals.browser}},rules:{'no-undef':'error','no-unused-vars':'error','eqeqeq':'error','no-unreachable':'error'}}]});
  for (const name of ['model.js','app.js','build.cjs','validate.cjs']) {
    const results = await eslint.lintText(fs.readFileSync(path.join(__dirname,name),'utf8'),{filePath:name});
    const errors = results.reduce((n,r)=>n+r.errorCount,0);
    if(errors)console.log(await (await eslint.loadFormatter('stylish')).format(results));
    assert.equal(errors,0,`Lint ${name}`);
  }
  console.log('PASS: ESLint for all JavaScript.');
  const {JSDOM,VirtualConsole} = dependency('jsdom');
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError',e=>errors.push(e.message));
  let latestDownload='';
  const dom = new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole,beforeParse(w){
    w.scrollTo=()=>{};w.ResizeObserver=class{observe(){}};
    w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
    w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
    w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
    w.HTMLAnchorElement.prototype.click=function(){latestDownload=this.download;};
  }});
  const doc=dom.window.document;
  const click=selector=>{const b=doc.querySelector(selector);assert(b,`Exists: ${selector}`);assert(!b.disabled,`Enabled: ${selector}`);b.click();};
  const key=(key,shiftKey=false)=>doc.getElementById('adjust-track').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key,shiftKey,bubbles:true}));
  function setFocus(value){const select=doc.getElementById('focus-select');select.value=value;select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));}
  setFocus('midpoint');click('[data-training-mode="tutorial"]');
  assert(doc.getElementById('confirm-button').disabled);
  key('Home');for(let i=0;i<50;i++)key('ArrowRight');
  click('[data-action="confirm"]');const firstScore=doc.querySelector('.score-value').textContent;
  click('[data-action="retry"]');key('Home');click('[data-action="confirm"]');const revisionScore=doc.querySelector('.score-value').textContent;
  assert(doc.querySelector('.revision-note').textContent.includes(`Primeira tentativa: ${firstScore} pontos. Revisão: ${revisionScore} pontos.`));
  click('[data-action="next"]');
  click('#home-button');click('#exit-home');click('[data-training-mode="classic"]');
  for(let i=0;i<6;i++){click('[data-action="plus"]');click('[data-action="confirm"]');click('[data-action="next"]');}
  assert(doc.querySelector('.summary-metrics'));
  const saved=JSON.parse(dom.window.localStorage.getItem('xuim.olho-regua.sessions.v3'));
  assert.equal(saved.length,1);assert(saved[0].average>=0&&saved[0].average<=100,'Session average is valid and the revision did not create a second record');
  click('[data-action="download"]');assert.equal(latestDownload,'xuim-art_olho-de-regua_resumo.txt');
  click('#home-button');setFocus('angle');click('[data-training-mode="tutorial"]');key('End');click('[data-action="confirm"]');click('[data-action="next"]');click('[data-action="minus"]');click('[data-action="confirm"]');click('#finish-button');
  assert.equal(JSON.parse(dom.window.localStorage.getItem('xuim.olho-regua.sessions.v3')).length,1,'Free training does not alter session records');
  click('#home-button');setFocus('ratio');click('[data-training-mode="classic"]');click('[data-action="plus"]');click('[data-action="confirm"]');click('#home-button');click('#exit-summary');assert(doc.querySelector('.summary-metrics'));
  assert.equal(JSON.parse(dom.window.localStorage.getItem('xuim.olho-regua.sessions.v3')).length,1,'Partial session does not alter records');
  assert.equal(doc.querySelectorAll('script[src],link[rel=stylesheet],img[src^="http"]').length,0);
  assert(html.includes('Barlow Condensed')&&html.includes('DM Sans')&&html.includes('IBM Plex Mono'));
  assert(!html.includes('/* MODEL */')&&!html.includes('/* APP */'));
  const ids=[...doc.querySelectorAll('[id]')].map(e=>e.id);
  assert.equal(new Set(ids).size,ids.length,'Unique IDs');
  assert.deepEqual(errors,[]);
  dom.window.close();
  console.log('PASS: six-round challenge, keyboard precision, tutorial retries, record persistence, partial summary, export, offline assets and DOM runtime.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
