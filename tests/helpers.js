const BASE_URL = 'https://qaplayground.com/bank';

const CREDENTIALS = {
  admin: { username: 'admin', password: 'admin123' },
  viewer: { username: 'viewer', password: 'viewer123' },
};

async function login(page, role = 'admin') {
  const { username, password } = CREDENTIALS[role];
  await page.goto(BASE_URL);
  await page.fill('[data-testid="username-input"]', username);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('**/bank/dashboard', { timeout: 10000 });
}

async function navigateTo(page, section) {
  const nav = page.locator(`[data-testid="nav-${section}"]`);
  await nav.click();
  await page.waitForURL(`**/bank/${section}`, { timeout: 10000 });
  await page.waitForTimeout(1500);
}

module.exports = { BASE_URL, CREDENTIALS, login, navigateTo };