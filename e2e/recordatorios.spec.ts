import { test, expect } from "@playwright/test";
import { loginAsDemo } from "./helpers";

test.describe("Recordatorios — envío de alertas", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.getByRole("link", { name: "Recordatorios" }).click();
    await expect(page).toHaveURL(/\/recordatorios/);
  });

  test("ver página de recordatorios", async ({ page }) => {
    await expect(page.getByText("Recordatorios de pago")).toBeVisible();
  });

  test("ver resumen de familias con deuda", async ({ page }) => {
    const summary = page.locator("p").filter({ hasText: /familias|facturas|cargos/ });
    await expect(summary.first()).toBeVisible();
  });
});
