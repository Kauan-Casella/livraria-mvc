import { Observable } from '../core/Observable.js';
import { storage } from '../core/storage.js';

const KEY = 'livraria.orders.v1';

function luhn(num) {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i -= 1) {
    let d = Number(num[i]);
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export class OrderModel extends Observable {
  constructor(books) {
    super();
    this.books = books;
    this.orders = storage.get(KEY, []);
  }

  // Frete é único por pedido (vários livros = um só frete). Retirada na loja = grátis.
  totals(subtotalCents, discountCents, delivery) {
    const shippingCents = delivery === 'pickup' || subtotalCents === 0 ? 0 : OrderModel.SHIPPING_CENTS;
    return {
      subtotalCents,
      discountCents,
      shippingCents,
      totalCents: subtotalCents - discountCents + shippingCents,
    };
  }

  // Parcelamento sem juros, com parcela mínima.
  installmentOptions(totalCents) {
    const options = [];
    for (let n = 1; n <= OrderModel.MAX_INSTALLMENTS; n += 1) {
      if (n > 1 && totalCents / n < OrderModel.MIN_INSTALLMENT_CENTS) break;
      options.push({ n, perCents: Math.round(totalCents / n) });
    }
    return options;
  }

  validateCard({ number, name, expiry, cvv }) {
    const errors = {};
    const digits = String(number || '').replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19 || !luhn(digits)) errors.number = 'Número de cartão inválido.';

    if (String(name || '').trim().length < 3) errors.name = 'Informe o nome impresso no cartão.';

    const m = /^(\d{2})\/(\d{2})$/.exec(String(expiry || '').trim());
    if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) {
      errors.expiry = 'Validade inválida (MM/AA).';
    } else {
      const now = new Date();
      const nowIndex = now.getFullYear() * 12 + (now.getMonth() + 1);
      const cardIndex = (2000 + Number(m[2])) * 12 + Number(m[1]);
      if (cardIndex < nowIndex) errors.expiry = 'Cartão vencido.';
    }

    if (!/^\d{3,4}$/.test(String(cvv || '').trim())) errors.cvv = 'CVV inválido.';
    return errors;
  }

  place({ lines, totals, coupon, delivery, installments, cardNumber }) {
    for (const l of lines) {
      const book = this.books.find(l.book.id);
      if (!book || book.stock < l.qty) {
        return { ok: false, message: `"${l.book.title}" não tem estoque suficiente.` };
      }
    }
    const digits = String(cardNumber || '').replace(/\D/g, '');
    const order = {
      id: `LV-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      items: lines.map((l) => ({
        title: l.book.title, qty: l.qty, priceCents: l.book.priceCents, totalCents: l.totalCents,
      })),
      totals,
      couponCode: coupon ? coupon.code : null,
      delivery,
      installments,
      installmentCents: Math.round(totals.totalCents / installments),
      cardLast4: digits.slice(-4),
    };
    this.books.decrement(lines);
    this.orders.unshift(order);
    storage.set(KEY, this.orders);
    this.notify({ type: 'orders' });
    return { ok: true, order };
  }
}

OrderModel.SHIPPING_CENTS = 1590;
OrderModel.MAX_INSTALLMENTS = 6;
OrderModel.MIN_INSTALLMENT_CENTS = 2000;
OrderModel.PICKUP_ADDRESS = 'Rua Consolação, 930 — Consolação, São Paulo/SP (seg–sáb, 10h às 19h)';
