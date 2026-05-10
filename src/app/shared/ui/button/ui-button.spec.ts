import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UiButton } from './ui-button';
import { ButtonVariant } from '../models/ui-types';

@Component({
  standalone: true,
  imports: [UiButton],
  template: `
    <ui-button
      [variant]="variant"
      [type]="type"
      [icon]="icon"
      [iconPosition]="iconPosition"
      [loading]="loading"
      [disabled]="disabled"
      [ariaLabel]="ariaLabel"
    >
      {{ label }}
    </ui-button>
  `,
})
class TestHost {
  variant: ButtonVariant = 'primary';
  type: 'button' | 'submit' = 'button';
  icon = '';
  iconPosition: 'start' | 'end' = 'start';
  loading = false;
  disabled = false;
  ariaLabel = '';
  label = 'Click me';
}

describe('UiButton', () => {
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
    expect(fixture.nativeElement.querySelector('ui-button')).toBeTruthy();
  });

  it('should render primary variant as mat-flat-button', () => {
    host.variant = 'primary';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.classList).toContain('mat-mdc-unelevated-button');
  });

  it('should render text variant as mat-button', () => {
    host.variant = 'text';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.classList).toContain('mat-mdc-button');
  });

  it('should render secondary variant as mat-stroked-button', () => {
    host.variant = 'secondary';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.classList).toContain('mat-mdc-outlined-button');
  });

  it('should render outlined variant as mat-stroked-button', () => {
    host.variant = 'outlined';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.classList).toContain('mat-mdc-outlined-button');
  });

  it('should render danger variant as mat-flat-button with warn color', () => {
    host.variant = 'danger';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.classList).toContain('mat-mdc-unelevated-button');
    expect(button.classList).toContain('mat-warn');
  });

  it('should render icon variant as mat-icon-button', () => {
    host.variant = 'icon';
    host.icon = 'close';
    host.ariaLabel = 'Close';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.classList).toContain('mat-mdc-icon-button');
  });

  it('should project text content', () => {
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.textContent).toContain('Click me');
  });

  it('should show spinner when loading', () => {
    host.loading = true;
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('mat-spinner');
    expect(spinner).toBeTruthy();
  });

  it('should disable button when loading', () => {
    host.loading = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);
  });

  it('should disable button when disabled input is true', () => {
    host.disabled = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);
  });

  it('should render icon at start position', () => {
    host.icon = 'save';
    host.iconPosition = 'start';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    const icon = button.querySelector('mat-icon');
    expect(icon).toBeTruthy();
    expect(icon.textContent.trim()).toBe('save');
  });

  it('should render icon at end position', () => {
    host.icon = 'arrow_forward';
    host.iconPosition = 'end';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    const icon = button.querySelector('mat-icon');
    expect(icon).toBeTruthy();
    expect(icon.textContent.trim()).toBe('arrow_forward');
  });

  it('should set type attribute', () => {
    host.type = 'submit';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.type).toBe('submit');
  });

  it('should set aria-label', () => {
    host.ariaLabel = 'Save document';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Save document');
  });

  it('should show icon in icon variant', () => {
    host.variant = 'icon';
    host.icon = 'delete';
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('mat-icon');
    expect(icon.textContent.trim()).toBe('delete');
  });

  it('should show spinner instead of icon in loading icon variant', () => {
    host.variant = 'icon';
    host.icon = 'delete';
    host.loading = true;
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('mat-spinner');
    const icon = fixture.nativeElement.querySelector('mat-icon');
    expect(spinner).toBeTruthy();
    expect(icon).toBeFalsy();
  });
});
