import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardSummary {
  weeklyHours: number;
  yearAverages: { [year: number]: number };
  subjectComparison: { [subjectKey: string]: { [year: number]: number } };
}

export interface UpcomingTask {
  id: number;
  title: string;
  dueDate: string;
  priority: string;
  status: string;
  estimatedHours: number;
}

export interface UpcomingExam {
  subjectName: string;
  examName: string;
  date: string;
  type: string;
}

export interface UpcomingData {
  tasks: UpcomingTask[];
  exams: UpcomingExam[];
}

export interface CalendarEvent {
  type: 'task' | 'subtask' | 'exam';
  date: string;
  title: string;
  priority?: string;
  status?: string;
  examType?: string;
  taskId?: number;
  parentTaskId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://127.0.0.1:8080/api/dashboard';

  constructor(private http: HttpClient) {}

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/summary`);
  }

  getUpcoming(): Observable<UpcomingData> {
    return this.http.get<UpcomingData>(`${this.apiUrl}/upcoming`);
  }

  getCalendarEvents(year: number, month: number): Observable<CalendarEvent[]> {
    return this.http.get<CalendarEvent[]>(`${this.apiUrl}/calendar?year=${year}&month=${month}`);
  }
}
