'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const model = require('./model.js');
const root = path.resolve(__dirname, '../..');
const catalog = require('./curriculum.json');
assert.deepEqual(catalog.modules.map(m => m.weeks.length), [13,6,4,9,4,12]);
assert.deepEqual(catalog.modules.flatMap(m => m.weeks.map(w => w[0])), Array.from({length:48}, (_,i) => i+1));
assert.deepEqual(catalog.projects.map(p => [p.start,p.delivery]), [[11,13],[17,19],[24,26],[27,29],[30,32],[45,47]]);
const state = model.blank();
assert.equal(model.next(state), 1);
model.update(state, 1, {note:'Dúvida <teste> & "texto"\n</textarea><script>literal</script>',review:true});
state.active = 1;
model.complete(state, 1);
assert.equal(model.completed(state), 1);
assert.equal(model.next(state), 2);
assert.equal(state.active, null);
assert.deepEqual(model.reviews(state), [1]);
assert.deepEqual(model.validate(JSON.parse(JSON.stringify(state))), state);
model.complete(state, 1, false);
assert.equal(model.next(state), 1);
assert.ok(model.record(state,1).note.includes('</textarea>'));
state.active = 30;
assert.equal(model.next(state), 30);
for(let id=1;id<=48;id++) model.complete(state,id);
assert.equal(model.completed(state),48);
assert.equal(model.next(state),null);
for(const patch of [{format:'xuim-review'}, {module:7}, {selected:49}, {active:-1}, {records:[]}, {records:{'01':model.record(state,1)}}, {records:{1:{started:true,completed:'yes',review:false,note:''}}}, {records:{1:{started:true,completed:false,review:false,note:'x'.repeat(10001)}}}]) {
  assert.throws(() => model.validate({...model.blank(),...patch}));
}
const html = fs.readFileSync(path.join(root,'trilha-xuim.html'),'utf8');
for(const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
  if(match[1].includes('application/json')) JSON.parse(match[2]);
  else new vm.Script(match[2]);
}
const staticHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
const ids = [...staticHtml.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Duplicate static IDs');
assert.ok(html.includes('font-licenses'));
assert.ok(!/__(CURRICULUM|MASCOT)__|\/\* (CSS|JS|FONTS) \*\//.test(html));
assert.ok(!/<(?:script|link|img)[^>]+(?:src|href)="https?:/i.test(html),'Remote dependency');
for(const [file,hash] of Object.entries({
  'atelie-xuim.html':'432941d7eaa947d78ce6a48950f71e6ca5263503eb1063fb1a48659a2fe1398e',
  'atelie-xuim-1.0.html':'432941d7eaa947d78ce6a48950f71e6ca5263503eb1063fb1a48659a2fe1398e',
  'atelie-xuim-2.0.html':'391bfc69168d8556eb91cb02091b01ce4c58a2e8eeb24d5b49b1395429a6b02a'
})) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),hash,file+' changed');
console.log('PASS: curriculum, progression, revisit, note round-trip, backup validation, compiled scripts, standalone assets and preserved prototypes.');
