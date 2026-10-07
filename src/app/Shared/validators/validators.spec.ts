import { FormControl, FormGroup } from '@angular/forms';

import {
  appliquerErreursServeur, dateNonFuture, dateNonPassee, nomCommun, reference,
  telephoneSenegal, texteLong,
} from './validators';

const ctrl = (v: unknown) => new FormControl(v);

describe('nomCommun', () => {
  const v = nomCommun();
  it('accepte un nom valide avec accents et ponctuation', () => {
    expect(v(ctrl('Spectrophotomètre UV (5810 R)'))).toBeNull();
  });
  it('refuse HTML, symboles seuls, chiffres seuls, répétitions, trop court', () => {
    for (const mauvais of ['<b>x</b>', '@@@', '123', '----', 'aaaa', 'a']) {
      expect(v(ctrl(mauvais))).not.toBeNull();
    }
  });
  it('laisse le vide au validateur required', () => {
    expect(v(ctrl(''))).toBeNull();
  });
});

describe('reference', () => {
  const v = reference();
  it('accepte les formats valides', () => {
    for (const bon of ['REF-001', 'ETH/2024', 'ABC.12']) expect(v(ctrl(bon))).toBeNull();
  });
  it('refuse espaces, trop court, HTML', () => {
    for (const mauvais of ['a b', 'ab', 're<f>']) expect(v(ctrl(mauvais))).not.toBeNull();
  });
});

describe('telephoneSenegal', () => {
  const v = telephoneSenegal();
  it('accepte 77/78 à 9 chiffres', () => {
    expect(v(ctrl('77 123 45 67'))).toBeNull();
    expect(v(ctrl('+221781234567'))).toBeNull();
  });
  it('refuse un préfixe non 7 ou un format étranger', () => {
    expect(v(ctrl('+221611234567'))).not.toBeNull();
    expect(v(ctrl('+33123456789'))).not.toBeNull();
  });
});

describe('texteLong', () => {
  it('refuse HTML et applique min obligatoire', () => {
    expect(texteLong()(ctrl('<script>x</script>'))).not.toBeNull();
    expect(texteLong({ min: 10, obligatoire: true })(ctrl('court'))).not.toBeNull();
  });
});

describe('dates', () => {
  it('dateNonFuture refuse demain', () => {
    const demain = new Date(); demain.setDate(demain.getDate() + 1);
    expect(dateNonFuture()(ctrl(demain))).not.toBeNull();
  });
  it('dateNonPassee refuse hier', () => {
    const hier = new Date(); hier.setDate(hier.getDate() - 1);
    expect(dateNonPassee()(ctrl(hier))).not.toBeNull();
  });
});

describe('appliquerErreursServeur', () => {
  it('place le message 400 sous le bon champ', () => {
    const form = new FormGroup({ nom: new FormControl('x') });
    const global = appliquerErreursServeur(form, { nom: ['Un équipement nommé « X » existe déjà dans ce laboratoire.'] });
    expect(global).toBeNull();
    expect(form.get('nom')?.errors?.['serveur']).toContain('existe déjà');
  });
  it('mappe un champ backend vers un contrôle renommé', () => {
    const form = new FormGroup({ laboratoireId: new FormControl(null) });
    appliquerErreursServeur(form, { laboratoire: ['Obligatoire.'] }, { laboratoire: 'laboratoireId' });
    expect(form.get('laboratoireId')?.errors?.['serveur']).toBe('Obligatoire.');
  });
  it('renvoie un message global pour un champ non mappé', () => {
    const form = new FormGroup({ nom: new FormControl('x') });
    const global = appliquerErreursServeur(form, { detail: 'Accès refusé.' });
    expect(global).toBe('Accès refusé.');
  });
});
