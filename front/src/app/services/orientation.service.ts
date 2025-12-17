import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StudentInput {
  mathScore: number;
  physicsScore: number;
  chemistryScore: number;
  biologyScore: number;
  englishScore: number;
  geographyScore: number;
  weeklySelfStudyHours: number;
  absenceDays: number;
}

export interface PredictionResponse {
  recommendedField: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrientationService {
  private apiUrl = 'http://127.0.0.1:8080/api/orientation/predict';

  constructor(private http: HttpClient) { }

  predict(input: StudentInput): Observable<PredictionResponse> {
    return this.http.post<PredictionResponse>(this.apiUrl, input);
  }
}
