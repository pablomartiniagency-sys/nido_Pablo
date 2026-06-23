import { Page } from "@playwright/test";

export async function loginAsDemo(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /probar demo/i }).click();
  await page.waitForURL("**/dashboard");
  await dismissOnboarding(page);
}

export async function loginAsMaster(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("pablomartiniagency@gmail.com");
  await page.getByPlaceholder("Contraseña").fill("RKewpablomartin90!2");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/dashboard");
  await dismissOnboarding(page);
}

async function dismissOnboarding(page: Page) {
  await page.waitForTimeout(800);
  try {
    const skip = page.getByRole("button", { name: /saltar tour/i });
    await skip.click({ timeout: 3000 });
    await page.waitForTimeout(300);
  } catch {
    // onboarding might not have appeared
  }
}
