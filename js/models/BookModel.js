import { Observable } from '../core/Observable.js';
import { fmt } from '../core/format.js';
import { storage } from '../core/storage.js';

const KEY = 'livraria.books.v1';

export class BookModel extends Observable {
  constructor() {
    super();
    this.books = storage.get(KEY, null) || BookModel.seed();
  }

  static seed() {
    return [
      { id: 1, title: 'Dom Casmurro', author: 'Machado de Assis', category: 'Romance', priceCents: 3990, stock: 8, hue: 8 },
      { id: 2, title: 'Memórias Póstumas de Brás Cubas', author: 'Machado de Assis', category: 'Romance', priceCents: 3490, stock: 5, hue: 28 },
      { id: 3, title: 'O Cortiço', author: 'Aluísio Azevedo', category: 'Romance', priceCents: 2990, stock: 6, hue: 150 },
      { id: 4, title: 'Grande Sertão: Veredas', author: 'João Guimarães Rosa', category: 'Romance', priceCents: 5490, stock: 2, hue: 40 },
      { id: 5, title: 'Vidas Secas', author: 'Graciliano Ramos', category: 'Romance', priceCents: 3290, stock: 10, hue: 22 },
      { id: 6, title: 'A Hora da Estrela', author: 'Clarice Lispector', category: 'Romance', priceCents: 2790, stock: 0, hue: 330 },
      { id: 7, title: 'Capitães da Areia', author: 'Jorge Amado', category: 'Romance', priceCents: 4290, stock: 7, hue: 200 },
      { id: 8, title: 'Quincas Borba', author: 'Machado de Assis', category: 'Romance', priceCents: 2890, stock: 0, hue: 270 },
      { id: 9, title: 'Clean Architecture', author: 'Robert C. Martin', category: 'Tecnologia', priceCents: 9990, stock: 3, hue: 215 },
    ];
  }

  all() { return this.books.slice(); }

  find(id) { return this.books.find((b) => b.id === Number(id)); }

  search(query) {
    const q = fmt.normalize(query || '').trim();
    if (!q) return this.all();
    return this.books.filter((b) =>
      fmt.normalize(`${b.title} ${b.author} ${b.category}`).includes(q));
  }

  decrement(lines) {
    lines.forEach(({ book, qty }) => {
      const b = this.find(book.id);
      if (b) b.stock = Math.max(0, b.stock - qty);
    });
    this._save();
  }

  restock(id, qty) {
    const b = this.find(id);
    if (b) { b.stock += qty; this._save(); }
    return b;
  }

  reset() {
    this.books = BookModel.seed();
    this._save();
  }

  _save() {
    storage.set(KEY, this.books);
    this.notify({ type: 'books' });
  }
}
