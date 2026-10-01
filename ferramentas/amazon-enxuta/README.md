# Amazon enxuta

Script local para Tampermonkey no Edge, voltado à Amazon.com.br.

Versão **1.0.1**: restringe a preservação de diálogos para que componentes internos de players e de outras seções inferiores não reabram blocos ocultos. Inclui exclusões para a seção de vídeos encontrada no produto 6525930324. A falha foi reproduzida com a inserção tardia de um diálogo de player; a sessão real do usuário não está acessível para confirmação.

Para atualizar, **substitua o conteúdo do script existente**, salve e recarregue a página. Não mantenha duas cópias ativas.

## Instalação

1. No Tampermonkey, abra **Criar novo script**.
2. Apague o exemplo e cole todo o conteúdo de `amazon-enxuta.user.js`.
3. Salve com **Ctrl+S** e recarregue uma página de produto da Amazon.
4. O botão **Página completa**, no canto inferior direito, permite desfazer a limpeza imediatamente. A preferência fica salva no Tampermonkey e vale para os próximos carregamentos.

Se o Tampermonkey avisar que scripts de usuário não estão permitidos, siga a orientação exibida pela extensão para sua versão do Edge. Referência oficial: https://www.tampermonkey.net/faq.php#Q209

Também é possível usar a opção de importação de arquivo na aba **Utilitários** do painel do Tampermonkey.

## O que fica

- SiteStripe e seus diálogos de geração de links.
- Foto, título, autor, nota, sinopse e dados resumidos, como ISBN e editora.
- Preço, parcelamento, cupom, variações, entrega, estoque, vendedor e caixa de compra.
- Keepa, inclusive quando aparece depois do carregamento inicial.
- Diálogos nativos necessários para interagir com o produto.

## O que sai da visualização

- Cabeçalho de busca e menus da Amazon, mantendo o SiteStripe.
- Anúncio abaixo da ficha e bloco externo de outros vendedores.
- Recomendações, conteúdo adicional abaixo do produto, avaliações completas e rodapé.

A sinopse e a ficha curta do topo continuam visíveis. Para consultar conteúdo abaixo do produto, como avaliações e a ficha completa, use **Página completa** antes de abrir esses detalhes.

## Escopo e decisões

A referência é a página do livro de ISBN-10 6525954355 e os dois prints fornecidos. O usuário priorizou limpar a página e preservar Keepa/SiteStripe. A solução mantém os nós originais e usa CSS reversível para evitar quebrar eventos, integrações e alvos usados pelas extensões. Layouts desconhecidos ficam sem limpeza, em vez de serem ocultados por engano.

Esta versão **não é um bloqueador de rede**. Ela não garante impedir downloads ou parar scripts da Amazon. Ocultar regiões pode evitar parte do trabalho de renderização e alguns carregamentos sob demanda; não há promessa de redução de RAM. O script não faz requisições, não coleta dados e não altera links de afiliado.

A Amazon e as extensões podem mudar seus elementos. Os seletores ficam reunidos no início do script para manutenção. O teste com HTML público não substitui conferir o funcionamento do SiteStripe e Keepa na sessão autenticada do usuário.

## Desenvolvimento

As dependências de desenvolvimento são opcionais e não são usadas pelo script no navegador. Execute `npm ci`, `npm run check`, `npm test` e `npm audit --audit-level=high` nesta pasta para repetir a validação. O arquivo HTML de referência, quando presente, é uma cópia pública obtida sem cookies da sessão do usuário.
