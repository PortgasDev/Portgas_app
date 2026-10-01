window.GM_getValue = (_key, fallback) => fallback;
window.GM_setValue = () => {};
window.GM_registerMenuCommand = () => {};
document.addEventListener('DOMContentLoaded', () => {
  const keepa = document.createElement('section');
  keepa.id = 'keepaContainer';
  keepa.style.cssText = 'clear:both;margin:24px 0;padding:40px;border:1px solid #d5d9d9;background:#f8fafc;color:#555;font:16px Arial';
  keepa.textContent = 'Keepa — área simulada inserida após o carregamento. O gráfico real depende da sua extensão.';
  document.getElementById('bottomRow').append(keepa);
  document.querySelectorAll('form').forEach(form => form.addEventListener('submit', event => event.preventDefault()));
});
