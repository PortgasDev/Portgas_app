// ==UserScript==
// @name         Amazon enxuta — produto, Keepa e SiteStripe
// @namespace    local.amazon-enxuta
// @version      1.0.1
// @description  Mantém o produto, a compra, o Keepa e o SiteStripe. Oculta anúncios, recomendações e o restante da página.
// @match        https://www.amazon.com.br/*
// @match        https://amazon.com.br/*
// @run-at       document-start
// @noframes
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(() => {
  'use strict';

  // A verificação adicional evita alterar buscas, carrinho, checkout e login.
  if (!/\/(?:dp|gp\/product|gp\/aw\/d)\/[A-Z0-9]{10}(?:[/?]|$)/i.test(location.pathname)) return;

  const MODE = 'data-amazon-enxuta';
  const PATH = 'data-amazon-enxuta-path';
  const KEEP = 'data-amazon-enxuta-keep';
  const CONTROL_ID = 'amazon-enxuta-controls';
  const STORAGE_KEY = 'amazonEnxutaAtiva';

  // Preserva os elementos originais: os eventos de compra e as extensões
  // continuam ligados aos mesmos nós. Os ancestrais também são preservados.
  const contentSelectors = [
    '#leftCol', '#centerCol', '#rightCol',
    '#desktop-breadcrumbs_feature_div', '#wayfinding-breadcrumbs_feature_div',
    '[id^="keepa"]', '[id^="Keepa"]',
    '[id^="amzn-ss-"]', '#nav-associates',
    '#sitestripe', '#siteStripe', '#sitestripe-container',
    `#${CONTROL_ID}`,
  ].join(',');

  const overlaySelectors = [
    '.a-popover', '.a-modal-scroller', '.a-modal',
    '.a-drawer', '.a-sheet', '.a-immersive-view', '#a-popover-lgtbox',
    '[role="dialog"]', '[role="alertdialog"]',
  ].join(',');
  const keepSelectors = `${contentSelectors},${overlaySelectors}`;

  const videoSelectors = [
    '#ive-videos-for-this-product-widget_feature_div',
    '#vftphero', '#ive-hero-video-player',
    '.VideosForThisProduct', '.vse-video-widget-container',
    '.video-js', '.vjs-modal-dialog',
  ].join(',');

  const unwantedSelectors = [
    // Os dois blocos riscados no print.
    '#heroQuickPromoContainer', '#universalHQP_feature_div',
    '#olpLinkWidget_feature_div', '#olp_feature_div',
    '#dynamic-aod-ingress-box',
    // Outros anúncios/recomendações que podem aparecer dentro das colunas.
    '[id^="ape_"]', '[id^="sp_detail"]', '[id^="sims-"]',
    '#amsDetailRightPBook-dramabot_feature_div',
    '#sponsoredProducts_feature_div', '#sponsoredProducts2_feature_div',
    '#similarities_feature_div', '#purchase-sims-feature',
    '#desktop-dp-ilm_feature_div_0', '#desktop-dp-lpo_feature_div_0',
    '#primeDPUpsellStaticContainerNPA', '#primeDPUpsellStaticContainer',
    '#followTheAuthor_feature_div', '#desktop-below-image-block_Books',
    '#desktop-below-image-block_Ebooks', '#kcpApp_feature_div',
    '#sellYoursHere_feature_div', '#newerVersion_feature_div',
    videoSelectors,
  ].join(',');

  let enabled = GM_getValue(STORAGE_KEY, true);
  let ready = false;
  let toggleButton;

  function keepElement(element) {
    if (!element.matches(contentSelectors)) {
      // Um player também usa role="dialog" para legendas e erros. Preservar
      // esse diálogo acabava reabrindo a seção inteira, deixando molduras pretas.
      if (element.closest(videoSelectors)) return;
      const insideProductPage = element.closest('#dp, #dp-container, #ppd, #dp-top');
      if (insideProductPage && !element.closest(contentSelectors)) return;
    }
    element.setAttribute(KEEP, '');
    if (element.parentElement?.closest(`[${KEEP}]`)) return;
    for (let parent = element.parentElement; parent && parent !== document.documentElement; parent = parent.parentElement) {
      // Dentro de uma região preservada, todos os descendentes já são visíveis.
      if (parent.hasAttribute(KEEP)) break;
      parent.setAttribute(PATH, '');
    }
  }

  function inspectTree(node) {
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_NODE) return;
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (/^(SCRIPT|STYLE|LINK|META)$/.test(node.tagName)) return;
      if (node.matches(keepSelectors)) keepElement(node);
      // Não é necessário vigiar cada alteração no gráfico ou na caixa de compra.
      if (node.parentElement?.closest(`[${KEEP}]`)) return;
    }
    node.querySelectorAll(keepSelectors).forEach(keepElement);
  }

  function updateMode() {
    document.documentElement.setAttribute(MODE, enabled && ready ? 'on' : 'off');
    if (toggleButton) {
      toggleButton.textContent = enabled ? 'Página completa' : 'Ativar modo enxuto';
      toggleButton.title = enabled ? 'Mostrar novamente todas as seções' : 'Mostrar somente produto, Keepa e SiteStripe';
    }
  }

  function toggleMode() {
    enabled = !enabled;
    GM_setValue(STORAGE_KEY, enabled);
    updateMode();
  }

  function activateWhenReady() {
    if (ready || !document.body || !document.getElementById('productTitle') || !document.getElementById('centerCol')) return;
    if (!document.getElementById('leftCol') && !document.getElementById('rightCol')) return;

    // Se a Amazon entregar um layout desconhecido ou uma página de erro,
    // a limpeza não é ativada: evita uma tela vazia.
    ready = true;
    const controls = document.createElement('div');
    controls.id = CONTROL_ID;
    toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.addEventListener('click', toggleMode);
    controls.append(toggleButton);
    document.body.append(controls);
    keepElement(controls);
    updateMode();
  }

  function start() {
    const style = document.createElement('style');
    style.id = 'amazon-enxuta-style';
    style.textContent = `
      /* Oculta os irmãos que não levam a nenhuma região preservada. */
      html[${MODE}="on"] [${PATH}]:not([${KEEP}]):not([${KEEP}] *) > :not([${PATH}]):not([${KEEP}]) {
        display: none !important;
      }
      /* Anúncios dentro das próprias colunas do produto. */
      html[${MODE}="on"] :is(${unwantedSelectors}):not([${PATH}]):not([${KEEP}]) {
        display: none !important;
      }
      html[${MODE}="on"] :is(#dp, #dp-container, #ppd) {
        margin-top: 0 !important;
        padding-top: 8px !important;
        padding-bottom: 16px !important;
      }
      html[${MODE}="on"] #keepaContainer {
        clear: both;
      }
      #${CONTROL_ID} {
        position: fixed; bottom: 12px; right: 12px; z-index: 9999;
        font: 12px/1.4 Arial, sans-serif;
      }
      #${CONTROL_ID} button {
        color: #fff; background: #232f3e; border: 1px solid #607080;
        border-radius: 18px; padding: 7px 12px; cursor: pointer;
        box-shadow: 0 2px 6px #0002; font: inherit;
      }
      #${CONTROL_ID} button:hover { background: #37475a; }
      #${CONTROL_ID} button:focus-visible { outline: 3px solid #ff9900; outline-offset: 2px; }
    `;
    (document.head || document.documentElement).append(style);
    inspectTree(document);
    activateWhenReady();

    // Sem polling, setInterval ou varreduras periódicas. Novos blocos do Keepa
    // e SiteStripe são reconhecidos mesmo se a extensão chegar depois da página.
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'attributes') inspectTree(record.target);
        else record.addedNodes.forEach(inspectTree);
      }
      activateWhenReady();
    });
    observer.observe(document.documentElement, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['id'],
    });
    GM_registerMenuCommand('Alternar Amazon enxuta / página completa', toggleMode);
  }

  if (document.documentElement) start();
  else {
    const bootstrap = new MutationObserver(() => {
      if (!document.documentElement) return;
      bootstrap.disconnect();
      start();
    });
    bootstrap.observe(document, { childList: true });
  }
})();
