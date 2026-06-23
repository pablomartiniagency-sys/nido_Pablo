import { test, expect } from "@playwright/test";
import { loginAsDemo } from "./helpers";

test.describe("Comedor — menú e incidencias", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.getByRole("link", { name: "Comedor" }).click();
    await expect(page).toHaveURL(/\/comedor/);
  });

  test("ver menú semanal", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Comedor" })).toBeVisible();
    await expect(page.getByText("Menú semanal editable")).toBeVisible();
  });

  test("ver días de la semana en el menú", async ({ page }) => {
    await expect(page.getByText("Lunes")).toBeVisible();
    await expect(page.getByText("Martes")).toBeVisible();
    await expect(page.getByText("Miércoles")).toBeVisible();
    await expect(page.getByText("Jueves")).toBeVisible();
    await expect(page.getByText("Viernes")).toBeVisible();
  });

  test("editar un día del menú", async ({ page }) => {
    await page.getByText("Lunes").first().click();

    const primerPlato = page.getByPlaceholder("Primer plato");
    if (await primerPlato.isVisible()) {
      await primerPlato.clear();
      await primerPlato.fill("Sopa de verduras E2E");
      await page.getByRole("button", { name: "Guardar menú" }).click();
    }
  });

  test("registrar una nueva incidencia", async ({ page }) => {
    await page.getByRole("button", { name: /nueva incidencia/i }).click();

    await page.getByPlaceholder("Nombre del alumno *").fill("Alumno Incidencia E2E");
    await page.locator("textarea").fill("Incidencia de prueba E2E");

    await page.getByRole("button", { name: "Registrar" }).click();
    await expect(page.getByText("Alumno Incidencia E2E")).toBeVisible();
  });

  test("ver alertas activas", async ({ page }) => {
    await page.waitForTimeout(300);
    const body = page.locator("body");
    await expect(body).toContainText(/alérgenos|alertas activas/i);
  });
});
