// Models
import { BookModel } from '../models/BookModel.js';
import { CartModel } from '../models/CartModel.js';
import { CouponModel } from '../models/CouponModel.js';
import { OrderModel } from '../models/OrderModel.js';
import { WaitlistModel } from '../models/WaitlistModel.js';
// Views
import { HeaderView } from '../views/HeaderView.js';
import { CatalogView } from '../views/CatalogView.js';
import { CartView } from '../views/CartView.js';
import { CheckoutView } from '../views/CheckoutView.js';
import { SuccessView } from '../views/SuccessView.js';
import { ModalView } from '../views/ModalView.js';
import { ToastView } from '../views/ToastView.js';
import { DemoView } from '../views/DemoView.js';

const $ = (id) => document.getElementById(id);

const PICKUP = OrderModel.PICKUP_ADDRESS;

// Controller: recebe eventos das Views, chama os Models e manda as Views renderizarem.
export class StoreController {
  constructor() {
    // O Controller conhece as duas camadas: instancia os Models...
    const books = new BookModel();
    this.m = {
      books,
      cart: new CartModel(books),
      coupons: new CouponModel(),
      orders: new OrderModel(books),
      waitlist: new WaitlistModel(books),
    };
    // ...e as Views, e faz a ponte entre elas.
    this.v = {
      header: new HeaderView($('header')),
      catalog: new CatalogView($('view-catalog')),
      cart: new CartView($('cart'), $('overlay')),
      checkout: new CheckoutView($('view-checkout')),
      success: new SuccessView($('view-success')),
      modal: new ModalView($('modal')),
      toast: new ToastView($('toast')),
      demo: new DemoView($('demo')),
    };
    this.state = {
      route: 'catalog', // catalog | checkout | success
      query: '',
      cartOpen: false,
      delivery: 'delivery', // delivery | pickup
      couponCode: null,
      couponMsg: null,
      lastOrder: null,
      checkoutErrors: {},
      checkoutValues: {},
    };
  }

  init() {
    const { m, v } = this;

    v.header.bind({
      onHome: () => this.go('catalog'),
      onOpenCart: () => this.setCartOpen(true),
      onSearch: (q) => { this.state.query = q; if (this.state.route !== 'catalog') this.state.route = 'catalog'; this.render(); },
    });

    v.catalog.bind({
      onAdd: (id) => this.addToCart(id),
      onNotify: (id) => { const b = m.books.find(id); if (b) v.modal.open(b); },
    });

    v.cart.bind({
      onClose: () => this.setCartOpen(false),
      onInc: (id) => this.changeQty(id, +1),
      onDec: (id) => this.changeQty(id, -1),
      onRemove: (id) => m.cart.remove(id),
      onApplyCoupon: (code) => this.applyCoupon(code),
      onRemoveCoupon: () => { this.state.couponCode = null; this.state.couponMsg = null; this.render(); },
      onDelivery: (d) => { this.state.delivery = d; this.render(); },
      onCheckout: () => { this.state.cartOpen = false; this.go('checkout'); },
    });

    v.checkout.bind({
      onBack: () => this.go('catalog'),
      onPay: (values) => this.pay(values),
    });

    v.success.bind({ onContinue: () => this.go('catalog') });

    v.modal.bind({
      onClose: () => v.modal.close(),
      onSubmit: (id, email) => v.modal.showResult(m.waitlist.register(id, email)),
    });

    v.demo.bind({
      onRestock: (id) => this.restock(id),
      onReset: () => this.resetDemo(),
    });

    [m.books, m.cart, m.waitlist].forEach((model) => model.subscribe(() => this.render()));
    this.render();
  }

  // ---- ações ----

  go(route) {
    this.state.route = route;
    if (route === 'catalog') this.state.query = '';
    if (route === 'catalog') document.getElementById('search').value = '';
    this.render();
    window.scrollTo({ top: 0 });
  }

  setCartOpen(open) {
    this.state.cartOpen = open;
    this.render();
  }

  addToCart(id) {
    const r = this.m.cart.add(id);
    this.v.toast.show(r.ok ? `“${r.book.title}” adicionado ao carrinho.` : r.message, r.ok ? 'ok' : 'error');
  }

  changeQty(id, delta) {
    const line = this.m.cart.lines().find((l) => l.book.id === id);
    if (!line) return;
    const r = this.m.cart.setQty(id, line.qty + delta);
    if (r && r.message) this.v.toast.show(r.message, 'error');
  }

  applyCoupon(code) {
    const sub = this.m.cart.subtotalCents();
    const r = this.m.coupons.validate(code, sub);
    if (r.valid) this.state.couponCode = r.coupon.code;
    this.state.couponMsg = { text: r.message, ok: r.valid };
    this.render();
  }

  pay(values) {
    const s = this.state;
    s.checkoutValues = values;
    const errors = this.m.orders.validateCard(values);
    if (Object.keys(errors).length) {
      s.checkoutErrors = errors;
      this.render();
      this.v.toast.show('Confira os dados do cartão.', 'error');
      return;
    }
    s.checkoutErrors = {};
    this.v.checkout.setProcessing(true);

    setTimeout(() => {
      const { lines, coupon, totals } = this._compute();
      const r = this.m.orders.place({
        lines, totals, coupon,
        delivery: s.delivery,
        installments: values.installments,
        cardNumber: values.number,
      });
      if (!r.ok) {
        this.v.toast.show(r.message, 'error');
        this.render();
        return;
      }
      s.lastOrder = r.order;
      s.couponCode = null;
      s.couponMsg = null;
      s.checkoutValues = {};
      s.route = 'success';
      this.m.cart.clear(); // dispara render
      window.scrollTo({ top: 0 });
    }, 900);
  }

  restock(id) {
    const book = this.m.books.restock(id, 5);
    if (!book) return;
    const emails = this.m.waitlist.notifyRestock(book);
    this.v.toast.show(
      emails.length
        ? `“${book.title}” reposto. ${emails.length} e-mail(s) de aviso enviado(s).`
        : `“${book.title}” reposto no estoque.`,
      'ok',
    );
  }

  resetDemo() {
    this.m.cart.clear();
    this.m.waitlist.reset();
    this.m.books.reset();
    this.state.couponCode = null;
    this.state.couponMsg = null;
    this.v.toast.show('Dados da demonstração resetados.', 'info');
  }

  // ---- renderização ----

  _syncCoupon(subtotal) {
    const s = this.state;
    if (!s.couponCode) return null;
    const r = this.m.coupons.validate(s.couponCode, subtotal);
    if (r.valid) return r.coupon;
    s.couponCode = null;
    s.couponMsg = subtotal > 0 ? { text: `Cupom removido. ${r.message}`, ok: false } : null;
    return null;
  }

  _compute() {
    const lines = this.m.cart.lines();
    const subtotal = this.m.cart.subtotalCents();
    const coupon = this._syncCoupon(subtotal);
    const discount = this.m.coupons.discountCents(coupon, subtotal);
    const totals = this.m.orders.totals(subtotal, discount, this.state.delivery);
    return { lines, subtotal, coupon, totals };
  }

  render() {
    const { m, v, state: s } = this;
    const { lines, coupon, totals } = this._compute();

    if (s.route === 'checkout' && lines.length === 0) s.route = 'catalog';

    v.header.renderCount(m.cart.count());
    v.catalog.setVisible(s.route === 'catalog');
    v.checkout.setVisible(s.route === 'checkout');
    v.success.setVisible(s.route === 'success');

    if (s.route === 'catalog') {
      v.catalog.render({ books: m.books.search(s.query), query: s.query, coupons: m.coupons.available() });
    }
    if (s.route === 'checkout') {
      v.checkout.render({
        lines, totals, coupon,
        delivery: s.delivery,
        options: m.orders.installmentOptions(totals.totalCents),
        errors: s.checkoutErrors,
        values: s.checkoutValues,
        pickupAddress: PICKUP,
      });
    }
    if (s.route === 'success') v.success.render(s.lastOrder, PICKUP);

    v.cart.render({
      open: s.cartOpen, lines, totals, coupon,
      couponMsg: s.couponMsg,
      delivery: s.delivery,
      shippingCents: OrderModel.SHIPPING_CENTS,
      pickupAddress: PICKUP,
    });

    v.demo.render({
      soldOut: m.books.all().filter((b) => b.stock <= 0)
        .map((book) => ({ book, waiting: m.waitlist.countFor(book.id) })),
      outbox: m.waitlist.outbox,
    });
  }
}
