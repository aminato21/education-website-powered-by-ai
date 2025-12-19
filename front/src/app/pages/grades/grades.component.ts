import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, Exam, GradeService, ML_SUBJECTS } from '../../services/grade.service';

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './grades.component.html',
  styleUrl: './grades.component.css'
})
export class GradesComponent implements OnInit {
  subjects: Subject[] = [];
  yearAverages: { [year: number]: number } = {};
  
  // Year filter from dashboard navigation
  filterYear: number | null = null;
  
  // NEW: Search filter
  searchQuery = '';
  
  // NEW: Collapsible year sections
  collapsedYears: Set<number> = new Set();
  
  // Pre-defined subjects for dropdown
  mlSubjects = ML_SUBJECTS;
  
  // Modal State
  showSubjectModal = false;
  showExamModal = false;
  selectedSubject: Subject | null = null;
  
  // Form Data
  newSubject: Subject = this.getEmptySubject();
  newExam: Exam = this.getEmptyExam();
  isEditingSubject = false;
  isEditingExam = false;
  editingExamId: number | null = null;

  examTypes = ['Midterm', 'Final'];
  maxGradeOptions = [10, 20, 100];

  constructor(
    private gradeService: GradeService, 
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Check for year query param
    this.route.queryParams.subscribe(params => {
      this.filterYear = params['year'] ? parseInt(params['year']) : null;
      this.cd.detectChanges();
    });
    
    this.loadSubjects();
    this.loadYearAverages();
  }

  loadSubjects() {
    this.gradeService.getSubjects().subscribe(data => {
      this.subjects = data;
      this.cd.detectChanges();
    });
  }

  loadYearAverages() {
    this.gradeService.getYearAverages().subscribe(data => {
      this.yearAverages = data;
      this.cd.detectChanges();
    });
  }

  getUniqueYears(): number[] {
    const years = [...new Set(this.subjects.map(s => s.year))];
    const sorted = years.sort((a, b) => a - b);
    
    // If filterYear is set, only return that year
    if (this.filterYear !== null) {
      return sorted.filter(y => y === this.filterYear);
    }
    return sorted;
  }

  clearYearFilter() {
    this.filterYear = null;
    this.router.navigate(['/grades']); // Remove query param
  }

  getSubjectsByYear(year: number): Subject[] {
    let filtered = this.subjects.filter(s => s.year === year);
    
    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) || 
        (s.teacher && s.teacher.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }

  // NEW: Toggle year section collapse
  toggleYearCollapse(year: number) {
    if (this.collapsedYears.has(year)) {
      this.collapsedYears.delete(year);
    } else {
      this.collapsedYears.add(year);
    }
  }

  isYearCollapsed(year: number): boolean {
    return this.collapsedYears.has(year);
  }

  // Stats summary per YEAR
  getStatsForYear(year: number) {
    const yearSubjects = this.subjects.filter(s => s.year === year);
    const totalSubjects = yearSubjects.length;
    const totalExams = yearSubjects.reduce((sum, s) => sum + (s.exams?.length || 0), 0);
    const totalAbsences = yearSubjects.reduce((sum, s) => sum + (s.absenceDays || 0), 0);
    
    // Find best and worst subjects for THIS YEAR
    const subjectsWithAvg = yearSubjects
      .filter(s => s.average !== undefined && s.average !== null)
      .sort((a, b) => (b.average || 0) - (a.average || 0));
    
    const best = subjectsWithAvg[0];
    const worst = subjectsWithAvg[subjectsWithAvg.length - 1];
    
    return {
      totalSubjects,
      totalExams,
      totalAbsences,
      bestSubject: best ? { name: best.name, avg: best.average } : null,
      worstSubject: worst && worst !== best ? { name: worst.name, avg: worst.average } : null
    };
  }

  // ===== SUBJECT MODAL =====
  openAddSubject() {
    this.newSubject = this.getEmptySubject();
    this.isEditingSubject = false;
    this.showSubjectModal = true;
  }

  openEditSubject(subject: Subject) {
    this.newSubject = { ...subject };
    this.isEditingSubject = true;
    this.showSubjectModal = true;
  }

  closeSubjectModal() {
    this.showSubjectModal = false;
    this.newSubject = this.getEmptySubject();
  }

  onSubjectKeyChange() {
    // Auto-fill name from key
    const found = this.mlSubjects.find(s => s.key === this.newSubject.subjectKey);
    this.newSubject.name = found ? found.name : '';
  }

  saveSubject() {
    if (!this.newSubject.subjectKey || !this.newSubject.year) return;
    
    // Use pre-defined name from subject key
    const found = this.mlSubjects.find(s => s.key === this.newSubject.subjectKey);
    this.newSubject.name = found ? found.name : this.newSubject.subjectKey;

    if (this.isEditingSubject) {
      this.gradeService.updateSubject(this.newSubject).subscribe(() => {
        this.loadSubjects();
        this.loadYearAverages();
        this.closeSubjectModal();
      });
    } else {
      this.gradeService.createSubject(this.newSubject).subscribe(() => {
        this.loadSubjects();
        this.closeSubjectModal();
      });
    }
  }

  deleteSubject(subject: Subject) {
    if (confirm(`Delete "${subject.name}" and all its exams?`)) {
      if (subject.id) {
        this.gradeService.deleteSubject(subject.id).subscribe(() => {
          this.loadSubjects();
          this.loadYearAverages();
        });
      }
    }
  }

  // ===== EXAM MODAL =====
  openSubjectDetail(subject: Subject) {
    this.selectedSubject = subject;
  }

  closeSubjectDetail() {
    this.selectedSubject = null;
  }

  openAddExam() {
    this.newExam = this.getEmptyExam();
    this.isEditingExam = false;
    this.editingExamId = null;
    this.showExamModal = true;
  }

  openEditExam(exam: Exam) {
    this.newExam = { ...exam };
    this.isEditingExam = true;
    this.editingExamId = exam.id || null;
    this.showExamModal = true;
  }

  closeExamModal() {
    this.showExamModal = false;
    this.newExam = this.getEmptyExam();
  }

  saveExam() {
    if (!this.selectedSubject?.id || !this.newExam.name) return;

    if (this.isEditingExam && this.editingExamId) {
      this.gradeService.updateExam(this.selectedSubject.id, this.editingExamId, this.newExam).subscribe(updated => {
        this.selectedSubject = updated;
        this.updateLocalSubject(updated);
        this.loadYearAverages();
        this.closeExamModal();
      });
    } else {
      this.gradeService.addExam(this.selectedSubject.id, this.newExam).subscribe(updated => {
        this.selectedSubject = updated;
        this.updateLocalSubject(updated);
        this.loadYearAverages();
        this.closeExamModal();
      });
    }
  }

  deleteExam(exam: Exam) {
    if (!this.selectedSubject?.id || !exam.id) return;
    if (confirm(`Delete exam "${exam.name}"?`)) {
      this.gradeService.deleteExam(this.selectedSubject.id, exam.id).subscribe(updated => {
        this.selectedSubject = updated;
        this.updateLocalSubject(updated);
        this.loadYearAverages();
      });
    }
  }

  updateLocalSubject(updated: Subject) {
    const idx = this.subjects.findIndex(s => s.id === updated.id);
    if (idx !== -1) this.subjects[idx] = updated;
  }

  // ===== HELPERS =====
  getEmptySubject(): Subject {
    return { subjectKey: '', name: '', year: 1, teacher: '' };
  }

  getEmptyExam(): Exam {
    return { name: '', type: 'Midterm', grade: 0, maxGrade: 20 };
  }

  getGradeColor(average: number | undefined): string {
    if (average === undefined || average === null) return '#999';
    if (average >= 80) return '#27ae60';
    if (average >= 60) return '#f39c12';
    return '#e74c3c';
  }

  formatAverage(avg: number | undefined): string {
    if (avg === undefined || avg === null) return '-';
    return avg.toFixed(1) + '%';
  }

  // Check if exam date has passed (or is today) - show grade inputs only then
  isExamDatePassed(): boolean {
    if (!this.newExam.date) return false; // No date = can't enter grades yet
    const examDate = new Date(this.newExam.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return examDate <= today;
  }
}
