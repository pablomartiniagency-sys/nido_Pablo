import { test, expect } from "@playwright/test";

test.describe("Login", () => {
  test("muestra el formulario de inicio de sesión", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("Acceder a Nido")).toBeVisible();
    await expect(page.getByPlaceholder("Email")).toBeVisible();
    await expect(page.getByPlaceholder("Contraseña")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
    await expect(page.getByRole("button", { name: /demo gratuita/i })).toBeVisible();
  });

  test("alterna entre Iniciar sesión y Crear cuenta", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: /crear cuenta/i }).first().click();
    await expect(page.getByPlaceholder("Nombre del centro")).toBeVisible();
    await expect(page.locator("form").getByRole("button", { name: "Crear cuenta" })).toBeVisible();

    await page.getByRole("button", { name: /iniciar sesión/i }).first().click();
    await expect(page.getByPlaceholder("Nombre del centro")).toBeHidden();
    await expect(page.locator("form").getByRole("button", { name: "Entrar" })).toBeVisible();
  });

  test("muestra error si se envía vacío", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText(/email y contraseña requeridos/i)).toBeVisible();
  });

  test("vuelve a la landing con el enlace", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /volver a nido/i }).click();
    await expect(page).toHaveURL("/");
  });
});
