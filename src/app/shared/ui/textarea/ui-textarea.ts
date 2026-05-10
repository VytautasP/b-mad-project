import { Component, ChangeDetectionStrategy, input, signal, inject } from '@angular/core';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'ui-textarea',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ label() }}</mat-label>
      <textarea
        matInput
        [rows]="rows()"
        [attr.maxlength]="maxlength()"
        [value]="value()"
        [disabled]="disabled()"
        (input)="onInput($event)"
        (blur)="onTouched()"
      ></textarea>
      @if (showCharCount() && maxlength()) {
        <mat-hint align="end">{{ value().length }}/{{ maxlength() }}</mat-hint>
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
export class UiTextarea implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly rows = input(3);
  readonly maxlength = input<number | null>(null);
  readonly showCharCount = input(false);
  readonly errorMessages = input<Record<string, string>>({});

  readonly value = signal('');
  readonly disabled = signal(false);

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
    const val = (event.target as HTMLTextAreaElement).value;
    this.value.set(val);
    this.onChange(val);
  }
}
