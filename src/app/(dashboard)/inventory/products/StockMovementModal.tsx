"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { CheckCircle, AlertCircle, ArrowDownCircle, Sliders, Trash2 } from "lucide-react";
import { VariantType } from "./page";

interface StockMovementModalProps {
  variant: VariantType;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (variantId: string, newStock: number) => void;
}

type MovementType = "IN" | "ADJUSTMENT" | "LOSS";
type AdjustSign = "add" | "subtract";

const MOVEMENT_OPTIONS: { type: MovementType; label: string; icon: React.ReactNode; colorClass: string; selectedClass: string }[] = [
  {
    type: "IN",
    label: "Ingreso",
    icon: <ArrowDownCircle size={24} />,
    colorClass: "border-border hover:border-success/50 hover:bg-success/5 text-text-secondary",
    selectedClass: "border-success bg-success/10 text-success shadow-md shadow-success/10"
  },
  {
    type: "ADJUSTMENT",
    label: "Ajuste",
    icon: <Sliders size={24} />,
    colorClass: "border-border hover:border-blue-400/50 hover:bg-blue-500/5 text-text-secondary",
    selectedClass: "border-blue-400 bg-blue-500/10 text-blue-400 shadow-md shadow-blue-500/10"
  },
  {
    type: "LOSS",
    label: "Pérdida",
    icon: <Trash2 size={24} />,
    colorClass: "border-border hover:border-destructive/50 hover:bg-destructive/5 text-text-secondary",
    selectedClass: "border-destructive bg-destructive/10 text-destructive shadow-md shadow-destructive/10"
  }
];

export function StockMovementModal({ variant, isOpen, onClose, onSuccess }: StockMovementModalProps) {
  const [type, setType] = useState<MovementType>("IN");
  const [adjustSign, setAdjustSign] = useState<AdjustSign>("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [showOptionalReason, setShowOptionalReason] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setType("IN");
      setAdjustSign("add");
      setQuantity("");
      setReason("");
      setShowOptionalReason(false);
      setStatus("idle");
      setErrorMsg("");
    }
  }, [isOpen]);

  const currentStock = variant.currentStock;
  const qty = parseInt(quantity) || 0;

  const projectedStock = (() => {
    if (qty <= 0) return currentStock;
    if (type === "IN") return currentStock + qty;
    if (type === "LOSS") return currentStock - qty;
    if (type === "ADJUSTMENT") return adjustSign === "add" ? currentStock + qty : currentStock - qty;
    return currentStock;
  })();

  const requiresReason = type === "ADJUSTMENT" || type === "LOSS";

  const handleSubmit = async () => {
    if (qty <= 0) { setErrorMsg("La cantidad debe ser mayor a 0."); return; }
    if (requiresReason && !reason.trim()) { setErrorMsg("El motivo es requerido para este tipo de movimiento."); return; }

    setLoading(true);
    setErrorMsg("");
    try {
      const signedQty = type === "ADJUSTMENT" && adjustSign === "subtract" ? -qty : qty;
      const res = await fetch("/api/stock/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: variant.id,
          type,
          quantity: signedQty,
          reason: reason.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || "Error al registrar."); setLoading(false); return; }
      setStatus("success");
      setTimeout(() => {
        onSuccess(variant.id, data.currentStock);
        onClose();
      }, 1500);
    } catch {
      setErrorMsg("Error de red.");
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} title={`Movimiento de Stock · ${variant.name}`}>
      <div className="py-2 flex flex-col gap-5">
        {status === "success" && (
          <div className="p-5 rounded-2xl bg-success/15 border border-success/30 text-success flex items-center gap-4 animate-in zoom-in-95">
            <CheckCircle size={32} />
            <div>
              <p className="font-black text-xl">¡Movimiento registrado!</p>
              <p className="text-sm font-semibold opacity-80">Cerrando automáticamente...</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive flex items-center gap-3 font-bold text-sm">
            <AlertCircle size={20} />
            {errorMsg}
          </div>
        )}

        {/* Movement type selector */}
        <div className="grid grid-cols-3 gap-3">
          {MOVEMENT_OPTIONS.map(opt => (
            <button
              key={opt.type}
              onClick={() => { setType(opt.type); setErrorMsg(""); }}
              className={`flex flex-col items-center gap-2.5 py-5 rounded-2xl border-2 font-bold transition-all active:scale-95 ${type === opt.type ? opt.selectedClass : opt.colorClass}`}
            >
              {opt.icon}
              <span className="text-sm md:text-md">{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Adjustment sign toggle */}
        {type === "ADJUSTMENT" && (
          <div className="flex rounded-xl overflow-hidden border-2 border-border">
            <button
              onClick={() => setAdjustSign("add")}
              className={`flex-1 py-3 font-black text-md transition-all ${adjustSign === "add" ? "bg-blue-500/20 text-blue-400 border-r border-blue-400/30" : "text-text-secondary hover:bg-hover"}`}
            >
              + Sumar
            </button>
            <button
              onClick={() => setAdjustSign("subtract")}
              className={`flex-1 py-3 font-black text-md transition-all ${adjustSign === "subtract" ? "bg-blue-500/20 text-blue-400 border-l border-blue-400/30" : "text-text-secondary hover:bg-hover"}`}
            >
              − Restar
            </button>
          </div>
        )}

        {/* Quantity input */}
        <div className="flex flex-col gap-2">
          <label className="font-bold text-text-primary">Cantidad</label>
          <input
            type="number"
            value={quantity}
            onChange={e => { setQuantity(e.target.value); setErrorMsg(""); }}
            min="1"
            step="1"
            placeholder="Ingrese una cantidad positiva..."
            className="w-full px-4 py-4 rounded-xl border-2 border-border bg-base font-bold text-text-primary focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all text-xl"
          />
        </div>

        {/* Real-time projection */}
        {qty > 0 && (
          <div className="p-4 rounded-xl bg-elevated border border-border flex items-center justify-between animate-in zoom-in-95 duration-150">
            <span className="text-text-secondary font-semibold text-sm md:text-md">Stock actual:</span>
            <div className="flex items-center gap-3">
              <span className="font-black text-xl text-text-primary">{currentStock}</span>
              <span className="text-text-disabled">→</span>
              <span className={`font-black text-xl ${projectedStock < 0 ? "text-destructive" : projectedStock <= variant.minimumStock && variant.minimumStock > 0 ? "text-warning" : "text-success"}`}>
                {projectedStock}
              </span>
            </div>
          </div>
        )}

        {/* Reason field */}
        {requiresReason && (
          <div className="flex flex-col gap-2">
            <label className="font-bold text-text-primary">Motivo <span className="text-destructive">*</span></label>
            <textarea
              value={reason}
              onChange={e => { setReason(e.target.value); setErrorMsg(""); }}
              placeholder="Describí el motivo del movimiento..."
              className="w-full min-h-[100px] px-4 py-3 rounded-xl border-2 border-border bg-base font-semibold text-text-primary focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>
        )}

        {!requiresReason && !showOptionalReason && (
          <button
            onClick={() => setShowOptionalReason(true)}
            className="text-sm text-text-secondary hover:text-primary font-bold underline text-left transition-colors"
          >
            + Agregar motivo (opcional)
          </button>
        )}

        {!requiresReason && showOptionalReason && (
          <div className="flex flex-col gap-2">
            <label className="font-bold text-text-primary">Motivo <span className="text-text-disabled font-normal">(opcional)</span></label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Nota sobre este ingreso..."
              className="w-full min-h-[80px] px-4 py-3 rounded-xl border-2 border-border bg-base font-semibold text-text-primary focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>
        )}

        {status !== "success" && (
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-4 font-bold border-2 border-border rounded-xl text-text-secondary hover:bg-hover transition-all">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || qty <= 0}
              className="flex-1 py-4 font-black bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md shadow-primary/20 transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? "Registrando..." : "Registrar movimiento"}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
