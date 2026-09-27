# UMRED — Frontend

Interface utilisateur de la plateforme UMRED, application Angular construite en composants autonomes (`standalone`) avec des signaux plutôt que des observables pour la gestion d'état locale.

Ce dépôt consomme l'API du backend Django REST Framework et intègre un assistant conversationnel branché sur le service FastAPI du projet.

## Sommaire

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration des environnements](#configuration-des-environnements)
- [Lancement](#lancement)
- [Structure du projet](#structure-du-projet)
- [Rôles et accès](#rôles-et-accès)
- [Authentification](#authentification)
- [Bibliothèques principales](#bibliothèques-principales)
- [Build de production](#build-de-production)
- [Tests](#tests)

## Prérequis

- Node.js 20 ou supérieur
- Angular CLI (`npm install -g @angular/cli`)
- Le backend Django et, pour tester l'assistant, le service FastAPI, doivent tourner en parallèle

## Installation

```bash
git clone <url-du-depot>
cd frontend
npm install
```

## Configuration des environnements

Les URLs des deux services backend sont définies dans `src/environments/` :

```typescript
// environment.developpement.ts (développement)
export const environment = {
  apiUrl: 'http://localhost:8000/api',
  aiApiUrl: 'http://localhost:8001/api'
};
```

Le fichier `environment.ts` doit pointer vers les URLs réellement déployées avant toute mise en production. Aucune de ces valeurs ne doit contenir de secret : l'authentification se fait uniquement par jeton, jamais par une clé embarquée côté client.

## Lancement

```bash
ng serve
```

L'application est servie sur `http://localhost:4200`.

## Structure du projet

```
src/app/
├── Core/
│   ├── services/           Un service par domaine métier (reservation, equipement, maintenance, consommable, projet, assistant...)
│   ├── models/             Interfaces TypeScript correspondant aux serializers du backend
│   ├── guards/              authGuard, roleGuard
│   └── interceptors/        Ajout automatique du jeton, rafraîchissement silencieux
├── Shared/
│   ├── components/         Composants réutilisés entre plusieurs pages (tableaux, badges de statut, en-tête et pied de page publics, assistant conversationnel)
│   ├── directives/          RevealDirective (animation au scroll), ParallaxDirective
│   └── utils/                Fonctions pures partagées (calcul de plage de dates, badges de journal)
└── Features/
    ├── auth/                 Connexion, inscription, définition du mot de passe
    ├── dashboard/            Un tableau de bord par rôle
    ├── reservations/         Formulaire, liste, validation, alternatives de conflit
    ├── laboratoires/
    ├── equipements/
    ├── maintenances/
    ├── consommables/
    ├── projets/
    ├── utilisateurs/
    ├── rapports/             Statistiques et export Excel
    ├── journal-activite/
    ├── notifications/
    ├── profil/
    ├── home/, a-propos/, contact/   Pages publiques, hors authentification
```

Chaque page suit la même convention : un composant `*.ts` porteur de la logique et des signaux, un gabarit `*.html` séparé, jamais de logique métier dupliquée entre deux composants qui pourraient partager un service.

## Rôles et accès

Quatre rôles déterminent ce qu'un utilisateur voit et peut faire : `ADMIN`, `TECHNICIEN`, `CHERCHEUR`, `ETUDIANT`. La sidebar et les routes protégées sont construites à partir de ce rôle, jamais codées en dur par page :

- `authGuard` protège l'ensemble des routes sous `/app`, redirige vers `/connexion` avec l'URL d'origine mémorisée dans les paramètres de requête.
- `roleGuard([...roles])` restreint une route à une liste de rôles précise, par exemple la validation des réservations ou la gestion des utilisateurs.

Ces restrictions côté interface sont une aide à l'usage, pas une mesure de sécurité : chaque endpoint sensible applique sa propre vérification de permission côté backend, indépendamment de ce que montre l'interface.

## Authentification

Le jeton d'accès est conservé en mémoire et rafraîchi automatiquement par un intercepteur HTTP avant expiration. Un seul rafraîchissement est déclenché à la fois, même si plusieurs requêtes échouent simultanément avec un jeton expiré, pour éviter une rotation concurrente qui invaliderait les jetons les uns après les autres.

## Bibliothèques principales

| Bibliothèque | Usage |
|---|---|
| PrimeNG | Composants d'interface (tableaux, formulaires, boîtes de dialogue, sélecteurs de date) |
| Tailwind CSS | Mise en forme utilitaire, cohérente avec la charte graphique du projet |
| Chart.js (via `primeng/chart`) | Graphiques du tableau de bord et des rapports |

La charte graphique repose sur un jeu de couleurs fixe (bleu principal, bleu foncé, accent orange, bleu marine pour les fonds de rupture), appliqué de façon identique sur les pages internes et les pages publiques.

## Build de production

```bash
ng build --configuration production
```

Les fichiers générés dans `dist/` sont prêts à être servis par n'importe quel hébergeur de fichiers statiques. Vérifiez que `environment.prod.ts` référence bien les URLs de production avant de lancer le build.

## Tests

```bash
ng test
```
