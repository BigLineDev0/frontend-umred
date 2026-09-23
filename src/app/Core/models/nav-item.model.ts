export interface NavItem {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
  excludes?: string[]; // sous-routes qui ne doivent PAS activer ce lien, même en mode non-exact
  disabled?: boolean;
}
