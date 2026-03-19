import { expect, type Locator, type Page } from '@playwright/test';

export async function fillWhenEnabled(locator: Locator, value: string, timeout = 15000) {
  await expect(locator).toBeEnabled({ timeout });
  await locator.fill(value);
}

export async function clickWhenEnabled(locator: Locator, timeout = 15000) {
  await expect(locator).toBeEnabled({ timeout });
  await locator.click();
}

export async function fillByLabel(page: Page, label: string | RegExp, value: string, timeout = 15000) {
  await fillWhenEnabled(page.getByLabel(label), value, timeout);
}

export async function selectComboboxOption(page: Page, label: string, option: RegExp) {
  const combobox = page.getByRole('combobox', { name: new RegExp(label, 'i') });
  if (await combobox.count()) {
    await combobox.first().click();
  } else {
    await page.getByLabel(label).click();
  }

  const optionLocator = page.getByRole('option', { name: option });
  await optionLocator.first().waitFor({ state: 'visible', timeout: 5000 });
  await optionLocator.first().click();
}
