import { View } from '../core/View.js';
import { fmt } from '../core/format.js';

const { brl, esc } = fmt;

export class CheckoutView extends View {
  bind(h) {
    this.el.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="back"]')) h.onBack();
    });
    this.el.addEventListener('submit', (e) => {
      if (!e.target.matches('[data-form="payment"]')) return;
      e.preventDefault();
      h.onPay(this._readForm());
    });
    // Máscaras são apenas formatação visual (apresentação).
    this.el.addEventListener('input', (e) => {
      const t = e.target;
      if (t.name === 'number') {
        t.value = t.value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
      } else if (t.name === 'expiry') {
        const d = t.value.replace(/\D/g, '').slice(0, 4);
        t.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
      } else if (t.name === 'cvv') {
        t.value = t.value.replace(/\D/g, '').slice(0, 4);
      }
    });
  }

  _readForm() {
    const f = this.el.querySelector('[data-form="payment"]').elements;
    return {
      number: f.number.value,
      name: f.name.value,
      expiry: f.expiry.value,
      cvv: f.cvv.value,
      installments: Number(f.installments.value),
    };
  }

  setProcessing(on) {
    const btn = this.el.querySelector('[data-submit]');
    if (!btn) return;
    btn.disabled = on;
    btn.textContent = on ? 'Processando pagamento…' : btn.dataset.label;
  }

  render({ lines, totals, delivery, coupon, options, errors, values, pickupAddress }) {
    const err = (k) => (errors[k] ? `<span class="field-err">${esc(errors[k])}</span>` : '');
    const v = values || {};
    const selected = Number(v.installments) || 1;

    const items = lines.map((l) => `
      <li><span>${l.qty}× ${esc(l.book.title)}</span><span>${brl(l.totalCents)}</span></li>`).join('');

    const optionsHtml = options.map((o) => `
      <option value="${o.n}" ${o.n === selected ? 'selected' : ''}>
        ${o.n}x de ${brl(o.perCents)} ${o.n === 1 ? '(à vista)' : 'sem juros'}
      </option>`).join('');

    const label = `Pagar ${brl(totals.totalCents)}`;

    this.el.innerHTML = `
      <button class="link back" data-action="back">← Voltar às compras</button>
      <h1>Pagamento</h1>
      <div class="checkout">
        <form class="panel" data-form="payment" novalidate>
          <h2>Cartão de crédito</h2>
          <p class="muted small">Ambiente de demonstração — use <code>4111 1111 1111 1111</code>, qualquer nome, validade futura e CVV com 3 dígitos.</p>

          <label class="field">Número do cartão
            <input name="number" inputmode="numeric" autocomplete="off" placeholder="0000 0000 0000 0000" value="${esc(v.number || '')}" class="${errors.number ? 'invalid' : ''}">
            ${err('number')}
          </label>
          <label class="field">Nome impresso no cartão
            <input name="name" autocomplete="off" placeholder="COMO NO CARTÃO" value="${esc(v.name || '')}" class="${errors.name ? 'invalid' : ''}">
            ${err('name')}
          </label>
          <div class="row">
            <label class="field">Validade
              <input name="expiry" inputmode="numeric" autocomplete="off" placeholder="MM/AA" value="${esc(v.expiry || '')}" class="${errors.expiry ? 'invalid' : ''}">
              ${err('expiry')}
            </label>
            <label class="field">CVV
              <input name="cvv" inputmode="numeric" autocomplete="off" placeholder="123" value="${esc(v.cvv || '')}" class="${errors.cvv ? 'invalid' : ''}">
              ${err('cvv')}
            </label>
          </div>
          <label class="field">Parcelamento
            <select name="installments">${optionsHtml}</select>
          </label>
          <button class="btn btn-block" type="submit" data-submit data-label="${esc(label)}">${esc(label)}</button>
        </form>

        <aside class="panel">
          <h2>Resumo do pedido</h2>
          <ul class="order-items">${items}</ul>
          <dl class="summary">
            <div><dt>Subtotal</dt><dd>${brl(totals.subtotalCents)}</dd></div>
            ${totals.discountCents ? `<div class="discount"><dt>Desconto${coupon ? ` (${esc(coupon.code)})` : ''}</dt><dd>− ${brl(totals.discountCents)}</dd></div>` : ''}
            <div><dt>Frete</dt><dd>${totals.shippingCents ? brl(totals.shippingCents) : 'Grátis'}</dd></div>
            <div class="total"><dt>Total</dt><dd>${brl(totals.totalCents)}</dd></div>
          </dl>
          <p class="muted small">${delivery === 'pickup'
            ? `🏬 Retirada na loja: ${esc(pickupAddress)}`
            : '🚚 Entrega em casa'}</p>
        </aside>
      </div>`;
  }
}
