# Notas de diseño

Estas notas explican las decisiones de la suite: qué hace cada cambio, por qué quedó así y qué otra opción no tomamos.

## Sesión: loguearse una sola vez

**Qué hace.** `tests/auth.setup.ts` corre en un proyecto de Playwright que se llama `setup`. Entra como `standard_user` por la UI una sola vez y guarda cookies y `localStorage` en `playwright/.auth/standard-user.json`. Los proyectos Chromium y Firefox dependen de `setup` y arrancan con ese `storageState`. El fixture `loggedInPage` no se loguea: abre `/inventory.html` y verifica la URL. Si la sesión no sirve, el fixture falla antes del cuerpo del test.

**Por qué.** Antes, `loggedInPage` tipeaba usuario y contraseña en cada test. Un fallo de carrito o de checkout quedaba mezclado con el recorrido de login, y cada test pagaba una navegación de más.

**Qué no tomamos.**

- Dejar el login dentro del fixture. Sigue siendo válido cuando la sesión no se puede guardar. Acá SauceDemo guarda el usuario en la cookie `session-username`, así que un solo archivo alcanza para los dos navegadores.
- Un `globalSetup`. También puede escribir el archivo, pero no aparece como test en el reporte y es más fácil olvidarse de que corre.
- Un segundo proyecto "deslogueado". También funciona. El `test.use({ storageState: { cookies: [], origins: [] } })` de `login.spec.ts` separa dos decisiones: qué navegador corre, y si ese archivo arranca con sesión o sin sesión.

`login.spec.ts` sigue manejando el formulario de verdad: usuario válido, `locked_out_user`, contraseña incorrecta, campos vacíos, `problem_user` y la visita directa a `/inventory.html` sin sesión.

`npm run test:smoke` y `npm run test:regression` igual corren `setup` primero. `--grep` filtra los proyectos de navegador. Una dependencia no se saltea porque el título no tenga tag.

El archivo de auth está en `.gitignore`. Es una cookie de sesión viva, aunque la contraseña del demo sea pública.

El carrito vive en `localStorage`, clave `cart-contents`. Cada test recibe su propia copia del archivo, así que un producto agregado en un test no aparece en el siguiente.

El archivo se llama `auth.setup.ts` a propósito. El `testMatch` por defecto de los proyectos de navegador es `*.spec.ts`, entonces no vuelven a correr el setup. El proyecto `setup` es el único que lo incluye.

## Page objects

**Qué hace.** Los specs no llaman a `locator`, `getByRole` ni `getByTestId`. Las fuentes de las imágenes, el parseo de subtotal, impuesto y total, y la apertura de `/inventory.html` viven en los page objects. Se eliminó `CartPage.goto()` porque nadie lo usaba. Continue shopping, cancel y logout son métodos porque ahora hay tests que los usan.

**Por qué.** El test de `problem_user` usaba `img.inventory_item_img` en el spec. El de checkout importaba la clase `CheckoutPage` solo para leer etiquetas con `$`. Un cambio de estilo o de formato del label no debería obligarte a tocar el spec. Las assertions quedan en el spec: si el page object asserta, el fallo se esconde en un helper y el título del test deja de decir qué se comprobó.

**Qué no tomamos.** Dejar la clase de CSS en el spec es más corto, y se rompe cuando cambia el estilo. Parsear los precios en el spec también anda. El formato `Item total: $29.99` es conocimiento de la página, así que lo parsea el page object.

**El menú.** `data-test="open-menu"` está en el ícono. El `<button>` que tiene adelante es el que recibe el click: Playwright avisó que ese botón intercepta los pointer events. Por eso logout usa `getByRole('button', { name: 'Open Menu' })`. `data-test` sigue siendo el default cuando SauceDemo lo puso en el elemento con el que interactuás. `getByRole` es para botones cuyo nombre accesible es el texto que ve la persona (`Add to cart`, `Remove`, `Logout`, `Open Menu`).

Las imágenes de `problem_user` se leen con `getByRole('img')` adentro de cada ítem del inventario. El `data-test` de la imagen incluye el nombre del producto, y `inventory_item_img` es una clase de CSS, no un contrato.

## Datos de prueba

**Qué hace.** Nombre y precio del producto están juntos en `data/testData.ts`, junto con los títulos (`Products`, `Your Cart`) y los mensajes esperados. `expectedOrder()` suma los precios del catálogo, saca el 8%, redondea ese impuesto al centavo con `toFixed(2)` y después lo suma al subtotal. Es el mismo orden que usa la app. El spec además comprueba que el total en pantalla sea el subtotal más el impuesto que leyó.

**Por qué.** El test de compra sumaba `29.99 + 9.99` en el spec, y el título del inventario y el mensaje de ruta protegida estaban hardcodeados. Si el catálogo cambia, el número mágico no te dice de dónde salió.

**Qué no tomamos.** Hardcodear `43.18` esconde la regla. Assertar solo `total ≈ subtotal + impuesto` no comprueba que la tasa sea 8%. Las dos comprobaciones juntas agarran una etiqueta cambiada y una tasa cambiada.

## Cobertura

Smoke sigue siendo el camino corto: un login que entra, orden por precio de menor a mayor, agregar y sacar del carrito, y una compra. Lo nuevo es `@regression`. Un test tiene un solo tag, en el título, porque `--grep @smoke` matchea el título. Los dos conjuntos no se pisan.

| Caso                        | Por qué está                                                                                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Orden A a Z                 | Ya estaban los otros tres órdenes. El catálogo abre en A a Z, así que el test pasa a Z a A y vuelve. Si no, pasa aunque la opción A a Z no haga nada.      |
| Usuario o contraseña vacíos | El formulario tiene un mensaje propio para el campo en blanco. La contraseña incorrecta no cubre eso. Misma forma data-driven que los campos del checkout. |
| Logout                      | Muestra que la sesión guardada se puede cerrar y que `/inventory.html` vuelve a quedar bloqueado.                                                          |
| Continue shopping           | Es el botón del carrito que antes no usaba nadie. El badge tiene que seguir en 1 al volver al inventario.                                                  |
| Cancel en el paso de datos  | El checkout solo podía avanzar. Cancel vuelve al carrito y los dos productos siguen ahí.                                                                   |
| Ítems del overview          | El test de compra miraba la plata y no que los productos del overview fueran los que se agregaron.                                                         |

Quedó afuera a propósito `performance_glitch_user`: traba el hilo principal unos 5 segundos, y un assert de tiempo sale lento y frágil. Tampoco armamos un catálogo de todos los bugs de `error_user`. Las dos cosas están en las mejoras futuras del README.

## CI

**Qué hace.** El job `quality` corre `npm run lint` y `npm run format:check`. Los jobs de navegador lo esperan. La matriz corre `--project=chromium` y `--project=firefox` con `fail-fast: false`. El job de Firefox también instala Chromium. El reporte HTML se sube con `if: ${{ !cancelled() }}`, con un artifact por navegador: `playwright-report-chromium` y `playwright-report-firefox`, 14 días.

**Por qué.** Antes CI solo lintaba y corría Chromium. `format:check` existía como script y no corría. Firefox estaba detrás de `FIREFOX=1`, entonces Actions nunca definía ese proyecto. `npm test` ahora corre los dos proyectos en local también. `npm run test:chromium` es el loop rápido. El switch `FIREFOX=1` era fácil de olvidar y hacía que CI y la máquina no corrieran lo mismo.

**Qué no tomamos.**

- `if: success()` no sube el reporte cuando los tests fallan, que es justo cuando lo querés mirar.
- `if: always()` también lo sube si cancelaron el run.
- Un setup por navegador se loguea dos veces para la misma cookie. Firefox restaura el `storageState` que escribió Chromium. Por eso el job de Firefox igual instala Chromium.
- En `upload-artifact` v4 el nombre del artifact tiene que ser único dentro del workflow. Si los dos jobs suben `playwright-report`, uno pisa al otro.

## Preguntas que suelen hacer

**¿Por qué no te logueás por la UI en cada test?**
SauceDemo guarda la sesión en la cookie `session-username`. El proyecto `setup` se loguea una vez y escribe el `storageState`. El resto abre el inventario con esa sesión. El formulario queda cubierto en `login.spec.ts`, que arranca sin cookies. Loguearse en el fixture también aísla los tests, pero repite el login en fallos que no son de login.

**¿Por qué `login.spec.ts` no usa la sesión guardada?**
Porque ese archivo existe para probar el formulario y la ruta protegida. Si heredara la cookie de `standard_user`, el usuario bloqueado y la visita a `/inventory.html` sin sesión no estarían probando lo que dice el título. `test.use` en el archivo pisa el `storageState` del proyecto solo para esos tests.

**¿Por qué el menú no usa el `data-test`?**
Porque `data-test="open-menu"` está en el ícono, y el botón de adelante intercepta el click. El locator estable es el botón, con `getByRole('button', { name: 'Open Menu' })`. En el resto de la app, si el `data-test` está en el elemento con el que interactuás, usamos `getByTestId`.

**¿Por qué el test de A a Z ordena primero Z a A?**
El inventario ya abre en A a Z. Si solo elegís A a Z, el assert pasa aunque el control no haga nada. Salir de ese orden y volver demuestra que la opción reordena.

**¿De dónde sale el total del checkout? ¿Por qué no está escrito 43.18?**
La app calcula 8% del subtotal, redondea ese impuesto al centavo y después lo suma. `expectedOrder()` hace esa cuenta con los precios del catálogo (backpack 29.99 y bike light 9.99). El spec también mira que el total de la pantalla sea el subtotal más el impuesto leído. Si el total no cierra con esas dos etiquetas, el test falla aunque nuestra fórmula y la de la app coincidan.

**¿Qué diferencia hay entre `@smoke` y `@regression`?**
Smoke es el camino corto que dice que la tienda sigue funcionando: login, un orden, carrito y una compra. Regression es el resto: logins rechazados, los otros órdenes, persistencia del carrito, continue shopping, validación y cancel del checkout, logout y las imágenes de `problem_user`. Un test tiene un solo tag. `--grep` matchea el título, y `setup` corre igual porque es dependencia del proyecto.

**¿Por qué el job de Firefox instala Chromium?**
El proyecto `setup` se loguea con Chromium. Firefox solo restaura el archivo. Sin Chromium instalado, el setup de ese job no arranca.

**¿Por qué el reporte se sube cuando fallan los tests?**
La condición es `!cancelled()`. En un fallo el job no está cancelado, así que el HTML se publica. `success()` no lo subiría, y es el caso en el que el reporte más sirve.
