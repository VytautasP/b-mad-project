import { Component } from '@angular/core';
import { TaskFullDetailsWorkspaceComponent } from '../task-full-details-workspace/task-full-details-workspace';

@Component({
  selector: 'app-task-details-page',
  standalone: true,
  imports: [TaskFullDetailsWorkspaceComponent],
  templateUrl: './task-details-page.html',
  styleUrl: './task-details-page.css'
})
export class TaskDetailsPageComponent {}