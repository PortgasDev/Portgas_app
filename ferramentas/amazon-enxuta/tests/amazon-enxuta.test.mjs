import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const source = readFileSync(new URL('../amazon-enxuta.user.js', import.meta.url), 'utf8');
const publicPages = ['amazon-reference.html', 'amazon-reference-6525930324.html'];
const fixture = `<!doctype html><html><head></head><body><div id="a-page">
  <header><div id="amzn-ss-new-site-stripe"><button id="affiliate-link">Obter link</button></div><nav id="navbar">Menu Amazon</nav></header>
  <div id="dp"><div id="dp-container">
    <div id="above-dp-container"><aside id="top-ad">Anúncio</aside><div id="desktop-breadcrumbs_feature_div">Livros</div></div>
    <div id="rightCol"><div id="buybox"><button id="add-to-cart-button">Adicionar ao carrinho</button></div><div id="olpLinkWidget_feature_div">Outros vendedores</div></div>
    <div id="leftCol"><img id="cover" alt="Capa"></div>
    <div id="centerCol"><h1 id="productTitle">Livro</h1><div id="price">25,94 <span class="a-popover-preload" style="display:none">Informação</span></div><div id="bookDescription_feature_div">Sinopse</div><div id="richProductInformation_feature_div">ISBN</div><div id="heroQuickPromoContainer">Patrocinado</div></div>
    <div id="bottomRow"><section id="unwanted-bottom">Mais produtos</section></div>
    <section id="customer-reviews_feature_div">Avaliações completas</section>
  </div></div><footer id="navFooter">Rodapé</footer>
</div></body></html>`;

function setup(html = fixture, path = '/dp/6525954355', enabled = true) {
  const dom = new JSDOM(html, { url: `https://www.amazon.com.br${path}`, runScripts: 'outside-only' });
  const values = new Map([['amazonEnxutaAtiva', enabled]]);
  dom.window.GM_getValue = (key, fallback) => values.get(key) ?? fallback;
  dom.window.GM_setValue = (key, value) => values.set(key, value);
  dom.window.GM_registerMenuCommand = () => {};
  dom.window.eval(source);
  return { dom, window: dom.window, document: dom.window.document, values };
}

function visible(window, selector) {
  let element = window.document.querySelector(selector);
  assert.ok(element, `Elemento existe: ${selector}`);
  for (; element; element = element.parentElement) {
    if (window.getComputedStyle(element).display === 'none') return false;
  }
  return true;
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

test('mantém produto, sinopse, ficha e eventos originais; oculta os dois blocos e a navegação', () => {
  const { dom, window, document } = setup();
  try {
    for (const selector of ['#cover', '#productTitle', '#price', '#bookDescription_feature_div', '#richProductInformation_feature_div', '#buybox', '#affiliate-link']) {
      assert.equal(visible(window, selector), true, selector);
    }
    for (const selector of ['#navbar', '#top-ad', '#heroQuickPromoContainer', '#olpLinkWidget_feature_div', '#customer-reviews_feature_div', '#navFooter']) {
      assert.equal(visible(window, selector), false, selector);
    }
    const buy = document.getElementById('add-to-cart-button');
    let clicks = 0;
    buy.addEventListener('click', () => { clicks += 1; });
    buy.click();
    assert.equal(clicks, 1);
    assert.equal(document.getElementById('add-to-cart-button'), buy);
  } finally { dom.window.close(); }
});

test('Keepa tardio aparece mesmo dentro de uma seção antes escondida', async () => {
  const { dom, window, document } = setup();
  try {
    const keepa = document.createElement('div');
    keepa.id = 'keepaContainer';
    keepa.innerHTML = '<iframe id="keepa" title="Gráfico Keepa"></iframe>';
    document.getElementById('bottomRow').append(keepa);
    await flush();
    assert.equal(visible(window, '#keepaContainer'), true);
    assert.equal(visible(window, '#keepa'), true);
    assert.equal(visible(window, '#unwanted-bottom'), false);
  } finally { dom.window.close(); }
});

test('SiteStripe tardio e seus diálogos são preservados; menu Amazon continua oculto', async () => {
  const { dom, window, document } = setup(fixture.replace(/<div id="amzn-ss-new-site-stripe">.*?<\/div>/, ''));
  try {
    const stripe = document.createElement('div');
    document.querySelector('header').prepend(stripe);
    await flush();
    stripe.id = 'amzn-ss-new-site-stripe';
    stripe.innerHTML = '<button>Obter link</button>';
    const portal = document.createElement('div');
    portal.innerHTML = '<div id="amzn-ss-link-dialog" role="dialog">Link de afiliado</div>';
    document.body.append(portal);
    await flush();
    assert.equal(visible(window, '#amzn-ss-new-site-stripe'), true);
    assert.equal(visible(window, '#amzn-ss-link-dialog'), true);
    assert.equal(visible(window, '#navbar'), false);
  } finally { dom.window.close(); }
});

test('diálogos nativos fora das colunas continuam disponíveis', async () => {
  const { dom, window, document } = setup();
  try {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = '<div class="a-modal-scroller"><div id="installments" role="dialog">Parcelas</div></div>';
    document.body.append(wrapper);
    await flush();
    assert.equal(visible(window, '#installments'), true);
  } finally { dom.window.close(); }
});

test('diálogo interno de player tardio não revela vídeos nem suas molduras abaixo do Keepa', async () => {
  const html = fixture.replace('<section id="customer-reviews_feature_div">', `
    <section id="ive-videos-for-this-product-widget_feature_div">
      <div id="video-card" style="background:black;min-height:390px"><div id="ive-hero-video-player"><video></video></div></div>
    </section><section id="customer-reviews_feature_div">`);
  const { dom, window, document } = setup(html);
  try {
    const keepa = document.createElement('div');
    keepa.id = 'keepaContainer';
    document.getElementById('bottomRow').append(keepa);
    // Players como Video.js inserem diálogos de legendas/erros após inicializar.
    const dialog = document.createElement('div');
    dialog.className = 'vjs-modal-dialog';
    dialog.setAttribute('role', 'dialog');
    document.getElementById('ive-hero-video-player').append(dialog);
    await flush();
    assert.equal(visible(window, '#keepaContainer'), true);
    assert.equal(visible(window, '#ive-videos-for-this-product-widget_feature_div'), false);
    assert.equal(visible(window, '#video-card'), false);
    assert.equal(visible(window, 'video'), false);
    document.querySelector('#amazon-enxuta-controls button').click();
    assert.equal(visible(window, '#video-card'), true);
  } finally { dom.window.close(); }
});

test('diálogo de outra seção inferior também não a libera; janelas de compra continuam disponíveis', async () => {
  const { dom, window, document } = setup();
  try {
    const below = document.createElement('section');
    below.id = 'lower-card';
    below.innerHTML = '<div role="dialog">Conteúdo auxiliar da seção</div>';
    document.getElementById('dp-container').append(below);
    const purchase = document.createElement('div');
    purchase.innerHTML = '<div id="purchase-popup" role="dialog">Parcelamento</div>';
    document.getElementById('rightCol').append(purchase);
    await flush();
    assert.equal(visible(window, '#lower-card'), false);
    assert.equal(visible(window, '#purchase-popup'), true);
  } finally { dom.window.close(); }
});

test('botão restaura todas as seções e salva a preferência, sem recarregar', () => {
  const { dom, window, document, values } = setup();
  try {
    const button = document.querySelector('#amazon-enxuta-controls button');
    button.click();
    assert.equal(visible(window, '#heroQuickPromoContainer'), true);
    assert.equal(visible(window, '#olpLinkWidget_feature_div'), true);
    assert.equal(visible(window, '#navFooter'), true);
    assert.equal(values.get('amazonEnxutaAtiva'), false);
    assert.equal(button.textContent, 'Ativar modo enxuto');
    button.click();
    assert.equal(visible(window, '#navFooter'), false);
  } finally { dom.window.close(); }
});

test('página incompleta permanece visível e ativa a limpeza quando o produto chega', async () => {
  const { dom, window, document } = setup('<html><body><div id="placeholder">Carregando</div></body></html>');
  try {
    assert.notEqual(document.documentElement.getAttribute('data-amazon-enxuta'), 'on');
    const shell = document.createElement('div');
    shell.innerHTML = '<div id="leftCol">Capa</div><div id="centerCol"><h1 id="productTitle">Livro</h1></div>';
    document.body.append(shell);
    await flush();
    assert.equal(document.documentElement.getAttribute('data-amazon-enxuta'), 'on');
    assert.equal(visible(window, '#productTitle'), true);
  } finally { dom.window.close(); }
});

test('não interfere em carrinho, login ou pesquisa; preferência desligada é respeitada', () => {
  for (const path of ['/gp/cart/view.html', '/ap/signin', '/s?k=livro']) {
    const { dom, document } = setup(fixture, path);
    assert.equal(document.getElementById('amazon-enxuta-style'), null);
    dom.window.close();
  }
  const { dom, window } = setup(fixture, '/livro/dp/6525954355/ref=teste', false);
  assert.equal(visible(window, '#navFooter'), true);
  dom.window.close();
});

for (const filename of publicPages) {
  const publicPage = new URL(`../${filename}`, import.meta.url);
  test(`HTML público mantém as colunas e oculta o restante: ${filename}`, { skip: !existsSync(publicPage) }, () => {
  const { dom, window, document } = setup(readFileSync(publicPage, 'utf8'));
  try {
    assert.equal(document.documentElement.getAttribute('data-amazon-enxuta'), 'on');
    for (const selector of ['#leftCol', '#centerCol', '#rightCol', '#productTitle', '#bookDescription_feature_div', '#richProductInformation_feature_div', '#desktop_buybox']) {
      assert.equal(visible(window, selector), true, selector);
    }
    for (const selector of ['#navbar', '#heroQuickPromoContainer', '#olpLinkWidget_feature_div', '#customer-reviews_feature_div', '#navFooter']) {
      assert.equal(visible(window, selector), false, selector);
    }
  } finally { dom.window.close(); }
  });
}
