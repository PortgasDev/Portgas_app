# Ateliê Xuim Art — protótipo local

## Pedido e direção adotada

HTML único para testar uma plataforma de aulas de desenho. A identidade vem de `manual-xuim-art.html`; o contexto funcional vem da tarefa “Analisar totalmente o Galdrabok” e das guias locais do projeto. A primeira versão priorizou sala de aula e desenho. A expansão de 18/09/2026 acrescenta **gestão e evolução integradas**, por pedido do usuário, preservando a sala, os canais e a convivência no mesmo arquivo.

Direção visual: ateliê digital escuro, tipografia editorial condensada, prancha clara central. Grafite `#121214`, vermelho `#de2246`, papel `#f5f3f0`, Barlow Condensed, DM Sans e IBM Plex Mono do manual. Logo, personagem e desenhos reaproveitados do acervo fornecido, com identificação da autoria. DFII interno: 14 (impacto 4, adequação 5, viabilidade 4, desempenho 4, risco de inconsistência 3).

## Decisões

- HTML, CSS e JavaScript nativos, fontes e imagens incorporadas: abrir diretamente no navegador, sem instalação, CDN ou conexão. Framework e servidor de aplicação seriam desnecessários nesta etapa.
- Professor inicia pela visão geral; aluno, pela jornada. A prancha de desenho, referências, exportação PNG e conversa continuam na sala.
- Um só conjunto de registros liga turma, matrícula, aula, tarefa, etapa, estudo, versão, avaliação e presença. A gestão não é uma extensão separada: preparar uma tarefa abre seu espaço no sketchbook de cada aluno da turma.
- Sketchbook individual por artista, com tarefa atual, etapas conforme ritmo, percurso completo e referências. O upload recebe o contexto de tarefa/etapa; revisões preservam as tentativas e os comentários anteriores. A fila de avaliação exibe a última versão de cada estudo.
- O professor pode abrir a entrega na prancha, desenhar a orientação e anexar a correção ao estudo, preservando a imagem original. Alunos consultam a orientação e enviam uma nova versão pelo mesmo lugar.
- XP das avaliações considera a última versão avaliada de cada estudo. Alterar uma avaliação substitui seu valor. Prática marcada acrescenta 20 XP por etapa válida; bases de XP do cenário são identificadas como demonstração.
- Aulas regulares concluídas após a matrícula compõem a presença. Registros justificados e ainda não lançados são excluídos do denominador. Extras, monitorias e pausas não avançam a numeração das aulas regulares; mudar uma data não reagenda outras aulas automaticamente.
- Duas turmas iniciais têm registros separados. Turmas, matrículas, cronograma e tarefas podem ser criados e editados. Matrículas podem ser arquivadas. O cenário de demonstração usa explicitamente 18/09/2026 como data de referência.
- Exportação e restauração JSON incluem os registros locais, imagens enviadas e correções. O HTML continua sendo o único arquivo necessário para executar a plataforma; o JSON é uma cópia opcional dos testes.
- Estrutura de canais inspirada no Discord; estúdio 2D com avatar e proximidade local inspirado no Gather; ritmos de prática, XP, trilha e acompanhamento inspirados no Galdrabok.
- Turma, mensagens iniciais e indicadores são demonstrações identificadas. Os desenhos de referência são obras do acervo Xuim Art, não entregas reais de alunos fictícios.
- Prancha, mensagens, tarefas, uploads e comentários usam armazenamento local. Mudança de navegador/endereço separa os dados. Falha de armazenamento mantém as alterações apenas em memória e informa o usuário.
- Novos traços usam coordenadas relativas ao desenho para acompanhar mudanças de tamanho da referência.
- Professor/Aluno é uma troca de perspectiva visual, sem autenticação ou controle de acesso de produção.
- Sem integração, publicação ou dados privados reais. Áudio, vídeo, compartilhamento, presença e participantes são simulados. Um produto multiusuário exigirá backend, autenticação e transporte de áudio/vídeo.

## Escopo e premissas

Uso individual para experimentação e revisão. Até 15 estudos locais, imagens de até 8 MB convertidas para cópias com maior lado de 1.400 pixels; originais devem ser preservados pelo usuário. A gravação depende da disponibilidade e da capacidade de armazenamento do navegador. Sem requisitos de disponibilidade de serviço nesta fase. A manutenção do protótipo pode ocorrer no HTML final; os arquivos desta pasta permitem regenerá-lo a partir do manual.

## Montagem e checagem

`python .prototype-tools/build.py` monta `atelie-xuim.html`. O manual existente é somente lido.

`python .prototype-tools/validate.py` valida o arquivo final: JavaScript incorporado, IDs estáticos únicos, ausência de recursos externos e resolução dos marcadores de montagem.

Validações: sintaxe JavaScript; IDs estáticos; imagens com texto alternativo; ausência de dependências externas; navegador em desktop e telas de 390 e 320 pixels; navegação, desenho, persistência após recarregar, exportação PNG, troca de referência, upload local, comentários escapados, mensagem local, ritmos, tarefas/XP, avatar, interface de professor/aluno e chat móvel. Testes adicionais usam `localhost`, separado da prévia em `127.0.0.1`, para não compartilhar seu armazenamento.

Expansão de gestão verificada no navegador: avaliação com pedido de revisão, envio da versão 2 pelo aluno, histórico de ambas as versões, aprovação pelo professor, XP 900 → 920 → 1.000 (a revisão de 100 substitui a de 20), atualização da mesma avaliação sem duplicar XP, anotação desenhada e anexada, alternância entre original/correção, chamada da aula 9 atualizando presença de 84% para 86%, criação de turma/matrícula/aula/tarefa e aparição automática das duas etapas no novo sketchbook. Exportação JSON e restauração foram verificadas, inclusive após recarregar a página. Sketchbook e calendário foram inspecionados a 320 px; visão geral e sketchbook a 390 px, sem transbordamento horizontal da página. O atalho de aula sem tarefa abre a preparação com a aula correta selecionada.

Limite da verificação: o navegador de automação permite a prévia HTTP local, mas bloqueia navegação em `file://`. A portabilidade foi verificada estruturalmente; a abertura direta por duplo clique não foi automatizada. Os testes de turma e avaliação ficam no armazenamento de QA (`localhost`), separado da prévia do usuário (`127.0.0.1`).

## Ateliê virtual 2D — 19/09/2026

O usuário pediu continuar a experiência inspirada no Gather e escolheu explicitamente um estúdio visto de cima, com avatares e mobiliário. Também sinalizou ruído visual na expansão anterior. A direção adotada foi concentrar a experiência em um mapa ilustrado com uma única área contextual, evitando acrescentar painéis de gestão ao espaço.

Direção visual: oficina acolhedora, planta 2D e personagens pixelados, emoldurados pela identidade grafite/vermelho existente. Tipografia do manual preservada. Piso em madeira, tapetes verdes apagados e móveis em tons terrosos ajudam a distinguir ambientes. DFII 14: impacto 4, adequação 5, viabilidade 5, desempenho 4, risco 4. Planta e sprites feitos em SVG/CSS, incorporados ao HTML; não há novas dependências ou imagens externas.

Decisões funcionais:

- Quatro ambientes: sala de aula, mesas de estudo, galeria e café, ligados por portas e corredores. A alternativa de uma planta abstrata foi descartada pela escolha do usuário.
- Teclado contínuo (setas/WASD), clique com cálculo de caminho e botões de direção no celular. Geometria comum à cena e ao motor de colisão; o avatar contorna paredes e móveis. Escape interrompe o caminho. A câmera acompanha o avatar quando necessário; zoom e localização estão disponíveis.
- Proximidade exige distância menor que 112 unidades e o mesmo ambiente. Avatares refletem alunos da turma, com professor presente na perspectiva do aluno. O aluno selecionado não se duplica entre os colegas. Até oito colegas e o professor são representados para manter a cena legível.
- A sala abre a aula ativa; as mesas abrem o sketchbook da turma/aluno; obras avaliadas aparecem na galeria, com autoria e acesso contextual. Comentários privados de avaliação não são exibidos no mural da galeria.
- Conversas locais ficam separadas por turma e ambiente. Nenhuma resposta é inventada em nome dos participantes. Personalização do avental, estado, aceno e posição ficam no estado do protótipo. Posições são separadas por turma e perspectiva.
- O professor pode reunir os avatares da demonstração na aula e liberá-los. Isso não lança presença nem representa convocação a pessoas reais. Não há transporte de áudio/vídeo, rede ou autenticação nesta etapa.
- Estado do ateliê incluído no backup existente; backups anteriores continuam aceitos. Reunir/liberar, salas e destinos são escolhas locais e reversíveis.

Arquivos-fonte: `atelier-world.js` (geometria e caminhos), `atelier.js` (interação e integração), `atelier.css` (cena e interface), incorporados pelo build ao mesmo `atelie-xuim.html`.

Verificação: `node .prototype-tools/atelier-world.test.cjs` cobre 100 rotas entre ambientes, destinos sobre móveis, colisão com mesa/limites e deslocamento contínuo a partir de posições fora da grade. Navegador: circulação real, proximidade com Lia, abertura da aula e sketchbook, conversa com caracteres HTML tratados como texto, separação de conversa por ambiente, abertura de obra pela parede, galeria, reunir turma, troca professor/aluno, cor/estado persistentes, toques rápidos no teclado, troca de turma, controles móveis e layouts a 390 e 320 px sem transbordamento horizontal. Console sem erros ou avisos nos fluxos verificados.

Backup do ateliê verificado em ida e volta pelo navegador: avental azul, estado Desenhando, posições por perspectiva e conversa do café restaurados. A checagem móvel identificou e corrigiu textos acessíveis fora do contêiner: a página agora mantém exatamente a altura/largura do viewport, com rolagem apenas na área de conteúdo e no mapa.
