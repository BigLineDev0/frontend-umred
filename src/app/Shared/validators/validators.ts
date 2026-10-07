/**
 * Validateurs Reactive Forms partagés — miroir des règles backend
 * (apps/core/validation.py). Factorisés ici une seule fois puis réutilisés
 * par tous les formulaires, au lieu d'être réécrits champ par champ.
 *
 * Chaque validateur, en cas d'erreur, renvoie un objet dont la valeur est
 * directement le message français à afficher ({ nomCommun: 'message' }).
 * `messageErreurChamp` lit ce message, ou traduit les erreurs natives
 * d'Angular (required, email, min...).
 */
import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

const HTML = /<[^>]*>|&#?\w+;/;
const REPETITION = /(.)\1{3,}/;
// Lettres Unicode (accents compris), chiffres, espace et - ' ’ . / ( ) & + ,
const NOM_AUTORISE = /^[\p{L}\p{N} \-'’./()&+,]+$/u;
const UNE_LETTRE = /\p{L}/u;
const REFERENCE = /^[A-Z0-9][A-Z0-9._/-]{1,38}[A-Z0-9]$/;
const TELEPHONE_SN = /^\+2217\d{8}$/;

export function normaliserEspaces(valeur: unknown): string {
  return (typeof valeur === 'string' ? valeur : '').replace(/\s+/g, ' ').trim();
}

/** Nom d'équipement, de laboratoire, de consommable, de personne. */
export function nomCommun(min = 2, max = 100): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valeur = normaliserEspaces(control.value);
    if (!valeur) return null; // le vide est géré par Validators.required
    if (HTML.test(valeur)) return { nomCommun: 'Le texte ne doit pas contenir de balises HTML.' };
    if (valeur.length < min || valeur.length > max)
      return { nomCommun: `Doit comporter entre ${min} et ${max} caractères.` };
    if (!NOM_AUTORISE.test(valeur))
      return { nomCommun: "Caractères non autorisés. Utilisez des lettres, des chiffres, l'espace et - ' . / ( ) & + ," };
    if (!UNE_LETTRE.test(valeur)) return { nomCommun: 'Doit contenir au moins une lettre.' };
    if (REPETITION.test(valeur)) return { nomCommun: "Évitez la répétition d'un même caractère." };
    return null;
  };
}

/** Référence (consommable) : A-Z 0-9 - _ . / , 3 à 40, comparée en majuscules. */
export function reference(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valeur = normaliserEspaces(control.value).toUpperCase();
    if (!valeur) return null;
    if (!REFERENCE.test(valeur))
      return { reference: 'Référence invalide : 3 à 40 caractères parmi A-Z, 0-9, - _ . / (sans espace).' };
    return null;
  };
}

/** Description, motif, notes : HTML interdit, bornes de longueur. */
export function texteLong(opts: { min?: number; max?: number; obligatoire?: boolean } = {}): ValidatorFn {
  const { min = 0, max = 2000, obligatoire = false } = opts;
  return (control: AbstractControl): ValidationErrors | null => {
    const valeur = (typeof control.value === 'string' ? control.value : '').trim();
    if (!valeur) return obligatoire ? { texteLong: 'Ce champ est obligatoire.' } : null;
    if (HTML.test(valeur)) return { texteLong: 'Le texte ne doit pas contenir de balises HTML.' };
    if (valeur.length < min) return { texteLong: `Doit comporter au moins ${min} caractères.` };
    if (valeur.length > max) return { texteLong: `Ne doit pas dépasser ${max} caractères.` };
    return null;
  };
}

/** Téléphone sénégalais : +221 puis 9 chiffres commençant par 7. */
export function telephoneSenegal(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    let valeur = (typeof control.value === 'string' ? control.value : '').replace(/[\s.\-]/g, '');
    if (!valeur) return null;
    if (/^7\d{8}$/.test(valeur)) valeur = '+221' + valeur;
    if (!TELEPHONE_SN.test(valeur))
      return { telephone: 'Téléphone invalide. Format attendu : +221 7X XXX XX XX.' };
    return null;
  };
}

/** Date non future (date d'acquisition). */
export function dateNonFuture(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const jour = new Date(control.value);
    jour.setHours(0, 0, 0, 0);
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    return jour > aujourdhui ? { dateNonFuture: 'La date ne peut pas être dans le futur.' } : null;
  };
}

/** Date non passée (péremption, réservation). */
export function dateNonPassee(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const jour = new Date(control.value);
    jour.setHours(0, 0, 0, 0);
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    return jour < aujourdhui ? { dateNonPassee: 'La date ne peut pas être déjà passée.' } : null;
  };
}

/** Deux champs mot de passe identiques (validateur de groupe). */
export function motsDePasseEgaux(champ = 'nouveau_password', confirmation = 'confirmation'): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const a = group.get(champ)?.value;
    const b = group.get(confirmation)?.value;
    if (a && b && a !== b) {
      group.get(confirmation)?.setErrors({ motDePasseDifferent: 'Les mots de passe ne correspondent pas.' });
      return { motDePasseDifferent: true };
    }
    return null;
  };
}

const MESSAGES_PERSONNALISES = ['serveur', 'nomCommun', 'reference', 'telephone', 'texteLong', 'dateNonFuture', 'dateNonPassee', 'motDePasseDifferent'];

/** Message à afficher sous un champ, à partir de ses erreurs. */
export function messageErreurChamp(control: AbstractControl | null): string {
  const erreurs = control?.errors;
  if (!erreurs) return '';
  for (const cle of MESSAGES_PERSONNALISES) {
    if (typeof erreurs[cle] === 'string') return erreurs[cle];
  }
  if (erreurs['required']) return 'Ce champ est obligatoire.';
  if (erreurs['email']) return 'Adresse e-mail invalide.';
  if (erreurs['minlength']) return `Minimum ${erreurs['minlength'].requiredLength} caractères.`;
  if (erreurs['maxlength']) return `Maximum ${erreurs['maxlength'].requiredLength} caractères.`;
  if (erreurs['min']) return `La valeur doit être au moins ${erreurs['min'].min}.`;
  if (erreurs['max']) return `La valeur ne doit pas dépasser ${erreurs['max'].max}.`;
  if (erreurs['motDePasseDifferent']) return 'Les mots de passe ne correspondent pas.';
  return 'Valeur invalide.';
}

/**
 * Reporte les erreurs 400 renvoyées par DRF ({"nom": ["..."]}) sous chaque
 * champ. `correspondance` traduit un nom de champ backend vers le contrôle
 * du formulaire (ex. { laboratoire: 'laboratoireId' }). Renvoie un message
 * global pour les erreurs non rattachables à un champ (ou null).
 */
export function appliquerErreursServeur(
  form: FormGroup,
  corps: unknown,
  correspondance: Record<string, string> = {},
): string | null {
  if (!corps || typeof corps !== 'object') return null;
  const data = corps as Record<string, unknown>;
  const messagesGlobaux: string[] = [];

  for (const [champBackend, valeur] of Object.entries(data)) {
    const message = Array.isArray(valeur) ? String(valeur[0]) : String(valeur);
    const nomControle = correspondance[champBackend] ?? champBackend;
    const controle = form.get(nomControle);
    if (controle) {
      controle.setErrors({ ...(controle.errors ?? {}), serveur: message });
      controle.markAsTouched();
    } else if (champBackend !== 'detail' || Object.keys(data).length === 1) {
      messagesGlobaux.push(message);
    }
  }
  return messagesGlobaux.length ? messagesGlobaux.join(' ') : null;
}
