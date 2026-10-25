import { View } from '../core/View.js';
import { fmt } from '../core/format.js';

const { brl, esc } = fmt;

export class CatalogView extends View {
  bind(h) {
    this.el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = Number(btn.dataset.id);
      if (btn.dataset.action === 'add') h.onAdd(id);
      if (btn.dataset.action === 'notify') h.onNotify(id);
    });
  }

  render({ books, query, coupons }) {
    const cards = books.map((b) => {
      const out = b.stock <= 0;
      const low = !out && b.stock <= 3;
      return `
        <article class="card ${out ? 'is-out' : ''}">
          <div class="cover" style="--hue:${b.hue}">
            <span class="cover-title">${esc(b.title)}</span>
            <span class="cover-author">${esc(b.author)}</span>
            ${out ? '<span class="ribbon">Esgotado</span>' : ''}
          </div>
          <div class="card-body">
            <span class="tag">${esc(b.category)}</span>
            <h3>${esc(b.title)}</h3>
            <p class="author">${esc(b.author)}</p>
            <p class="price">${brl(b.priceCents)} <small>em até 6x sem juros</small></p>
            ${low ? `<p class="stock-low">Restam apenas ${b.stock}</p>` : ''}
            ${out
              ? `<button class="btn btn-outline" data-action="notify" data-id="${b.id}">🔔 Avise-me quando chegar</button>`
              : `<button class="btn" data-action="add" data-id="${b.id}">Adicionar ao carrinho</button>`}
          </div>
        </article>`;
    }).join('');

    const couponChips = coupons.map((c) => `<code>${esc(c.code)}</code>`).join(' ');

    this.el.innerHTML = `
      <div class="hero">
        <h1>Boas leituras, com desconto.</h1>
        <p>Monte um carrinho com vários livros e pague um único frete — ou retire na loja física sem custo.</p>
        <p class="hero-coupons">Cupons para testar: ${couponChips}</p>
      </div>
      ${books.length
        ? `<div class="grid">${cards}</div>`
        : `<p class="empty">Nenhum livro encontrado para “${esc(query)}”.</p>`}`;
  }
}
