import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UiSelect } from './ui-select';
import { SelectOption } from '../models/ui-types';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, UiSelect],
  template: `
    <ui-select
      label="Test"
      [options]="options"
      [multiple]="multiple"
      [errorMessages]="errorMessages"
      [formControl]="control"
    />
  `,
})
class TestHost {
  control = new FormControl<number | number[] | null>(null);
  options: SelectOption<number>[] = [
    { value: 1, label: 'Option 1' },
    { value: 2, label: 'Option 2' },
    { value: 3, label: 'Option 3', icon: 'star' },
    { value: 4, label: 'Option 4', disabled: true },
  ];
  multiple = false;
  errorMessages: Record<string, string> = {};
}

describe('UiSelect', () => {
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
    expect(fixture.nativeElement.querySelector('ui-select')).toBeTruthy();
  });

  it('should render all options', () => {
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.mat-mdc-select-trigger');
    trigger.click();
    fixture.detectChanges();

    const options = document.querySelectorAll('mat-option');
    expect(options.length).toBe(4);
  });

  it('should render option with icon', () => {
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.mat-mdc-select-trigger');
    trigger.click();
    fixture.detectChanges();

    const options = document.querySelectorAll('mat-option');
    const iconOption = options[2];
    const icon = iconOption.querySelector('mat-icon');
    expect(icon?.textContent?.trim()).toBe('star');
  });

  it('should render disabled option', () => {
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.mat-mdc-select-trigger');
    trigger.click();
    fixture.detectChanges();

    const options = document.querySelectorAll('mat-option');
    expect(options[3].classList).toContain('mdc-list-item--disabled');
  });

  it('should bind value from FormControl for single select', async () => {
    fixture.detectChanges();
    host.control.setValue(2);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const selectText = fixture.nativeElement.querySelector('.mat-mdc-select-value-text');
    expect(selectText?.textContent?.trim()).toBe('Option 2');
  });

  it('should propagate selection to FormControl', () => {
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.mat-mdc-select-trigger');
    trigger.click();
    fixture.detectChanges();

    const options = document.querySelectorAll('mat-option');
    (options[0] as HTMLElement).click();
    fixture.detectChanges();

    expect(host.control.value).toBe(1);
  });

  it('should support multiple selection', () => {
    host.multiple = true;
    host.control = new FormControl<number[]>([]);
    fixture.detectChanges();

    host.control.setValue([1, 2]);
    fixture.detectChanges();

    const selectText = fixture.nativeElement.querySelector('.mat-mdc-select-value-text');
    expect(selectText?.textContent).toContain('Option 1');
    expect(selectText?.textContent).toContain('Option 2');
  });

  it('should disable the select when FormControl is disabled', () => {
    host.control.disable();
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('.mat-mdc-select-disabled');
    expect(select).toBeTruthy();
  });

  it('should display validation errors when touched', () => {
    host.control.setValidators(() => ({ required: true }));
    host.errorMessages = { required: 'Selection is required' };
    host.control.updateValueAndValidity();
    host.control.markAsTouched();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('mat-error');
    expect(error?.textContent?.trim()).toBe('Selection is required');
  });
});
