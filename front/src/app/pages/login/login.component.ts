import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  success = '';
  loading = false;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  onSubmit() {
    if (!this.email || !this.password) {
      this.error = 'Please fill in all fields';
      this.success = '';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.success = 'Login successful! Redirecting...';
          this.cd.detectChanges();
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 500);
        } else {
          this.error = res.message || 'Login failed';
          this.cd.detectChanges();
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Connection error. Please try again.';
        this.cd.detectChanges();
      }
    });
  }
}
