# playwright-saucedemo-e2e

[![Playwright Tests](https://github.com/matiasleonel28/playwright-saucedemo-e2e/actions/workflows/playwright.yml/badge.svg)](https://github.com/matiasleonel28/playwright-saucedemo-e2e/actions/workflows/playwright.yml)

Suite de pruebas End-to-End sobre [SauceDemo](https://www.saucedemo.com) (app pública de práctica) construida con **Playwright + TypeScript** usando el patrón **Page Object Model**.

> **English summary:** Portfolio E2E suite for saucedemo.com built with Playwright + TypeScript and the Page Object Model. It covers login (valid, locked-out, invalid, problem user, protected route), product sorting, cart add/remove/persistence, a full checkout with total verification, and checkout form validation. Tests are tagged `@smoke` / `@regression`, run on Chromium (Firefox optional), and execute in GitHub Actions on every push/PR, publishing the HTML report as an artifact.

## Propósito

Demostrar buenas prácticas de automatización QA: page objects reutilizables, fixtures con sesión iniciada, datos de prueba desacoplados, locators estables (`data-test`), etiquetado smoke/regresión e integración continua.

## Stack

- [Playwright Test](https://playwright.dev) + TypeScript
- ESLint (typescript-eslint + eslint-plugin-playwright) y Prettier
- GitHub Actions

## Estructura

```
├── .github/workflows/playwright.yml   # Pipeline CI
├── data/testData.ts                   # Usuarios, productos, mensajes esperados
├── fixtures/test.ts                   # Fixtures: page objects + loggedInPage
├── pages/                             # Page Objects
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── CartPage.ts
│   └── CheckoutPage.ts
├── tests/                             # Specs
│   ├── login.spec.ts
│   ├── inventory.spec.ts
│   ├── cart.spec.ts
│   └── checkout.spec.ts
└── playwright.config.ts
```

## Cómo ejecutar

```bash
npm ci
npx playwright install --with-deps chromium

npm test                 # suite completa
npm run test:smoke       # solo @smoke
npm run test:regression  # solo @regression
npm run test:headed      # con navegador visible
FIREFOX=1 npm test       # agrega el proyecto Firefox (requiere: npx playwright install firefox)
npm run report           # abre el reporte HTML
npm run lint             # ESLint
```

En caso de fallo se guardan trace, screenshot y video en `test-results/` (ver con `npx playwright show-trace`).

## Estrategia de pruebas

| Área       | Casos                                                                                      | Tag         |
| ---------- | ------------------------------------------------------------------------------------------ | ----------- |
| Login      | Login OK                                                                                   | @smoke      |
| Login      | Usuario bloqueado, credenciales inválidas, `problem_user` (imágenes rotas), ruta protegida | @regression |
| Inventario | Orden precio menor→mayor                                                                   | @smoke      |
| Inventario | Orden Z→A, precio mayor→menor                                                              | @regression |
| Carrito    | Agregar/quitar productos (badge + carrito)                                                 | @smoke      |
| Carrito    | Persistencia tras recargar                                                                 | @regression |
| Checkout   | Compra completa con validación de subtotal + impuesto = total                              | @smoke      |
| Checkout   | Validación de nombre, apellido y código postal obligatorios (data-driven)                  | @regression |

- **Smoke:** caminos críticos del negocio, rápidos, para cada push.
- **Regresión:** casos negativos, validaciones y comportamientos conocidos.
- La sesión se inicia vía fixture `loggedInPage` para que cada test sea independiente y paralelizable.

## Autor

**Matías Gomez** — QA Analyst, Buenos Aires · [@matiasleonel28](https://github.com/matiasleonel28)
