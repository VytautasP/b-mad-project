import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UiTextarea } from './ui-textarea';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, UiTextarea],
  template: `
    <ui-textarea
      label="Notes"
      [rows]="rows"
      [maxlength]="maxlength"
      [showCharCount]="showCharCount"
      [errorMessages]="errorMessages"
      [formControl]="control"
    />
  `,
})
class TestHost {
  control = new FormControl('');
  rows = 3;
  maxlength: number | null = null;
  showCharCount = false;
  errorMessages: Record<string, string> = {};
}

describe('UiTextarea', () => {
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
    expect(fixture.nativeElement.querySelector('ui-textarea')).toBeTruthy();
  });

  it('should bind value from FormControl', () => {
    host.control.setValue('some text');
    fixture.detectChanges();

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    expect(textarea.value).toBe('some text');
  });

  it('should propagate input changes to FormControl', () => {
    fixture.detectChanges();
    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    textarea.value = 'typed text';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.control.value).toBe('typed text');
  });

  it('should display validation errors when touched', () => {
    host.control.setValidators(() => ({ required: true }));
    host.errorMessages = { required: 'Notes are required' };
    host.control.updateValueAndValidity();
    host.control.markAsTouched();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('mat-error');
    expect(error?.textContent?.trim()).toBe('Notes are required');
  });

  it('should disable the textarea when FormControl is disabled', () => {
    host.control.disable();
    fixture.detectChanges();

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    expect(textarea.disabled).toBe(true);
  });

  it('should show character count when enabled', () => {
    host.maxlength = 500;
    host.showCharCount = true;
    host.control.setValue('hello');
    fixture.detectChanges();

    const hint = fixture.nativeElement.querySelector('mat-hint');
    expect(hint?.textContent?.trim()).toBe('5/500');
  });

  it('should set rows attribute on textarea', () => {
    host.rows = 5;
    fixture.detectChanges();

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    expect(textarea.rows).toBe(5);
  });
});
