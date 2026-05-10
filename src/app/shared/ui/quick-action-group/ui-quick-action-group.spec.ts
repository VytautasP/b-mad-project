import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UiQuickActionGroup, QuickActionOption } from './ui-quick-action-group';

@Component({
  standalone: true,
  imports: [UiQuickActionGroup],
  template: `
    <ui-quick-action-group
      [options]="options"
      [activeValue]="activeValue"
      [mode]="mode"
      (optionClicked)="onOptionClicked($event)"
      (selectionChanged)="onSelectionChanged($event)"
    />
  `,
})
class TestHost {
  options: QuickActionOption<number>[] = [
    { value: 15, label: '15m' },
    { value: 30, label: '30m' },
    { value: 60, label: '1h', icon: 'schedule' },
    { value: 120, label: '2h' },
  ];
  activeValue: number | null = null;
  mode: 'action' | 'radio' = 'action';
  clickedOption: QuickActionOption<number> | null = null;
  selectedValue: number | null = null;

  onOptionClicked(option: QuickActionOption<number>): void {
    this.clickedOption = option;
  }

  onSelectionChanged(value: number): void {
    this.selectedValue = value;
  }
}

describe('UiQuickActionGroup', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ui-quick-action-group')).toBeTruthy();
  });

  it('should render all options as buttons', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBe(4);
  });

  it('should display option labels', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[0].textContent).toContain('15m');
    expect(buttons[1].textContent).toContain('30m');
    expect(buttons[2].textContent).toContain('1h');
    expect(buttons[3].textContent).toContain('2h');
  });

  it('should render option icon when provided', () => {
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelectorAll('button')[2].querySelector('mat-icon');
    expect(icon).toBeTruthy();
    expect(icon.textContent.trim()).toBe('schedule');
  });

  it('should emit optionClicked on button click', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[1].click();
    fixture.detectChanges();

    expect(host.clickedOption).toEqual({ value: 30, label: '30m' });
  });

  it('should emit selectionChanged on button click', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[0].click();
    fixture.detectChanges();

    expect(host.selectedValue).toBe(15);
  });

  it('should apply active class to button matching activeValue', () => {
    host.activeValue = 60;
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[2].classList).toContain('quick-action-group__btn--active');
    expect(buttons[0].classList).not.toContain('quick-action-group__btn--active');
  });

  it('should use group role in action mode', () => {
    host.mode = 'action';
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector('.quick-action-group');
    expect(group.getAttribute('role')).toBe('group');
  });

  it('should use radiogroup role in radio mode', () => {
    host.mode = 'radio';
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector('.quick-action-group');
    expect(group.getAttribute('role')).toBe('radiogroup');
  });

  it('should set aria-checked on buttons in radio mode', () => {
    host.mode = 'radio';
    host.activeValue = 30;
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[1].getAttribute('aria-checked')).toBe('true');
    expect(buttons[0].getAttribute('aria-checked')).toBe('false');
  });

  it('should set role=radio on buttons in radio mode', () => {
    host.mode = 'radio';
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[0].getAttribute('role')).toBe('radio');
  });

  it('should set aria-pressed in action mode', () => {
    host.mode = 'action';
    host.activeValue = 15;
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
  });
});
