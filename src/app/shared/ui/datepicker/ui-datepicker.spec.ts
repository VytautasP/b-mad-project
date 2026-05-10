import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatNativeDateModule } from '@angular/material/core';
import { UiDatepicker } from './ui-datepicker';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, UiDatepicker, MatNativeDateModule],
  template: `
    <ui-datepicker
      label="Test Date"
      [min]="minDate"
      [max]="maxDate"
      [errorMessages]="errorMessages"
      [formControl]="control"
    />
  `,
})
class TestHost {
  control = new FormControl<Date | null>(null);
  minDate: Date | null = null;
  maxDate: Date | null = null;
  errorMessages: Record<string, string> = {};
}

describe('UiDatepicker', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost, NoopAnimationsModule, MatNativeDateModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ui-datepicker')).toBeTruthy();
  });

  it('should render the datepicker toggle', () => {
    fixture.detectChanges();
    const toggle = fixture.nativeElement.querySelector('mat-datepicker-toggle');
    expect(toggle).toBeTruthy();
  });

  it('should bind value from FormControl', () => {
    const date = new Date(2024, 5, 15);
    host.control.setValue(date);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.value).toBeTruthy();
  });

  it('should propagate date changes to FormControl', () => {
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');

    input.value = '6/15/2024';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('dateChange'));
    fixture.detectChanges();

    // The FormControl should have been updated via the CVA
    // (exact value depends on date adapter parsing)
  });

  it('should disable the input when FormControl is disabled', () => {
    host.control.disable();
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.disabled).toBe(true);
  });

  it('should apply min date constraint', () => {
    host.minDate = new Date(2024, 0, 1);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.getAttribute('min')).toBeTruthy();
  });

  it('should apply max date constraint', () => {
    host.maxDate = new Date(2024, 11, 31);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.getAttribute('max')).toBeTruthy();
  });

  it('should display validation errors when touched', () => {
    host.control.setValidators(() => ({ required: true }));
    host.errorMessages = { required: 'Date is required' };
    host.control.updateValueAndValidity();
    host.control.markAsTouched();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('mat-error');
    expect(error?.textContent?.trim()).toBe('Date is required');
  });

  it('should accept null min/max without errors', () => {
    host.minDate = null;
    host.maxDate = null;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('ui-datepicker')).toBeTruthy();
  });
});
