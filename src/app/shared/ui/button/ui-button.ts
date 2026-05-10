import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ButtonVariant } from '../models/ui-types';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (variant() === 'icon') {
      <button
        mat-icon-button
        [type]="type()"
        [disabled]="disabled() || loading()"
        [attr.aria-label]="ariaLabel()"
      >
        @if (loading()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else if (icon()) {
          <mat-icon>{{ icon() }}</mat-icon>
        }
      </button>
    } @else {
      <button
        [attr.mat-flat-button]="isFlatButton() ? '' : null"
        [attr.mat-stroked-button]="isStrokedButton() ? '' : null"
        [attr.mat-button]="isTextButton() ? '' : null"
        [type]="type()"
        [disabled]="disabled() || loading()"
        [attr.aria-label]="ariaLabel()"
        [class.mat-mdc-unelevated-button]="isFlatButton()"
        [class.mdc-button]="true"
        [class.mat-mdc-button-base]="true"
        [class.mat-mdc-outlined-button]="isStrokedButton()"
        [class.mat-mdc-button]="isTextButton()"
        [class.mat-warn]="variant() === 'danger'"
      >
        @if (loading()) {
          <mat-spinner diameter="18"></mat-spinner>
        } @else {
          @if (icon() && iconPosition() === 'start') {
            <mat-icon>{{ icon() }}</mat-icon>
          }
          <ng-content />
          @if (icon() && iconPosition() === 'end') {
            <mat-icon>{{ icon() }}</mat-icon>
          }
        }
      </button>
    }
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    mat-spinner {
      display: inline-block;
    }
  `],
})
export class UiButton {
  readonly variant = input<ButtonVariant>('primary');
  readonly type = input<'button' | 'submit'>('button');
  readonly icon = input<string>('');
  readonly iconPosition = input<'start' | 'end'>('start');
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly ariaLabel = input<string>('');

  readonly isFlatButton = computed(() => this.variant() === 'primary' || this.variant() === 'danger');
  readonly isStrokedButton = computed(() => this.variant() === 'secondary' || this.variant() === 'outlined');
  readonly isTextButton = computed(() => this.variant() === 'text');
}
