"use client";

import React, { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "destructive" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wide rounded-base";
  
  const variantClasses = {
    primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-active border border-transparent shadow-sm",
    destructive: "bg-destructive text-white hover:bg-destructive-hover border border-transparent shadow-sm",
    outline: "border border-border bg-surface text-primary hover:bg-hover hover:text-primary shadow-sm",
    ghost: "bg-transparent hover:bg-hover text-primary",
  };

  const sizeClasses = {
    sm: "min-h-8 px-3 py-1.5 text-sm",
    md: "min-h-10 px-4 py-2 text-md",
    lg: "min-h-12 px-6 py-3 text-lg rounded-lg", 
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
