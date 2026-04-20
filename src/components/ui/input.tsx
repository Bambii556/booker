import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
            ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium
            placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-primary focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            ${error ? 'border-destructive focus-visible:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
