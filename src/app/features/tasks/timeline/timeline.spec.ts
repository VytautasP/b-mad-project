// @ts-nocheck
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TimelineComponent } from './timeline';
import { TaskService } from '../services/task.service';
import { Task, TaskStatus, TaskPriority, TaskType } from '../../../shared/models/task.model';

describe('TimelineComponent', () => {
  let component: TimelineComponent;
  let fixture: ComponentFixture<TimelineComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockBreakpointObserver: jasmine.SpyObj<BreakpointObserver>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockTask: Task = {
    id: '1',
    name: 'Test Task',
    description: 'Test description',
    parentTaskId: null,
    hasChildren: false,
    createdByUserId: 'user1',
    createdByUserName: 'Test User',
    createdDate: new Date('2026-01-01'),
    modifiedDate: new Date('2026-01-01'),
    dueDate: new Date('2026-01-15'),
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

  beforeEach(async () => {
    mockTaskService = jasmine.createSpyObj('TaskService', [
      'getTimelineTasks',
      'updateTask'
    ]);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockBreakpointObserver = jasmine.createSpyObj('BreakpointObserver', ['observe']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    // Default mock implementations
    mockTaskService.getTimelineTasks.and.returnValue(of([mockTask]));
    mockBreakpointObserver.observe.and.returnValue(of({ matches: false, breakpoints: {} }));

    await TestBed.configureTestingModule({
      imports: [TimelineComponent, MatDialogModule],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TimelineComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should restore zoom level from session storage on init', () => {
    sessionStorage.setItem('timeline-zoom', 'day');
    component.ngOnInit();
    expect(component.viewMode()).toBe('day');
    sessionStorage.removeItem('timeline-zoom');
  });

  it('should load timeline tasks on init', () => {
    fixture.detectChanges();
    expect(mockTaskService.getTimelineTasks).toHaveBeenCalled();
    expect(component.tasks().length).toBe(1);
  });

  it('should detect mobile device', (done) => {
    mockBreakpointObserver.observe.and.returnValue(of({ matches: true, breakpoints: {} }));
    fixture.detectChanges();
    
    setTimeout(() => {
      expect(component.isMobile()).toBe(true);
      done();
    }, 100);
  });

  it('should persist zoom level when changing view mode', () => {
    spyOn(sessionStorage, 'setItem');
    component.changeViewMode('month');
    expect(sessionStorage.setItem).toHaveBeenCalledWith('timeline-zoom', 'month');
    expect(component.viewMode()).toBe('month');
  });

  it('should not allow dragging completed tasks', () => {
    const completedTask = { ...mockTask, status: TaskStatus.Done };
    expect(component['isTaskDraggable'](completedTask)).toBe(false);
  });

  it('should allow dragging non-completed tasks', () => {
    expect(component['isTaskDraggable'](mockTask)).toBe(true);
  });

  it('should validate due date is not before creation date', async () => {
    component.tasks.set([mockTask]);
    const newDueDate = new Date('2025-12-01'); // Before creation date
    
    const result = await component['onTaskDragEnd']('1', new Date(), newDueDate);
    expect(result).toBe(false);
  });

  it('should update task via API on successful drag', async () => {
    const updatedTask = { ...mockTask, dueDate: new Date('2026-01-20') };
    mockTaskService.updateTask.and.returnValue(of(updatedTask));
    component.tasks.set([mockTask]);
    
    const result = await component['onTaskDragEnd']('1', new Date(), new Date('2026-01-20'));
    expect(result).toBe(true);
    expect(mockTaskService.updateTask).toHaveBeenCalled();
  });

  it('should revert drag on API error', async () => {
    mockTaskService.updateTask.and.returnValue(throwError(() => new Error('API Error')));
    component.tasks.set([mockTask]);
    spyOn(window, 'alert');
    
    const result = await component['onTaskDragEnd']('1', new Date(), new Date('2026-01-20'));
    expect(result).toBe(false);
  });

  it('should open task detail dialog on task click', () => {
    component.tasks.set([mockTask]);
    const dialogRef = { afterClosed: () => of(null) };
    mockDialog.open.and.returnValue(dialogRef as any);
    
    component.onTaskClick('1');
    expect(mockDialog.open).toHaveBeenCalled();
  });

  it('should zoom in from month to week', () => {
    component.viewMode.set('month');
    component['zoomIn']();
    expect(component.viewMode()).toBe('week');
  });

  it('should zoom in from week to day', () => {
    component.viewMode.set('week');
    component['zoomIn']();
    expect(component.viewMode()).toBe('day');
  });

  it('should not zoom in beyond day level', () => {
    component.viewMode.set('day');
    component['zoomIn']();
    expect(component.viewMode()).toBe('day');
  });

  it('should zoom out from day to week', () => {
    component.viewMode.set('day');
    component['zoomOut']();
    expect(component.viewMode()).toBe('week');
  });

  it('should zoom out from week to month', () => {
    component.viewMode.set('week');
    component['zoomOut']();
    expect(component.viewMode()).toBe('month');
  });

  it('should not zoom out beyond month level', () => {
    component.viewMode.set('month');
    component['zoomOut']();
    expect(component.viewMode()).toBe('month');
  });

  it('should handle keyboard zoom in shortcuts', () => {
    component.tasks.set([mockTask]);
    component.viewMode.set('month');
    
    const event = new KeyboardEvent('keydown', { key: '+' });
    spyOn(event, 'preventDefault');
    component.handleKeyboardEvent(event);
    
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.viewMode()).toBe('week');
  });

  it('should handle keyboard zoom out shortcuts', () => {
    component.tasks.set([mockTask]);
    component.viewMode.set('week');
    
    const event = new KeyboardEvent('keydown', { key: '-' });
    spyOn(event, 'preventDefault');
    component.handleKeyboardEvent(event);
    
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.viewMode()).toBe('month');
  });

  it('should add locked class and icon to completed tasks', () => {
    const completedTask = { ...mockTask, status: TaskStatus.Done };
    const timelineItems = component['transformTasksToTimelineFormat']([completedTask]);
    
    expect(timelineItems[0].className).toContain('locked');
    expect(timelineItems[0].content).toContain('🔒');
    expect(timelineItems[0].editable).toBe(false);
  });

  it('should not add locked class to in-progress tasks', () => {
    const timelineItems = component['transformTasksToTimelineFormat']([mockTask]);
    
    expect(timelineItems[0].className).not.toContain('locked');
    expect(timelineItems[0].content).not.toContain('🔒');
    expect(timelineItems[0].editable).toBe(true);
  });

  it('should navigate to dashboard date-edit context from empty-state CTA', () => {
    component.onAddDueDateCta();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard'], {
      queryParams: {
        openTaskForm: 'true',
        focusField: 'dueDate',
        returnTo: 'timeline'
      }
    });
  });

  it('should track no-date and partial-date tasks when loading timeline data', () => {
    const noDateTask = { ...mockTask, id: '2', dueDate: null };
    const invalidDateTask = { ...mockTask, id: '3', dueDate: '2026-01-' as any };
    mockTaskService.getTimelineTasks.and.returnValue(of([mockTask, noDateTask, invalidDateTask]));

    component.loadTimelineData(new Date('2026-01-01'), new Date('2026-01-31'));

    expect(component.tasks().length).toBe(1);
    expect(component.noDueDateCount()).toBe(1);
    expect(component.invalidDueDateCount()).toBe(1);
  });
});
