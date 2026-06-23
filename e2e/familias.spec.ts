import { test, expect } from "@playwright/test";
import { loginAsDemo } from "./helpers";

test.describe("Familias — CRUD completo", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.getByRole("link", { name: "Familias" }).click();
    await expect(page).toHaveURL(/\/familias/);
  });

  test("ver 10 familias demo cargadas", async ({ page }) => {
    await expect(page.getByText("10 familias")).toBeVisible();
  });

  test("crear una nueva familia con servicios", async ({ page }) => {
    await page.getByRole("button", { name: /nueva familia/i }).click();

    await page.getByPlaceholder("Ej: García López").fill("Familia Test E2E");
    await page.getByPlaceholder("maria@ejemplo.com").fill("test@e2e.com");
    await page.getByPlaceholder("600 00 00 00").fill("612345678");
    await page.getByPlaceholder("ES00 0000 0000 0000 0000 0000").fill("ES12 1234 1234 1234 1234 1234");
    await page.getByPlaceholder("Martina (3a), Leo (1a)").fill("Alumno E2E");

    await page.getByRole("button", { name: /añadir servicio/i }).click();
    const servicioSelect = page.locator(".space-y-4 .select").last();
    await servicioSelect.selectOption("Mensualidad completa (8:00-17:00)");
    const importeInput = page.locator(".space-y-4 input[type='number']").last();
    await importeInput.fill("420");

    await page.getByRole("button", { name: "Añadir familia" }).click();
    await expect(page.getByText("Familia añadida")).toBeVisible();
    await expect(page.getByText("Familia Test E2E")).toBeVisible();
  });

  test("editar una familia existente", async ({ page }) => {
    await page.getByText("Familia García López").first().click();
    await page.getByPlaceholder("Ej: García López").clear();
    await page.getByPlaceholder("Ej: García López").fill("García López Editado");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByText("Familia actualizada")).toBeVisible();
    await expect(page.getByText("García López Editado")).toBeVisible();
  });

  test("eliminar una familia", async ({ page }) => {
    await page.getByPlaceholder("Buscar familia o alumno...").fill("García López");
    const card = page.locator("div.grid > div").filter({ hasText: "Familia García López" }).first();
    await expect(card).toBeVisible();
    await card.locator("button").filter({ has: page.locator("svg") }).last().click();
    await expect(page.getByText(/familia .* eliminada/i)).toBeVisible();
  });

  test("buscar familia por nombre", async ({ page }) => {
    await page.getByPlaceholder("Buscar familia o alumno...").fill("García");
    await expect(page.getByText("Familia García López")).toBeVisible();
    await expect(page.getByText("Familia Martínez Ruiz")).not.toBeVisible();
  });
});
