"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export function Modal({ isOpen, onClose, title, children, footer, maxWidth = "md" }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Mirror the theme class from <html> to <body> so that CSS variables
      // defined in .dark { } cascade correctly to all portal children.
      const isDark = document.documentElement.classList.contains("dark");
      document.body.classList.toggle("dark", isDark);
      document.body.setAttribute("data-font-size",
        document.documentElement.getAttribute("data-font-size") ?? "normal"
      );
    } else {
      document.body.style.overflow = "unset";
      document.body.classList.remove("dark");
      document.body.removeAttribute("data-font-size");
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.classList.remove("dark");
      document.body.removeAttribute("data-font-size");
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const maxWidthClasses: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-[90vw]",
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex justify-center ${isMobile ? "items-end" : "items-center"} ${isMobile ? "" : "p-6"}`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={`
          relative bg-surface text-text-primary border border-border
          w-full ${maxWidthClasses[maxWidth]}
          flex flex-col overflow-hidden
          shadow-2xl
          ${isMobile
            ? "rounded-t-2xl max-h-[92vh]"
            : "rounded-xl max-h-[85vh]"
          }
        `}
        style={{
          animation: isMobile
            ? "modalSlideUp 0.25s ease-out"
            : "modalZoomIn 0.2s ease-out",
        }}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
            <h2 className="font-bold text-text-primary text-lg">{title}</h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary hover:bg-hover p-1.5 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {!title && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 text-text-secondary hover:text-text-primary hover:bg-hover border border-border bg-surface p-1.5 rounded-lg shadow-sm transition-colors"
          >
            <X size={20} />
          </button>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 text-text-primary">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-border flex-shrink-0">
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes modalZoomIn {
          from { transform: scale(0.95); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  );
}
