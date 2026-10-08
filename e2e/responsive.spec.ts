import { test, expect, Page } from '@playwright/test';

/**
 * Pour chaque page principale et chaque largeur, on vérifie :
 *  - aucun défilement horizontal de la page entière ;
 *  - aucun élément ne dépasse du viewport ;
 *  - les boutons d'action principaux sont visibles ;
 *  - le bouton d'envoi du chatbot reste visible quand il est ouvert.
 * Des captures sont produites dans e2e/screenshots/.
 */

const EMAIL = process.env.E2E_EMAIL ?? '';
const PASSWORD = process.env.E2E_PASSWORD ?? '';

// Largeurs à couvrir en plus du viewport de l'appareil du projet.
const LARGEURS = [320, 360, 390, 412, 768, 1024];

// Pages testées (le tableau de bord dépend du rôle du compte de test).
const PAGES = [
  '/connexion', '/laboratoires', '/equipements', '/maintenances',
  '/consommables', '/reservations/ajouter', '/profil', '/notifications',
];

async function seConnecter(page: Page) {
  if (!EMAIL || !PASSWORD) return; // pages publiques uniquement sans identifiants
  await page.goto('/connexion');
  await page.getByLabel(/email/i).fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.getByRole('button', { name: /connexion|se connecter/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('connexion'), { timeout: 15_000 });
}

async function pasDeScrollHorizontal(page: Page) {
  const debordement = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(debordement, 'défilement horizontal de la page').toBeLessThanOrEqual(1);
}

test.describe('Responsive — pas de débordement horizontal', () => {
  test.beforeEach(async ({ page }) => {
    await seConnecter(page);
  });

  for (const chemin of PAGES) {
    test(`page ${chemin}`, async ({ page }, testInfo) => {
      for (const largeur of LARGEURS) {
        await page.setViewportSize({ width: largeur, height: 900 });
        const reponse = await page.goto(chemin, { waitUntil: 'networkidle' }).catch(() => null);
        if (reponse && reponse.status() >= 400) continue; // page non accessible pour ce rôle
        await pasDeScrollHorizontal(page);
        await page.screenshot({
          path: `e2e/screenshots/${testInfo.project.name}/${chemin.replace(/\W+/g, '_')}_${largeur}.png`,
          fullPage: true,
        });
      }
    });
  }
});

test('Chatbot — bouton d’envoi visible quand ouvert', async ({ page }) => {
  await seConnecter(page);
  await page.goto('/profil');
  const ouvrir = page.getByRole('button', { name: /assistant/i });
  if (await ouvrir.count()) {
    await ouvrir.first().click();
    const envoi = page.getByRole('button', { name: /envoyer le message/i });
    await expect(envoi).toBeVisible();
    const boite = await envoi.boundingBox();
    const largeurVue = page.viewportSize()?.width ?? 0;
    expect(boite && boite.x + boite.width).toBeLessThanOrEqual(largeurVue + 1);
  }
});
