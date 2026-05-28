import type {
  ButtonHTMLAttributes,
  SelectHTMLAttributes,
} from 'react';
import { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  className,
  variant = 'secondary',
  size = 'md',
  type = 'button',
  ...props
}, ref) {
  return (
    <button
      className={cx('ui-button', `ui-button-${variant}`, `ui-button-${size}`, className)}
      ref={ref}
      type={type}
      {...props}
    />
  );
});

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx('ui-select', className)} {...props} />;
}
