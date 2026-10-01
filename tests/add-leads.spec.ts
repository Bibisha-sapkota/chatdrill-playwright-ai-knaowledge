import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

type Lead = {
  name: string;
  phone: string;
  email: string;
  location: string;
  status: string;
  source: string;
  notes: string;
};

const leads: Lead[] = parse(
  fs.readFileSync(path.join(process.cwd(), 'leads.csv'), 'utf-8'),
  { columns: true, skip_empty_lines: true },
);

console.log(`📄 CSV bata ${leads.length} ota lead padhiyo`);

test.describe.configure({ mode: 'serial' });

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await (await browser.newContext()).newPage();

  try {
    await page.goto('https://app.chatdrill.com/');
    await page
      .getByRole('textbox', { name: 'you@company.com' })
      .fill('bibishasapkota0+essentialteamleader@gmail.com');
    await page.locator('input[type="password"]').fill('12345678Aa#');
    await page.getByRole('button', { name: 'Login' }).click();
    console.log('1️⃣ Login button clicked');

    await page.waitForURL(/\/admin/, { timeout: 20_000 });
    console.log('2️⃣ Dashboard loaded, URL:', page.url());

    const leadsLink = page.locator('a[href="/admin/leads"]').first();
    try {
      await leadsLink.click({ timeout: 8_000 });
    } catch {
      console.log('⚠️ Link click fail bhayo, seedhai URL ma jaadai chhu');
      await page.goto('https://app.chatdrill.com/admin/leads');
    }

    await expect(page.getByRole('button', { name: /New Lead/ })).toBeVisible({
      timeout: 15_000,
    });
    console.log('3️⃣ Leads page ma pugyo, URL:', page.url());
  } catch (err) {
    await page.screenshot({ path: 'beforeall-failure.png', fullPage: true });
    console.log('❌ beforeAll fail bhayo. URL:', page.url());
    throw err;
  }
});

test.afterAll(async () => {
  console.log(`\n📋 Total leads attempted: ${leads.length}`);
  await page.context().close();
});

for (const [i, lead] of leads.entries()) {
  test(`Add lead #${i + 1}: ${lead.name}`, async () => {
    await page.getByRole('button', { name: /New Lead/ }).click();

    await page.getByRole('textbox', { name: 'e.g. Jane Smith' }).fill(lead.name);
    await page.getByRole('textbox', { name: '+1 9882' }).fill(lead.phone);
    await page.getByRole('textbox', { name: 'jane@gmail.com' }).fill(lead.email);
    await page.getByRole('textbox', { name: 'San Francisco, CA' }).fill(lead.location);
    await page.getByRole('combobox').nth(1).selectOption(lead.status);
    await page.getByRole('combobox').nth(2).selectOption(lead.source);
    await page
      .getByRole('textbox', { name: 'Add any specific requirement' })
      .fill(lead.notes);

    await page.getByRole('button', { name: 'Add Lead' }).click();

    // Duplicate warning aayo bhane "Add anyway" click garne
    const addAnyway = page.getByRole('button', { name: 'Add anyway' });
    try {
      await addAnyway.waitFor({ state: 'visible', timeout: 2_000 });
      await addAnyway.click();
      console.log(`⚠️ Duplicate warning aayo, "Add anyway" click gare: ${lead.name}`);
    } catch {
      // warning aayena, normal flow
    }

    // Form band bhayo bhane lead add bhayo
    await expect(page.getByRole('button', { name: 'Add Lead' })).toBeHidden({
      timeout: 10_000,
    });

    console.log(`✅ [${i + 1}/${leads.length}] Added: ${lead.name} | ${lead.email}`);
  });
}