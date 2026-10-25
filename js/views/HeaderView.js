import { View } from '../core/View.js';

export class HeaderView extends View {
  constructor(el) {
    super(el);
    el.innerHTML = `
      <a href="#" class="brand" data-action="home">📖 <span>Página Viva</span></a>
      <input id="search" class="search" type="search" placeholder="Buscar por título, autor ou categoria" aria-label="Buscar livros">
      <button class="cart-btn" data-action="open-cart" aria-label="Abrir carrinho">
        🛒 <span class="cart-label">Carrinho</span> <span id="cart-count" class="badge">0</span>
      </button>`;
  }

  bind(h) {
    this.el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      e.preventDefault();
      if (a.dataset.action === 'home') h.onHome();
      if (a.dataset.action === 'open-cart') h.onOpenCart();
    });
    this.el.querySelector('#search').addEventListener('input', (e) => h.onSearch(e.target.value));
  }

  renderCount(n) {
    const badge = this.el.querySelector('#cart-count');
    badge.textContent = String(n);
    badge.classList.toggle('badge-on', n > 0);
  }
}
