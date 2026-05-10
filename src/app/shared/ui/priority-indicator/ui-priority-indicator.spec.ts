import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { UiPriorityIndicator } from './ui-priority-indicator';
import { TaskPriority } from '../../models/task.model';

@Component({
  standalone: true,
  imports: [UiPriorityIndicator],
  template: `<ui-priority-indicator [priority]="priority" [showLabel]="showLabel" [showIcon]="showIcon" [size]="size" />`,
})
class TestHost {
  priority = TaskPriority.Low;
  showLabel = true;
  showIcon = true;
  size: 'sm' | 'md' = 'md';
}

function createFixture(overrides: Partial<TestHost> = {}): { fixture: ComponentFixture<TestHost>; host: TestHost } {
  const fixture = TestBed.createComponent(TestHost);
  const host = fixture.componentInstance;
  Object.assign(host, overrides);
  fixture.detectChanges();
  return { fixture, host };
}

describe('UiPriorityIndicator', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();
  });

  it('should create', () => {
    const { fixture } = createFixture();
    expect(fixture.nativeElement.querySelector('ui-priority-indicator')).toBeTruthy();
  });

  describe('priority rendering', () => {
    it('should render Low priority', () => {
      const { fixture } = createFixture({ priority: TaskPriority.Low });
      expect(fixture.nativeElement.querySelector('.priority-label').textContent.trim()).toBe('Low');
      expect(fixture.nativeElement.querySelector('.priority-low')).toBeTruthy();
    });

    it('should render Medium priority', () => {
      const { fixture } = createFixture({ priority: TaskPriority.Medium });
      expect(fixture.nativeElement.querySelector('.priority-label').textContent.trim()).toBe('Medium');
      expect(fixture.nativeElement.querySelector('.priority-medium')).toBeTruthy();
    });

    it('should render High priority', () => {
      const { fixture } = createFixture({ priority: TaskPriority.High });
      expect(fixture.nativeElement.querySelector('.priority-label').textContent.trim()).toBe('High');
      expect(fixture.nativeElement.querySelector('.priority-high')).toBeTruthy();
    });

    it('should render Critical priority', () => {
      const { fixture } = createFixture({ priority: TaskPriority.Critical });
      expect(fixture.nativeElement.querySelector('.priority-label').textContent.trim()).toBe('Critical');
      expect(fixture.nativeElement.querySelector('.priority-critical')).toBeTruthy();
    });
  });

  describe('icon rendering', () => {
    it('should show correct icon for Critical', () => {
      const { fixture } = createFixture({ priority: TaskPriority.Critical });
      expect(fixture.nativeElement.querySelector('mat-icon').textContent.trim()).toBe('keyboard_double_arrow_up');
    });

    it('should show correct icon for High', () => {
      const { fixture } = createFixture({ priority: TaskPriority.High });
      expect(fixture.nativeElement.querySelector('mat-icon').textContent.trim()).toBe('arrow_upward');
    });

    it('should show correct icon for Medium', () => {
      const { fixture } = createFixture({ priority: TaskPriority.Medium });
      expect(fixture.nativeElement.querySelector('mat-icon').textContent.trim()).toBe('arrow_forward');
    });

    it('should show correct icon for Low', () => {
      const { fixture } = createFixture({ priority: TaskPriority.Low });
      expect(fixture.nativeElement.querySelector('mat-icon').textContent.trim()).toBe('arrow_downward');
    });
  });

  describe('label toggle', () => {
    it('should show label by default', () => {
      const { fixture } = createFixture();
      expect(fixture.nativeElement.querySelector('.priority-label')).toBeTruthy();
    });

    it('should hide label when showLabel is false', () => {
      const { fixture } = createFixture({ showLabel: false });
      expect(fixture.nativeElement.querySelector('.priority-label')).toBeFalsy();
    });
  });

  describe('icon toggle', () => {
    it('should show icon by default', () => {
      const { fixture } = createFixture();
      expect(fixture.nativeElement.querySelector('mat-icon')).toBeTruthy();
    });

    it('should hide icon when showIcon is false', () => {
      const { fixture } = createFixture({ showIcon: false });
      expect(fixture.nativeElement.querySelector('mat-icon')).toBeFalsy();
    });
  });

  describe('size variants', () => {
    it('should not have size-sm class by default', () => {
      const { fixture } = createFixture();
      const el = fixture.nativeElement.querySelector('ui-priority-indicator');
      expect(el.classList.contains('size-sm')).toBe(false);
    });

    it('should have size-sm class when size is sm', () => {
      const { fixture } = createFixture({ size: 'sm' });
      const el = fixture.nativeElement.querySelector('ui-priority-indicator');
      expect(el.classList.contains('size-sm')).toBe(true);
    });
  });
});
