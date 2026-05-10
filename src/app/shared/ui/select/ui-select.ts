import { Component, ChangeDetectionStrategy, input, signal, inject } from '@angular/core';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { SelectOption } from '../models/ui-types';

@Component({
  selector: 'ui-select',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ label() }}</mat-label>
      <mat-select
        [multiple]="multiple()"
        [placeholder]="placeholder()"
        [value]="value()"
        [disabled]="disabled()"
        (selectionChange)="onSelectionChange($event.value)"
        (blur)="onTouched()"
      >
        @for (option of options(); track option.value) {
          <mat-option [value]="option.value" [disabled]="option.disabled ?? false">
            @if (option.icon) {
              <mat-icon>{{ option.icon }}</mat-icon>
            }
            {{ option.label }}
          </mat-option>
        }
      </mat-select>
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
export class UiSelect<T = any> implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly options = input.required<SelectOption<T>[]>();
  readonly multiple = input(false);
  readonly placeholder = input('');
  readonly errorMessages = input<Record<string, string>>({});

  readonly value = signal<T | T[] | null>(null);
  readonly disabled = signal(false);

  ngControl: NgControl | null = null;

  private onChange: (value: T | T[] | null) => void = () => {};
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

  writeValue(value: T | T[] | null): void {
    this.value.set(value ?? (this.multiple() ? [] as unknown as T : null));
  }

  registerOnChange(fn: (value: T | T[] | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onSelectionChange(value: T | T[]): void {
    this.value.set(value);
    this.onChange(value);
  }
}
