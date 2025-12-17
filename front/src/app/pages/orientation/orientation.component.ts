import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrientationService, StudentInput } from '../../services/orientation.service';

@Component({
  selector: 'app-orientation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orientation.component.html',
  styleUrl: './orientation.component.css'
})
export class OrientationComponent {
  studentInput: StudentInput = {
    mathScore: 0,
    physicsScore: 0,
    chemistryScore: 0,
    biologyScore: 0,
    englishScore: 0,
    geographyScore: 0,
    weeklySelfStudyHours: 0,
    absenceDays: 0
  };

  prediction: string | null = null;
  loading: boolean = false;
  error: string | null = null;

  constructor(private orientationService: OrientationService, private cd: ChangeDetectorRef) {}

  onSubmit() {
    this.loading = true;
    this.error = null;
    this.prediction = null;

    this.orientationService.predict(this.studentInput).subscribe({
      next: (res) => {
        this.prediction = res.recommendedField;
        this.loading = false;
        this.cd.detectChanges(); // Force UI update
      },
      error: (err) => {
        console.error('Error', err);
        this.error = 'Une erreur est survenue lors de la prédiction.';
        this.loading = false;
        this.cd.detectChanges(); // Force UI update
      }
    });
  }
}
