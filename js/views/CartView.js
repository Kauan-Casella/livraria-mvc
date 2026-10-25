import { View } from '../core/View.js';
import { fmt } from '../core/format.js';

const { brl, esc } = fmt;

export class CartView extends View {
  constructor(el, overlay) {
    super(el);
    this.overlay = overlay;
  }

  bind(h) {
    this.overlay.addEventListener('click', () => h.onClose());
    this.el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = Number(btn.dataset.id);
      switch (btn.dataset.action) {
        case 'close-cart': h.onClose(); break;
        case 'inc': h.onInc(id); break;
        case 'dec': h.onDec(id); break;
        case 'remove': h.onRemove(id); break;
        case 'remove-coupon': h.onRemoveCoupon(); break;
        case 'checkout': h.onCheckout(); break;
        default: break;
      }
    });
    this.el.addEventListener('submit', (e) => {
      if (e.target.matches('[data-form="coupon"]')) {
        e.preventDefault();
        h.onApplyCoupon(e.target.elements.code.value);
      }
    });
    this.el.addEventListener('change', (e) => {
      if (e.target.name === 'delivery') h.onDelivery(e.target.value);
    });
  }

  render({ open, lines, totals, coupon, couponMsg, delivery, shippingCents, pickupAddress }) {
    this.el.classList.toggle('open', open);
    this.el.setAttribute('aria-hidden', String(!open));
    this.overlay.hidden = !open;

    const head = `
      <div class="drawer-head">
        <h2>Seu carrinho</h2>
        <button class="icon-btn" data-action="close-cart" aria-label="Fechar carrinho">✕</button>
      </div>`;

    if (!lines.length) {
      this.el.innerHTML = `${head}<div class="drawer-body"><p class="empty">Seu carrinho está vazio.<br>Adicione livros do catálogo.</p></div>`;
      return;
    }

    const items = lines.map((l) => `
      <li class="line">
        <div class="mini-cover" style="--hue:${l.book.hue}"></div>
        <div class="line-info">
          <strong>${esc(l.book.title)}</strong>
          <span class="muted">${brl(l.book.priceCents)}</span>
          <div class="qty">
            <button data-action="dec" data-id="${l.book.id}" aria-label="Diminuir quantidade">−</button>
            <span>${l.qty}</span>
            <button data-action="inc" data-id="${l.book.id}" aria-label="Aumentar quantidade">+</button>
          </div>
        </div>
        <div class="line-total">${brl(l.totalCents)}
          <button class="link" data-action="remove" data-id="${l.book.id}">Remover</button>
        </div>
      </li>`).join('');

    const couponBlock = coupon
      ? `<div class="coupon-applied">🏷️ <strong>${esc(coupon.code)}</strong> — ${esc(coupon.label)}
           <button class="link" data-action="remove-coupon">remover</button></div>`
      : `<form class="coupon" data-form="coupon">
           <input name="code" placeholder="Cupom de desconto" autocomplete="off" aria-label="Código do cupom">
           <button class="btn btn-outline" type="submit">Aplicar</button>
         </form>`;
    const msg = couponMsg
      ? `<p class="msg ${couponMsg.ok ? 'msg-ok' : 'msg-err'}">${esc(couponMsg.text)}</p>` : '';

    this.el.innerHTML = `
      ${head}
      <div class="drawer-body">
        <ul class="lines">${items}</ul>

        <div class="block">
          <h3>Cupom</h3>
          ${couponBlock}${msg}
        </div>

        <fieldset class="block delivery">
          <legend>Entrega</legend>
          <label class="radio ${delivery === 'delivery' ? 'on' : ''}">
            <input type="radio" name="delivery" value="delivery" ${delivery === 'delivery' ? 'checked' : ''}>
            <span><strong>Receber em casa</strong><small>Frete único de ${brl(shippingCents)} por pedido, não importa quantos livros.</small></span>
          </label>
          <label class="radio ${delivery === 'pickup' ? 'on' : ''}">
            <input type="radio" name="delivery" value="pickup" ${delivery === 'pickup' ? 'checked' : ''}>
            <span><strong>Retirar na loja física — Grátis</strong><small>${esc(pickupAddress)}</small></span>
          </label>
        </fieldset>

        <dl class="summary">
          <div><dt>Subtotal</dt><dd>${brl(totals.subtotalCents)}</dd></div>
          ${totals.discountCents ? `<div class="discount"><dt>Desconto</dt><dd>− ${brl(totals.discountCents)}</dd></div>` : ''}
          <div><dt>Frete</dt><dd>${totals.shippingCents ? brl(totals.shippingCents) : 'Grátis'}</dd></div>
          <div class="total"><dt>Total</dt><dd>${brl(totals.totalCents)}</dd></div>
        </dl>
      </div>
      <div class="drawer-foot">
        <button class="btn btn-block" data-action="checkout">Ir para o pagamento</button>
      </div>`;
  }
}
