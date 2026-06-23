import { test, expect } from "@playwright/test";
import { loginAsDemo } from "./helpers";

test.describe("Alumnos — CRUD completo", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.getByRole("link", { name: "Alumnos" }).click();
    await expect(page).toHaveURL(/\/alumnos/);
  });

  test("ver listado de alumnos demo", async ({ page }) => {
    await expect(page.getByText("CRM de Alumnos")).toBeVisible();
    await expect(page.getByText(/7 estudiantes/)).toBeVisible();
  });

  test("crear un nuevo alumno", async ({ page }) => {
    await page.getByRole("button", { name: /nuevo alumno/i }).click();

    await page.locator('input[name="nombre"]').fill("Alumno E2E Test");
    await page.locator('input[name="fechaNac"]').fill("2023-06-01");
    await page.locator('input[name="fechaIngreso"]').fill("2026-01-15");
    await page.locator('select[name="curso"]').selectOption("1 año");
    await page.locator('select[name="familiaId"]').selectOption({ index: 1 });

    await page.getByRole("button", { name: "Crear alumno" }).click();

    await expect(page.getByText("Alumno E2E Test").first()).toBeVisible();
  });

  test("seleccionar alumno y ver detalle perfil", async ({ page }) => {
    await page.getByText("Martina García López").first().click();

    await expect(page.getByRole("heading", { name: "Martina García López" })).toBeVisible();
    await expect(page.getByText("Fecha nacimiento")).toBeVisible();
    await expect(page.getByText("Curso").last()).toBeVisible();
  });

  test("ver pestaña de asistencia", async ({ page }) => {
    await page.getByText("Martina García López").first().click();
    await page.getByRole("button", { name: "Asistencia" }).click();

    await expect(page.getByText("Presentes")).toBeVisible();
    await expect(page.getByText("Ausencias")).toBeVisible();
  });

  test("filtrar alumnos por estado", async ({ page }) => {
    const estadoSelect = page.locator("select").first();
    await estadoSelect.selectOption("activo");
    await page.waitForTimeout(300);
    await expect(page.getByText("7 estudiantes")).toBeVisible();
  });
});
