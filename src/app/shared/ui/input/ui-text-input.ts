import { Component, ChangeDetectionStrategy, input, signal, inject } from '@angular/core';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'ui-text-input',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ label() }}</mat-label>
      @if (prefixIcon()) {
        <mat-icon matPrefix>{{ prefixIcon() }}</mat-icon>
      }
      <input
        matInput
        [type]="showPasswordToggle() && passwordVisible() ? 'text' : type()"
        [placeholder]="placeholder()"
        [attr.maxlength]="maxlength()"
        [attr.min]="min()"
        [attr.max]="max()"
        [attr.required]="required() || null"
        [value]="value()"
        [disabled]="disabled()"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      @if (showPasswordToggle() && type() === 'password') {
        <button
          mat-icon-button
          matSuffix
          type="button"
          (click)="togglePasswordVisibility()"
          [attr.aria-label]="passwordVisible() ? 'Hide password' : 'Show password'"
        >
          <mat-icon>{{ passwordVisible() ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      }
      @if (hint()) {
        <mat-hint>{{ hint() }}</mat-hint>
      }
      @if (ngControl?.invalid && ngControl?.touched) {
        @for (entry of errorEntries(); track entry[0]) {
          @if (ngControl?.hasError(entry[0])) {
            <mat-error>{{ entry[1] }}</mat-error>
          }
        }
      }
    </mat-form-field>
  `,
})
export class UiTextInput implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly type = input<'text' | 'email' | 'password' | 'number'>('text');
  readonly placeholder = input('');
  readonly prefixIcon = input<string>();
  readonly hint = input<string>();
  readonly maxlength = input<number>();
  readonly min = input<number>();
  readonly max = input<number>();
  readonly required = input(false);
  readonly showPasswordToggle = input(false);
  readonly errorMessages = input<Record<string, string>>({});

  readonly value = signal('');
  readonly disabled = signal(false);
  readonly passwordVisible = signal(false);

  ngControl: NgControl | null = null;

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  constructor() {
    const ngControl = inject(NgControl, { optional: true, self: true });
    if (ngControl) {
      ngControl.valueAccessor = this;
      this.ngControl = ngControl;
    }
  }

  errorEntries(): [string, string][] {
    return Object.entries(this.errorMessages());
  }

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update(v => !v);
  }
}
