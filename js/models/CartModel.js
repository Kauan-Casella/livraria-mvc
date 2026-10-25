import { Observable } from '../core/Observable.js';
import { storage } from '../core/storage.js';

const KEY = 'livraria.cart.v1';

export class CartModel extends Observable {
  constructor(books) {
    super();
    this.books = books;
    this.items = storage.get(KEY, []);
    this._sanitize();
  }

  _sanitize() {
    this.items = this.items
      .filter((i) => this.books.find(i.id))
      .map((i) => ({ id: i.id, qty: Math.min(i.qty, this.books.find(i.id).stock) }))
      .filter((i) => i.qty > 0);
  }

  add(id) {
    const book = this.books.find(id);
    if (!book) return { ok: false, message: 'Livro não encontrado.' };
    if (book.stock <= 0) return { ok: false, message: 'Este livro está esgotado.' };
    const item = this.items.find((i) => i.id === book.id);
    const current = item ? item.qty : 0;
    if (current + 1 > book.stock) {
      return { ok: false, message: `Só há ${book.stock} unidade(s) em estoque.` };
    }
    if (item) item.qty += 1; else this.items.push({ id: book.id, qty: 1 });
    this._save();
    return { ok: true, book };
  }

  setQty(id, qty) {
    const item = this.items.find((i) => i.id === Number(id));
    if (!item) return { ok: false };
    if (qty <= 0) { this.remove(id); return { ok: true }; }
    const book = this.books.find(id);
    let result = { ok: true };
    if (qty > book.stock) {
      qty = book.stock;
      result = { ok: false, message: `Só há ${book.stock} unidade(s) em estoque.` };
    }
    item.qty = qty;
    this._save();
    return result;
  }

  remove(id) {
    this.items = this.items.filter((i) => i.id !== Number(id));
    this._save();
  }

  clear() {
    this.items = [];
    this._save();
  }

  lines() {
    return this.items
      .map((i) => {
        const book = this.books.find(i.id);
        return book ? { book, qty: i.qty, totalCents: book.priceCents * i.qty } : null;
      })
      .filter(Boolean);
  }

  subtotalCents() {
    return this.lines().reduce((sum, l) => sum + l.totalCents, 0);
  }

  count() {
    return this.items.reduce((sum, i) => sum + i.qty, 0);
  }

  _save() {
    storage.set(KEY, this.items);
    this.notify({ type: 'cart' });
  }
}
