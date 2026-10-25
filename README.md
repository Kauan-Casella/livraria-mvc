# 📖 Página Viva — Livraria (MVP front-end, arquitetura MVC)

MVP do front-end de uma livraria online, construído em **HTML + CSS + JavaScript puro** (sem build, sem dependências), organizado na arquitetura **MVC** (Exercício 7.2).

## Como rodar

O projeto usa **ES Modules** (`import`/`export`), e o navegador não carrega módulos via `file://`. Por isso é preciso servir a pasta por HTTP:

- **Pela IDE (PyCharm/WebStorm):** abra o `index.html` e clique no ícone do Chrome no canto superior direito do editor.
- **Pelo terminal**, dentro da pasta do projeto:
  ```
  python3 -m http.server 8000
  ```
  e acesse **http://localhost:8000**.

Não precisa de `npm install` nem de build. Os dados (estoque, carrinho, lista de espera, pedidos) ficam no `localStorage`.

## Arquitetura MVC

```
index.html                       # carrega apenas js/main.js (<script type="module">)
css/styles.css
js/
├── main.js                      # ponto de entrada: new StoreController().init()
├── controllers/StoreController.js   # importa Models e Views e faz a ponte entre eles
├── models/                      # Regras de negócio e dados — NÃO tocam no DOM
│   ├── BookModel.js             # catálogo e estoque
│   ├── CartModel.js             # carrinho (múltiplos livros, limites de estoque)
│   ├── CouponModel.js           # validação e cálculo de cupons
│   ├── OrderModel.js            # frete, parcelamento, validação do cartão, criação do pedido
│   └── WaitlistModel.js         # lista de espera "avise-me" + caixa de saída simulada
├── views/                       # Apenas HTML e captura de eventos — SEM regra de negócio
│   ├── HeaderView.js  CatalogView.js  CartView.js  CheckoutView.js
│   └── SuccessView.js  ModalView.js  ToastView.js  DemoView.js
└── core/                        # utilitários compartilhados
    ├── Observable.js  View.js  format.js  storage.js
```

### Grafo de imports

```
main.js ──► StoreController ──► models/*  ──► core/Observable, core/format, core/storage
                           └──► views/*   ──► core/View, core/format
```

- O **Controller** é o único que importa Models **e** Views.
- **Models** importam só o `core`; nunca importam Views nem o Controller.
- **Views** importam só o `core`; nunca importam Models nem o Controller.

**Fluxo:** `View (evento) → Controller → Model (regra) → notifica → Controller → View.render()`

- Os Models são `Observable`: quando mudam, avisam o Controller, que re-renderiza as Views.
- Valores monetários são inteiros em **centavos** (evita erro de ponto flutuante).
- Todo texto vindo de dados passa por `esc()` (proteção contra XSS).

## Histórias de usuário → onde estão implementadas

| História | Model | View | Como testar |
|---|---|---|---|
| **1. Cupom de desconto** | `CouponModel` | `CartView` (bloco "Cupom") | Carrinho → digite `BEMVINDO10`, `LEITOR15` (mín. R$ 100) ou `LIVRO20` (mín. R$ 80, R$ 20 off) |
| **2. Retirar na loja sem frete** | `OrderModel.totals()` | `CartView` (bloco "Entrega") | Carrinho → "Retirar na loja física — Grátis" |
| **3. Pagar no cartão e parcelar** | `OrderModel.validateCard()` / `installmentOptions()` | `CheckoutView` | Pagamento → até 6x sem juros (parcela mínima R$ 20) |
| **4. Vários livros, um só frete** | `CartModel` + frete único em `OrderModel` | `CatalogView`, `CartView` | Adicione vários livros: o frete é R$ 15,90 por **pedido** |
| **5. Avisar quando o livro for reposto** | `WaitlistModel` | `ModalView`, `DemoView` | Livro esgotado → "Avise-me" → informe e-mail |

### Dados para teste

- **Cartão de teste:** `4111 1111 1111 1111`, qualquer nome, validade futura (ex.: `12/30`), CVV `123`.
- **Livros esgotados:** *A Hora da Estrela* e *Quincas Borba*.
- **Simular reposição:** rodapé → "🧪 Painel de demonstração" → "Repor 5 unidades". Os e-mails cadastrados recebem o aviso (simulado, aparece na "Caixa de saída").

## Regras de negócio

- Cupom é revalidado a cada mudança no carrinho (se o valor mínimo deixar de ser atingido, ele é removido).
- Não é possível adicionar mais unidades do que o estoque; o estoque é abatido ao confirmar o pedido.
- Cadastro de e-mail na lista de espera só é aceito para livros esgotados; e-mail repetido não duplica a inscrição.
- Cartão validado por algoritmo de Luhn, validade (MM/AA, não vencido) e CVV.

## Limitações do MVP

Não há back-end: pagamento, envio de e-mail e login são simulados. Para evoluir, o `OrderModel` e o `WaitlistModel` são os pontos onde entrariam chamadas a uma API.
