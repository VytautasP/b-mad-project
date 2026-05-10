export type ButtonVariant = 'primary' | 'accent' | 'warn' | 'basic';

export interface SelectOption<T> {
  value: T;
  label: string;
  icon?: string;
  disabled?: boolean;
}
