"use client";

import React, { TextareaHTMLAttributes, forwardRef } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, helperText, error, disabled, id, ...props }, ref) => {
    const defaultId = React.useId();
    const textareaId = id || defaultId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className={`text-sm font-semibold ${disabled ? 'text-text-disabled' : 'text-text-primary'}`}>
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          disabled={disabled}
          className={`
            flex min-h-[100px] w-full rounded-base border bg-surface px-3 py-2 text-sm text-text-primary
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
Textarea.displayName = "Textarea";
