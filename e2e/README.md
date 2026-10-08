# Tests responsive (Playwright)

Vérifient, sur iOS (webkit) et Android (chromium), qu'aucune page ne défile
horizontalement et que le bouton d'envoi du chatbot reste visible.

## Installation (une fois)

```bash
npm i -D @playwright/test
npx playwright install        # télécharge webkit + chromium
```

## Exécution

L'application doit être accessible (dev server ou build servi) :

```bash
npm start   # dans un terminal (http://localhost:4200)
```

Puis, dans un autre terminal :

```bash
# Pages publiques uniquement
npm run e2e

# Avec un compte de test (couvre les pages protégées) — NE PAS committer ces valeurs
E2E_BASE_URL=http://localhost:4200 \
E2E_EMAIL="…" E2E_PASSWORD="…" \
npm run e2e

npm run e2e:report   # ouvre le rapport HTML
```

Appareils couverts (playwright.config.ts) : iPhone SE, iPhone 14, iPad Mini,
Pixel 7. Largeurs testées en plus : 320, 360, 390, 412, 768, 1024.

Captures produites dans `e2e/screenshots/<appareil>/`.
