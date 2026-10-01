# Caderno de revisão da plataforma Xuim Art 2.0

Entregável independente: `C:\XuimArt Web\revisao-atelie-2.0.html`.

O usuário autorizou um guia separado para revisar o produto antes de implementar novas mudanças. A alternativa de comentários sobre elementos da própria plataforma fica para depois. Nenhum arquivo da plataforma foi alterado.

## Organização

- 33 áreas e 149 detalhes, com três percursos completos e comparação entre v1 e v2.
- Para cada área: propósito, caminho no protótipo, comportamento atual, interpretação a revisar e pergunta aberta.
- Marcação e comentário independentes por área/detalhe; não responder não equivale a aprovar. Não existe aprovação automática de todos os detalhes de uma área.
- Busca, filtros, índice responsivo, conexões entre assuntos, resumo e links de volta à resposta específica.
- Markdown parcial com contexto e respostas; cópia em texto; JSON para retomar depois.
- Armazenamento isolado `xuim-review-2.0-2026-09-20`. Não lê nem altera os dados da plataforma.
- Importação validada com prévia antes da substituição. Falha no armazenamento ou conflito entre abas mantém a sessão exportável e avisa o usuário.

## Direção visual

Caderno editorial de trabalho: grafite, papel claro, vermelho Xuim, títulos Barlow Condensed, leitura DM Sans e pequenos índices IBM Plex Mono. Fontes e licenças incorporadas do manual. Um assunto por vez, detalhes recolhidos e comentários opcionais. DFII: impacto 4 + adequação 5 + viabilidade 5 + desempenho 4 − risco 3 = 15.

## Fonte do conteúdo

Leitura de `.prototype-tools/v2/v2.js`, `v2-spaces.js`, `v2-profiles.js`, `management.js`, `app.js`, `atelier.js`, `prototype.html` e `DECISOES.md`, confrontada com os pedidos do usuário nesta conversa. Não presume que todas as decisões do arquivo DECISOES foram definidas pelo usuário. O guia identifica escolhas de implementação e lacunas, incluindo notas, ritmos, privacidade de sketchbooks, números de XP, versões de imagem e separação entre chat de mesa e de estudo.

## Gerar e validar

```powershell
python .prototype-tools/review/build.py
node .prototype-tools/review/validate.cjs
```

Validação automatizada: IDs estáveis, campos obrigatórios, links entre áreas, exportação parcial, texto multiline com caracteres especiais, preservação integral no round trip JSON, rejeição de cópias incompatíveis, sintaxe final, fontes/licenças incorporadas e hashes dos três HTMLs da plataforma preservados.

Validação no navegador em origem de QA (`localhost:8765`): marcação geral e comentário de detalhe; troca de área e recarga com respostas recuperadas; busca e filtro; resumo com texto literal seguro; copiar Markdown e conferir contexto/linhas; importar `qa-import.json`, prévia e retomada; voltar do resumo a um detalhe aberto; índice e comentário em viewport de celular, sem transbordamento horizontal; console sem erros.

Os cliques de download geraram a mensagem da aplicação, mas o navegador integrado não retornou evento de download nem um arquivo verificável na pasta Downloads do Windows. O conteúdo da exportação foi verificado pela cópia de texto e pelos testes de formato; a importação foi exercitada com a fixture local. Não declarar que arquivos baixados foram verificados. A ação de copiar feedback oferece um caminho adicional pela interface.

## Arquivos preservados

- `atelie-xuim.html` / `atelie-xuim-1.0.html`: SHA-256 `432941d7eaa947d78ce6a48950f71e6ca5263503eb1063fb1a48659a2fe1398e`.
- `atelie-xuim-2.0.html`: SHA-256 `391bfc69168d8556eb91cb02091b01ce4c58a2e8eeb24d5b49b1395429a6b02a`.

O HTML distribuído não carrega recursos externos; o link relativo para abrir a plataforma requer manter ambos na mesma pasta. As respostas não são gravadas dentro do HTML: exportar JSON para mover entre arquivo local, localhost, 127.0.0.1 ou navegadores.

## Complemento: o que ficou na versão 1

`legacy.json` acrescenta seis áreas e 30 detalhes ao catálogo durante o build, antes do Fechamento. `content.json`, a revisão do formato, a chave de armazenamento e todos os IDs anteriores são preservados. As cópias JSON anteriores continuam aceitas; nenhuma resposta antiga muda de significado.

Os itens comparativos mostram comportamento na v1, comportamento na v2 e tipo de diferença. As marcações desse complemento usam Quero recuperar / Quero adaptar / Pode ficar de fora / Quero discutir, tanto na tela como no resumo e no Markdown. As marcações dos assuntos anteriores continuam iguais. O filtro de mudanças também considera pedidos de recuperação da v1.

Comparação baseada nos módulos da v1 (`management.js`, `sketchbook.js`, `atelier.js`, `app.js` e navegação de `prototype.html`) e nos pontos substituídos por `initV2`, `renderNotebook`, `renderToday`, `renderInbox`, `configureV2Spaces` e `initProfiles`. Diferencia controles ausentes, fluxos alterados e recursos apenas movidos. Não trata código antigo ainda incorporado, mas fora do novo fluxo de navegação, como uma função acessível ao usuário.

Verificações adicionais: catálogo anterior integralmente preservado; importação de feedback antigo; novas decisões e contexto v1/v2 no Markdown; leitura de respostas antigas em localhost sem migração; marcação de recuperação e comentário de teste, resumo e cópia de texto; comparação legível no celular; console sem erros. Arquivos da plataforma seguem com os hashes anteriores.

`extend-legacy.py` documenta a edição pontual já aplicada à interface; não precisa ser executado novamente. O build normal usa apenas `build.py`.
