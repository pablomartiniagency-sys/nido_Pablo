import { test, expect } from "@playwright/test";
import { loginAsDemo } from "./helpers";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test("la sidebar muestra todas las secciones", async ({ page }) => {
    const sections = [
      "Dashboard", "Contabilidad", "Facturación", "Familias",
      "Asistente IA", "Previsiones", "Suministros", "Comedor",
      "Empleados", "Nóminas", "Alumnos", "Oportunidades",
      "Recordatorios", "Exportar datos", "Importar datos",
      "Configuración", "Ayuda",
    ];
    for (const s of sections) {
      await expect(page.getByRole("link", { name: s })).toBeVisible();
    }
  });

  test("navega a cada módulo desde la sidebar", async ({ page }) => {
    const routes = [
      { label: "Contabilidad", url: /\/contabilidad/ },
      { label: "Facturación", url: /\/facturacion/ },
      { label: "Familias", url: /\/familias/ },
      { label: "Asistente IA", url: /\/asistente/ },
      { label: "Previsiones", url: /\/previsiones/ },
      { label: "Alumnos", url: /\/alumnos/ },
      { label: "Configuración", url: /\/configuracion/ },
    ];
    for (const { label, url } of routes) {
      await page.getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(url);
    }
  });

  test("vuelve al dashboard desde cualquier página", async ({ page }) => {
    await page.getByRole("link", { name: "Contabilidad" }).click();
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
