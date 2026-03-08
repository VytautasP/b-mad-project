import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';
import { filter } from 'rxjs/operators';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  exact: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  currentUser$ = this.authService.currentUser$;
  mobileOpen = signal(false);

  readonly navItems: NavItem[] = [
    { label: 'Tasks', icon: 'task_alt', route: '/dashboard', exact: true },
    { label: 'Project', icon: 'folder', route: '/project', exact: false },
    { label: 'Timeline', icon: 'timeline', route: '/timeline', exact: false },
    { label: 'Logs', icon: 'schedule', route: '/logs', exact: false }
  ];

  readonly settingsItem: NavItem = {
    label: 'Settings', icon: 'settings', route: '/settings', exact: false
  };

  constructor() {
    // Auto-close sidebar on navigation for mobile
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.mobileOpen.set(false);
    });
  }

  toggleMobile(): void {
    this.mobileOpen.update(v => !v);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
  }
}
