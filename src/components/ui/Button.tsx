import * as React from 'react';

type ButtonHTMLAttributes<T> = React.ButtonHTMLAttributes<T>;
type ReactNode = React.ReactNode;
type FC<P = {}> = React.FunctionComponent<P>;

/**
 * Reusable Button component for consistent styling, theming, and accessibility.
 * Supports variants, sizes, loading state, and dark mode.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'icon' | 'danger' | 'default';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  dark?: boolean; // For dark mode support
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white font-semibold hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
  icon: 'p-2 rounded-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
  danger: 'bg-red-600 text-white font-semibold hover:bg-red-700',
  default: 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-6 py-3',
};

const Button: FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  loading = false,
  dark = false,
  disabled,
  ...props
}) => {
  const isDisabled = disabled || loading;
  const base = 'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded disabled:opacity-50 disabled:cursor-not-allowed';
  const theme = dark ? 'dark' : '';
  const classes = [
    base,
    variantClasses[variant],
    sizeClasses[size],
    className,
    theme,
  ].join(' ');

  return (
    <button
      className={classes}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      aria-disabled={isDisabled ? 'true' : undefined}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full" />
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button; 