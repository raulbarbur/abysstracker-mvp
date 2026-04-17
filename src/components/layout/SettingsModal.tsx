"use client";

import React from "react";
import { Type } from "lucide-react";
import { Modal } from "../ui/Modal";
import { usePreferences } from "../preferences-provider";
import { useToast } from "../ui/Toast";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { fontSize, setFontSize, persistPreferences } = usePreferences();
  const { toast } = useToast();

  const handleFontSize = async (fs: "normal" | "large") => {
    if (fs === fontSize) return;
    setFontSize(fs);
    const ok = await persistPreferences({ fontSize: fs });
    if (!ok) {
      setFontSize(fontSize);
      toast({ variant: "error", title: "Error al guardar", message: "No se pudo guardar la preferencia. Intentá de nuevo." });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tamaño de Fuente">
      <div className="space-y-6 py-4">
        {/* Typography Settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
            <Type size={14} /> Accesibilidad
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleFontSize("normal")}
              className={`p-4 rounded-xl border flex flex-col justify-center items-center gap-2 transition-all active:scale-95 ${
                fontSize === "normal"
                  ? "bg-primary/10 border-primary text-primary shadow-sm"
                  : "bg-surface border-border text-text-secondary hover:bg-hover hover:text-text-primary"
              }`}
            >
              <span className="font-bold text-sm">Aa</span>
              <span className="font-medium text-xs">Normal</span>
            </button>
            <button
              onClick={() => handleFontSize("large")}
              className={`p-4 rounded-xl border flex flex-col justify-center items-center gap-2 transition-all active:scale-95 ${
                fontSize === "large"
                  ? "bg-primary/10 border-primary text-primary shadow-sm"
                  : "bg-surface border-border text-text-secondary hover:bg-hover hover:text-text-primary"
              }`}
            >
              <span className="font-bold text-lg">Aa</span>
              <span className="font-medium text-xs">Grande</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Save state occurs optimistically, no explicit save button required */}
      <div className="flex justify-end pt-2">
        <button 
          onClick={onClose}
          className="px-5 py-2.5 bg-surface border border-border text-text-primary hover:bg-hover rounded-lg font-semibold text-sm transition-all shadow-sm"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
