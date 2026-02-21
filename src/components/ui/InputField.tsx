import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  inputSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'default',
      inputSize = 'md',
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-5 py-3 text-lg',
    };

    const variantClasses = {
      default:
        'border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      filled: 'border-0 bg-gray-100 focus:bg-gray-200 focus:ring-2 focus:ring-blue-500',
      outlined: 'border-2 border-gray-300 bg-transparent focus:border-blue-500 focus:ring-0',
    };

    const baseInputClasses = `
      w-full rounded-lg transition-all outline-none
      ${sizeClasses[inputSize]}
      ${variantClasses[variant]}
      ${leftIcon ? 'pl-10' : ''}
      ${rightIcon ? 'pr-10' : ''}
      ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
      ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
      ${className}
    `;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label ? (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
        ) : null}

        <div className="relative">
          {leftIcon ? (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          ) : null}

          <input ref={ref} className={baseInputClasses} disabled={disabled} {...props} />

          {rightIcon ? (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          ) : null}
        </div>

        {error ? <p className="mt-1.5 text-sm text-red-600">{error}</p> : null}

        {helperText && !error ? <p className="mt-1.5 text-sm text-gray-500">{helperText}</p> : null}
      </div>
    );
  }
);

InputField.displayName = 'InputField';

export default InputField;
