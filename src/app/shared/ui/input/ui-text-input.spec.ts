import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UiTextInput } from './ui-text-input';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, UiTextInput],
  template: `
    <ui-text-input
      label="Test"
      [type]="type"
      [showPasswordToggle]="showPasswordToggle"
      [errorMessages]="errorMessages"
      [formControl]="control"
    />
  `,
})
class TestHost {
  control = new FormControl('');
  type: 'text' | 'email' | 'password' | 'number' = 'text';
  showPasswordToggle = false;
  errorMessages: Record<string, string> = {};
}

describe('UiTextInput', () => {
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
    expect(fixture.nativeElement.querySelector('ui-text-input')).toBeTruthy();
  });

  it('should bind value from FormControl', () => {
    host.control.setValue('hello');
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.value).toBe('hello');
  });

  it('should propagate input changes to FormControl', () => {
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'typed';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.control.value).toBe('typed');
  });

  it('should display validation errors when touched', () => {
    host.control.setValidators(() => ({ required: true }));
    host.errorMessages = { required: 'Field is required' };
    host.control.updateValueAndValidity();
    host.control.markAsTouched();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('mat-error');
    expect(error?.textContent?.trim()).toBe('Field is required');
  });

  it('should disable the input when FormControl is disabled', () => {
    host.control.disable();
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.disabled).toBe(true);
  });

  it('should toggle password visibility', () => {
    host.type = 'password';
    host.showPasswordToggle = true;
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.type).toBe('password');

    const toggleBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[matSuffix]');
    expect(toggleBtn).toBeTruthy();
    toggleBtn.click();
    fixture.detectChanges();

    expect(input.type).toBe('text');

    toggleBtn.click();
    fixture.detectChanges();
    expect(input.type).toBe('password');
  });
});
