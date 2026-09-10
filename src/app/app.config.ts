import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

import { routes } from './app.routes';

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
    provideRouter(routes),
    providePrimeNG({
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


