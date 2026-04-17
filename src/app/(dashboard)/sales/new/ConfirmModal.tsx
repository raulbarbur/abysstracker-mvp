"use client";

import React, { useState, useEffect } from "react";
import { Loader2, CheckCircle, AlertOctagon, Banknote, ArrowLeftRight } from "lucide-react";
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
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER">("CASH");

  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setErrorMessage("");
      setPaymentMethod("CASH");
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setStatus("loading");

    try {
      const payload = {
        lines: cartItems.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity
        })),
        paymentMethod
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
    <Modal isOpen={isOpen} onClose={status === "loading" ? () => {} : onClose} title="Confirmación de Transacción" maxWidth="2xl">
      <div className="py-2">
        {status === "success" && (
          <div className="mb-5 p-5 rounded-2xl bg-success/15 border border-success/40 flex items-center gap-4 text-success animate-in zoom-in-95 duration-300 shadow-sm">
            <CheckCircle size={32} />
            <div className="flex flex-col">
              <span className="font-black text-xl">¡Venta Aprobada!</span>
              <span className="text-md font-semibold text-success/80">Cerrando transacción...</span>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="mb-5 p-5 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-start gap-4 text-destructive animate-in swing-in-top-fwd duration-300 shadow-sm">
            <AlertOctagon size={28} className="mt-0.5 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="font-black text-lg">Transacción Rechazada</span>
              <span className="text-md font-semibold leading-tight">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Dos columnas en desktop, una columna en mobile */}
        <div className="md:grid md:grid-cols-2 md:gap-6">

          {/* Columna izquierda: lista de productos */}
          <div>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Productos</p>
            <div className="space-y-0 max-h-[40vh] md:max-h-[55vh] overflow-y-auto custom-scrollbar bg-base rounded-xl border border-border">
              {cartItems.map(item => (
                <div key={item.variantId} className="flex justify-between items-center py-3 border-b border-border last:border-0 px-3 hover:bg-surface transition-colors gap-3">
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm md:text-base text-text-primary">{item.productName} - {item.variantName}</span>
                    <span className="text-xs text-text-secondary font-semibold">
                      {item.quantity} x ${item.unitPrice.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                  </div>
                  <span className="font-black text-sm md:text-base text-text-primary bg-surface border border-border px-2.5 py-1 rounded-lg shadow-sm flex-shrink-0">
                    ${(item.quantity * item.unitPrice).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Columna derecha: método de pago + total */}
          <div className="mt-5 md:mt-0 flex flex-col gap-4">
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Método de Pago</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                    paymentMethod === "CASH"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                      : "border-border text-text-secondary hover:border-emerald-500/40"
                  }`}
                >
                  <Banknote size={18} />
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("TRANSFER")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                    paymentMethod === "TRANSFER"
                      ? "border-blue-500 bg-blue-500/10 text-blue-500"
                      : "border-border text-text-secondary hover:border-blue-500/40"
                  }`}
                >
                  <ArrowLeftRight size={18} />
                  Transferencia
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="flex-1 flex flex-col justify-end">
              <div className="bg-elevated px-5 py-5 rounded-2xl border border-border shadow-inner flex flex-col gap-1">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-widest text-center">Total a Cobrar</span>
                <span className="text-2xl md:text-3xl font-black text-primary drop-shadow-sm text-center break-all leading-tight w-full">
                  ${subtotal.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
            </div>
          </div>

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
