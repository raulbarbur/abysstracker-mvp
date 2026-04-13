"use client";

import React, { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, helperText, error, disabled, id, ...props }, ref) => {
    const defaultId = React.useId();
    const inputId = id || defaultId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className={`text-sm font-semibold ${disabled ? 'text-text-disabled' : 'text-text-primary'}`}>
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          disabled={disabled}
          className={`
            flex min-h-[44px] w-full rounded-base border bg-surface px-3 py-2 text-sm text-text-primary
            file:border-0 file:bg-transparent file:text-sm file:font-medium
            placeholder:text-text-disabled
            focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50
            transition-colors
            ${error 
              ? 'border-destructive focus-visible:ring-destructive/30' 
              : 'border-border focus-visible:ring-primary/30 focus-visible:border-primary'}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-sm text-destructive mt-0.5">{error}</p>}
        {!error && helperText && <p className="text-sm text-text-secondary mt-0.5">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
