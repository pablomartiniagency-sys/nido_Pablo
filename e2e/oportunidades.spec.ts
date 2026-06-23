import { test, expect } from "@playwright/test";
import { loginAsDemo } from "./helpers";

test.describe("Oportunidades/Leads — CRUD completo", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.getByRole("link", { name: "Oportunidades" }).click();
    await expect(page).toHaveURL(/\/oportunidades/);
  });

  test("ver pipeline de leads", async ({ page }) => {
    await expect(page.getByText("CRM Comercial")).toBeVisible();
    await expect(page.getByText("Total leads")).toBeVisible();
    await expect(page.getByText("Pipeline ponderado")).toBeVisible();
  });

  test("crear un nuevo lead", async ({ page }) => {
    await page.getByRole("button", { name: /nuevo lead/i }).click();

    await page.locator('input[name="nombre"]').fill("Lead E2E Test");
    await page.locator('input[name="email"]').fill("lead@e2e.com");
    await page.locator('input[name="telefono"]').fill("600111222");
    await page.locator('select[name="fuente"]').selectOption("Google");
    await page.locator('input[name="nombreHijo"]').fill("Hijo E2E");
    await page.locator('select[name="edadHijo"]').selectOption("1 año");

    await page.getByRole("button", { name: "Crear lead" }).click();
    await expect(page.getByText("Lead E2E Test")).toBeVisible();
  });

  test("cambiar estado de un lead", async ({ page }) => {
    const estadoSelect = page.locator("table select").first();
    const options = await estadoSelect.locator("option").allTextContents();
    if (options.length > 1) {
      await estadoSelect.selectOption({ index: 1 });
    }
    await page.waitForTimeout(300);
  });

  test("buscar lead por nombre", async ({ page }) => {
    await page.getByPlaceholder("Buscar lead...").fill("Raquel");
    await expect(page.getByText("Raquel Moreno").first()).toBeVisible();
  });
});
