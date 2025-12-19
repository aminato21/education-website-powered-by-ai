import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrientationService, StudentInput } from '../../services/orientation.service';
import { GradeService, ML_SUBJECTS } from '../../services/grade.service';

@Component({
  selector: 'app-orientation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orientation.component.html',
  styleUrl: './orientation.component.css'
})
export class OrientationComponent implements OnInit {
  // Year selection
  availableYears: number[] = [];
  selectedYear: number | null = null;
  
  // Data from Grades (auto-loaded)
  subjectAverages: { [key: string]: number } = {};
  totalAbsences: number = 0;
  loading = false;
  dataLoaded = false;
  
  // Only manual input
  weeklySelfStudyHours: number = 10;
  
  // ML Prediction
  prediction: string | null = null;
  predicting: boolean = false;
  error: string | null = null;
  
  // Subject display order
  mlSubjects = ML_SUBJECTS;

  constructor(
    private orientationService: OrientationService,
    private gradeService: GradeService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Load unique years from grades
    this.gradeService.getYearAverages().subscribe(yearAvgs => {
      this.availableYears = Object.keys(yearAvgs).map(y => parseInt(y)).sort((a, b) => b - a);
      if (this.availableYears.length > 0) {
        this.selectedYear = this.availableYears[0]; // Default to most recent
        this.loadYearData();
      }
      this.cd.detectChanges();
    });
  }
  
  onYearChange() {
    if (this.selectedYear) {
      this.loadYearData();
    }
  }
  
  loadYearData() {
    if (!this.selectedYear) return;
    
    this.loading = true;
    this.dataLoaded = false;
    this.error = null;
    
    this.gradeService.getYearMLData(this.selectedYear).subscribe({
      next: (data) => {
        this.subjectAverages = data.subjectAverages || {};
        this.totalAbsences = data.totalAbsences || 0;
        this.dataLoaded = true;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error loading year data', err);
        this.error = 'Failed to load grade data for this year.';
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }
  
  getSubjectScore(key: string): number | null {
    return this.subjectAverages[key] ?? null;
  }
  
  formatScore(score: number | null): string {
    if (score === null || score === undefined) return '--';
    return score.toFixed(0) + '%';
  }
  
  getScoreColor(score: number | null): string {
    if (score === null) return '#666';
    if (score >= 70) return '#27ae60';
    if (score >= 50) return '#f39c12';
    return '#e74c3c';
  }
  
  canPredict(): boolean {
    // Need at least some data and weekly hours
    return this.dataLoaded && Object.keys(this.subjectAverages).length > 0;
  }
  
  onSubmit() {
    if (!this.canPredict()) return;
    
    this.predicting = true;
    this.error = null;
    this.prediction = null;
    
    // Build StudentInput from auto-loaded data
    const input: StudentInput = {
      mathScore: this.subjectAverages['MATH'] || 0,
      physicsScore: this.subjectAverages['PHYSICS'] || 0,
      chemistryScore: this.subjectAverages['CHEMISTRY'] || 0,
      biologyScore: this.subjectAverages['BIOLOGY'] || 0,
      englishScore: this.subjectAverages['ENGLISH'] || 0,
      geographyScore: this.subjectAverages['GEOGRAPHY'] || 0,
      weeklySelfStudyHours: this.weeklySelfStudyHours,
      absenceDays: this.totalAbsences
    };
    
    this.orientationService.predict(input).subscribe({
      next: (res) => {
        this.prediction = res.recommendedField;
        this.predicting = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Prediction error', err);
        this.error = 'An error occurred during prediction.';
        this.predicting = false;
        this.cd.detectChanges();
      }
    });
  }
}
