import { View } from '../core/View.js';
import { fmt } from '../core/format.js';

const { esc } = fmt;

// Painel de demonstração: simula a reposição de estoque e mostra os e-mails "enviados".
export class DemoView extends View {
  constructor(el) {
    super(el);
    this.isOpen = false;
    el.addEventListener('toggle', (e) => {
      if (e.target.tagName === 'DETAILS') this.isOpen = e.target.open;
    }, true);
  }

  bind(h) {
    this.el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'restock') h.onRestock(Number(btn.dataset.id));
      if (btn.dataset.action === 'reset') h.onReset();
    });
  }

  render({ soldOut, outbox }) {
    const restock = soldOut.length
      ? soldOut.map((s) => `
          <li>
            <span>${esc(s.book.title)} <small class="muted">(${s.waiting} na lista de espera)</small></span>
            <button class="btn btn-outline btn-sm" data-action="restock" data-id="${s.book.id}">Repor 5 unidades</button>
          </li>`).join('')
      : '<li class="muted">Nenhum livro esgotado.</li>';

    const mails = outbox.length
      ? outbox.map((m) => `<li>📧 para <strong>${esc(m.to)}</strong> — ${esc(m.subject)}</li>`).join('')
      : '<li class="muted">Nenhum e-mail enviado ainda.</li>';

    this.el.innerHTML = `
      <details ${this.isOpen ? 'open' : ''}>
        <summary>🧪 Painel de demonstração</summary>
        <h4>Repor estoque (dispara avisos da lista de espera)</h4>
        <ul class="demo-list">${restock}</ul>
        <h4>Caixa de saída (simulada)</h4>
        <ul class="demo-list">${mails}</ul>
        <button class="link" data-action="reset">Resetar dados da demonstração</button>
      </details>`;
  }
}
