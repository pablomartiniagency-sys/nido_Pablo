import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("muestra el título principal y elementos clave", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("secretaría digital")).toBeVisible();
    await expect(page.getByText("de tu escuela infantil")).toBeVisible();
    await expect(page.getByText("Nido automatiza la")).toBeVisible();

    await expect(page.getByRole("link", { name: /iniciar sesión/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /solicitar demo/i }).first()).toBeVisible();
  });

  test("muestra las 6 funcionalidades principales", async ({ page }) => {
    await page.goto("/");

    const features = [
      { name: "Contabilidad", role: "heading" },
      { name: "Facturación SEPA", role: "heading" },
      { name: "Asistente IA", role: "heading" },
      { name: "Previsiones", role: "heading" },
      { name: "Comedor", role: "heading" },
      { name: "Empleados", role: "heading" },
    ] as const;
    for (const f of features) {
      await expect(page.getByRole(f.role, { name: f.name })).toBeVisible();
    }
  });

  test("los enlaces de navegación funcionan", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("el formulario de contacto se abre al hacer clic en Solicitar demo", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /solicitar demo/i }).first().click();

    await expect(page.getByPlaceholder("Nombre completo *")).toBeVisible();
    await expect(page.getByPlaceholder("Email profesional *")).toBeVisible();
    await expect(page.getByPlaceholder("Teléfono")).toBeVisible();
    await expect(page.getByPlaceholder("Nombre del centro")).toBeVisible();
  });
});
