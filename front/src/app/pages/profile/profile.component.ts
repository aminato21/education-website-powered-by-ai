import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user: User | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    if (!this.user) {
      this.router.navigate(['/login']);
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Force logout on frontend anyway
        localStorage.removeItem('currentUser');
        this.router.navigate(['/login']);
      }
    });
  }

  getMemberSince(): string {
    if (!this.user?.createdAt) return '';
    const date = new Date(this.user.createdAt);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
}
