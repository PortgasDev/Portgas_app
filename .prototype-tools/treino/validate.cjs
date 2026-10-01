const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'treino-do-olhar.html'),'utf8');
const games=JSON.parse(html.match(/<script id="games" type="application\/json">([\s\S]*?)<\/script>/)[1]);
assert.deepEqual(Object.keys(games),['regua','cubo','elipse']);
assert(games.regua.includes('Divisões do segmento')&&!games.regua.includes('CompareCore'));
assert(games.cubo.includes('traceBtn'));
for(const doc of [html,...Object.values(games)]){
  for(const [,attr,body] of doc.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if(attr.includes('application/json'))JSON.parse(body);else new vm.Script(body);
  }
  assert(!/<(?:script|img|link)[^>]*(?:src|href)="https?:/.test(doc),'Remote asset dependency');
  assert(!doc.includes('/* FONTS */')&&!doc.includes('/* APP */'));
}
const {JSDOM}=require(path.join(root,'ferramentas/amazon-enxuta/node_modules/jsdom'));
const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',beforeParse(w){
  w.scrollTo=()=>{};
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
}});
const d=dom.window.document;
assert.equal(d.querySelector('.key-settings').open,false,'Shortcut settings start collapsed');
d.querySelector('[data-game=cubo]').click();
assert.equal(d.querySelector('iframe').title,'Cubo em Perspectiva');
assert.equal(d.querySelector('iframe').srcdoc,games.cubo);
d.querySelector('.arena-bar [data-game=regua]').click();
assert(d.querySelector('#leave-dialog').open);
d.querySelector('#stay').click();
assert.equal(d.querySelector('iframe').title,'Cubo em Perspectiva');
d.querySelector('.arena-bar [data-game=elipse]').click();d.querySelector('#leave').click();
assert.equal(d.querySelectorAll('iframe').length,1,'Only the active game may run');
assert.equal(d.querySelector('iframe').title,'Elipse em Perspectiva');
d.querySelector('#back').click();d.querySelector('#leave').click();
assert.equal(d.querySelector('iframe'),null,'Leaving removes timers and listeners');
assert.equal(d.querySelector('#lobby').hidden,false);
assert(d.querySelector('#resume').textContent.includes('Elipse'));
dom.window.close();
console.log('PASS: embedded games, syntax, offline assets, selected simple version, switch/cancel, session teardown and return.');
