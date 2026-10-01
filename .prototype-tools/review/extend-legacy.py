"""Apply the review-only comparison UI changes once."""
from pathlib import Path

HERE = Path(__file__).resolve().parent
script_path = HERE / 'guide.js'
script = script_path.read_text(encoding='utf-8')

def replace_once(old, new):
    global script
    assert script.count(old) == 1, old[:100]
    script = script.replace(old, new, 1)

replace_once("  function hasChanges(section) {return ReviewModel.keysFor(section).some(id=>['change','remove'].includes(state.answers[id]?.decision));}", "  const legacyIds=new Set(catalog.sections.filter(s=>s.reviewKind==='legacy').flatMap(ReviewModel.keysFor));\n  const proposesChange=(id,answer)=>['change','remove'].includes(answer?.decision)||(legacyIds.has(id)&&answer?.decision==='keep');\n  function hasChanges(section) {return ReviewModel.keysFor(section).some(id=>proposesChange(id,state.answers[id]));}")
replace_once('Object.entries(ReviewModel.choices).map', 'Object.entries(ReviewModel.choicesFor(item)).map')
replace_once("${whole?'O que você acha da proposta desta área?':'Sua avaliação deste detalhe'}", "${item.reviewKind==='legacy'?'O que você quer aproveitar da v1?':whole?'O que você acha da proposta desta área?':'Sua avaliação deste detalhe'}")
replace_once("${feedback({id:section.id,title:section.title,question:section.question},true)}", "${feedback({id:section.id,title:section.title,question:section.question,reviewKind:section.reviewKind},true)}")
replace_once('<div class="detail-body"><p>${escape(item.description)}</p>', '<div class="detail-body">${comparisonHTML(item)}<p>${escape(item.description)}</p>')
replace_once("  function renderChapter(section) {", "  function comparisonHTML(item) {\n    if(!item.before)return '';\n    return `<div class=\"version-comparison\"><span class=\"change-tag\">${escape(item.changeType)}</span><div class=\"version-pair\"><section><h4>Na versão 1</h4><p>${escape(item.before)}</p></section><section><h4>Na versão 2</h4><p>${escape(item.after)}</p></section></div></div>`;\n  }\n  function renderChapter(section) {")
replace_once('</p></header><div class="context-grid">', '</p>${section.reviewKind===\'legacy\'?\'<div class="version-actions"><a class="button" href="atelie-xuim-1.0.html" target="_blank" rel="noopener">Abrir versão 1 ↗</a><a class="button" href="atelie-xuim-2.0.html" target="_blank" rel="noopener">Abrir versão 2 ↗</a><span>Escolha o que recuperar ou adaptar. As plataformas não são alteradas aqui.</span></div>\':\'\'}</header><div class="context-grid">')
replace_once("const changes=answers.filter(a=>['change','remove'].includes(a.decision)).length;", "const changes=Object.entries(state.answers).filter(([id,a])=>proposesChange(id,a)).length;")
replace_once('marcações de mudança/remoção', 'recuperações, mudanças ou remoções')
replace_once("[{id:s.id,title:'Área inteira',question:s.question},...s.items]", "[{id:s.id,title:'Área inteira',question:s.question,reviewKind:s.reviewKind},...s.items]")
replace_once('escape(ReviewModel.choices[answer.decision])', 'escape(ReviewModel.choicesFor(item)[answer.decision])')
# Keep the existing storage key, edition, revision and every existing answer ID.
script_path.write_text(script, encoding='utf-8')

html_path = HERE / 'guide.html'
html = html_path.read_text(encoding='utf-8')
old = '<a class="button quiet" href="atelie-xuim-2.0.html"'
assert html.count(old) == 1
html = html.replace(old, '<a class="button quiet" href="#v1-mapa">V1 → V2</a>' + old)
html = html.replace('<option value="changes">Com mudança ou remoção</option>', '<option value="changes">Com mudanças propostas</option>')
html_path.write_text(html, encoding='utf-8')
