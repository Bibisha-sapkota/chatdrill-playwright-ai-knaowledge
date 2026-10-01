import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// ================= LOGIN DETAILS =================
const BASE_URL = 'https://app.chatdrill.com';
const EMAIL = 'bibishasapkota0+essentialteamleader@gmail.com';
const PASSWORD = '12345678Aa#';
// =================================================

type Article = { title: string; category: string; content: string };

const articles: Article[] = parse(
  fs.readFileSync(path.join(process.cwd(), 'articles.csv'), 'utf-8'),
  { columns: true, skip_empty_lines: true },
);

console.log(`📄 CSV bata ${articles.length} ota article padhiyo`);

// ---------- "USE HERE" CLICK ----------
async function clickUseHere(page: Page) {
  const useHere = page.locator('button', { hasText: /^\s*Use here\s*$/ }).first();
  const tries: [string, () => Promise<void>][] = [
    ['normal click', () => useHere.click({ timeout: 3_000 })],
    ['force click', () => useHere.click({ force: true, timeout: 3_000 })],
    ['JavaScript click', () => useHere.evaluate((el: HTMLElement) => el.click())],
  ];
  for (const [name, action] of tries) {
    try {
      await action();
      console.log(`   → "Use here" ${name} gare`);
    } catch {
      console.log(`   → "Use here" ${name} fail bhayo`);
    }
    await page.waitForTimeout(2_000);
    if (!(await useHere.isVisible().catch(() => false))) return;
  }
}

// ---------- LOGIN FUNCTION ----------
async function login(page: Page) {
  await page.goto(BASE_URL + '/');

  await page.getByRole('textbox', { name: 'you@company.com' }).fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  console.log('1️⃣ Login button clicked');

  const sidebar = page.locator('a[href="/admin/ai-knowledge"]').first();
  const useHere = page.locator('button', { hasText: /^\s*Use here\s*$/ }).first();

  // URL ko bharosa nagari, screen ko state herera kaam garne
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await sidebar.isVisible().catch(() => false)) {
      console.log('2️⃣ Login successful, URL:', page.url());
      return;
    }

    if (await useHere.isVisible().catch(() => false)) {
      console.log('⚠️ "Use here" screen dekhiyo, URL:', page.url());
      await clickUseHere(page);
      continue;
    }

    await page.waitForTimeout(500);
  }

  // 60 second ma kehi pani bhayena: page ma ke lekhieko chha print garne
  const text = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ');
  console.log('📃 Page ma dekhieko text:', text.slice(0, 400));
  await page.screenshot({ path: 'login-stuck.png', fullPage: true });
  throw new Error('Login pachhi sidebar aayena. URL: ' + page.url() + ' | Screenshot: login-stuck.png');
}

// ---------- AI KNOWLEDGE PAGE MA JANE ----------
async function openKnowledgePage(page: Page) {
  await page.locator('a[href="/admin/ai-knowledge"]').first().click();

  await expect(page.getByRole('button', { name: /Add knowledge/ })).toBeVisible({
    timeout: 20_000,
  });
  console.log('3️⃣ AI Knowledge page ma pugyo, URL:', page.url());
}

test.describe.configure({ mode: 'serial' });

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await (await browser.newContext()).newPage();

  try {
    await login(page);
    await openKnowledgePage(page);
  } catch (err) {
    await page.screenshot({ path: 'beforeall-failure.png', fullPage: true });
    console.log('❌ Login / navigation fail bhayo. URL:', page.url());
    throw err;
  }
});

test.afterAll(async () => {
  console.log(`\n📋 Total articles attempted: ${articles.length}`);
  await page.context().close();
});

// ---------- 10 ARTICLE ADD GARNE ----------
for (const [i, a] of articles.entries()) {
  test(`Add article #${i + 1}: ${a.title}`, async () => {
    const titleBox = page.getByRole('textbox', { name: 'Refund policy' });
    if (!(await titleBox.isVisible())) {
      await page.getByRole('button', { name: /Add knowledge/ }).click();
    }

    await titleBox.fill(a.title);
    await page.getByRole('textbox', { name: 'Billing' }).fill(a.category);
    await page.getByRole('textbox', { name: 'Customers can request a' }).fill(a.content);
    await page.getByRole('checkbox', { name: /Let visitors read this/ }).check();

    await page.getByRole('button', { name: 'Add article' }).click();

    await expect(page.getByText(a.title, { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });

    console.log(`✅ [${i + 1}/${articles.length}] Added: ${a.title} (${a.category})`);
  });
}