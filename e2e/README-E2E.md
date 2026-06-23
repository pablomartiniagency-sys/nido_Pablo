# E2E Tests — Nido CRM

## Resumen

55 tests de Playwright corriendo secuencialmente (`--workers=1`). Todos los tests usan sesión demo (no requiere Supabase ni credenciales reales).

## Archivos generados

| Archivo | Tests | Módulo |
|---|---|---|
| `e2e/landing.spec.ts` | 4 | Landing page (título, features, nav, formulario) |
| `e2e/login.spec.ts` | 4 | Login (form, toggle tabs, validación vacío, back link) |
| `e2e/demo.spec.ts` | 3 | Demo session (login, persistencia, logout) |
| `e2e/auth-master.spec.ts` | 2 | Master login (correcto, error) |
| `e2e/dashboard.spec.ts` | 3 | Sidebar, navegación módulos, volver al dashboard |
| `e2e/familias.spec.ts` | 5 | CRUD familias + búsqueda |
| `e2e/facturacion.spec.ts` | 5 | CRUD facturas + filtros + remesa SEPA |
| `e2e/contabilidad.spec.ts` | 6 | CRUD gastos + balance + asientos contables |
| `e2e/alumnos.spec.ts` | 5 | CRUD alumnos + asistencia + filtros |
| `e2e/empleados.spec.ts` | 4 | KPIs + CRUD empleados + incidencias |
| `e2e/oportunidades.spec.ts` | 4 | Pipeline + CRUD leads + cambio estado + búsqueda |
| `e2e/comedor.spec.ts` | 5 | Menú semanal + incidencias + alérgenos |
| `e2e/nominas.spec.ts` | 3 | KPIs + selección período + detalle |
| `e2e/recordatorios.spec.ts` | 2 | Página recordatorios + resumen deudas |

## Archivos auxiliares

- `e2e/helpers.ts` — `loginAsDemo()` y `loginAsMaster()` que abren sesión demo/master y descartan el onboarding modal.
- `playwright.config.ts` — Configuración con webServer (auto-start), HTML reporter, es-ES locale, 1 worker.

## Scripts en package.json

```
"test:e2e": "playwright test --workers=1"
"test:e2e:ui": "playwright test --ui"
"test:e2e:debug": "playwright test --debug"
```

## Bugs encontrados y corregidos

1. **Strict mode: texto repetido en la página** — Varios selectores `getByText()` matcheaban múltiples elementos. Solución: usar `.first()`, `.last()` o matchers más específicos.
2. **Onboarding modal interceptando clics** — El modal "Saltar tour" aparecía sobre el contenido. Solución: `dismissOnboarding()` en el helper.
3. **selectOption con display text vs value** — Los `<select>` usaban el nombre del concepto como `value`, no el texto visible. Solución: usar `selectOption("value")` en lugar de `selectOption({ label: "..." })`.
4. **Toast overlay bloqueando interacción** — Notificaciones toast impedían hacer clic en elementos subyacentes. Solución: usar `.first()` para evitar ambigüedad y esperar que desaparezcan.
5. **Locator de botón eliminar familia demasiado frágil** — La cadena de `.locator("..")` no era fiable. Solución: usar `page.locator("div.grid > div").filter({ hasText: "..." })` + `button:has(svg).last()`.

## Datos críticos para tests

- **Sesión demo**: localStorage key `nido-demo-session`, expira en 1h.
- **Data mock**: `src/lib/data/mock.ts` y `crm-mock.ts`.
- **Servicios catálogo**: `src/lib/data/catalogos.ts` (los values de los select son nombres de concepto).
- **Nombres empleados demo**: "María García López", "Laura García López".
- **Nombres leads demo**: "Raquel Moreno", "Sofía García", "Alejandro Martínez".
- **Master account**: email `pablomartiniagency@gmail.com`, pass `RKewpablomartin90!2`.
- **Onboarding**: botón "Saltar tour" — aparece 1 vez por userId en sesión demo.

## Cómo ejecutar

```bash
cd "Nido CRM webv1"
npm run test:e2e
```

55 tests, ~2.3 min en total.
