import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Pre-defined subjects for ML (no custom option)
export const ML_SUBJECTS = [
  { key: 'MATH', name: 'Mathematics' },
  { key: 'PHYSICS', name: 'Physics' },
  { key: 'CHEMISTRY', name: 'Chemistry' },
  { key: 'BIOLOGY', name: 'Biology' },
  { key: 'ENGLISH', name: 'English' },
  { key: 'GEOGRAPHY', name: 'Geography' }
];

export interface Exam {
  id?: number;
  name: string;
  type: string; // Midterm, Final
  date?: string;
  grade: number;
  maxGrade: number; // 10, 20, or 100
}

export interface Subject {
  id?: number;
  subjectKey: string; // "MATH", "PHYSICS", etc.
  name: string;
  year: number;
  teacher?: string;
  absenceDays?: number; // Days of absence for this subject
  exams?: Exam[];
  average?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GradeService {
  private apiUrl = 'http://127.0.0.1:8080/api/grades';

  constructor(private http: HttpClient) {}

  // Subjects
  getSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/subjects`);
  }

  getSubjectsByYear(year: number): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/subjects/year/${year}`);
  }

  createSubject(subject: Subject): Observable<Subject> {
    return this.http.post<Subject>(`${this.apiUrl}/subjects`, subject);
  }

  updateSubject(subject: Subject): Observable<Subject> {
    return this.http.put<Subject>(`${this.apiUrl}/subjects/${subject.id}`, subject);
  }

  deleteSubject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/subjects/${id}`);
  }

  // Exams
  addExam(subjectId: number, exam: Exam): Observable<Subject> {
    return this.http.post<Subject>(`${this.apiUrl}/subjects/${subjectId}/exams`, exam);
  }

  updateExam(subjectId: number, examId: number, exam: Exam): Observable<Subject> {
    return this.http.put<Subject>(`${this.apiUrl}/subjects/${subjectId}/exams/${examId}`, exam);
  }

  deleteExam(subjectId: number, examId: number): Observable<Subject> {
    return this.http.delete<Subject>(`${this.apiUrl}/subjects/${subjectId}/exams/${examId}`);
  }

  // Analytics
  getYearAverages(): Observable<{ [year: number]: number }> {
    return this.http.get<{ [year: number]: number }>(`${this.apiUrl}/analytics/year-averages`);
  }
  
  // ML data for a specific year (subject averages + total absences)
  getYearMLData(year: number): Observable<{ subjectAverages: { [key: string]: number }, totalAbsences: number }> {
    return this.http.get<{ subjectAverages: { [key: string]: number }, totalAbsences: number }>(`${this.apiUrl}/analytics/year/${year}/ml-data`);
  }
}
