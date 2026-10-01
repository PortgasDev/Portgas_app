/* Geometry and assessment are independent of the interface. */
(function (root) {
  'use strict';
  const TYPES = ['midpoint', 'angle', 'ratio'];
  const META = {
    midpoint: {name: 'Divisões do segmento', verb: 'Encontre a divisão.', description: 'Marque a fração indicada, partindo de A em direção a B.'},
    angle: {name: 'Ângulos', verb: 'Reproduza a abertura.', description: 'Observe o ângulo de referência e ajuste a abertura do segundo ângulo.'},
    ratio: {name: 'Proporções', verb: 'Compare os comprimentos.', description: 'Ajuste o segundo segmento para a proporção indicada.'}
  };
  const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
  const mix = (a, b, t) => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
  const polar = (p, radius, degrees) => ({x: p.x + radius * Math.cos(degrees * Math.PI / 180), y: p.y + radius * Math.sin(degrees * Math.PI / 180)});
  function project(point, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    return clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy || 1));
  }
  function fractionWords([n,d]) {return {'1/1':'o mesmo comprimento','1/2':'a metade','1/3':'um terço','2/3':'dois terços','1/4':'um quarto','3/4':'três quartos','1/5':'um quinto','2/5':'dois quintos','3/5':'três quintos','4/5':'quatro quintos','5/4':'um inteiro e mais um quarto','3/2':'um inteiro e mais a metade','2/1':'o dobro'}[n+'/'+d] || n+' de '+d+' partes';}
  function describe(task) {
    if(task.type==='midpoint')return {verb:`Marque ${fractionWords(task.fraction)} do caminho.`,description:`Comece em A. Imagine ${task.fraction[1]} partes iguais e avance ${task.fraction[0]} ${task.fraction[0]===1?'parte':'partes'} em direção a B.`};
    if(task.type==='angle')return {verb:task.divide?'Faça uma abertura com metade desta.':'Copie esta abertura.',description:task.divide?'Imagine a abertura dividida em duas partes iguais. Reproduza uma dessas partes.':'Compare o espaço entre as duas linhas. A direção da base pode mudar.'};
    return {verb:`Faça uma linha com ${fractionWords(task.fraction)} da referência.`,description:'Observe a linha de cima. Ajuste a linha de baixo para o comprimento pedido, sem calcular.'};
  }
  function generate(type, level = 1, random = Math.random, previous = null) {
    if (!TYPES.includes(type)) throw new Error('Unknown exercise');
    const pick = values => values[Math.floor(random() * values.length)];
    if (type === 'midpoint') {
      const maxTilt = [12, 45, 70][level];
      const angle = (random() * 2 - 1) * maxTilt;
      const center = {x: 450 + (random() - .5) * 72, y: 310 + (random() - .5) * 24};
      const length = 430 + random() * 110;
      const options=level===0?[[1,2],[1,3],[2,3],[1,4],[3,4]]:[[1,2],[1,3],[2,3],[1,4],[3,4],[1,5],[2,5],[3,5],[4,5]];
      const fraction=pick(options.filter(([n,d])=>n/d!==previous?.target));
      return {type, level, fraction, a: polar(center, length / 2, angle + 180), b: polar(center, length / 2, angle), target: fraction[0]/fraction[1]};
    }
    if (type === 'angle') {
      const degrees = 25 + random() * [80, 115, 135][level];
      const base = -85 + random() * 25;
      const divide=previous?.type==='angle'?!previous.divide:random()<.5;
      return {type, level, degrees, base, divide, answerBase: level === 0 ? base : -135 + random() * 110, target: degrees / (divide?360:180)};
    }
    const options=level===0?[[1,2],[3,4],[1,1],[3,2]]:level===1?[[1,2],[2,3],[3,4],[5,4],[3,2]]:[[1,3],[2,5],[3,5],[4,5],[5,4],[3,2],[2,1]];
    const fraction = pick(options.filter(([n,d])=>!previous?.fraction||n/d!==previous.fraction[0]/previous.fraction[1]));
    const reference = Math.min(350 + random() * 170,560/(fraction[0]/fraction[1]));
    return {type, level, fraction, reference, maxLength: 600, target: reference * fraction[0] / fraction[1] / 600};
  }
  function assess(task, value) {
    if (value === null || !Number.isFinite(value)) return null;
    const guess = clamp(value);
    const delta = task.type === 'angle' ? (guess - task.target) * 180 : task.type === 'ratio' ? (guess - task.target) * task.maxLength / task.reference * 100 : (guess - task.target) * 100;
    const error = Math.abs(delta);
    return {guess, delta, error, unit: task.type === 'angle' ? '°' : '%', score: Math.round(clamp(1 - error / (task.type === 'angle' ? 40 : 25)) * 100)};
  }
  function plan(focus = 'mix', count = 9, random = Math.random) {
    if (focus !== 'mix') return Array.from({length: count}, () => focus);
    const list = Array.from({length: count}, (_, i) => TYPES[i % TYPES.length]);
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }
  function summarize(rounds) {
    const average = items => items.length ? Math.round(items.reduce((n, r) => n + r.result.score, 0) / items.length) : null;
    return {average: average(rounds), categories: TYPES.map(type => ({type, score: average(rounds.filter(r => r.task.type === type))}))};
  }
  function sanitizeHistory(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.filter(r => r && Number.isFinite(r.average) && r.average >= 0 && r.average <= 100 && [0, 1, 2].includes(r.level) && ['mix', ...TYPES].includes(r.focus) && typeof r.date === 'string' && Number.isFinite(Date.parse(r.date))).slice(-20);
  }
  const api = {TYPES, META, describe, fractionWords, clamp, mix, polar, project, generate, assess, plan, summarize, sanitizeHistory};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EyeCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
