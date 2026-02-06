const { chromium } = require('playwright');

const baseURL = process.env.CRM_BASE_URL || 'http://127.0.0.1:5173';
const email = process.env.CRM_EMAIL || '';
const password = process.env.CRM_PASSWORD || '';

const outDir = 'output/playwright';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fillFirst(page, selectors, value) {
  for (const selector of selectors) {
    const loc = page.locator(selector).first();
    if (await loc.count()) {
      await loc.fill(value);
      return true;
    }
  }
  return false;
}

async function clickFirst(page, selectors) {
  for (const selector of selectors) {
    const loc = page.locator(selector).first();
    if (await loc.count()) {
      await loc.click();
      return true;
    }
  }
  return false;
}

async function tryFillByLabel(page, labels, value) {
  for (const label of labels) {
    const loc = page.getByLabel(label, { exact: false });
    if (await loc.count()) {
      await loc.first().fill(value);
      return true;
    }
  }
  return false;
}

async function tryFillByPlaceholder(page, placeholders, value) {
  for (const placeholder of placeholders) {
    const loc = page.locator(`input[placeholder*="${placeholder}" i]`).first();
    if (await loc.count()) {
      await loc.fill(value);
      return true;
    }
  }
  return false;
}

async function trySelectFirst(page) {
  const select = page.locator('select').first();
  if (await select.count()) {
    const options = select.locator('option:not([disabled])');
    if (await options.count()) {
      const value = await options.nth(0).getAttribute('value');
      if (value !== null) {
        await select.selectOption(value);
        return true;
      }
    }
  }
  return false;
}

async function fillBasicForm(page, root) {
  const scope = root || page;
  const inputs = scope.locator('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])');
  const count = await inputs.count();
  for (let i = 0; i < Math.min(count, 6); i += 1) {
    const input = inputs.nth(i);
    try {
      const type = (await input.getAttribute('type')) || 'text';
      const name = (await input.getAttribute('name')) || '';
      const placeholder = (await input.getAttribute('placeholder')) || '';
      let value = 'Test';
      if (type === 'email' || /mail/i.test(name + placeholder)) value = 'test@example.com';
      else if (type === 'tel' || /tel|phone/i.test(name + placeholder)) value = '5551112233';
      else if (type === 'number') value = '1000';
      else if (/tutar|amount/i.test(name + placeholder)) value = '1000';
      else if (/ad|isim|name/i.test(name + placeholder)) value = 'Test Musteri';
      else if (/polic|policy/i.test(name + placeholder)) value = 'POL-TEST-001';
      await input.fill(value, { timeout: 2000 });
    } catch (err) {
      continue;
    }
  }
}

function getDateString(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

async function fillCustomerForm(page) {
  await tryFillByLabel(page, ['Musteri Adi', 'Ad Soyad', 'Ad', 'Isim', 'Name'], 'Test Musteri');
  await tryFillByLabel(page, ['Telefon', 'Phone', 'GSM'], '5551112233');
  await tryFillByLabel(page, ['Eposta', 'Email', 'Mail'], 'test@example.com');
  await tryFillByPlaceholder(page, ['ad', 'isim', 'name'], 'Test Musteri');
  await tryFillByPlaceholder(page, ['telefon', 'phone', 'gsm'], '5551112233');
  await tryFillByPlaceholder(page, ['mail', 'email'], 'test@example.com');
  await fillBasicForm(page);
}

async function fillSaleForm(page) {
  await tryFillByLabel(page, ['Musteri', 'Customer'], 'Test Musteri');
  await tryFillByLabel(page, ['Police No', 'Policy No', 'Polic'], 'POL-TEST-001');
  await tryFillByLabel(page, ['Tutar', 'Prim', 'Amount'], '1000');
  await tryFillByLabel(page, ['Baslangic', 'Start Date'], getDateString(0));
  await tryFillByLabel(page, ['Bitis', 'End Date'], getDateString(30));
  await tryFillByPlaceholder(page, ['polic', 'policy'], 'POL-TEST-001');
  await tryFillByPlaceholder(page, ['tutar', 'prim', 'amount'], '1000');
  await trySelectFirst(page);
  await fillBasicForm(page);
}

async function fillCommissionForm(page) {
  await tryFillByLabel(page, ['Komisyon', 'Oran', 'Rate', 'Yuzde'], '10');
  await tryFillByLabel(page, ['Tutar', 'Amount'], '1000');
  await tryFillByPlaceholder(page, ['komisyon', 'oran', 'rate', 'yuzde'], '10');
  await trySelectFirst(page);
}

async function softCheckSuccess(page) {
  const candidates = [
    'text=/Basarili/i',
    'text=/Kaydedildi/i',
    'text=/Kayit/i',
    'text=/Olusturuldu/i',
    'text=/Guncellendi/i'
  ];
  for (const sel of candidates) {
    const loc = page.locator(sel).first();
    try {
      if (await loc.count()) {
        await loc.waitFor({ timeout: 1500 });
        return true;
      }
    } catch (err) {
      continue;
    }
  }
  return false;
}

async function assertNoFormErrors(page) {
  const errorSelectors = [
    'text=/zorunlu/i',
    'text=/hata/i',
    'text=/gecersiz/i',
    'text=/gecerli/i',
    '.error',
    '.text-red',
    '[aria-invalid="true"]'
  ];
  for (const sel of errorSelectors) {
    const loc = page.locator(sel).first();
    if (await loc.count()) {
      throw new Error(`Form validation error detected: ${sel}`);
    }
  }
}

async function step(page, name, fn) {
  const safeName = name.replace(/[^a-zA-Z0-9_-]+/g, '_');
  try {
    await fn();
    await page.screenshot({ path: `${outDir}/${safeName}.png`, fullPage: true });
    return { name, ok: true };
  } catch (err) {
    await page.screenshot({ path: `${outDir}/${safeName}_error.png`, fullPage: true });
    return { name, ok: false, error: err && err.message ? err.message : String(err) };
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const results = [];

  results.push(await step(page, '01_login_page', async () => {
    await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
  }));

  results.push(await step(page, '02_login_submit', async () => {
    if (!email || !password) throw new Error('Missing CRM_EMAIL/CRM_PASSWORD env vars');

    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="mail" i]'
    ];
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="sifre" i]'
    ];

    const filledEmail = await fillFirst(page, emailSelectors, email);
    const filledPassword = await fillFirst(page, passwordSelectors, password);
    if (!filledEmail || !filledPassword) throw new Error('Login inputs not found');

    const loginClicked = await clickFirst(page, [
      'button:has-text("Giris Yap")',
      'button[type="submit"]'
    ]);
    if (!loginClicked) throw new Error('Login button not found');

    await page.waitForURL('**/app/**', { timeout: 15000 });
  }));

  results.push(await step(page, '03_dashboard', async () => {
    await page.goto(`${baseURL}/app/dashboard`, { waitUntil: 'domcontentloaded' });
  }));

  results.push(await step(page, '04_quick_new_buttons', async () => {
    await page.goto(`${baseURL}/app/dashboard`, { waitUntil: 'domcontentloaded' });
    await clickFirst(page, [
      'button:has-text("Yeni")',
      'a:has-text("Yeni")'
    ]);
    await sleep(500);
  }));

  results.push(await step(page, '05_sales_page', async () => {
    await page.goto(`${baseURL}/app/sales`, { waitUntil: 'domcontentloaded' });
    await clickFirst(page, [
      'button:has-text("Yeni")',
      'button:has-text("Satis Ekle")'
    ]);
    await sleep(500);
  }));

  results.push(await step(page, '06_create_sale', async () => {
    await page.goto(`${baseURL}/app/sales`, { waitUntil: 'domcontentloaded' });
    await clickFirst(page, [
      'button:has-text("Yeni")',
      'button:has-text("Satis Ekle")'
    ]);
    await sleep(500);
    const dialog = page.locator('[role="dialog"], .modal, .dialog, .sheet').first();
    const dialogCount = await dialog.count();
    if (dialogCount) {
      await fillSaleForm(dialog);
    } else {
      await fillSaleForm(page);
    }
    await sleep(300);
    await clickFirst(page, [
      'button:has-text("Kaydet")',
      'button:has-text("Kaydi Kaydet")',
      'button:has-text("Olustur")',
      'button[type="submit"]'
    ]);
    await sleep(700);
    await softCheckSuccess(page);
    await assertNoFormErrors(page);
  }));

  results.push(await step(page, '07_customers_page', async () => {
    await page.goto(`${baseURL}/app/customers`, { waitUntil: 'domcontentloaded' });
  }));

  results.push(await step(page, '08_create_customer', async () => {
    await page.goto(`${baseURL}/app/customers`, { waitUntil: 'domcontentloaded' });
    const opened = await clickFirst(page, [
      'button:has-text("Yeni Musteri")',
      'button:has-text("Yeni")'
    ]);
    if (!opened) throw new Error('Yeni Musteri butonu bulunamadi');
    await sleep(500);
    const dialog = page.locator('[role="dialog"], .modal, .dialog, .sheet').first();
    const dialogCount = await dialog.count();
    if (dialogCount) {
      await fillCustomerForm(dialog);
    } else {
      await fillCustomerForm(page);
    }
    await sleep(300);
    await clickFirst(page, [
      'button:has-text("Kaydet")',
      'button:has-text("Olustur")',
      'button[type="submit"]'
    ]);
    await sleep(700);
    await softCheckSuccess(page);
    await assertNoFormErrors(page);
  }));

  results.push(await step(page, '09_portfolio_sales_dashboard', async () => {
    await page.goto(`${baseURL}/app/dashboard/sales`, { waitUntil: 'domcontentloaded' });
  }));

  results.push(await step(page, '10_cancellations_dashboard', async () => {
    await page.goto(`${baseURL}/app/dashboard/cancellations`, { waitUntil: 'domcontentloaded' });
  }));

  results.push(await step(page, '11_commissions_page', async () => {
    await page.goto(`${baseURL}/app/commissions`, { waitUntil: 'domcontentloaded' });
  }));

  results.push(await step(page, '12_commission_simulation', async () => {
    await page.goto(`${baseURL}/app/commissions`, { waitUntil: 'domcontentloaded' });
    await clickFirst(page, [
      'button:has-text("Simulasyon")',
      'button:has-text("Komisyon")',
      'button:has-text("Ekle")'
    ]);
    await sleep(500);
    const dialog = page.locator('[role="dialog"], .modal, .dialog, .sheet').first();
    const dialogCount = await dialog.count();
    if (dialogCount) {
      await fillCommissionForm(dialog);
    } else {
      await fillCommissionForm(page);
    }
    await sleep(300);
    await clickFirst(page, [
      'button:has-text("Hesapla")',
      'button:has-text("Guncelle")',
      'button:has-text("Kaydet")',
      'button[type="submit"]'
    ]);
    await sleep(700);
    await softCheckSuccess(page);
    await assertNoFormErrors(page);
  }));

  results.push(await step(page, '13_branch_kpi_page', async () => {
    await page.goto(`${baseURL}/app/kpi`, { waitUntil: 'domcontentloaded' });
    await sleep(500);
  }));

  results.push(await step(page, '14_approvals_page', async () => {
    await page.goto(`${baseURL}/app/approvals`, { waitUntil: 'domcontentloaded' });
    await sleep(500);
  }));

  results.push(await step(page, '15_renewals_page', async () => {
    await page.goto(`${baseURL}/app/renewals`, { waitUntil: 'domcontentloaded' });
    await sleep(500);
  }));

  const summaryPath = `${outDir}/summary.json`;
  require('fs').writeFileSync(summaryPath, JSON.stringify({ results }, null, 2));

  await browser.close();

  const failed = results.filter(r => !r.ok);
  if (failed.length) {
    console.error('Playwright flow completed with failures:', failed);
    process.exit(1);
  } else {
    console.log('Playwright flow completed successfully.');
  }
})();
