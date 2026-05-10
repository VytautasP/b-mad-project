import { Component, ChangeDetectionStrategy, input, signal, inject } from '@angular/core';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'ui-datepicker',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ label() }}</mat-label>
      <input
        matInput
        [matDatepicker]="picker"
        [min]="min()"
        [max]="max()"
        [value]="value()"
        [disabled]="disabled()"
        (dateChange)="onDateChange($event.value)"
        (blur)="onTouched()"
      />
      <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
      <mat-datepicker #picker></mat-datepicker>
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
export class UiDatepicker implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);
  readonly errorMessages = input<Record<string, string>>({});

  readonly value = signal<Date | null>(null);
  readonly disabled = signal(false);

  ngControl: NgControl | null = null;

  private onChange: (value: Date | null) => void = () => {};
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

  writeValue(value: Date | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onDateChange(value: Date | null): void {
    this.value.set(value);
    this.onChange(value);
  }
}
