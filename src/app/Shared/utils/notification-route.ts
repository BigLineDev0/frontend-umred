import { Notification } from '../../Core/models/notification.model';
import { UserRole } from '../../Core/models/auth.model';

// Liste « mes réservations » de chaque rôle (les routes réelles de dashboard.routes.ts).
const MES_RESERVATIONS: Partial<Record<UserRole, string>> = {
  ETUDIANT: '/etudiant/mes-demandes',
  CHERCHEUR: '/enseignant/reservations',
  ADMIN: '/admin/reservations',
};

const ROLES_VALIDATEURS: UserRole[] = ['ADMIN', 'TECHNICIEN', 'CHERCHEUR'];
const ROLES_MAINTENANCE: UserRole[] = ['ADMIN', 'TECHNICIEN'];

/**
 * Page vers laquelle mène une notification. Partagée par le popup du
 * topbar et la page Notifications : une seule source de vérité, pour que
 * les deux ne divergent plus (le popup pointait vers des URL inexistantes).
 * Toute destination est une route existante accessible au rôle ; à défaut,
 * la liste des notifications.
 */
export function routeNotification(n: Notification, role: UserRole | undefined): string | (string | number)[] {
  switch (n.entite_type_nom) {
    case 'reservation': {
      // Nouvelle demande à traiter -> file d'attente des validateurs.
      if (n.titre.startsWith('Nouvelle demande') && role && ROLES_VALIDATEURS.includes(role)) {
        return '/reservations/a-valider';
      }
      // Créneau libéré -> on propose directement de réserver.
      if (n.titre.includes('libéré')) {
        return '/reservations/ajouter';
      }
      return (role && MES_RESERVATIONS[role]) ?? '/reservations/a-valider';
    }
    case 'maintenance':
      // Le détail d'une maintenance est réservé aux techniciens et admins ;
      // celui qui a signalé la panne retrouve l'équipement via la liste.
      return role && ROLES_MAINTENANCE.includes(role) && n.entite_id ? ['/maintenances', n.entite_id] : '/equipements';
    case 'consommable':
      return n.entite_id ? ['/consommables', n.entite_id] : '/consommables';
    default:
      return '/notifications';
  }
}
