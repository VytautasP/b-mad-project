import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/tasks',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent)
  },
  {
    path: 'tasks',
    loadComponent: () => import('./features/tasks/task-list/task-list.component').then(m => m.TaskListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'project',
    loadComponent: () => import('./features/project/project').then(m => m.ProjectComponent),
    canActivate: [authGuard]
  },
  {
    path: 'timeline',
    loadComponent: () => import('./features/tasks/timeline/timeline').then(m => m.TimelineComponent),
    canActivate: [authGuard]
  },
  {
    path: 'logs',
    loadComponent: () => import('./features/logs/logs').then(m => m.LogsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings').then(m => m.SettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'tasks/:id',
    loadComponent: () => import('./features/tasks/task-details-page/task-details-page').then(m => m.TaskDetailsPageComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
