import { Observable } from '../core/Observable.js';
import { storage } from '../core/storage.js';

const KEY = 'livraria.waitlist.v1';
const OUTBOX_KEY = 'livraria.outbox.v1';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export class WaitlistModel extends Observable {
  constructor(books) {
    super();
    this.books = books;
    this.entries = storage.get(KEY, []);
    this.outbox = storage.get(OUTBOX_KEY, []);
  }

  register(bookId, rawEmail) {
    const email = String(rawEmail || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return { ok: false, message: 'Informe um e-mail válido.' };
    const book = this.books.find(bookId);
    if (!book) return { ok: false, message: 'Livro não encontrado.' };
    if (book.stock > 0) return { ok: false, message: 'Este livro já está disponível no estoque!' };
    const exists = this.entries.some((e) => e.bookId === book.id && e.email === email);
    if (exists) return { ok: true, already: true, message: 'Você já está na lista de espera deste livro.' };
    this.entries.push({ bookId: book.id, email, createdAt: new Date().toISOString() });
    this._save();
    return { ok: true, message: `Pronto! Avisaremos ${email} quando "${book.title}" voltar ao estoque.` };
  }

  // Chamado quando o livro é reposto: "envia" (simula) e-mails e limpa a fila.
  notifyRestock(book) {
    const mine = this.entries.filter((e) => e.bookId === book.id);
    if (!mine.length) return [];
    this.entries = this.entries.filter((e) => e.bookId !== book.id);
    mine.forEach((e) => this.outbox.unshift({
      to: e.email,
      subject: `"${book.title}" voltou ao estoque!`,
      at: new Date().toISOString(),
    }));
    this.outbox = this.outbox.slice(0, 20);
    this._save();
    return mine.map((e) => e.email);
  }

  countFor(bookId) { return this.entries.filter((e) => e.bookId === bookId).length; }

  reset() {
    this.entries = [];
    this.outbox = [];
    this._save();
  }

  _save() {
    storage.set(KEY, this.entries);
    storage.set(OUTBOX_KEY, this.outbox);
    this.notify({ type: 'waitlist' });
  }
}
