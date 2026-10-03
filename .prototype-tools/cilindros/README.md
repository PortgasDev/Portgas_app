# Construindo Cilindros · primeiro protótipo

Artefatos: `cilindros.html` (independente, offline) e acesso incorporado em `treino-do-olhar.html`.

## Intenção aprovada

Implementar primeiro os cilindros mostrados no vídeo `Gravando 2026-10-01 205805.mp4`, sobretudo 02:46–03:36. Blobs fica para outra etapa. O aluno envolve as extremidades da guia com elipses e conecta o volume com duas laterais. A revisão pode mostrar seções intermediárias. Não altera Linha & Corpo nem os três jogos existentes.

Identidade: laboratório editorial de desenho, papel claro e estrutura grafite, vermelho Xuim para o aluno, azul para as guias, verde para a referência, ocre para seções. Fontes e licenças incorporadas do manual da marca; base visual dos jogos existentes.

## Decisões desta versão

- Quatro partes selecionáveis; um gesto por parte. Novo gesto substitui só a parte ativa; desfazer recupera a anterior. Cancelamento de ponteiro restaura o traço anterior.
- Traço livre com eventos coalescidos; alternativa Forma / reta com três controles de elipse, centro arrastável e laterais retas. Sem ajuste automático do traço livre à solução.
- Fácil: projeção paralela, extremidades iguais. Médio: perspectiva e rotação no plano. Difícil: mais escorço e sobreposição. A exigência geométrica da correção é igual entre níveis.
- Tutorial sem tempo, apoio pontilhado, repetição da mesma construção. Clássico/Diário: seis cilindros, 90 segundos cada. Infinito: meta crescente e tempo de 90 a 45 segundos. Usa infraestrutura compartilhada, com opções de tempo que preservam os padrões dos outros jogos.
- Diário determinado por data local e dificuldade, três tentativas por dia/dificuldade, salvo localmente. Sem servidor ou classificação pública.
- As guias em I sozinhas não determinam uma elipse única. As marcas transversais de abertura foram adicionadas para tornar o alvo explícito. Sem elas seria inadequado tratar uma única construção como resposta universal.
- A guia comprida de cada extremidade representa o diâmetro maior da elipse projetada. As duas marcas curtas representam os extremos do diâmetro menor. A linha longitudinal corresponde à projeção do eixo do cilindro; os centros das elipses não são usados como substitutos dos centros projetados dos círculos.
- A revisão desenha o volume através das partes ocultas: é estudo de construção, sem remoção de linhas escondidas.

## Geometria e correção

Um cilindro circular reto 3D de raio 1, com duas seções circulares paralelas. No Médio/Difícil, ambas as elipses vêm de projeção pinhole. Reutiliza decomposição de cônica do módulo de elipses; não estima uma abertura arbitrária em pixels. As laterais são geratrizes onde a normal radial é ortogonal ao raio de visão e, portanto, tangenciam exatamente as duas elipses. Cortes intermediários usam a mesma câmera.

Cada parte vale 25% do resultado, inclusive partes ausentes (zero). Distâncias bidirecionais medem cobertura da referência e proximidade do traço; amostragem por comprimento de arco reduz dependência da frequência dos eventos. A combinação é uma média harmônica de proximidades gaussianas com sigma 5 unidades na prancha 900 × 560. Não existe faixa de acerto binária nem snap. Desvio médio exibido em proporção da largura da prancha. Laterais aceitam qualquer ordem.

Limites: a nota mede proximidade geométrica à referência, não pressão, fluidez, articulação, qualidade artística ou um diâmetro físico do tablet. O tutorial permite comparar construções incompletas, explicitando a penalidade. O traço não avança automaticamente de parte.

## Construir e conferir

```powershell
node .prototype-tools/cilindros/build.cjs
node .prototype-tools/cilindros/validate.cjs
python .prototype-tools/treino/build.py
node .prototype-tools/treino/validate.cjs
node .prototype-tools/treino/validate-modes.cjs
```

Validação numérica: 300 cilindros, pontos na cônica, tangentes comuns exatas, enquadramento, notas para traços completos/incompletos/deslocados e laterais invertidas. DOM: traçado completo, cancelamento, desfazer, ajuste, tutorial, cronômetro, sessão, recordes, sementes/limites diários e atalhos personalizados.

Validação no navegador: traço livre, desfazer, controles de elipse, duas laterais por arraste, avaliação (95/100 na tentativa manual), cortes, desktop e largura 390 px sem overflow horizontal. Screenshot: `preview-cilindros.png`. Sensibilidade e ergonomia com uma caneta física ainda dependem do teste do professor.

Backup anterior do hub: `.prototype-tools/treino/backups/treino-do-olhar-antes-cilindros.html`. Nenhum push ou publicação feito nesta etapa.
