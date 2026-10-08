import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

/**
 * Remplace une image qui ne se charge pas (fichier supprimé, média
 * indisponible...) par une image de repli, au lieu d'afficher l'icône
 * d'image cassée du navigateur.
 *
 *   <img [src]="labo.photo || defaut" [appImageRepli]="defaut" />
 */
@Directive({
  selector: 'img[appImageRepli]',
  standalone: true,
})
export class ImageRepliDirective {
  appImageRepli = input.required<string>();
  private readonly image = inject<ElementRef<HTMLImageElement>>(ElementRef).nativeElement;

  @HostListener('error')
  remplacer(): void {
    const repli = this.appImageRepli();
    // Garde-fou : si l'image de repli échoue elle aussi, on n'insiste pas.
    if (!this.image.src.endsWith(repli)) this.image.src = repli;
  }
}
