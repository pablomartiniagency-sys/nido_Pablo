import { test, expect } from "@playwright/test";
import { loginAsDemo } from "./helpers";

test.describe("Contabilidad — CRUD completo", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.getByRole("link", { name: "Contabilidad" }).click();
    await expect(page).toHaveURL(/\/contabilidad/);
  });

  test("ver cards de gastos del mes", async ({ page }) => {
    await expect(page.getByText("Gasto junio")).toBeVisible();
    await expect(page.getByText("Total acumulado")).toBeVisible();
    await expect(page.getByText("Principal gasto")).toBeVisible();
  });

  test("crear un nuevo gasto", async ({ page }) => {
    await page.getByRole("button", { name: /nuevo gasto/i }).click();

    await page.getByPlaceholder("Ej: Makro, Endesa, Amazon...").fill("Proveedor E2E");
    await page.getByPlaceholder("Ej: Compra semanal comedor, Factura luz...").fill("Gasto test E2E");
    await page.getByPlaceholder("0.00").first().fill("150.00");

    await page.getByRole("button", { name: "Guardar gasto" }).click();

    await expect(page.getByText(/gasto registrado/i)).toBeVisible();
    await expect(page.getByRole("cell", { name: "Proveedor E2E" })).toBeVisible();
  });

  test("buscar gastos por proveedor", async ({ page }) => {
    await page.getByPlaceholder("Buscar proveedor o concepto...").fill("Makro");
    const rows = page.locator("table tbody tr");
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test("cambiar a pestaña Balance y ver indicadores", async ({ page }) => {
    await page.getByRole("button", { name: "Balance" }).click();

    await expect(page.getByText("Ingresos totales")).toBeVisible();
    await expect(page.getByText("Gastos totales")).toBeVisible();
    await expect(page.getByText("Resultado neto")).toBeVisible();
  });

  test("cambiar a pestaña Asientos contables", async ({ page }) => {
    await page.getByRole("button", { name: "Asientos" }).click();
    await expect(page.getByRole("heading", { name: /asientos contables/i })).toBeVisible();
  });

  test("añadir asiento contable manual", async ({ page }) => {
    await page.getByRole("button", { name: "Asientos" }).click();
    await page.getByRole("button", { name: /añadir asiento manual/i }).click();

    await page.getByPlaceholder("Ej: Amortización mobiliario, Capital inicial, Préstamo bancario...").fill("Asiento test E2E");
    await page.locator(".fixed.inset-0.z-50 input[type='number']").fill("500.00");
    await page.locator(".fixed.inset-0.z-50").getByRole("button", { name: "Añadir asiento" }).click();

    await expect(page.getByText("Asiento contable añadido")).toBeVisible();
    await expect(page.getByText("Asiento test E2E")).toBeVisible();
  });
});
