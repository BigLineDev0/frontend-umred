import { Pipe, PipeTransform } from '@angular/core';
import { accord } from '../utils/accord';

// {{ n | accord: 'panne' }} -> « 3 pannes » ; remplace les « panne(s) ».
@Pipe({ name: 'accord' })
export class AccordPipe implements PipeTransform {
  transform(nombre: number | null | undefined, singulier: string, pluriel?: string): string {
    return accord(nombre ?? 0, singulier, pluriel);
  }
}
