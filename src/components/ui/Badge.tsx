import React from "react";

export type BadgeVariant = "success" | "destructive" | "warning" | "neutral";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

export function Badge({ className = "", variant = "neutral", children, ...props }: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold tracking-wider uppercase transition-colors shadow-sm";
  
  const variantClasses = {
    success: "bg-success/10 text-success border border-success/20",
    destructive: "bg-destructive/10 text-destructive border border-destructive/20",
    warning: "bg-warning/10 text-warning border border-warning/20",
    neutral: "bg-elevated text-text-secondary border border-border",
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
