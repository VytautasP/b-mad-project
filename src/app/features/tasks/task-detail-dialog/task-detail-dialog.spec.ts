import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TaskDetailDialog, TaskDetailDialogData } from './task-detail-dialog';
import { Task, TaskPriority, TaskStatus, TaskType } from '../../../shared/models/task.model';

describe('TaskDetailDialog (Quick Inspect)', () => {
  let component: TaskDetailDialog;
  let fixture: ComponentFixture<TaskDetailDialog>;

  const mockTask: Task = {
    id: 'task-1',
    name: 'Task One',
    description: 'Short description',
    parentTaskId: null,
    hasChildren: false,
    createdByUserId: 'user-1',
    createdByUserName: 'User One',
    createdDate: new Date('2026-01-01'),
    modifiedDate: new Date('2026-01-02'),
    dueDate: new Date('2026-01-31'),
    priority: TaskPriority.Medium,
    status: TaskStatus.InProgress,
    progress: 50,
    type: TaskType.Task,
    isDeleted: false,
    assignees: [],
    directLoggedMinutes: 0,
    childrenLoggedMinutes: 0,
    totalLoggedMinutes: 0
  };

  const mockDialogRef = {
    close: vi.fn()
  };

  const mockRouter = {
    navigate: vi.fn().mockResolvedValue(true)
  };

  beforeEach(async () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);

    const dialogData: TaskDetailDialogData = {
      task: mockTask,
      openerElement: opener
    };

    await TestBed.configureTestingModule({
      imports: [TaskDetailDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskDetailDialog);
    component = fixture.componentInstance;
  });

  it('should close and restore focus to opener on escape', () => {
    const data = TestBed.inject(MAT_DIALOG_DATA) as TaskDetailDialogData;
    const focusSpy = vi.spyOn(data.openerElement!, 'focus');

    component.onEscapeKey(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(mockDialogRef.close).toHaveBeenCalled();
    expect(focusSpy).toHaveBeenCalled();
  });

  it('should navigate to full details and close modal', () => {
    component.onOpenFullDetails();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tasks', mockTask.id]);
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});