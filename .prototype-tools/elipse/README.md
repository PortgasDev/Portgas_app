# Elipse em Perspectiva · Xuim Art

Jogo da semana 7: círculos em perspectiva. Artefato: `C:/XuimArt Web/elipse-perspectiva.html`, independente e offline.

Identidade extraída de `manual-xuim-art.html`: Barlow Condensed, DM Sans e IBM Plex Mono incorporadas, paleta oficial e organização de prancha clara com interface escura. Compartilha a folha de estilo base do Olho de Régua durante o build; o arquivo final não depende de outros arquivos.

## Construção

Um círculo unitário e seu quadrado circunscrito são transformados pela mesma homografia. A base usa projeção paralela. Perspectiva e escorço usam uma câmera pinhole. A cônica é obtida por `H^-T diag(1,1,-1) H^-1`, decomposta em centro, eixos e rotação. Os pontos de contato são projetados a partir do plano; não são calculados como os meios das arestas da imagem. A correção mostra o círculo projetado; as diagonais marcam o centro do quadrado, que pode diferir do centro da elipse.

Traço livre: uma curva por tentativa. Curvas que terminam a menos de 24 unidades lógicas do início são fechadas automaticamente. Elipse ajustável: centro, dois eixos e rotação, com alças, controles e teclado. Undo mantém até 40 estados. A revisão não troca a primeira tentativa no resumo.

Pontuação: proximidade bidirecional entre amostras do desenho e segmentos do alvo, tolerância gaussiana de 10 unidades no espaço de 900 × 620. A média harmônica combina cobertura e precisão. A nota é uma orientação geométrica, não uma avaliação pedagógica validada.

## Fluxos

Sessão de seis rodadas ou treino sem limite. Recordes de sessões completas separados por nível, guardados em `xuim.elipse.best.v1`. Resumo com miniaturas das últimas seis primeiras tentativas e download textual de todas as rodadas. Não sincroniza automaticamente com a trilha de semanas.

```powershell
node .prototype-tools/elipse/build.cjs
node .prototype-tools/elipse/validate.cjs
```

O validador usa ESLint e JSDOM existentes no workspace. Testa geometria de 300 projeções, contato com os lados, decomposição da cônica, pontuação e os fluxos da interface. Conferir também desenho real, alças e layout responsivo no navegador.
