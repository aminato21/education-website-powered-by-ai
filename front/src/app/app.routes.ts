import { Routes } from '@angular/router';
import { OrientationComponent } from './pages/orientation/orientation.component';
import { TasksComponent } from './pages/tasks/tasks.component';
import { GradesComponent } from './pages/grades/grades.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Public routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Protected routes (require login)
  { path: '', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'tasks', component: TasksComponent, canActivate: [authGuard] },
  { path: 'grades', component: GradesComponent, canActivate: [authGuard] },
  { path: 'orientation', component: OrientationComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  
  // Redirect unknown paths to login
  { path: '**', redirectTo: 'login' }
];
