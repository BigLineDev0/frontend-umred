import { HttpErrorResponse } from '@angular/common/http';
import { messageErreur } from './message-erreur';

function erreur(status: number, error: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error });
}

describe('messageErreur', () => {
  it('lit le champ detail', () => {
    expect(messageErreur(erreur(403, { detail: 'Accès refusé.' }))).toBe('Accès refusé.');
  });

  it('lit une règle métier renvoyée sous forme de liste', () => {
    expect(messageErreur(erreur(400, ['Créneau déjà passé.']))).toBe('Créneau déjà passé.');
  });

  it("lit la première erreur d'un champ", () => {
    expect(messageErreur(erreur(400, { email: ['Adresse déjà utilisée.'] }))).toBe('Adresse déjà utilisée.');
  });

  it('signale un serveur injoignable', () => {
    expect(messageErreur(erreur(0, null))).toContain('Serveur injoignable');
  });

  it("n'affiche pas une page HTML d'erreur", () => {
    expect(messageErreur(erreur(500, '<!doctype html><h1>Server Error</h1>'), 'Défaut')).toBe('Défaut');
  });

  it('utilise le message par défaut sinon', () => {
    expect(messageErreur(erreur(500, {}), 'Défaut')).toBe('Défaut');
  });
});
