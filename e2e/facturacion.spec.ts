import { test, expect } from "@playwright/test";
import { loginAsDemo } from "./helpers";

test.describe("Facturación — CRUD completo", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.getByRole("link", { name: "Facturación" }).click();
    await expect(page).toHaveURL(/\/facturacion/);
  });

  test("ver cards de resumen (cobrado, pendiente, impago)", async ({ page }) => {
    await expect(page.getByText(/^Cobrado$/).first()).toBeVisible();
    await expect(page.getByText(/^Pendiente$/).first()).toBeVisible();
    await expect(page.getByText(/^En impago$/).first()).toBeVisible();
  });

  test("crear una nueva factura", async ({ page }) => {
    await page.getByRole("button", { name: /nueva factura/i }).first().click();

    await page.locator("select").first().selectOption({ index: 1 });
    await expect(page.getByText(/Los servicios contratados/i)).toBeVisible();

    await page.getByRole("button", { name: "Crear factura" }).click();
    await expect(page.getByText(/factura .* creada/i)).toBeVisible();
  });

  test("cambiar a pestaña Facturas y ver datos", async ({ page }) => {
    await page.getByRole("button", { name: "Facturas" }).click();

    await expect(page.getByRole("heading", { name: /facturas/i })).toBeVisible();
    const rows = page.locator("table tbody tr");
    await expect(rows.first()).toBeVisible();
  });

  test("filtrar facturas por estado", async ({ page }) => {
    await page.getByRole("button", { name: "Facturas" }).click();
    await page.getByRole("button", { name: "Pagadas" }).click();
    const rows = page.locator("table tbody tr");
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test("generar remesa SEPA", async ({ page }) => {
    await page.getByRole("button", { name: /remesa sepa/i }).click();
    await expect(page.getByText(/Remesa SEPA generada/i)).toBeVisible();
    await expect(page.getByText(/Descargar XML/i)).toBeVisible();
  });
});
