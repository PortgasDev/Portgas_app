# Treino do Olhar — Xuim Art

Entregável: `C:\XuimArt Web\treino-do-olhar.html`. Página de entrada e três modalidades incorporadas no mesmo arquivo, sem CDN, API ou instalação. Os jogos são carregados sob demanda. Ao confirmar uma troca, a modalidade anterior é removida, encerrando seus temporizadores e eventos. Cancelar mantém a rodada atual.

## Escolhas confirmadas

- Olho de Régua: **aquecimento**, com ponto médio, ângulos e proporções, conforme resposta explícita do usuário. A versão de comparação de objetos não foi incluída nem alterada.
- Cubo: tema Xuim, referência clara, desenho vermelho e correção azul. Arestas pontilhadas nos dois aquecimentos clássicos e no treino livre. Botão para mostrar/ocultar; sem pontilhado nas rodadas valendo recorde. Aquecimentos não entram no resultado da sessão.
- Referência do cubo corrigida: o ponto usa o vértice projetado compartilhado por três arestas-alvo, em vez de uma indicação de direção aproximada. A correção marca somente os sete vértices visíveis, omitindo o vértice oculto. Invariantes conferidos em 500 orientações.
- Elipse: exercício existente, traço livre e forma ajustável, integrado à mesma navegação.
- Nenhuma pontuação global inventada: cada exercício preserva sua própria avaliação, recordes e regras.
- Armazenamento mantém as chaves existentes dos jogos. A entrada guarda somente a última modalidade (`xuim.treino.last.v1`). Abrir em outro navegador ou endereço usa outro armazenamento; não há sincronização de contas.
- Configuração de atalhos começa recolhida para manter a entrada compacta; ao abrir, os nove comandos aparecem em duas colunas no desktop e uma coluna no celular. A edição e a restauração continuam locais.

## Direção visual

Laboratório editorial de desenho, seguindo a página pública https://xuimart.com.br/desafios/ consultada em 30/09/2026. Grafite, vermelho Xuim, títulos Barlow Condensed e texto DM Sans. Papel claro e diagramas de construção como elemento reconhecível. DFII: impacto 4 + adequação 5 + viabilidade 5 + desempenho 4 − risco 3 = 15. Fontes, licenças e marca incorporadas; composição responsiva com três modalidades lado a lado no computador e empilhadas no celular.

## Manutenção

Os arquivos em `originais/` são cópias anteriores a esta alteração. O cubo agora tem fontes de manutenção em `../cube/index.html`, `theme.css` e `build.py`. Os outros jogos continuam com seus geradores existentes.

Gerar em sequência, na raiz do projeto:

```
python .prototype-tools/cube/build.py
node .prototype-tools/olho-regua/build.cjs
node .prototype-tools/elipse/build.cjs
python .prototype-tools/treino/build.py
```

Validar:

```
node .prototype-tools/cube/validate.cjs
node .prototype-tools/olho-regua/validate.cjs
node .prototype-tools/elipse/validate.cjs
node .prototype-tools/treino/validate.cjs
```

O validador do Olho de Régua apontava para a versão comparativa por causa do nome antigo. Corrigido para validar `olho-de-regua-aquecimento.html`.

## Verificação

- Geometria: 500 cubos, 1.800 exercícios de observação e 300 projeções de elipses; notas, limites e registros existentes verificados.
- Integração: scripts incorporados compilados, três modalidades presentes, cancelamento e confirmação de saída, remoção do iframe anterior, retorno à entrada e última modalidade.
- Navegador: traço real sobre o pontilhado do cubo, avaliação e correção; sessão do Olho de Régua com resposta e feedback; elipse ajustável e avaliação; navegação entre as três.
- Tela de 390 × 844: entrada sem rolagem horizontal, controles do cubo e alternância de pontilhado. Nenhum erro de console observado nos testes de navegação.
- Sem teste em aparelho físico ou publicação remota.

## Publicação sugerida

Esta entrega é local. Para disponibilizar no site, hospedar o HTML único como `index.html` em uma rota própria, por exemplo `/treinos/`, e adicionar um link “Treino do olhar” na página de desafios. O arquivo já contém links de volta aos desafios criativos. Não é necessário enviar os outros três HTML junto do arquivo unificado.

Se o site usa um CMS, servir o arquivo como página estática ou incorporá-lo com iframe; não colar o documento inteiro em um editor que remova scripts. A política de segurança do host precisa permitir os scripts/estilos incorporados e o iframe `srcdoc` do próprio documento. Nenhuma configuração do servidor foi alterada.

A rodada atual permanece apenas na memória. O diálogo de troca explica que ela será encerrada; os registros que cada jogo já salvou permanecem. Atualizar/fechar a página também encerra o exercício atual.
