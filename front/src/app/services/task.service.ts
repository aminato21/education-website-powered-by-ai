import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export interface SubTask {
  id?: number;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  status: TaskStatus;
  completedHours: number;
  estimatedHours: number;
}

export interface Task {
  id?: number;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedHours: number;
  actualHours: number;
  dueDate?: string;
  subTasks?: SubTask[];
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://127.0.0.1:8080/api/tasks';

  constructor(private http: HttpClient) { }

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl);
  }

  createTask(task: Task): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  updateTask(task: Task): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${task.id}`, task);
  }

  getTaskById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }
  
  addSubTask(taskId: number, subTask: SubTask): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/${taskId}/subtasks`, subTask);
  }

  updateSubTask(taskId: number, subId: number, subTask: Partial<SubTask>): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${taskId}/subtasks/${subId}`, subTask);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Total hours (all time)
  getWeeklyHours(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/analytics/hours`);
  }
  
  // Rolling 7-day hours
  getRollingWeeklyHours(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/analytics/hours/week`);
  }
  
  // Weekly history (past 8 weeks)
  getWeeklyHistory(): Observable<{ weekStart: string, weekEnd: string, hours: number, label: string }[]> {
    return this.http.get<{ weekStart: string, weekEnd: string, hours: number, label: string }[]>(`${this.apiUrl}/analytics/hours/history`);
  }
  
  // Completed tasks count (rolling 7 days)
  getWeeklyCompletedCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/analytics/completed/week`);
  }
}
