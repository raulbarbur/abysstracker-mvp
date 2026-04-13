"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type BannerVariant = "success" | "error" | "warning" | "info";

interface BannerProps {
  variant?: BannerVariant;
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function Banner({ 
  variant = "info", 
  title, 
  message, 
  dismissible = false, 
  onDismiss,
  className = ""
}: BannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  const variants = {
    success: {
      container: "bg-success/10 border-success/20",
      icon: <CheckCircle2 className="text-success h-5 w-5" />,
      title: "text-success",
      text: "text-success/90"
    },
    error: {
      container: "bg-destructive/10 border-destructive/20",
      icon: <XCircle className="text-destructive h-5 w-5" />,
      title: "text-destructive",
      text: "text-destructive/90"
    },
    warning: {
      container: "bg-warning/10 border-warning/20",
      icon: <AlertTriangle className="text-warning h-5 w-5" />,
      title: "text-warning",
      text: "text-warning/90"
    },
    info: {
      container: "bg-primary/10 border-primary/20",
      icon: <Info className="text-primary h-5 w-5" />,
      title: "text-primary",
      text: "text-primary/90"
    }
  };

  const config = variants[variant];

  return (
    <div className={`flex rounded-lg border p-4 ${config.container} ${className}`}>
      <div className="flex-shrink-0">
        {config.icon}
      </div>
      <div className="ml-3 flex-1">
        {title && <h3 className={`text-sm font-bold ${config.title}`}>{title}</h3>}
        <div className={`text-sm ${title ? 'mt-1' : ''} ${config.text}`}>
          {message}
        </div>
      </div>
      {dismissible && (
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={handleDismiss}
              className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${config.text}`}
            >
              <span className="sr-only">Cerrar</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
