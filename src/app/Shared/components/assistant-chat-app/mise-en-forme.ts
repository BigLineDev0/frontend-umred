import { BlocTexte, ChatResponse, GenreOptions } from '../../../Core/models/assistant.model';

/**
 * Découpe le texte d'une réponse en blocs : paragraphes, listes à puces
 * (« - »), listes numérotées (« 1. »), encadré d'information (« ℹ️ ») et
 * alerte d'usure (« 🟠 », « 🔴 » critique). Les émojis servent de
 * marqueurs ; l'affichage utilise les icônes et couleurs de l'interface.
 */
export function decouperTexte(texte: string): BlocTexte[] {
  const blocs: BlocTexte[] = [];
  for (const brute of texte.split('\n')) {
    const ligne = brute.trim();
    if (!ligne) continue;
    const puce = ligne.startsWith('- ') ? ligne.slice(2) : null;
    const numero = /^\d+\.\s+(.*)$/.exec(ligne)?.[1] ?? null;
    const precedent = blocs.at(-1);

    if (puce !== null || numero !== null) {
      const type = puce !== null ? 'liste' : 'numerotee';
      // Les lignes consécutives d'une même liste forment un seul bloc.
      if (precedent?.type === type) precedent.lignes.push((puce ?? numero)!);
      else blocs.push({ type, lignes: [(puce ?? numero)!] });
    } else if (ligne.startsWith('ℹ️')) {
      blocs.push({ type: 'info', lignes: [ligne.replace(/^ℹ️\s*/u, '')] });
    } else if (ligne.startsWith('🔴') || ligne.startsWith('🟠')) {
      blocs.push({ type: 'alerte', critique: ligne.startsWith('🔴'), lignes: [ligne.replace(/^(🔴|🟠)\s*/u, '')] });
    } else {
      blocs.push({ type: 'texte', lignes: [ligne] });
    }
  }
  return blocs;
}

/**
 * Présentation des options : Oui/Non côte à côte pour une confirmation,
 * pastilles pour des libellés courts sans détail (créneaux, réponses
 * rapides), cartes titre + sous-titre sinon.
 */
export function genreOptions(res: Pick<ChatResponse, 'options' | 'necessite_confirmation'>): GenreOptions | undefined {
  const options = res.options ?? [];
  if (!options.length) return undefined;
  if (res.necessite_confirmation && options.length === 2) return 'confirmation';
  return options.every(o => !o.description && o.label.length <= 26) ? 'pastilles' : 'cartes';
}
