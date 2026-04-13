"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

interface ToggleStatusModalProps {
  name: string;
  isActive: boolean;
  entityType: "product" | "variant";
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
}

export function ToggleStatusModal({ name, isActive, entityType, isOpen, onClose, onConfirm }: ToggleStatusModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    const success = await onConfirm();
    if (!success) setError("Ocurrió un error. Intenta nuevamente.");
    setLoading(false);
  };

  const isDeactivating = isActive;
  const entityLabel = entityType === "product" ? "el producto" : "la variante";
  const entityName = name;

  const title = isDeactivating
    ? `¿Desactivar ${entityLabel}?`
    : `¿Reactivar ${entityLabel}?`;

  const bodyText = isDeactivating
    ? entityType === "product"
      ? `El producto "${entityName}" y todas sus variantes dejarán de estar disponibles en el punto de venta. Las ventas existentes no se verán afectadas.`
      : `La variante "${entityName}" dejará de estar disponible para la venta. El stock actual no se modifica.`
    : entityType === "product"
      ? `"${entityName}" y sus variantes activas volverán a estar disponibles para la venta.`
      : `La variante "${entityName}" volverá a estar disponible para la venta.`;

  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} title={title}>
      <div className="py-2 flex flex-col gap-5">
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive font-bold text-sm">
            {error}
          </div>
        )}

        <div className={`p-5 rounded-2xl border flex items-start gap-4 ${isDeactivating ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-primary/10 border-primary/30 text-primary"}`}>
          {isDeactivating ? <AlertTriangle size={28} className="flex-shrink-0 mt-0.5" /> : <CheckCircle size={28} className="flex-shrink-0 mt-0.5" />}
          <p className="font-semibold text-md leading-relaxed">{bodyText}</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 py-4 border-2 border-border rounded-xl font-bold text-text-secondary hover:bg-hover transition-all disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 py-4 rounded-xl font-black text-white shadow-md flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60 ${isDeactivating ? "bg-destructive hover:bg-destructive-hover shadow-destructive/20" : "bg-primary hover:bg-primary-hover shadow-primary/20"}`}
          >
            {loading && <Loader2 size={20} className="animate-spin" />}
            {loading ? "Procesando..." : isDeactivating ? "Confirmar desactivación" : "Confirmar reactivación"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
