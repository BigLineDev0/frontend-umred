import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { provideRouter, TitleStrategy, withInMemoryScrolling } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './Core/interceptors/auth.interceptor';
import { MessageService } from 'primeng/api';
import { PageTitleStrategy } from './Core/services/page-title.strategy';

// Sans locale française, le DatePipe affichait les mois en anglais ("12 March 2026").
registerLocaleData(localeFr);

// Textes internes des composants PrimeNG (calendrier, force du mot de passe,
// listes vides, dialogues de confirmation), anglais par défaut.
const TRADUCTION_FR = {
  dayNames: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  dayNamesShort: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
  dayNamesMin: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
  monthNames: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  monthNamesShort: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  firstDayOfWeek: 1,
  today: "Aujourd'hui",
  clear: 'Effacer',
  weekHeader: 'Sem',
  dateFormat: 'dd/mm/yy',
  weak: 'Faible',
  medium: 'Moyen',
  strong: 'Fort',
  passwordPrompt: 'Saisissez un mot de passe',
  emptyMessage: 'Aucun résultat',
  emptyFilterMessage: 'Aucun résultat trouvé',
  emptySearchMessage: 'Aucun résultat trouvé',
  searchMessage: '{0} résultats disponibles',
  selectionMessage: '{0} éléments sélectionnés',
  accept: 'Oui',
  reject: 'Non',
  choose: 'Choisir',
  upload: 'Envoyer',
  cancel: 'Annuler',
  noFilter: 'Aucun filtre',
};

const UmredPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#EBF1FD',
      100: '#D6E3FB',
      200: '#ADC7F7',
      300: '#84AAF3',
      400: '#5B8EEF',
      500: '#1848D9', // Bleu principal
      600: '#1540BF', // Bleu foncé
      700: '#123699',
      800: '#0E2B7A',
      900: '#0B215C',
      950: '#07173D'
    },
    colorScheme: {
      light: {
        text: {
          color: '#111827',       // Texte
          mutedColor: '#6B7280'   // Texte secondaire
        }
      }
    }
  }
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'fr' },
    { provide: TitleStrategy, useClass: PageTitleStrategy },
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })),
    provideHttpClient(withInterceptors([authInterceptor])),
    MessageService,
    providePrimeNG({
      translation: TRADUCTION_FR,
      // L'animation .animate-stagger crée un contexte d'empilement par section :
      // les overlays (select, datepicker...) restés dans leur section passaient
      // sous le tableau suivant. On les attache au body pour tous les composants.
      overlayAppendTo: 'body',
      theme: {
          preset: UmredPreset,
          options: {
          darkModeSelector: false,
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng'
          }
        }

      }
    })
  ]
};


