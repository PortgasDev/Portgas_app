# Trilha Xuim Art — 48 semanas

HTML independente solicitado pelo usuário para experimentar acompanhamento de semanas/módulos com uma trilha inspirada no Duolingo. O currículo fornecido contém seis módulos, 48 semanas e seis projetos com início/entrega.

## Direção e premissas

- Preservar todas as semanas na ordem fornecida. Ajustes apenas de acentuação, pontuação e erros evidentes de digitação; nenhuma aula ou exercício inventado.
- Tratar os números 1–48 como semanas de conteúdo, sem inventar datas ou bloquear acesso por cronograma.
- Trilha visual com caminho curvo, nós de estudo, marcos de projeto e entregas; todos os conteúdos acessíveis. Considerada e dispensada a imposição de bloqueios, vidas e sequências diárias: seriam regras pedagógicas não solicitadas.
- Conclusão manual, foco de estudo, marcação independente para revisitar e anotações por semana. Nenhuma conclusão equivale a enviar arte ou receber aprovação do professor.
- HTML local de uso individual, armazenamento isolado, exportação/restauração JSON e resumo em texto. Sem sincronização multiusuário nem alteração dos arquivos da plataforma/revisão.
- Escala fixa de 48 semanas e anotações de até 10 mil caracteres por semana. Alertar falhas de armazenamento e preservar a sessão exportável. Importação validada antes de substituir; proteger gravação contra conflitos entre abas.
- Manutenção por fontes nesta pasta, entregável único `trilha-xuim.html` na raiz.

Direção visual: mapa editorial sobre papel claro, interface grafite, vermelho Xuim, tipografia incorporada do manual e Xuimzinho do acervo. Um caminho por módulo para evitar uma página interminável; índice sempre acessível. Em telas estreitas, a semana abre numa janela; em desktop, num painel lateral. DFII: impacto 4 + contexto 5 + viabilidade 5 + desempenho 5 − risco 4 = 15.

Gerar: `python .prototype-tools/trilha/build.py`.
Validar: `node .prototype-tools/trilha/validate.cjs`.

Armazenamento: `xuim-trilha-48-semanas-v1`. As respostas do caderno e o estado do ateliê não são lidos nem escritos. Usar o mesmo navegador/endereço para retomar o armazenamento; exportar para mudar de origem.

## Verificação realizada

- Validação automatizada do currículo, progressão, reabertura, revisão independente, preservação de notas, rejeição de cópias incompatíveis, scripts incorporados e hashes dos três protótipos anteriores.
- Navegador: iniciar semana, anotar caracteres especiais, concluir, desmarcar e desfazer, marcar revisão, recarregar e recuperar notas, abrir projetos e saltar para suas semanas.
- Tela de 390 × 844: troca de módulo, leitura da trilha e janela da semana sem transbordamento horizontal. Títulos longos ajustados para compartilhar uma coluna ampla.
- Resumo copiado e conferido; importação de `qa-complete.json` pela interface confirmou as 48 conclusões, nota e revisão da semana 48. Nenhum erro de console observado.
- Download por Blob disponível; confirmação de gravação em disco depende do navegador. A cópia JSON em texto oferece alternativa independente do download.
- Dados de teste usados somente em localhost. A prévia entregue em 127.0.0.1 começa sem essas marcações.
