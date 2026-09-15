export type TypeNotification = 'RESERVATION' | 'MAINTENANCE' | 'VALIDATION' | 'RAPPEL' | 'SYSTEME';

export interface Notification {
  id: number;
  titre: string;
  message: string;
  type: TypeNotification;
  lu: boolean;
  entite_type_nom: string | null;
  entite_id: number | null;
  date_envoi: string;
}

export interface NotificationPage {
  count: number;
  results: Notification[];
}
