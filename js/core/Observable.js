// Observer simples: Models avisam o Controller quando mudam.
export class Observable {
  constructor() { this._subs = []; }
  subscribe(fn) { this._subs.push(fn); }
  notify(payload) { this._subs.forEach((fn) => fn(payload)); }
}
