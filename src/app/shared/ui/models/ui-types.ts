export type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'text' | 'icon' | 'danger';

export interface SelectOption<T> {
  value: T;
  label: string;
  icon?: string;
  disabled?: boolean;
}
