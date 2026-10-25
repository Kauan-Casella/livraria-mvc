import { View } from '../core/View.js';
import { fmt } from '../core/format.js';

const { brl, esc } = fmt;

export class SuccessView extends View {
  bind(h) {
    this.el.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="continue"]')) h.onContinue();
    });
  }

  render(order, pickupAddress) {
    if (!order) { this.el.innerHTML = ''; return; }
    const t = order.totals;
    const items = order.items.map((i) => `
      <li><span>${i.qty}× ${esc(i.title)}</span><span>${brl(i.totalCents)}</span></li>`).join('');

    this.el.innerHTML = `
      <div class="panel success">
        <div class="check">✓</div>
        <h1>Pedido confirmado!</h1>
        <p class="muted">Número do pedido: <strong>${esc(order.id)}</strong></p>

        <ul class="order-items">${items}</ul>
        <dl class="summary">
          <div><dt>Subtotal</dt><dd>${brl(t.subtotalCents)}</dd></div>
          ${t.discountCents ? `<div class="discount"><dt>Desconto${order.couponCode ? ` (${esc(order.couponCode)})` : ''}</dt><dd>− ${brl(t.discountCents)}</dd></div>` : ''}
          <div><dt>Frete</dt><dd>${t.shippingCents ? brl(t.shippingCents) : 'Grátis'}</dd></div>
          <div class="total"><dt>Total</dt><dd>${brl(t.totalCents)}</dd></div>
        </dl>

        <p>💳 Cartão final <strong>${esc(order.cardLast4)}</strong> —
          <strong>${order.installments}x de ${brl(order.installmentCents)}</strong>${order.installments > 1 ? ' sem juros' : ' à vista'}</p>
        <p>${order.delivery === 'pickup'
          ? `🏬 Retire seu pedido na loja: ${esc(pickupAddress)}`
          : '🚚 Seu pedido será enviado para o endereço cadastrado.'}</p>

        <button class="btn" data-action="continue">Continuar comprando</button>
      </div>`;
  }
}
