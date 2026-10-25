import { fmt } from '../core/format.js';

const COUPONS = {
  BEMVINDO10: { code: 'BEMVINDO10', type: 'percent', value: 10, minCents: 0, label: '10% de desconto' },
  LEITOR15: { code: 'LEITOR15', type: 'percent', value: 15, minCents: 10000, label: '15% de desconto em compras acima de R$ 100' },
  LIVRO20: { code: 'LIVRO20', type: 'fixed', value: 2000, minCents: 8000, label: 'R$ 20 de desconto em compras acima de R$ 80' },
};

export class CouponModel {
  validate(rawCode, subtotalCents) {
    const code = String(rawCode || '').trim().toUpperCase();
    if (!code) return { valid: false, message: 'Digite um código de cupom.' };
    const coupon = COUPONS[code];
    if (!coupon) return { valid: false, message: 'Cupom inválido.' };
    if (subtotalCents < coupon.minCents) {
      return {
        valid: false,
        message: `O cupom ${coupon.code} exige compras a partir de ${fmt.brl(coupon.minCents)}.`,
      };
    }
    return { valid: true, coupon, message: `Cupom ${coupon.code} aplicado: ${coupon.label}.` };
  }

  discountCents(coupon, subtotalCents) {
    if (!coupon) return 0;
    if (coupon.type === 'percent') return Math.round((subtotalCents * coupon.value) / 100);
    return Math.min(coupon.value, subtotalCents);
  }

  available() { return Object.values(COUPONS); }
}
