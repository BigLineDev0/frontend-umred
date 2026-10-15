# SenLab — Interface web (frontend)

Application **Angular** de SenLab, plateforme de gestion des réservations, des équipements, de la maintenance et des consommables des laboratoires de recherche universitaires.

Elle consomme deux services :

- l'**API métier Django** (`../backend`) pour toutes les données et les règles de gestion ;
- le **service IA FastAPI** (`../umred-labo-ia`) pour l'assistant conversationnel et la synthèse de la page « Aide à la décision ».

L'interface ne contient aucune règle métier décisive. Les restrictions d'affichage par rôle servent l'ergonomie : la sécurité est appliquée par l'API.

---

## Sommaire

1. [Stack technique](#1-stack-technique)
2. [Prérequis](#2-prérequis)
3. [Installation et lancement](#3-installation-et-lancement)
4. [Configuration des environnements](#4-configuration-des-environnements)
5. [Structure du projet](#5-structure-du-projet)
6. [Routage et accès par rôle](#6-routage-et-accès-par-rôle)
7. [Authentification](#7-authentification)
8. [Communication avec les services](#8-communication-avec-les-services)
9. [Fonctionnalités par écran](#9-fonctionnalités-par-écran)
10. [Assistant conversationnel](#10-assistant-conversationnel)
11. [Charte graphique et personnalisation par établissement](#11-charte-graphique-et-personnalisation-par-établissement)
12. [Conventions de code](#12-conventions-de-code)
13. [Tests](#13-tests)
14. [Build et déploiement](#14-build-et-déploiement)
15. [Dépannage](#15-dépannage)

---

## 1. Stack technique

| Outil | Version | Usage |
|---|---|---|
| Angular | 22.2 | Framework : composants autonomes (`standalone`), signaux, chargement différé des routes |
| TypeScript | 6.0 | Typage strict |
| PrimeNG + PrimeIcons | 21 / 7 | Composants d'interface : tableaux, formulaires, dialogues, sélecteurs de date |
| Tailwind CSS | 4.1 | Mise en forme utilitaire (via PostCSS) |
| Chart.js | 4.5 | Graphiques des tableaux de bord et des rapports |
| qrcode | 1.5 | QR code imprimable sur la fiche de chaque équipement |
| RxJS | 7.8 | Appels HTTP |
| Vitest + jsdom | 4 / 28 | Tests unitaires (`@angular/build:unit-test`) |
| Playwright | — | Tests de bout en bout responsive (`e2e/`) |
| Prettier | 3.8 | Formatage |

## 2. Prérequis

- **Node.js** 20.19 ou supérieur (l'image Docker utilise Node 24) et npm 11.
- L'**API Django** joignable. Pour l'assistant et la page « Aide à la décision », le **service IA** aussi.

Le plus simple est de lancer toute la pile avec Docker Compose depuis `../backend` (voir le README du backend). Le frontend est alors servi sur http://localhost:8090.

## 3. Installation et lancement

```bash
cd frontend
npm install --legacy-peer-deps
npm start                 # ng serve → http://localhost:4200
```

> `--legacy-peer-deps` est nécessaire tant que PrimeNG 21 déclare Angular 21 comme dépendance « peer » alors que le projet utilise Angular 22. Cela fonctionne en pratique.

| Script npm | Commande | Usage |
|---|---|---|
| `npm start` | `ng serve` | Serveur de développement, rechargement à chaud |
| `npm run build` | `ng build` | Build de production (`dist/frontend/browser`) |
| `npm run watch` | `ng build --watch -c development` | Build continu |
| `npm test` | `ng test` | Tests unitaires (Vitest) |
| `npm run e2e` | `playwright test` | Tests responsive (voir `e2e/README.md`) |
| `npm run e2e:report` | — | Rapport HTML des tests Playwright |

## 4. Configuration des environnements

Les adresses des deux services sont définies dans `src/environments/`. Le fichier utilisé dépend de la configuration de build (`angular.json`).

| Fichier | Configuration | `apiUrl` | `aiApiUrl` |
|---|---|---|---|
| `environment.development.ts` | `ng serve` (development) | `http://localhost:8010/api` | `http://localhost:8011/api` |
| `environment.docker.ts` | `ng build -c docker` (image Docker) | régénéré par le `Dockerfile` à partir de `API_URL` et `IA_URL` | idem |
| `environment.ts` | `ng build` (production, défaut) | `https://api.senlab.site/api` | `https://ia.senlab.site/api` |

Les valeurs de développement visent les ports publiés par Docker Compose. Si l'API tourne avec `python manage.py runserver`, remplacez-les par `http://localhost:8000/api` et `http://localhost:8001/api`.

Aucun secret ne doit figurer dans ces fichiers : ils sont publics une fois l'application compilée.

## 5. Structure du projet

```
src/
├── app/
│   ├── app.config.ts          Fournisseurs : routeur, HttpClient + intercepteur, PrimeNG (preset SenLab), locale « fr »
│   ├── app.routes.ts          Routes racine (pages publiques, espace connecté, 404)
│   ├── Core/
│   │   ├── guards/            authGuard, guestGuard, roleGuard
│   │   ├── interceptors/      authInterceptor : ajout du jeton, rafraîchissement automatique
│   │   ├── models/            Interfaces TypeScript alignées sur les serializers de l'API
│   │   ├── services/          Un service par domaine (auth, reservation, equipement, maintenance,
│   │   │                      consommable, laboratoire, projet, utilisateur, organisation,
│   │   │                      notification, journal, recherche, pilotage, assistant…)
│   │   └── theme/             Palette SenLab (preset PrimeNG)
│   ├── Layout/                main-layout (espace connecté), sidebar, topbar, footer, auth-layout
│   ├── Features/              Une fonctionnalité par dossier (voir §9)
│   ├── Shared/
│   │   ├── components/        data-table, filter-bar, page-header, stat-card, status-badge,
│   │   │                      reservations-calendar, assistant-chat-app, modales…
│   │   ├── directives/        reveal (animation au défilement), parallax, image-repli
│   │   ├── pipes/ utils/ validators/
│   ├── home/ about/ contact/  Pages publiques
│   └── not-found/             Page 404
├── environments/
└── styles.css                 Styles globaux et jetons de couleur
public/                        Logos SenLab, images, vidéo de présentation
e2e/                           Tests Playwright responsive
docker/nginx.conf              Configuration Nginx de l'image
```

## 6. Routage et accès par rôle

Toutes les fonctionnalités sont chargées à la demande (`loadChildren` / `loadComponent`).

### Pages publiques

| Route | Page | Garde |
|---|---|---|
| `/` | Accueil | — |
| `/a-propos`, `/contact` | Pages vitrines | — |
| `/connexion`, `/inscription`, `/mot-de-passe-oublie` | Authentification | `guestGuard` (redirige un utilisateur déjà connecté) |
| `/activer-compte/:jeton`, `/definir-mot-de-passe/:jeton` | Liens reçus par e-mail | `guestGuard` / — |

### Espace connecté

L'espace connecté est protégé par `authGuard`, qui redirige vers `/connexion?returnUrl=…`.

Après connexion, chaque rôle arrive sur sa page d'accueil :

| Rôle (API) | Libellé | Page d'accueil |
|---|---|---|
| `SUPER_ADMIN` | Super-administrateur | `/plateforme` |
| `ADMIN` | Administrateur | `/admin/dashboard` |
| `TECHNICIEN` | Technicien | `/technicien/dashboard` |
| `CHERCHEUR` | Membre du laboratoire (enseignant-chercheur, doctorant) | `/enseignant/dashboard` |
| `ETUDIANT` | Étudiant | `/etudiant/dashboard` |

| Route | Rôles autorisés (`roleGuard`) |
|---|---|
| `/reservations/ajouter` | tous |
| `/reservations/a-valider` | TECHNICIEN, CHERCHEUR, ADMIN |
| `/laboratoires`, `/laboratoires/:id` | tous (création et modification : ADMIN) |
| `/equipements`, `/equipements/:id` | tous (création et modification : ADMIN, TECHNICIEN) |
| `/consommables`, `/consommables/:id` | tous (création et modification : ADMIN, TECHNICIEN) |
| `/maintenances`, `/maintenances/pannes`, `/maintenances/:id` | ADMIN, TECHNICIEN |
| `/utilisateurs`, `/utilisateurs/:id` | ADMIN |
| `/rapports`, `/journal-activite`, `/etablissement` | ADMIN |
| `/pilotage` (Aide à la décision) | ADMIN, TECHNICIEN |
| `/plateforme` (Console plateforme) | SUPER_ADMIN |
| `/notifications`, `/profil` | tous |

Si un rôle n'a pas accès à une route, `roleGuard` le renvoie vers sa page d'accueil. La barre latérale est construite à partir du rôle, pas codée en dur page par page.

## 7. Authentification

- **Connexion.** `POST /auth/login/` renvoie un jeton d'accès (30 minutes), un jeton de rafraîchissement (7 jours) et le profil. Ils sont conservés dans le `localStorage` (`access_token`, `refresh_token`, `current_user`).
- **Intercepteur** (`authInterceptor`) :
  - il ajoute `Authorization: Bearer …` à chaque requête ;
  - sur une réponse 401, il rafraîchit le jeton puis rejoue la requête ;
  - **un seul rafraîchissement à la fois** : les requêtes simultanées attendent son résultat, ce qui évite une rotation concurrente qui invaliderait les jetons ;
  - les routes `login`, `refresh` et `logout` ne déclenchent jamais de rafraîchissement, pour éviter les boucles ;
  - si le rafraîchissement échoue, l'utilisateur est déconnecté et les requêtes en attente sont libérées.
- **Déconnexion.** `POST /auth/logout/` met le jeton de rafraîchissement en liste noire côté API, puis le stockage local est vidé.
- **Suspension.** Si l'établissement est suspendu ou le compte désactivé, l'API refuse les jetons existants : l'utilisateur est renvoyé vers la connexion.

> Le `localStorage` est exposé en cas de faille XSS. Angular échappe les contenus par défaut ; n'utilisez jamais `innerHTML` ou `bypassSecurityTrust…` avec des données non maîtrisées.

## 8. Communication avec les services

- **Un service Angular par domaine** dans `Core/services/`. Les composants n'appellent jamais `HttpClient` directement.
- **Modèles alignés sur l'API** : les interfaces de `Core/models/` reprennent les champs des serializers Django. Toute modification de l'API doit y être répercutée.
- **API métier** : `environment.apiUrl` (réservations, équipements, rapports, `pilotage/indicateurs/`…).
- **Service IA** : `environment.aiApiUrl`, avec trois routes :
  - `POST /chat` : message de l'assistant ;
  - `GET /chat/accueil` : message d'accueil personnalisé ;
  - `GET /pilotage/synthese` : synthèse rédigée par le modèle sur la page « Aide à la décision ».
- **Messages d'erreur** : `Shared/utils/message-erreur.ts` transforme les erreurs de l'API en messages lisibles en français.
- **Notifications** : le compteur de la cloche est chargé au démarrage, puis rafraîchi toutes les 60 s tant que l'onglet est visible et l'utilisateur connecté.

## 9. Fonctionnalités par écran

| Dossier `Features/` | Contenu |
|---|---|
| `auth/` | Connexion, inscription d'un étudiant (choix de l'établissement), mot de passe oublié, activation, définition du mot de passe |
| `dashboard/` | Un tableau de bord par rôle : indicateurs, prochaines réservations, notifications, étudiants encadrés, alertes (pannes, maintenances, stocks) |
| `reservations/` | Formulaire en étapes (laboratoire, projet, créneau, équipements), écran de vérification avant confirmation avec conflits et créneaux alternatifs, mes réservations, demandes à valider avec recommandation, calendrier |
| `laboratoires/` | Liste, fiche, création et modification |
| `equipements/` | Liste filtrable, fiche détaillée (manuel PDF, QR code, historique, indicateurs MTBF/MTTR, usure avant maintenance, score de santé) |
| `maintenances/` | Planification, démarrage, clôture, équipements en panne |
| `consommable/` | Stocks, déclaration d'utilisation, réapprovisionnement, historique des mouvements, alertes de seuil et de péremption |
| `utilisateurs/` | Comptes, rôles, activation et désactivation, assignation des encadrants |
| `rapports/` | Statistiques par période et par laboratoire, export PDF et Excel |
| `journal/` | Journal d'activité filtrable |
| `pilotage/` | Aide à la décision : indicateurs et synthèse rédigée par l'IA |
| `etablissement/` | Paramètres de l'établissement : identité visuelle, horaires par jour, règles de réservation |
| `plateforme/` | Console du super-administrateur : établissements, création, suspension, statistiques |
| `notifications/`, `profil/` | Notifications et profil utilisateur |

## 10. Assistant conversationnel

Le composant `Shared/components/assistant-chat-app` est accessible par le bouton flottant de l'espace connecté.

- **Session.** Chaque conversation a un `session_id` généré par `crypto.randomUUID()`, transmis à chaque message.
- **Affichage selon le type de réponse.** La réponse du service IA porte un `type` qui pilote l'affichage : message, boutons d'options, liste de créneaux, carte de confirmation, boutons de navigation, refus.
- **Liens internes uniquement.** Les boutons de navigation ne mènent qu'à des routes internes, validées côté service IA.
- **Confirmation obligatoire.** Une réservation n'est jamais créée sans clic explicite sur la carte de confirmation.
- **Mode dégradé.** Si le service IA est indisponible, l'assistant affiche un message d'erreur sans bloquer le reste de l'application.

## 11. Charte graphique et personnalisation par établissement

- **Palette SenLab** (`Core/theme/senlab-palette.ts`) : couleur primaire `#1B2CC1`, barre latérale `#091540`, nuances 50 à 950 et surfaces grises bleutées. Elle sert de preset à PrimeNG et de jetons CSS pour Tailwind.
- **Personnalisation par établissement.** À la connexion, `OrganisationService` applique les couleurs et le logo de l'établissement de l'utilisateur, réglés dans « Mon établissement ». Sans personnalisation, la charte SenLab s'applique.
- **Logos** dans `public/images/` : `logo-senlab.png`, `logo-senlab-white.png`, `senlab-icon.png`.
- **Responsive** : interface utilisable du smartphone (320 px) au grand écran, vérifiée par les tests Playwright.

## 12. Conventions de code

- **Composants autonomes** uniquement, un composant par dossier : `*.ts` (logique et signaux) et `*.html` (gabarit) séparés.
- **État local** en signaux (`signal`, `computed`). RxJS est réservé aux flux HTTP.
- **Pas de logique dupliquée** : tout ce qui est partagé passe par un service de `Core/` ou un utilitaire de `Shared/`.
- **Nommage en français** pour le métier (`reservation`, `equipement`, `consommable`), cohérent avec l'API.
- **Formatage** avec Prettier : `npx prettier --write src`.

## 13. Tests

```bash
npm test          # tests unitaires (Vitest + jsdom)
npm run e2e       # tests responsive Playwright (voir e2e/README.md)
```

Tests unitaires existants (30 tests) :

- `app.spec.ts` (composant racine) ;
- validateurs de formulaire (`validators.spec.ts`) ;
- accords grammaticaux (`accord.spec.ts`) ;
- traduction des messages d'erreur (`message-erreur.spec.ts`) ;
- mise en forme des réponses de l'assistant (`mise-en-forme.spec.ts`).

Les tests Playwright vérifient, sur iPhone SE, iPhone 14, iPad Mini et Pixel 7 et aux largeurs 320 à 1024 px :

- qu'aucune page ne défile horizontalement ;
- que le bouton d'envoi de l'assistant reste visible.

## 14. Build et déploiement

### Image Docker (pile complète)

Le `Dockerfile` procède en deux étapes :

1. **Build** (Node 24) : `npm ci --legacy-peer-deps`, génération de `environment.docker.ts` à partir des arguments `API_URL` et `IA_URL`, puis `ng build --configuration docker`.
2. **Service** par **Nginx 1.27**, avec la configuration `docker/nginx.conf` :
   - repli de toutes les routes vers `index.html` (routage Angular) ;
   - cache de 30 jours, immuable, pour les fichiers versionnés ; `no-cache` pour `index.html` ;
   - compression gzip ;
   - en-têtes `X-Content-Type-Options`, `X-Frame-Options` et `Referrer-Policy`.

Docker Compose (`../backend/docker-compose.yml`) construit l'image avec les URL de `URL_API` et `URL_IA`, et la publie sur `127.0.0.1:8090`. En production, le Nginx du serveur la sert sur `senlab.site` en HTTPS.

```bash
docker build -t senlab-frontend \
  --build-arg API_URL=https://api.senlab.site/api \
  --build-arg IA_URL=https://ia.senlab.site/api .
docker run -p 8090:80 senlab-frontend
```

### Vercel

`vercel.json` définit :

- l'installation (`npm ci --legacy-peer-deps`) ;
- le build (`ng build --configuration production`) ;
- le dossier de sortie (`dist/frontend/browser`) ;
- la réécriture de toutes les routes vers `index.html` ;
- un cache long pour les fichiers statiques.

Vérifiez que `environment.ts` contient les bonnes URL de production.

### Hébergement statique quelconque

`npm run build` produit `dist/frontend/browser`. Configurez le serveur pour renvoyer `index.html` sur toutes les routes inconnues.

## 15. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Erreur CORS dans la console | Origine du frontend absente de `CORS_ALLOWED_ORIGINS` (API) ou de `CORS_ORIGINS` (service IA) | Ajouter l'origine exacte (schéma + port) |
| Déconnexion à chaque rechargement | Jeton de rafraîchissement refusé (expiré, ou `SECRET_KEY` changée) | Se reconnecter ; vérifier la configuration de l'API |
| L'assistant répond « session expirée » | Clés JWT différentes entre l'API et le service IA | Voir le README du service IA |
| Page blanche sur une URL profonde en production | Pas de repli vers `index.html` | Configurer la réécriture (déjà fait dans Nginx et `vercel.json`) |
| `npm install` échoue (conflit de dépendances) | Dépendance « peer » de PrimeNG | `npm install --legacy-peer-deps` |
