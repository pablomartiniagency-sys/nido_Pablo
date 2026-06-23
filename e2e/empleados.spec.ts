import { test, expect } from "@playwright/test";
import { loginAsDemo } from "./helpers";

test.describe("Empleados — CRUD completo", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.getByRole("link", { name: "Empleados" }).click();
    await expect(page).toHaveURL(/\/empleados/);
  });

  test("ver cards de KPIs de empleados", async ({ page }) => {
    await expect(page.getByText("Plantilla activa")).toBeVisible();
    await expect(page.getByText("Coste bruto mensual")).toBeVisible();
    await expect(page.getByText("Coste SS empresa")).toBeVisible();
    await expect(page.getByText("Incidencias abiertas")).toBeVisible();
  });

  test("crear un nuevo empleado", async ({ page }) => {
    await page.getByRole("button", { name: /nuevo empleado/i }).click();

    await page.getByPlaceholder("Ej: María García López").fill("Empleado E2E");
    await page.getByPlaceholder("12345678Z").fill("12345678Z");
    await page.getByPlaceholder("Ej: Educadora, Cocinera...").fill("Educadora E2E");
    await page.getByPlaceholder("1500").fill("1800");

    await page.getByRole("button", { name: "Añadir empleado" }).click();

    await expect(page.getByText("Empleado añadido")).toBeVisible();
    await expect(page.getByText("Empleado E2E")).toBeVisible();
  });

  test("ver incidencias activas", async ({ page }) => {
    await expect(page.getByText("Incidencias activas")).toBeVisible();
  });

  test("editar un empleado existente", async ({ page }) => {
    await page.getByText("Laura García López").first().click();

    await page.getByPlaceholder("Ej: María García López").clear();
    await page.getByPlaceholder("Ej: María García López").fill("Laura García Editada");

    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByText("Empleado actualizado")).toBeVisible();
    await expect(page.getByText("Laura García Editada")).toBeVisible();
  });
});
