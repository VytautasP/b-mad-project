import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { UiStatusBadge } from './ui-status-badge';
import { TaskStatus } from '../../models/task.model';

@Component({
  standalone: true,
  imports: [UiStatusBadge],
  template: `<ui-status-badge [status]="status" [showIcon]="showIcon" [showDot]="showDot" [size]="size" />`,
})
class TestHost {
  status = TaskStatus.ToDo;
  showIcon = false;
  showDot = true;
  size: 'sm' | 'md' = 'md';
}

function createFixture(overrides: Partial<TestHost> = {}): { fixture: ComponentFixture<TestHost>; host: TestHost } {
  const fixture = TestBed.createComponent(TestHost);
  const host = fixture.componentInstance;
  Object.assign(host, overrides);
  fixture.detectChanges();
  return { fixture, host };
}

describe('UiStatusBadge', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();
  });

  it('should create', () => {
    const { fixture } = createFixture();
    expect(fixture.nativeElement.querySelector('ui-status-badge')).toBeTruthy();
  });

  describe('status rendering', () => {
    it('should render To Do status', () => {
      const { fixture } = createFixture({ status: TaskStatus.ToDo });
      expect(fixture.nativeElement.querySelector('.status-label').textContent.trim()).toBe('To Do');
      expect(fixture.nativeElement.querySelector('.status-todo')).toBeTruthy();
    });

    it('should render In Progress status', () => {
      const { fixture } = createFixture({ status: TaskStatus.InProgress });
      expect(fixture.nativeElement.querySelector('.status-label').textContent.trim()).toBe('In Progress');
      expect(fixture.nativeElement.querySelector('.status-in-progress')).toBeTruthy();
    });

    it('should render Blocked status', () => {
      const { fixture } = createFixture({ status: TaskStatus.Blocked });
      expect(fixture.nativeElement.querySelector('.status-label').textContent.trim()).toBe('Blocked');
      expect(fixture.nativeElement.querySelector('.status-blocked')).toBeTruthy();
    });

    it('should render Waiting status', () => {
      const { fixture } = createFixture({ status: TaskStatus.Waiting });
      expect(fixture.nativeElement.querySelector('.status-label').textContent.trim()).toBe('Waiting');
      expect(fixture.nativeElement.querySelector('.status-waiting')).toBeTruthy();
    });

    it('should render Done status', () => {
      const { fixture } = createFixture({ status: TaskStatus.Done });
      expect(fixture.nativeElement.querySelector('.status-label').textContent.trim()).toBe('Done');
      expect(fixture.nativeElement.querySelector('.status-done')).toBeTruthy();
    });
  });

  describe('dot toggle', () => {
    it('should show dot by default', () => {
      const { fixture } = createFixture();
      expect(fixture.nativeElement.querySelector('.status-dot')).toBeTruthy();
    });

    it('should hide dot when showDot is false', () => {
      const { fixture } = createFixture({ showDot: false });
      expect(fixture.nativeElement.querySelector('.status-dot')).toBeFalsy();
    });
  });

  describe('icon toggle', () => {
    it('should hide icon by default', () => {
      const { fixture } = createFixture();
      expect(fixture.nativeElement.querySelector('.status-icon')).toBeFalsy();
    });

    it('should show icon when showIcon is true', () => {
      const { fixture } = createFixture({ showIcon: true });
      expect(fixture.nativeElement.querySelector('.status-icon')).toBeTruthy();
    });
  });

  describe('size variants', () => {
    it('should not have size-sm class by default', () => {
      const { fixture } = createFixture();
      const el = fixture.nativeElement.querySelector('ui-status-badge');
      expect(el.classList.contains('size-sm')).toBe(false);
    });

    it('should have size-sm class when size is sm', () => {
      const { fixture } = createFixture({ size: 'sm' });
      const el = fixture.nativeElement.querySelector('ui-status-badge');
      expect(el.classList.contains('size-sm')).toBe(true);
    });
  });
});
