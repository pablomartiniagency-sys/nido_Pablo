import { test, expect } from "@playwright/test";
import { loginAsMaster } from "./helpers";

test.describe("Master login", () => {
  test("inicia sesión con la cuenta master", async ({ page }) => {
    await loginAsMaster(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("mensaje de error con credenciales incorrectas", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill("test@test.com");
    await page.getByPlaceholder("Contraseña").fill("wrong");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText(/credenciales incorrectas/i)).toBeVisible();
  });
});
