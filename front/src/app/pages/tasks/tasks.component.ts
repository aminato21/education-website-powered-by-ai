import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task, TaskService, TaskPriority, TaskStatus } from '../../services/task.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css'
})
export class TasksComponent implements OnInit {
  tasks: Task[] = [];
  newTask: Task = this.getEmptyTask();
  
  // Enums for template
  TaskPriority = TaskPriority;
  TaskStatus = TaskStatus;
  priorities = Object.values(TaskPriority);
  statuses = Object.values(TaskStatus);

  // Modal state
  showEditModal = false;
  selectedTask: Task | null = null;
  editTaskData: Task = this.getEmptyTask();
  isEditingTask = false; // View Mode (false) vs Edit Mode (true)
  showSubTaskForm = false; // Toggle for Add/Edit Subtask form
  
  // Analytics
  weeklyHours = 0;

  constructor(private taskService: TaskService, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadTasks();
    this.loadHours();
  }

  loadTasks() {
    this.taskService.getTasks().subscribe(tasks => {
      this.tasks = tasks;
      this.cd.detectChanges();
    });
  }
  
  loadHours() {
    this.taskService.getWeeklyHours().subscribe(h => {
      this.weeklyHours = h; 
      this.cd.detectChanges();
    });
  }

  // --- Add Task Logic ---
  isFormValid(): boolean {
    return !!this.newTask.title && !!this.newTask.dueDate;
  }

  addTask() {
    if (!this.isFormValid()) return;
    this.taskService.createTask(this.newTask).subscribe(() => {
      this.loadTasks();
      this.newTask = this.getEmptyTask();
      this.cd.detectChanges();
    });
  }

  // --- View/Edit Task Logic ---
  openTaskView(task: Task) {
    this.selectedTask = task;
    this.editTaskData = { ...task };
    this.showEditModal = true;
    this.isEditingTask = false; // Start in View Mode
    this.showSubTaskForm = false;
    this.resetSubTaskForm();
  }

  enableEditTask() {
    this.isEditingTask = true;
  }

  cancelEditTask() {
    this.isEditingTask = false;
    // Reset editTaskData to original
    if (this.selectedTask) {
      this.editTaskData = { ...this.selectedTask };
    }
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedTask = null;
    this.isEditingTask = false;
    this.showSubTaskForm = false;
  }

  saveEditTask() {
    if (!this.editTaskData.title || !this.editTaskData.dueDate) return;
    
    this.taskService.updateTask(this.editTaskData).subscribe(() => {
      this.loadTasks();
      this.loadHours(); // Fix: Refresh pipe/progress bar
      this.closeEditModal();
      this.cd.detectChanges();
    });
  }
  
  updateStatus(task: Task, event: any) {
    const newStatus = event.target.value;
    task.status = newStatus;
    this.taskService.updateTask(task).subscribe(() => {
        this.loadHours(); // Fix: Refresh pipe/progress bar
    });
  }

  delete(task: Task) {
    if (confirm('Are you sure you want to delete this task?')) {
      if (task.id) {
        this.taskService.deleteTask(task.id).subscribe(() => {
          this.loadTasks();
        });
      }
    }
  }

  getEmptyTask(): Task {
    return {
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      estimatedHours: 1,
      actualHours: 0,
      dueDate: ''
    };
  }

  getPriorityColor(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.HIGH: return '#e74c3c';
      case TaskPriority.MEDIUM: return '#f39c12';
      case TaskPriority.LOW: return '#27ae60';
      default: return '#ccc';
    }
  }

  // --- Validation Helpers ---
  getSubTaskSum(): number {
    return (this.editTaskData.subTasks || []).reduce((sum, st) => sum + (st.estimatedHours || 0), 0);
  }

  getDaysUntilDue(): number {
    if (!this.editTaskData.dueDate) return 999;
    const due = new Date(this.editTaskData.dueDate);
    const now = new Date();
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  getPriorityWarning(): string | null {
    const days = this.getDaysUntilDue();
    if (days <= 1 && this.editTaskData.priority !== TaskPriority.HIGH) {
      return '⚠️ Due in ≤1 day: Priority will be set to HIGH';
    }
    if (days <= 3 && this.editTaskData.priority === TaskPriority.LOW) {
      return '⚠️ Due in ≤3 days: Priority will be bumped to MEDIUM';
    }
    return null;
  }

  getHoursWarning(): string | null {
    const subtaskSum = this.getSubTaskSum();
    if (subtaskSum > 0 && this.editTaskData.estimatedHours < subtaskSum) {
      return `⚠️ Hours will be set to ${subtaskSum} (sum of subtasks)`;
    }
    return null;
  }

  // --- SubTask Logic ---
  newSubTaskTitle = '';
  newSubTaskEstHours = 1;
  newSubTaskDescription = '';
  newSubTaskDueDate = '';
  newSubTaskPriority: TaskPriority = TaskPriority.MEDIUM;
  editingSubTaskId: number | null = null; // Track if we are editing

  addSubTask() {
    if (!this.selectedTask?.id || !this.newSubTaskTitle) return;

    const subTask: any = { 
      title: this.newSubTaskTitle,
      estimatedHours: this.newSubTaskEstHours,
      completedHours: 0,
      status: TaskStatus.TODO,
      description: this.newSubTaskDescription,
      dueDate: this.newSubTaskDueDate,
      priority: this.newSubTaskPriority
    };
    
    // UPDATE EXISTING
    if (this.editingSubTaskId) {
        this.taskService.updateSubTask(this.selectedTask.id, this.editingSubTaskId, subTask).subscribe(updatedTask => {
            this.updateLocalTask(updatedTask);
            this.resetSubTaskForm();
            this.cd.detectChanges();
        });
    } 
    // CREATE NEW
    else {
        this.taskService.addSubTask(this.selectedTask.id, subTask).subscribe(updatedTask => {
            this.updateLocalTask(updatedTask);
            this.resetSubTaskForm();
            this.cd.detectChanges();
        });
    }
  }

  editSubTask(st: any) {
      this.editingSubTaskId = st.id;
      this.newSubTaskTitle = st.title;
      this.newSubTaskEstHours = st.estimatedHours;
      this.newSubTaskDescription = st.description || '';
      this.newSubTaskDueDate = st.dueDate || '';
      this.newSubTaskPriority = st.priority || TaskPriority.MEDIUM;
  }

  cancelEditSubTask() {
      this.resetSubTaskForm();
  }

  resetSubTaskForm() {
      this.editingSubTaskId = null;
      this.newSubTaskTitle = '';
      this.newSubTaskEstHours = 1;
      this.newSubTaskDescription = '';
      this.newSubTaskDueDate = '';
      this.newSubTaskPriority = TaskPriority.MEDIUM;
  }

  toggleSubTaskForm(show: boolean) {
      this.showSubTaskForm = show;
      if (!show) {
          this.resetSubTaskForm();
      }
  }

  openSubTaskEdit(st: any) {
      this.editSubTask(st);
      this.showSubTaskForm = true;
  }

  updateSubTaskStatus(subTask: any, event: any) {
     if (!this.selectedTask?.id || !subTask.id) return;
     
     const newStatus = event.target.value;
     const updates = { status: newStatus };
     
     // Optimistic update
     subTask.status = newStatus;

     this.taskService.updateSubTask(this.selectedTask.id, subTask.id, updates).subscribe(updatedTask => {
         this.updateLocalTask(updatedTask);
         this.loadHours(); // Refresh analytics
     });
  }

  updateLocalTask(updatedTask: Task) {
      this.selectedTask = updatedTask;
      this.editTaskData = { ...updatedTask };
      const idx = this.tasks.findIndex(t => t.id === updatedTask.id);
      if (idx !== -1) this.tasks[idx] = updatedTask;
  }
}
