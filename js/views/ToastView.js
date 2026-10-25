import { View } from '../core/View.js';

export class ToastView extends View {
  show(text, type = 'info') {
    const t = document.createElement('div');
    t.className = `toast-item toast-${type}`;
    t.textContent = text;
    this.el.appendChild(t);
    setTimeout(() => t.classList.add('out'), 3200);
    setTimeout(() => t.remove(), 3700);
  }
}
