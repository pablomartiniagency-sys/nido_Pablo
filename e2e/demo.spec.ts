import { test, expect } from "@playwright/test";
import { loginAsDemo } from "./helpers";

test.describe("Demo session", () => {
  test("inicia sesión demo y redirige al dashboard", async ({ page }) => {
    await loginAsDemo(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("la sesión demo persiste al recargar", async ({ page }) => {
    await loginAsDemo(page);
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("se puede cerrar sesión desde la sidebar", async ({ page }) => {
    await loginAsDemo(page);
    await page.getByRole("link", { name: /cerrar sesión/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
