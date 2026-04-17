"use client";

import React, { useState } from "react";
import { AlertTriangle, Loader2, CheckCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface CancelModalProps {
  saleId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (saleId: string, updatedSaleInfo: unknown) => void;
}

export function CancelModal({ saleId, isOpen, onClose, onSuccess }: CancelModalProps) {
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isOverLimit = reason.length > 500;
  const isTooShort = reason.trim().length === 0;

  React.useEffect(() => {
    if (isOpen) {
      setReason("");
      setStatus("idle");
      setErrorMsg("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!saleId || isTooShort || isOverLimit) return;
    setStatus("loading");

    try {
      const res = await fetch(`/api/sales/${saleId}/cancel`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ cancellationReason: reason })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Ocurrió un error al intentar anular.");
      } else {
        setStatus("success");
        setTimeout(() => {
          onSuccess(saleId, data.sale);
          onClose();
        }, 1500);
      }
    } catch {
      setStatus("error");
      setErrorMsg("Error de red. Intenta nuevamente.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={status === "loading" ? () => {} : onClose} title="Precaución de Seguridad">
       <div className="py-2 flex flex-col">
         {status === "success" && (
           <div className="mb-4 md:mb-6 p-4 md:p-6 rounded-2xl md:rounded-xl bg-success/15 border border-success/30 text-success flex items-center justify-center animate-in zoom-in-95 shadow-sm">
             <div className="flex flex-col items-center">
               <CheckCircle size={32} className="md:w-10 md:h-10 mb-2" />
               <span className="font-black text-lg md:text-xl">Reintegro Aprobado</span>
               <span className="text-xs md:text-sm font-bold opacity-80">El sistema cerrará automáticamente...</span>
             </div>
           </div>
         )}

         {status === "error" && (
           <div className="mb-6 p-5 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive font-bold animate-in slide-in-from-top-2 shadow-sm">
             Error: {errorMsg}
           </div>
         )}

         <div className="flex bg-destructive/10 border border-destructive text-destructive p-4 md:p-5 rounded-2xl md:rounded-xl gap-3 md:gap-4 items-start mb-4 md:mb-6 shadow-sm">
           <AlertTriangle size={24} className="md:w-7 md:h-7 mt-0.5 flex-shrink-0" />
           <p className="text-sm md:text-md font-semibold leading-relaxed">
             Estás a punto de anular esta venta de manera irreversible. Esta acción restaurará obligatoriamente el stock de las variantes a la bodega central.
           </p>
         </div>

         <div className="flex flex-col mb-2 md:mb-4 bg-surface p-4 md:p-5 rounded-2xl md:rounded-xl border border-border shadow-sm">
           <label className="font-bold text-text-primary text-md mb-2 md:mb-3 flex justify-between items-center">
             Declaración de Anulación
             <span className={`text-xs font-black bg-base px-2 py-0.5 rounded border border-border ${isOverLimit ? 'text-destructive' : 'text-text-secondary'}`}>
               {reason.length} / 500
             </span>
           </label>
           <textarea
             value={reason}
             onChange={e => setReason(e.target.value)}
             disabled={status === "loading" || status === "success"}
             placeholder="Dicta el motivo exacto de la devolución / cancelación..."
             className={`w-full min-h-[100px] md:min-h-[120px] rounded-xl border md:border-2 p-3 md:p-4 text-sm md:text-md bg-base focus:outline-none focus:ring-4 transition-all resize-none shadow-inner ${isOverLimit ? 'border-destructive focus:ring-destructive/20 focus:border-destructive' : 'border-border focus:ring-primary/20 focus:border-primary'}`}
           />
         </div>

         {status !== "success" && (
           <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4 mt-6 md:mt-8 pt-4 md:pt-6 border-t border-border">
              <button 
                onClick={onClose}
                disabled={status === "loading"}
                className="w-full md:w-auto md:flex-1 py-3 md:py-2.5 px-4 font-bold text-text-secondary border-2 border-border rounded-xl md:rounded-lg hover:bg-hover active:bg-base transition-all active:scale-[0.98] outline-none text-sm md:text-base"
              >
                Ignorar
              </button>
              <button
                onClick={handleSubmit}
                disabled={status === "loading" || isTooShort || isOverLimit}
                className="w-full md:w-auto md:flex-[2] py-3 md:py-2.5 px-4 font-black flex items-center justify-center gap-2 md:gap-3 rounded-xl md:rounded-lg bg-destructive hover:bg-destructive-hover active:bg-destructive shadow-sm text-white disabled:opacity-50 transition-all active:scale-[0.98] outline-none text-sm md:text-base"
              >
                {status === "loading" ? <Loader2 className="animate-spin" size={18} /> : <AlertTriangle size={18} />}
                {status === "loading" ? 'Procesando...' : 'Autorizar Reintegro'}
              </button>
           </div>
         )}
       </div>
    </Modal>
  );
}
