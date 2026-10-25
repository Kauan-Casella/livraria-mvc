import { View } from '../core/View.js';
import { fmt } from '../core/format.js';

const { esc } = fmt;

export class ModalView extends View {
  bind(h) {
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el || e.target.closest('[data-action="close-modal"]')) h.onClose();
    });
    this.el.addEventListener('submit', (e) => {
      if (!e.target.matches('[data-form="waitlist"]')) return;
      e.preventDefault();
      h.onSubmit(Number(e.target.dataset.id), e.target.elements.email.value);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.el.hidden) h.onClose();
    });
  }

  open(book) {
    this.el.hidden = false;
    this.el.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true" aria-label="Avise-me">
        <button class="icon-btn modal-close" data-action="close-modal" aria-label="Fechar">✕</button>
        <h2>Avise-me quando chegar</h2>
        <p class="muted">“${esc(book.title)}” está esgotado. Deixe seu e-mail e avisaremos assim que ele voltar ao estoque.</p>
        <form data-form="waitlist" data-id="${book.id}" novalidate>
          <label class="field">Seu e-mail
            <input name="email" type="email" placeholder="voce@exemplo.com" autocomplete="email">
          </label>
          <p class="msg" data-msg hidden></p>
          <button class="btn btn-block" type="submit">Cadastrar e-mail</button>
        </form>
      </div>`;
    const input = this.el.querySelector('input[name="email"]');
    if (input) input.focus();
  }

  showResult(result) {
    const msg = this.el.querySelector('[data-msg]');
    if (!msg) return;
    msg.hidden = false;
    msg.className = `msg ${result.ok ? 'msg-ok' : 'msg-err'}`;
    msg.textContent = result.message;
    if (result.ok) {
      const form = this.el.querySelector('[data-form="waitlist"]');
      form.elements.email.disabled = true;
      form.querySelector('button[type="submit"]').hidden = true;
    }
  }

  close() {
    this.el.hidden = true;
    this.el.innerHTML = '';
  }
}
