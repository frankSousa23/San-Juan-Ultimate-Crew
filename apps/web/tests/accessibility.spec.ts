import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('A11y (Accessibility) Audits', () => {
  test.use({ storageState: 'tests/.auth/admin.json' });

  test('Dashboard should not have automatically detectable accessibility violations', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    
    // Scan the page with Axe
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
      
    // There should be no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Roster page should be accessible', async ({ page }) => {
    await page.goto('http://localhost:5173/roster');
    await page.waitForSelector('button.text-left.bg-white.rounded-xl', { state: 'visible', timeout: 10000 });
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
      
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
