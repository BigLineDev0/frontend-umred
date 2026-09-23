import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResultatRecherche } from '../models/recherche.model';

@Injectable({ providedIn: 'root' })
export class RechercheService {
  private http = inject(HttpClient);

  rechercher(terme: string): Observable<ResultatRecherche> {
    return this.http.get<ResultatRecherche>(`${environment.apiUrl}/recherche/`, { params: { q: terme } });
  }
}
