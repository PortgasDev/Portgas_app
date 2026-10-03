# Blobs · laboratório de volume (protótipo local)

## Direção aprovada e decisões

Implementa a primeira proposta do vídeo analisado em `video-analysis-205805/analise.md`: receber uma silhueta orgânica e desenhar curvas internas para sugerir volume. O jogo está disponível como página independente e também integrado ao catálogo Treino do Olhar.

- Um HTML independente, `blobs.html`, com fontes, estilos e scripts incorporados. Sem chamadas de rede, conta ou servidor necessário para jogar.
- Identidade dos jogos: laboratório editorial de desenho, grafite, papel e vermelho Xuim; Barlow Condensed, DM Sans e IBM Plex Mono. A silhueta e os contornos desenhados são o foco. DFII: impacto 4 + contexto 5 + viabilidade 5 + desempenho 4 − risco 3 = 15.
- Níveis Fácil, Médio e Difícil variam as mudanças de direção e espessura da silhueta. Tutorial, Desafio clássico, Infinito e Desafio diário preservam os nomes dos jogos. Aqui as sessões são sem tempo e sem nota automática; o Clássico e o Diário oferecem seis formas.
- Uma silhueta não determina um volume único. Comparação com uma leitura possível, reversível, e autoavaliação em vez de pontuação geométrica. Esta decisão vem da análise do vídeo aprovada antes da implementação.
- Traços múltiplos, frente/verso (contínuo/tracejado), borracha por traço, desfazer/refazer e retomada do rascunho. Não há snap ou recorte que esconda erros do aluno.
- Histórico dos últimos seis estudos, exportação da imagem e gerador de folha com seis silhuetas para aula, exportável em SVG e impressão.
- Armazenamento local, limitado; falha ao salvar é informada. Sem upload. Caneta via Pointer Events, sem inferir articulação ou atribuir nota à pressão.
- Geometria gerada por uma linha central com espessura variável e extremidades arredondadas. Contornos de exemplo são ilustrações de uma interpretação, verificados para permanecer dentro da silhueta. Não são um gabarito universal de reconstrução 3D.

## Manutenção

Fontes/licenças vêm de `manual-xuim-art.html`; tokens/base visual de `olho-regua/style.css`; atalhos de `treino/shortcuts.js`. `build.cjs` gera a página independente `blobs.html`. O catálogo também incorpora essa página pelo script `.prototype-tools/treino/build.py`, mantendo o jogo funcional dentro do hub sem depender de uma navegação externa.

```powershell
node .prototype-tools/blobs/build.cjs
node .prototype-tools/blobs/validate.cjs
```

Testar: desenho/borracha/desfazer, rascunho após recarregar, diário determinístico, revisão sem nota, exportação e impressão; tamanho de tela grande e pequeno. A adequação pedagógica dos exemplos fica aberta à revisão do professor.

## Verificação desta versão

- `validate.cjs`: passou com 360 silhuetas; fechamento, enquadramento, ausência de cruzamentos e contornos de exemplo dentro da forma. Lint e testes de interação em jsdom passaram: cancelamento de gesto, borracha, desfazer/refazer, modos, retomada, notas, limite do histórico e falha de armazenamento.
- Navegador local: tutorial, traço com mouse, retomada após recarregar, guia de volume e folha de seis formas conferidos. Layout estreito conferido em viewport de 390 px, sem rolagem horizontal.
- PNG de 1800 × 1320 gerado no navegador e inspecionado em `export-verificado.png`. A prévia permite salvar pelo link ou pelo menu da imagem. A captura automática do evento de download não respondeu no navegador integrado; não foi usada como evidência de download concluído.
- Impressão disponível pela folha; saída em impressora física e uso com caneta real ainda não foram verificados.
- Publicação: a página independente e a integração com o catálogo foram preparadas para GitHub Pages.
