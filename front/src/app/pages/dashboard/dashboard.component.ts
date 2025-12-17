import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DashboardService, DashboardSummary, UpcomingData, CalendarEvent } from '../../services/dashboard.service';
import { TaskService, Task } from '../../services/task.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  summary: DashboardSummary | null = null;
  upcoming: UpcomingData | null = null;
  calendarEvents: CalendarEvent[] = [];
  
  // Task quick view modal
  showTaskModal = false;
  viewingTask: Task | null = null;
  
  // Calendar state
  currentDate = new Date();
  currentYear = this.currentDate.getFullYear();
  currentMonth = this.currentDate.getMonth() + 1; // 1-indexed
  calendarDays: (number | null)[] = [];
  
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

  constructor(
    private dashboardService: DashboardService, 
    private cd: ChangeDetectorRef,
    private router: Router,
    private taskService: TaskService
  ) {}

  ngOnInit() {
    this.loadSummary();
    this.loadUpcoming();
    this.buildCalendar();
    this.loadCalendarEvents();
  }

  loadSummary() {
    this.dashboardService.getSummary().subscribe(data => {
      this.summary = data;
      console.log('Dashboard Summary:', data);
      console.log('Subject Comparison:', data.subjectComparison);
      console.log('Subject Keys found:', this.getSubjectKeys());
      this.cd.detectChanges();
    });
  }

  loadUpcoming() {
    this.dashboardService.getUpcoming().subscribe(data => {
      this.upcoming = data;
      this.cd.detectChanges();
    });
  }

  loadCalendarEvents() {
    this.dashboardService.getCalendarEvents(this.currentYear, this.currentMonth).subscribe(data => {
      this.calendarEvents = data;
      this.cd.detectChanges();
    });
  }

  buildCalendar() {
    const firstDay = new Date(this.currentYear, this.currentMonth - 1, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth, 0);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = lastDay.getDate();
    
    this.calendarDays = [];
    // Add empty slots for days before the 1st
    for (let i = 0; i < startDayOfWeek; i++) {
      this.calendarDays.push(null);
    }
    // Add actual days
    for (let d = 1; d <= daysInMonth; d++) {
      this.calendarDays.push(d);
    }
  }

  prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 1) {
      this.currentMonth = 12;
      this.currentYear--;
    }
    this.buildCalendar();
    this.loadCalendarEvents();
  }

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 12) {
      this.currentMonth = 1;
      this.currentYear++;
    }
    this.buildCalendar();
    this.loadCalendarEvents();
  }

  getEventsForDay(day: number): CalendarEvent[] {
    const dateStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return this.calendarEvents.filter(e => e.date === dateStr);
  }

  isToday(day: number): boolean {
    const today = new Date();
    return day === today.getDate() && 
           this.currentMonth === today.getMonth() + 1 && 
           this.currentYear === today.getFullYear();
  }

  // Chart helpers
  // Hardcoded ML subjects in display order
  mlSubjectKeys = ['MATH', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'ENGLISH', 'GEOGRAPHY'];

  getYearKeys(): number[] {
    if (!this.summary?.yearAverages) return [];
    return Object.keys(this.summary.yearAverages).map(k => parseInt(k)).sort();
  }

  getSubjectKeys(): string[] {
    // Return only the ML subjects that have data
    if (!this.summary?.subjectComparison) return [];
    return this.mlSubjectKeys.filter(k => this.summary?.subjectComparison?.[k]);
  }

  getBarWidth(value: number): number {
    return Math.min(value, 100);
  }

  getGradeColor(value: number): string {
    if (value >= 80) return '#27ae60';
    if (value >= 60) return '#f39c12';
    return '#e74c3c';
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'HIGH': return '#e74c3c';
      case 'MEDIUM': return '#f39c12';
      case 'LOW': return '#27ae60';
      default: return '#999';
    }
  }

  formatSubjectName(key: string): string {
    const names: {[k: string]: string} = {
      'MATH': 'Math',
      'PHYSICS': 'Physics', 
      'CHEMISTRY': 'Chemistry',
      'BIOLOGY': 'Biology',
      'ENGLISH': 'English',
      'GEOGRAPHY': 'Geography'
    };
    return names[key] || key;
  }

  // Evolution comment based on year-over-year progress
  getEvolutionComment(): { icon: string; text: string } | null {
    const years = this.getYearKeys();
    if (years.length < 2) return null;
    
    const lastYear = years[years.length - 1];
    const prevYear = years[years.length - 2];
    const lastAvg = this.summary?.yearAverages?.[lastYear] || 0;
    const prevAvg = this.summary?.yearAverages?.[prevYear] || 0;
    const diff = lastAvg - prevAvg;
    
    if (diff >= 10) return { icon: '🚀', text: `Amazing progress! You improved by <span>+${diff.toFixed(1)}%</span> from Year ${prevYear} to Year ${lastYear}!` };
    if (diff >= 5) return { icon: '📈', text: `Great work! You've improved by <span>+${diff.toFixed(1)}%</span> this year.` };
    if (diff > 0) return { icon: '👍', text: `Steady progress! You're up <span>+${diff.toFixed(1)}%</span> from last year.` };
    if (diff === 0) return { icon: '📊', text: `Consistent performance. Keep pushing for improvement!` };
    if (diff > -5) return { icon: '📉', text: `Slight dip of ${diff.toFixed(1)}%. Let's work on getting back up!` };
    return { icon: '⚠️', text: `Challenging year - down ${Math.abs(diff).toFixed(1)}%. Time to refocus!` };
  }

  // Navigate to grades page filtered by year
  goToYear(year: number) {
    this.router.navigate(['/grades'], { queryParams: { year } });
  }

  // View task in read-only modal
  viewTask(taskId: number) {
    this.taskService.getTaskById(taskId).subscribe(task => {
      this.viewingTask = task;
      this.showTaskModal = true;
      this.cd.detectChanges();
    });
  }

  closeTaskModal() {
    this.showTaskModal = false;
    this.viewingTask = null;
  }
}
