# Olho de Régua · Xuim Art

Jogo independente para a semana 2 (observação), com ponto médio, reprodução de ângulos e comparação de proporções. Abra `C:/XuimArt Web/olho-de-regua.html` em um navegador. Não precisa instalar dependências para jogar.

## Identidade e decisões

Referência: `manual-xuim-art.html`, especialmente blocos 1, 3, 4 e 5. Paleta oficial, Barlow Condensed nos títulos, DM Sans na interface e IBM Plex Mono nos dados. Fontes e licenças do manual são incorporadas pelo build. A interface usa o nome textual “Xuim Art”; não redesenha o lettering nem improvisa uma assinatura compacta. Prancheta clara, navegação escura, vermelho para a ação principal e a tentativa, alvo preto tracejado. Não depende apenas de cores para comunicar a correção.

Direção: prancha de atelier com edição contemporânea. DFII: impacto 4 + adequação 5 + viabilidade 5 + desempenho 5 − risco de consistência 4 = 15. As relações geométricas são a evidência visual central. A interface segue os raios de 6/8 px e a escala de espaçamento do manual.

Sessão: nove exercícios, três de cada habilidade quando o foco é misto. Treino livre não tem limite de rodadas. Sem cronômetro. A revisão reutiliza o exercício e compara as duas tentativas; só a primeira entra na média. Recordes são separados por nível e foco e incluem apenas sessões completas. O resumo pode ser baixado como texto. Dados locais ficam na chave `xuim.olho-regua.sessions.v1`; não são sincronizados com a trilha do curso.

## Pontuação

Ponto médio: distância da marca até o meio, como porcentagem do segmento inteiro. Proporções: diferença de comprimento como porcentagem da referência inteira (não do alvo). Ângulos: diferença absoluta em graus. A pontuação cai quatro pontos por ponto percentual ou 2,5 pontos por grau, limitada a 0–100. Esse mapeamento é uma escolha de feedback do jogo, não uma avaliação validada da habilidade artística.

## Manutenção e validação

Edite `index.html`, `style.css`, `model.js` e `app.js`; depois execute:

```powershell
node .prototype-tools/olho-regua/build.cjs
node .prototype-tools/olho-regua/validate.cjs
```

O validador usa ESLint e JSDOM já presentes em `ferramentas/amazon-enxuta/node_modules`. Verifica 1.800 exercícios gerados, geometria, pontuação, sessões, revisões, armazenamento e exportação. A interface também deve ser conferida no navegador, inclusive em tela estreita.
