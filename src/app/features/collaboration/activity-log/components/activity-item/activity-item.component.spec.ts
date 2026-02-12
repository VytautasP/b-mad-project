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
    component.activity = baseActivity;
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
    const timestampEl = fixture.nativeElement.querySelector('.timestamp') as HTMLElement;
    expect(timestampEl.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('should show field change details when expanded', () => {
    component.activity = {
      ...baseActivity,
      changedField: 'Status',
      oldValue: 'InProgress',
      newValue: 'Done'
    };
    fixture.detectChanges();

    component.toggleDetails();
    fixture.detectChanges();

    const details = fixture.nativeElement.querySelector('.change-details') as HTMLElement;
    expect(details).toBeTruthy();
    const detailsText = details.textContent ?? '';
    expect(detailsText).toContain('Status');
    expect(detailsText).toContain('InProgress');
    expect(detailsText).toContain('Done');
  });

  it('should render initials avatar fallback', () => {
    component.activity = { ...baseActivity, userName: '' };
    fixture.detectChanges();
    expect(component.actorInitials).toBe('?');
  });
});
