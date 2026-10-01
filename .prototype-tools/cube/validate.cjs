const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'cube-perspectiva.html'), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const sandbox = {module: {exports: {}}};
vm.runInNewContext(source, sandbox);
const {makeCube, seeded, hash, scoreDrawing, pointSegment} = sandbox.module.exports;
const rng = seeded(381);
for (let i = 0; i < 500; i++) {
 const cube = makeCube(rng);
 assert.equal(cube.targets.length, 5, 'Exactly five missing visible edges');
 assert.equal(cube.baseEdges.length, 4);
 assert.equal(cube.targets.filter(edge=>edge.some(p=>p.x===cube.hint.x&&p.y===cube.hint.y)).length,3,'The hint must be the exact junction of three missing edges');
 assert(!cube.face.some(p=>p.x===cube.hint.x&&p.y===cube.hint.y),'The hint belongs outside the supplied face');
 assert.equal(cube.visiblePoints.length,7,'Only the seven visible vertices receive correction markers');
 for(const point of cube.visiblePoints) assert(cube.edges.some(edge=>edge.includes(point)),'Correction markers must belong to visible edges');
 for (const point of cube.points) assert(point.x > 0 && point.x < 1000 && point.y > 0 && point.y < 1000);
 const exact = cube.targets.map(points => ({points, width: 3}));
 assert.equal(scoreDrawing(cube, exact).score, 100, 'Perfect construction scores 100');
 assert.equal(scoreDrawing(cube, []).score, 0);
 const partial = scoreDrawing(cube, exact.slice(0, 2));
 assert(partial.score < 85 && partial.score > 0, 'Missing edges lower coverage');
 const wrong = [{points: [{x: 10, y: 10}, {x: 990, y: 10}], width: 3}];
 assert(scoreDrawing(cube, wrong).score < 1, 'Unrelated stroke scores near zero');
 const offset = exact.map(s => ({...s, points: s.points.map(p => ({x:p.x+30, y:p.y+30}))}));
 assert(scoreDrawing(cube, offset).score < 85, 'Displacement lowers score');
}
assert.deepEqual(makeCube(seeded(hash('2026-09-30'))), makeCube(seeded(hash('2026-09-30'))));
assert.equal(pointSegment({x:5,y:3},{x:0,y:0},{x:10,y:0}), 3);
assert.equal(pointSegment({x:0,y:5},{x:0,y:0},{x:0,y:0}), 5);
console.log('PASS: 500 cube orientations, exact/partial/empty/wrong/offset drawings, daily seed, degenerate segments.');

async function check() {
 const {ESLint} = require(path.join(root, 'ferramentas/amazon-enxuta/node_modules/eslint'));
 const globals = require(path.join(root, 'ferramentas/amazon-enxuta/node_modules/globals'));
 const eslint = new ESLint({overrideConfigFile:true, overrideConfig:[{languageOptions:{ecmaVersion:2022, sourceType:'script', globals:{...globals.browser,...globals.node}},rules:{'no-undef':'error','no-unused-vars':'error','no-unreachable':'error','valid-typeof':'error','eqeqeq':'error'}}]});
 const results = await eslint.lintText(source, {filePath:'cube.js'});
 const errors = results.reduce((n,r)=>n+r.errorCount,0);
 if(errors)console.log(await (await eslint.loadFormatter('stylish')).format(results));
 assert.equal(errors,0,'JavaScript lint');
 console.log('PASS: JavaScript syntax and ESLint.');
 const {JSDOM} = require(path.join(root, 'ferramentas/amazon-enxuta/node_modules/jsdom'));
 let tick;
 const dom = new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',beforeParse(window){
  window.scrollTo=()=>{};
  window.HTMLCanvasElement.prototype.getContext=()=>new Proxy({}, {get:()=>()=>{}});
  window.ResizeObserver=class {observe(){}};
  window.setInterval=fn=>{tick=fn;};
  window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 }});
 const doc=dom.window.document;
 const click=id=>{assert(doc.getElementById(id),`Button ${id} exists`);doc.getElementById(id).click();};
 const mode=name=>doc.querySelector(`[data-training-mode="${{study:'tutorial',normal:'classic',endless:'endless',daily:'daily'}[name]}"]`).click();
 mode('study'); assert.equal(doc.getElementById('timer').textContent,'∞');
 assert.equal(doc.getElementById('traceBtn').getAttribute('aria-pressed'),'true');
 click('traceBtn');assert.equal(doc.getElementById('traceBtn').getAttribute('aria-pressed'),'false');
 click('traceBtn');assert.equal(doc.getElementById('traceBtn').getAttribute('aria-pressed'),'true');
 click('judgeBtn');assert(doc.getElementById('sidebar').textContent.includes('0.0'));click('guidesBtn');click('retryBtn');assert(doc.getElementById('judgeBtn'));click('homeBtn');click('confirmExit');
 mode('normal');assert.equal(doc.getElementById('traceBtn').getAttribute('aria-pressed'),'true');click('judgeBtn');click('nextBtn');assert.equal(doc.getElementById('traceBtn').getAttribute('aria-pressed'),'true');click('judgeBtn');click('nextBtn');
 assert.equal(doc.getElementById('traceBtn'),null,'Scored rounds must not offer tracing');
 for(let i=0;i<6;i++){assert.equal(doc.getElementById('timer').textContent,'30s');click('judgeBtn');click('nextBtn');}
 assert(doc.getElementById('sidebar').textContent.includes('SESSÃO CONCLUÍDA'));click('backBtn');
 mode('endless');click('judgeBtn');click('nextBtn');assert(doc.getElementById('sidebar').textContent.includes('0 cubos superados'));click('backBtn');
 for(let i=0;i<3;i++){mode('daily');click('homeBtn');click('confirmExit');}
 assert(doc.querySelector('[data-training-mode="daily"]').disabled);
 mode('normal');click('skipBtn');
 Object.defineProperty(dom.window.performance,'now',{value:()=>Number.MAX_SAFE_INTEGER});tick();assert(doc.getElementById('nextBtn'),'Timer submits at deadline');
 dom.window.close();
 console.log('PASS: study/retry, 2 warmups + 6 rounds, endless defeat, daily attempt limit, automatic timeout.');
}
check().catch(error=>{console.error(error);process.exitCode=1;});
