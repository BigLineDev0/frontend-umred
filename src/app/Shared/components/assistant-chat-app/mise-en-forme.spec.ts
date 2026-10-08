import { decouperTexte, genreOptions } from './mise-en-forme';

describe('decouperTexte', () => {
  it('regroupe les lignes de liste consécutives', () => {
    expect(decouperTexte('Disponibilités :\n- lundi : 8h–19h\n- mardi : fermé')).toEqual([
      { type: 'texte', lignes: ['Disponibilités :'] },
      { type: 'liste', lignes: ['lundi : 8h–19h', 'mardi : fermé'] },
    ]);
  });

  it('reconnaît les listes numérotées', () => {
    expect(decouperTexte('1. Premier\n2. Second')).toEqual([{ type: 'numerotee', lignes: ['Premier', 'Second'] }]);
  });

  it("transforme les marqueurs en encadrés sans garder l'émoji", () => {
    const blocs = decouperTexte('ℹ️ Demande soumise à validation.\n\n🔴 Usure critique\n🟠 Usure à surveiller');
    expect(blocs).toEqual([
      { type: 'info', lignes: ['Demande soumise à validation.'] },
      { type: 'alerte', critique: true, lignes: ['Usure critique'] },
      { type: 'alerte', critique: false, lignes: ['Usure à surveiller'] },
    ]);
  });
});

describe('genreOptions', () => {
  const opt = (label: string, description?: string) => ({ label, value: label, description });

  it('Oui / Non côte à côte pour une confirmation', () => {
    expect(genreOptions({ necessite_confirmation: true, options: [opt('Oui, confirmer'), opt('Non, annuler')] }))
      .toBe('confirmation');
  });

  it('pastilles pour des créneaux courts', () => {
    expect(genreOptions({ necessite_confirmation: false, options: [opt('8h – 10h'), opt('10h – 12h')] })).toBe('pastilles');
  });

  it('cartes dès qu\'une option a un détail', () => {
    expect(genreOptions({ necessite_confirmation: false, options: [opt('Microscope', 'Labo Bio · disponible')] }))
      .toBe('cartes');
  });

  it('rien sans options', () => {
    expect(genreOptions({ necessite_confirmation: false, options: [] })).toBeUndefined();
  });
});
