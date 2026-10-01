'use strict';
const ReviewModel = (() => {
  const choices = { '': 'Sem decisão', keep: 'Faz sentido', change: 'Precisa mudar', remove: 'Não deveria existir', unsure: 'Ainda não decidi' };
  const legacyChoices = { '': 'Sem decisão', keep: 'Quero recuperar', change: 'Quero adaptar', remove: 'Pode ficar de fora', unsure: 'Quero discutir' };
  const choicesFor = item => item.reviewKind==='legacy' ? legacyChoices : choices;
  const hasAnswer = answer => !!answer && (!!answer.decision || !!answer.text?.trim());
  const keysFor = section => [section.id, ...section.items.map(item => item.id)];
  const count = (state, section) => keysFor(section).filter(id => hasAnswer(state.answers[id])).length;
  const blank = catalog => ({format:'xuim-review', schema:1, edition:catalog.edition, revision:catalog.revision, answers:{}, current:catalog.sections[0].id, updatedAt:null});
  function validate(data, catalog) {
    if (!data || data.format!=='xuim-review' || data.schema!==1 || data.edition!==catalog.edition || data.revision!==catalog.revision || !data.answers || typeof data.answers!=='object' || Array.isArray(data.answers)) throw new Error('Use uma cópia de feedback deste caderno 2.0. O backup da plataforma é outro arquivo.');
    const ids = new Set(catalog.sections.flatMap(keysFor));
    const result = blank(catalog);
    for (const [id, answer] of Object.entries(data.answers)) {
      if (!ids.has(id) || !answer || typeof answer!=='object' || !Object.hasOwn(choices, answer.decision) || typeof answer.text!=='string' || answer.text.length>20000) throw new Error('A cópia contém uma resposta incompatível. Nenhuma resposta atual foi substituída.');
      result.answers[id] = {decision:answer.decision, text:answer.text};
    }
    if (catalog.sections.some(s=>s.id===data.current) || data.current==='respostas') result.current=data.current;
    result.updatedAt=typeof data.updatedAt==='string'?data.updatedAt:null;
    return result;
  }
  function markdown(state, catalog) {
    const lines=['# Xuim Art — feedback da plataforma 2.0', '', `Guia: ${catalog.revision}. Exportado em ${new Date().toISOString()}.`, '', 'Respostas parciais são válidas. Itens ausentes ou sem decisão não estão aprovados. Uma resposta à área inteira não aprova seus detalhes.', '', 'Os textos “Hoje” e “Interpretação” documentam o protótipo revisado; as respostas do usuário vêm depois de cada pergunta.', ''];
    for (const section of catalog.sections) {
      if (!count(state,section)) continue;
      lines.push(`## ${section.title} [${section.id}]`, '', `Grupo: ${section.group}`, `Onde: ${section.path}`, '', `Propósito: ${section.purpose}`, '', `Hoje: ${section.current}`, '', `Interpretação a revisar: ${section.assumption}`, '');
      for (const item of [{id:section.id,title:'Área inteira',question:section.question,reviewKind:section.reviewKind},...section.items]) {
        const answer=state.answers[item.id];
        if (!hasAnswer(answer)) continue;
        lines.push(`### ${item.title} [${item.id}]`, '');
        if (item.description) lines.push(`Contexto: ${item.description}`, '');
        if (item.origin) lines.push(`Origem: ${item.origin}`, '');
        if (item.before) lines.push(`Na v1: ${item.before}`, '', `Na v2: ${item.after}`, '', `Diferença: ${item.changeType}`, '');
        lines.push(`Marcação: ${choicesFor(item)[answer.decision]}`, '', `Pergunta: ${item.question}`, '', 'Resposta do usuário:', '', answer.text.trim() || '(Somente a marcação; sem comentário.)', '', '---', '');
      }
    }
    if (!Object.values(state.answers).some(hasAnswer)) lines.push('Nenhuma resposta registrada ainda.', '');
    return lines.join('\n');
  }
  return {choices,choicesFor,hasAnswer,keysFor,count,blank,validate,markdown};
})();
if (typeof module!=='undefined') module.exports=ReviewModel;
