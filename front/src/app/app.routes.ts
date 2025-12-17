import { Routes } from '@angular/router';
import { OrientationComponent } from './pages/orientation/orientation.component';
import { TasksComponent } from './pages/tasks/tasks.component';
import { GradesComponent } from './pages/grades/grades.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'tasks', component: TasksComponent },
  { path: 'grades', component: GradesComponent },
  { path: 'orientation', component: OrientationComponent }
];
