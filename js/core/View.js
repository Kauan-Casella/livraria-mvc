// Classe base das Views.
export class View {
  constructor(el) { this.el = el; }
  setVisible(visible) { this.el.hidden = !visible; }
}
