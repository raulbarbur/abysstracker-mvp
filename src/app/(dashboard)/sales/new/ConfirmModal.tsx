"use client";

import React, { useState, useEffect } from "react";
import { Loader2, CheckCircle, AlertOctagon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { CartItem } from "./page";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  subtotal: number;
  onSuccess: (saleId: string, invoiceNumber: string) => void;
}

export function ConfirmModal({ isOpen, onClose, cartItems, subtotal, onSuccess }: ConfirmModalProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setErrorMessage("");
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setStatus("loading");
    
    try {
      const payload = {
        lines: cartItems.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity
        }))
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Ocurrió un error inesperado al procesar la venta.");
      } else {
        setStatus("success");
        setTimeout(() => {
          onSuccess(data.sale.id, data.invoice.invoiceNumber);
          onClose();
        }, 1500);
      }
    } catch {
      setStatus("error");
      setErrorMessage("Error de red o servidor no disponible.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={status === "loading" ? () => {} : onClose} title="Confirmación de Transacción">
      <div className="py-2">
        {status === "success" && (
          <div className="mb-6 p-5 rounded-2xl bg-success/15 border border-success/40 flex items-center gap-4 text-success animate-in zoom-in-95 duration-300 shadow-sm">
            <CheckCircle size={32} />
            <div className="flex flex-col">
              <span className="font-black text-xl">¡Venta Aprobada!</span>
              <span className="text-md font-semibold text-success/80">Cerrando transacción...</span>
            </div>
          </div>
        )}
        
        {status === "error" && (
          <div className="mb-6 p-5 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-start gap-4 text-destructive animate-in swing-in-top-fwd duration-300 shadow-sm">
            <AlertOctagon size={28} className="mt-0.5 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="font-black text-lg">Transacción Rechazada</span>
              <span className="text-md font-semibold leading-tight">{errorMessage}</span>
            </div>
          </div>
        )}

        <div className="space-y-3 max-h-[45vh] overflow-y-auto px-2 py-2 custom-scrollbar bg-base rounded-xl border border-border">
          {cartItems.map(item => (
            <div key={item.variantId} className="flex justify-between items-center py-3 border-b border-border last:border-0 px-3 hover:bg-surface transition-colors">
              <div className="flex flex-col pr-4">
                <span className="font-bold text-md md:text-lg text-text-primary whitespace-pre-wrap">{item.productName} - {item.variantName}</span>
                <span className="text-sm text-text-secondary font-semibold">
                  {item.quantity} x ${item.unitPrice.toFixed(2)}
                </span>
              </div>
              <span className="font-black text-md md:text-lg text-text-primary bg-surface border border-border px-3 py-1.5 rounded-lg shadow-sm">
                ${(item.quantity * item.unitPrice).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-5 flex justify-between items-center bg-elevated px-6 py-5 rounded-2xl border border-border shadow-inner">
          <span className="text-xl font-bold text-text-secondary uppercase tracking-widest">Total a Cobrar</span>
          <span className="text-4xl md:text-5xl font-black text-primary drop-shadow-sm">${subtotal.toFixed(2)}</span>
        </div>
      </div>

      {(status === "idle" || status === "error") && (
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 justify-end mt-6 pt-2">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-4 rounded-xl border-2 border-border text-text-secondary hover:bg-hover font-bold transition-all active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            className="w-full sm:w-auto px-10 py-4 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-active text-white shadow-lg shadow-primary/30 font-black text-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <CheckCircle size={22} className={status === "error" ? "hidden" : "block"} />
            {status === "error" ? "Reintentar" : "Efectuar Cobro"}
          </button>
        </div>
      )}

      {status === "loading" && (
        <div className="flex justify-center mt-6 pt-2">
          <button disabled className="w-full flex justify-center items-center gap-4 px-8 py-5 rounded-2xl bg-primary/80 border border-primary text-white font-black text-xl shadow-inner cursor-wait">
            <Loader2 className="animate-spin" size={28} />
            Procesando Venta Segura...
          </button>
        </div>
      )}
    </Modal>
  );
}
