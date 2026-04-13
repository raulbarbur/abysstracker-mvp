"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Drawer({ isOpen, onClose, title, children, footer }: DrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <div className={`flex fixed inset-0 z-[100] justify-end transition-all duration-300 ${isOpen ? 'visible' : 'invisible pointer-events-none'}`}>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Panel Lateral */}
      <div 
        className={`relative bg-surface w-[80%] max-w-[320px] h-full shadow-[0_0_40px_rgba(0,0,0,0.3)] border-l border-border flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div className="text-xl font-black text-text-primary">{title}</div>
          <button 
            onClick={onClose} 
            className="text-text-secondary hover:text-primary transition-colors p-2 rounded-md hover:bg-hover active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-5 border-t border-border flex-shrink-0 bg-base backdrop-blur-md">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
