const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const model=require('./model.js');
const root=path.resolve(__dirname,'../..');
const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'content.json'),'utf8'));
const originalCatalog=structuredClone(catalog);
const legacy=JSON.parse(fs.readFileSync(path.join(__dirname,'legacy.json'),'utf8'));
catalog.groups.splice(catalog.groups.indexOf('Fechamento'),0,legacy.group);
for(const section of legacy.sections){section.group=legacy.group;section.reviewKind='legacy';for(const item of section.items)item.reviewKind='legacy';}
catalog.sections.splice(catalog.sections.findIndex(s=>s.id==='fechamento'),0,...legacy.sections);
const ids=catalog.sections.flatMap(model.keysFor);
assert.equal(new Set(ids).size,ids.length,'Every answer needs a stable, unique ID');
for(const section of catalog.sections){
  for(const key of ['id','title','path','purpose','current','assumption','question'])assert.ok(section[key],section.id+' missing '+key);
  assert.ok(catalog.groups.includes(section.group));
  for(const item of section.items)for(const key of ['id','title','description','question'])assert.ok(item[key],item.id+' missing '+key);
  for(const id of [...section.links,...section.items.flatMap(i=>i.links||[])])assert.ok(catalog.sections.some(s=>s.id===id),'Broken chapter link '+id);
}
const state=model.blank(catalog);
assert.equal(model.count(state,catalog.sections[0]),0);
assert.equal(model.hasAnswer({decision:'',text:'  \n '}),false);
state.answers.essencia={decision:'change',text:'QA — processo antes da nota.\nUma conversa com "aspas", acentos e <script>literal</script>.'};
state.answers['essencia-processo']={decision:'',text:'QA — orientação imediata e revisão sem perder contexto.'};
state.answers['sketchbook-privacidade']={decision:'unsure',text:''};
state.current='sketchbook';
const restored=model.validate(JSON.parse(JSON.stringify(state)),catalog);
assert.deepEqual(restored,state,'Export/import must preserve every answer');
assert.equal(model.count(restored,catalog.sections[0]),2);
const markdown=model.markdown(restored,catalog);
assert.ok(markdown.includes(state.answers.essencia.text));
assert.ok(markdown.includes('Marcação: Ainda não decidi'));
assert.ok(markdown.includes('## Sketchbook · a organização do caderno'));
assert.ok(!markdown.includes('## Avaliação formal'),'Unanswered areas must not appear approved');
assert.ok(markdown.includes('Itens ausentes ou sem decisão não estão aprovados'));
const oldFeedback=JSON.parse(fs.readFileSync(path.join(__dirname,'qa-import.json'),'utf8'));
assert.deepEqual(model.validate(oldFeedback,catalog),model.validate(oldFeedback,originalCatalog),'Existing feedback must be accepted without losing or reinterpreting answers');
assert.deepEqual(catalog.sections.filter(s=>s.reviewKind!=='legacy'),originalCatalog.sections,'All existing review areas and IDs must remain unchanged');
assert.equal(model.choicesFor({}).keep,'Faz sentido');
assert.equal(model.choicesFor(legacy.sections[0]).keep,'Quero recuperar');
const comparisonState=model.blank(catalog);
comparisonState.answers['v1-jornada-checks']={decision:'keep',text:'Quero marcar a prática mesmo antes de enviar.'};
comparisonState.answers['v1-jornada']={decision:'change',text:'Integrar a jornada ao caderno.'};
const comparisonText=model.markdown(comparisonState,catalog);
assert.ok(comparisonText.includes('Marcação: Quero recuperar')&&comparisonText.includes('Marcação: Quero adaptar'));
assert.ok(comparisonText.includes('Na v1:')&&comparisonText.includes('Na v2:')&&comparisonText.includes('Controle ausente'));
assert.deepEqual(model.validate(JSON.parse(JSON.stringify(comparisonState)),catalog),comparisonState);
for(const section of legacy.sections)for(const item of section.items)for(const key of ['before','after','changeType'])assert.ok(item[key],item.id+' missing '+key);
for(const bad of [
  {...state,format:'xuim-atelier'},
  {...state,schema:99},
  {...state,answers:[]},
  {...state,answers:{unknown:{decision:'keep',text:''}}},
  {...state,answers:{essencia:{decision:'approved-all',text:''}}},
  {...state,answers:{essencia:{decision:'keep',text:{bad:true}}}},
  {...state,answers:{essencia:{decision:'keep',text:'x'.repeat(20001)}}}
])assert.throws(()=>model.validate(bad,catalog));
const html=fs.readFileSync(path.join(root,'revisao-atelie-2.0.html'),'utf8');
assert.ok(!html.includes('/* REVIEW_')&&!html.includes('__CATALOG__'));
assert.ok(!/<(?:script|link|img)\b[^>]*(?:src|href)=["']https?:/i.test(html),'Single-file guide must not load remote dependencies');
assert.ok(html.includes('font-licenses'),'Preserve embedded font licenses');
const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
for(const [,attributes,source] of scripts)if(!attributes.includes('application/json'))new vm.Script(source);
const embedded=JSON.parse(scripts.find(s=>s[1].includes('id="catalog"'))[2]);
assert.deepEqual(embedded,catalog,'Final HTML must contain the complete review');
const staticIds=[...html.replace(/<script\b[\s\S]*?<\/script>/g,'').matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(staticIds).size,staticIds.length);
const expected={
  'atelie-xuim.html':'432941d7eaa947d78ce6a48950f71e6ca5263503eb1063fb1a48659a2fe1398e',
  'atelie-xuim-1.0.html':'432941d7eaa947d78ce6a48950f71e6ca5263503eb1063fb1a48659a2fe1398e',
  'atelie-xuim-2.0.html':'391bfc69168d8556eb91cb02091b01ce4c58a2e8eeb24d5b49b1395429a6b02a'
};
for(const [file,hash] of Object.entries(expected))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),hash,file+' must remain unchanged');
console.log(`PASS: ${catalog.sections.length} areas, ${ids.length} answer locations, linked catalog, partial export, exact round trip, invalid imports, final HTML syntax, embedded assets and three preserved platform files.`);
