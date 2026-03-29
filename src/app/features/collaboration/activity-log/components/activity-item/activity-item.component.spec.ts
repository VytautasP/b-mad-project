import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityItemComponent } from './activity-item.component';
import { ActivityLog, ActivityType } from '../../../../../shared/models/activity-log.model';

describe('ActivityItemComponent', () => {
  let component: ActivityItemComponent;
  let fixture: ComponentFixture<ActivityItemComponent>;

  const baseActivity: ActivityLog = {
    id: 'act-1',
    taskId: 'task-1',
    userId: 'user-1',
    userName: 'Jane Doe',
    activityType: ActivityType.Updated,
    description: 'Task updated',
    changedField: null,
    oldValue: null,
    newValue: null,
    timestamp: '2026-02-12T10:00:00Z'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityItemComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('activity', baseActivity);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should map activity type to icon', () => {
    expect(component.getActivityIcon(ActivityType.Created)).toBe('add_circle');
    expect(component.getActivityIcon(ActivityType.StatusChanged)).toBe('sync_alt');
    expect(component.getActivityIcon(ActivityType.Commented)).toBe('chat');
  });

  it('should render relative timestamp text', () => {
    const timestampEl = fixture.nativeElement.querySelector('.bubble-time') as HTMLElement;
    expect(timestampEl.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('should show field change details when present', () => {
    fixture.componentRef.setInput('activity', {
      ...baseActivity,
      changedField: 'Status',
      oldValue: 'InProgress',
      newValue: 'Done'
    });
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('.bubble-change-alert') as HTMLElement;
    expect(alert).toBeTruthy();
    const alertText = alert.textContent ?? '';
    expect(alertText).toContain('Status');
    expect(alertText).toContain('InProgress');
    expect(alertText).toContain('Done');
  });

  it('should render initials avatar fallback', () => {
    fixture.componentRef.setInput('activity', { ...baseActivity, userName: '' });
    fixture.detectChanges();
    expect(component.actorInitials).toBe('?');
  });
});
