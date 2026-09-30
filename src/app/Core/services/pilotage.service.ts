import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IndicateursPilotage, SynthesePilotage } from '../models/pilotage.model';

@Injectable({ providedIn: 'root' })
export class PilotageService {
  private http = inject(HttpClient);

  indicateurs(options: { dateDebut?: string; dateFin?: string; laboratoire?: number | null } = {}): Observable<IndicateursPilotage> {
    let params = new HttpParams();
    if (options.dateDebut) params = params.set('date_debut', options.dateDebut);
    if (options.dateFin) params = params.set('date_fin', options.dateFin);
    if (options.laboratoire) params = params.set('laboratoire', options.laboratoire);
    return this.http.get<IndicateursPilotage>(`${environment.apiUrl}/pilotage/indicateurs/`, { params });
  }

  // Rédaction par le modèle de langage (service IA), contrôlée côté serveur.
  synthese(dateDebut: string, dateFin: string): Observable<SynthesePilotage> {
    const params = new HttpParams().set('date_debut', dateDebut).set('date_fin', dateFin);
    return this.http.get<SynthesePilotage>(`${environment.aiApiUrl}/pilotage/synthese`, { params });
  }
}
