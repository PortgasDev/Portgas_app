# Ateliê Xuim Art 2.0

## Direção aprovada
O sketchbook é um espaço de conversa durante o processo. Não existe espera por uma próxima semana para receber orientação. Um estudo vincula exercício, imagens de processo, pedidos de ajuda, respostas, correções visuais e versões. Entregar para avaliação é uma ação explícita, distinta de compartilhar o processo.

## Decisões
- Preservar atelie-xuim.html e uma cópia 1.0; gerar atelie-xuim-2.0.html com fontes isoladas nesta pasta.
- Usar armazenamento separado para a 2.0. Migrar uma cópia dos registros 1.0 quando disponíveis no mesmo endereço, sem modificar a origem.
- Menus por intenção: Hoje, Aulas, Meu sketchbook/Alunos, Acompanhamento (professor), Ateliê. Avisos, conversas, calendário e relatórios são acessos contextuais.
- Um estudo tem um histórico cronológico e uma situação atual; novas imagens são versões do mesmo estudo. Um novo estudo é uma ação diferente.
- Pedidos de ajuda têm prioridade própria para o professor e não exigem imagem finalizada, nota ou XP.
- Anotações visuais são privadas ao estudo. Apresentar na aula e expor na galeria são ações distintas.
- Participação em uma mesa/aula persiste ao consultar materiais ou abrir estudos. Visualizar uma aula não entra automaticamente em um encontro.
- A identidade mantém grafite, papel claro nas imagens, vermelho Xuim e tipografia incorporada. A composição editorial coloca o desenho e a conversa em primeiro plano. DFII: impacto 4, adequação 5, viabilidade 5, desempenho 4, risco 3 = 15.

## Premissas
Protótipo individual, um HTML sem dependências de rede, usuários e presença simulados; mensagens e arquivos ficam neste navegador. Não há autenticação nem conexão entre computadores. Os controles de papel são uma prévia, não segurança de produção. Poucas turmas e dezenas de imagens reduzidas para testar o fluxo. Rascunhos, exportação e validação da restauração são necessários para preservar testes. Manutenção por fontes legíveis e gerador; artefato distribuível continua único.

## Validação esperada
Aluno abre exercício, envia dúvida de processo, professor responde sem avaliação, aluno vê a resposta e adiciona versão, entrega explicitamente, professor avalia; tudo no mesmo estudo. Recarregar mantém histórico e rascunho. Trocar aluno/turma não mistura conversas. Abrir sketchbook mantém mesa. Galeria exige publicação. Arquivo 1.0 permanece idêntico.

## Criação de personagem solicitada durante a implementação
- Primeiro acesso de cada aluno oferece um cadastro em três etapas: personagem, nickname/objetivo, conta e matrícula.
- Cinco Xuimzinhos SVG com detalhes visuais próprios. Personagem, nickname, objetivo e rascunho de cadastro persistem por aluno.
- Nickname é único na prévia. A identificação de matrícula permanece vinculada ao registro original, independente da assinatura pública.
- Google é uma identificação explicitamente simulada, sem OAuth. Asaas é um vínculo de matrícula explicitamente simulado, ajustável pelo professor, sem cobrança ou acesso externo.
- Perfil do professor reúne nome de matrícula, nickname, personagem, objetivo, estudos, presença, XP e estados dessas simulações. O aluno acessa a própria personalização.

## Validação executada — 19/09/2026
- Gerador e validador do HTML final: sintaxe JavaScript, IDs estáticos únicos, fontes/imagens incorporadas e ausência de dependências externas.
- Testes do modelo: processo → ajuda → resposta sem nota → imagem → entrega → orientação → revisão → conclusão; contagem de não lidas, agrupamento de versões e validação da cópia.
- Testes dos perfis: identidade estável, nickname único, rejeição de dados inválidos e estados de conexão explicitamente simulados.
- Navegador em localhost (dados de QA): criação de estudo sem imagem, pedido de ajuda, resposta do professor, anexos WebP em V1 e V2, rascunho após recarregar, traço na prancha de correção e envio de imagem, avaliação e leitura pelo aluno.
- Personagem Maré / LuaGrafite criado na QA, identificação Google simulada e vínculo Asaas ativo simulado visíveis ao professor.
- Mesa 2: mensagem persistiu ao abrir sketchbook e conversa de estudo. Sala e mapa mostraram a mesma conversa do encontro.
- Exportação JSON verificada no arquivo baixado; restauração validada no navegador com conversas, imagens e personagem preservados.
- Cadastro e conversa revisados em 390 × 844. Corrigida a rolagem externa causada por rótulo absoluto sem contexto de posicionamento.
- Hash SHA-256 original/1.0 preservado: 432941D7EAA947D78CE6A48950F71E6CA5263503EB1063FB1A48659A2FE1398E.

## Arquivos e execução
`atelie-xuim.html` e `atelie-xuim-1.0.html` permanecem na raiz; a nova entrega é `atelie-xuim-2.0.html`. Fontes da 2.0 estão isoladas nesta pasta.

Gerar: `python .prototype-tools/v2/build.py`

Validar: `python .prototype-tools/v2/validate.py`, `node .prototype-tools/v2/study-model.test.cjs` e `node .prototype-tools/v2/profiles.test.cjs`.

Armazenamento: `xuim-atelier-prototype-v2`. Na primeira abertura, copia os registros 1.0 disponíveis na mesma origem, preservando a chave anterior. Mudar entre arquivo local, localhost e 127.0.0.1 separa o armazenamento do navegador. Para levar os testes entre endereços, exporte e restaure a cópia.
