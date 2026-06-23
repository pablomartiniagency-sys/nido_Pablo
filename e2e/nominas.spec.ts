import { test, expect } from "@playwright/test";
import { loginAsDemo } from "./helpers";

test.describe("Nóminas — generación y gestión", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.getByRole("link", { name: "Nóminas" }).click();
    await expect(page).toHaveURL(/\/nominas/);
  });

  test("ver KPIs de nóminas", async ({ page }) => {
    await expect(page.getByText("Bruto total")).toBeVisible();
    await expect(page.getByText("Neto total")).toBeVisible();
    await expect(page.getByText("Coste total empresa")).toBeVisible();
  });

  test("seleccionar un período", async ({ page }) => {
    const periodoSelect = page.locator("select").first();
    const options = await periodoSelect.locator("option").allTextContents();
    if (options.length > 0) {
      await periodoSelect.selectOption({ index: 0 });
      await page.waitForTimeout(300);
    }
  });

  test("ver detalle de nóminas del período seleccionado", async ({ page }) => {
    const periodoSelect = page.locator("select").first();
    const options = await periodoSelect.locator("option").allTextContents();
    if (options.length > 0) {
      await periodoSelect.selectOption({ index: 0 });
      await page.waitForTimeout(300);
    }
    await expect(page.getByText(/detalle nóminas/i)).toBeVisible();
  });
});
