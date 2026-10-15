import { affichageStatut, aujourdHuiEtablissement, libelleStatut, severiteStatut } from './statut-reservation';

describe('statut-reservation', () => {
  it('donne un libellé et une sévérité cohérents pour chaque statut', () => {
    expect(libelleStatut('EN_ATTENTE')).toBe('En attente');
    expect(severiteStatut('VALIDEE')).toBe('success');
    // Terminée et validée ne partagent pas la même couleur.
    expect(severiteStatut('TERMINEE')).not.toBe(severiteStatut('VALIDEE'));
  });

  it('marque annulée et refusée comme inactives', () => {
    expect(affichageStatut('ANNULEE').active).toBe(false);
    expect(affichageStatut('REFUSEE').active).toBe(false);
    expect(affichageStatut('VALIDEE').active).toBe(true);
  });

  it('garde un statut inconnu lisible plutôt que vide', () => {
    expect(libelleStatut('ARCHIVEE')).toBe('ARCHIVEE');
  });

  it("calcule « aujourd'hui » dans le fuseau de l'établissement (Africa/Dakar, UTC+0)", () => {
    // 23 h 30 à Dakar = 1 h 30 le lendemain à Paris (UTC+2) : le jour reste celui de Dakar.
    expect(aujourdHuiEtablissement(new Date('2026-10-15T23:30:00Z'))).toBe('2026-10-15');
    expect(aujourdHuiEtablissement(new Date('2026-10-16T00:10:00Z'))).toBe('2026-10-16');
  });
});
