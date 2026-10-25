export const fmt = {
  // Todos os valores monetários são inteiros em centavos (evita erros de ponto flutuante).
  brl(cents) {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },
  esc(value) {
    return String(value).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  },
  normalize(value) {
    return String(value).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  },
};
