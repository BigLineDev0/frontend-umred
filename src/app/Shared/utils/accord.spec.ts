import { accord } from './accord';

describe('accord', () => {
  it('garde le singulier pour 0 et 1', () => {
    expect(accord(0, 'panne')).toBe('0 panne');
    expect(accord(1, 'panne')).toBe('1 panne');
  });

  it('accorde au pluriel, régulier ou explicite', () => {
    expect(accord(3, 'panne')).toBe('3 pannes');
    expect(accord(2, 'étudiant encadré', 'étudiants encadrés')).toBe('2 étudiants encadrés');
  });
});
