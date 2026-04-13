"use client";

import React, { useEffect, useRef, useState } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number>(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setCurrentY(0);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Solo permitir drag desde la zona del handle
    const target = e.target as HTMLElement;
    if (target.closest('.handle-area')) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === null) return;
    const y = e.touches[0].clientY;
    const delta = y - startY;
    if (delta > 0) {
      setCurrentY(delta);
    }
  };

  const handleTouchEnd = () => {
    if (startY === null) return;
    if (currentY > 100) {
      onClose();
    } else {
      setCurrentY(0);
    }
    setStartY(null);
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div 
        ref={sheetRef}
        className="relative bg-surface w-full rounded-t-[20px] shadow-xl border-t border-border flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-full duration-300"
        style={{ transform: `translateY(${currentY}px)`, transition: startY !== null ? 'none' : 'transform 0.3s ease-out' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="handle-area w-full py-4 flex justify-center items-center cursor-grab active:cursor-grabbing flex-shrink-0">
          <div className="w-12 h-1.5 bg-border rounded-full" />
        </div>
        
        <div className="px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
