"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Loader2 } from "lucide-react";
import { VariantType } from "./page";

interface PriceHistoryModalProps {
  variant: VariantType;
  isOpen: boolean;
  onClose: () => void;
}

interface PriceRecord {
  id: string;
  previousPrice: string | number;
  newPrice: string | number;
  userId: string;
  createdAt: string;
  user?: { username: string };
}

export function PriceHistoryModal({ variant, isOpen, onClose }: PriceHistoryModalProps) {
  const [history, setHistory] = useState<PriceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError("");
    
    fetch(`/api/variants/${variant.id}/price-history`)
      .then(res => res.json())
      .then(data => {
        if (data.history) {
          setHistory(data.history);
        } else {
          setError("No se pudo cargar el historial.");
        }
      })
      .catch(() => setError("Error de red."))
      .finally(() => setLoading(false));
  }, [isOpen, variant.id]);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false
    }).format(new Date(dateStr));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Historial de Precios · ${variant.name}`}>
      <div className="py-2">
        {loading ? (
          <div className="flex justify-center items-center py-14">
            <Loader2 className="animate-spin text-primary w-10 h-10" />
          </div>
        ) : error ? (
          <p className="text-destructive font-bold text-center py-10">{error}</p>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-text-disabled">
            <p className="font-bold text-lg">Sin cambios de precio registrados.</p>
            <p className="text-sm mt-2 text-text-secondary">Editá la variante para registrar el primer movimiento de precio.</p>
          </div>
        ) : (
          <div className="max-h-[50vh] overflow-y-auto custom-scrollbar rounded-xl border border-border">
            {/* Table header */}
            <div className="grid grid-cols-3 px-4 py-3 bg-base border-b border-border text-xs font-black text-text-secondary uppercase tracking-wider">
              <span>Fecha</span>
              <span className="text-center">Precio anterior</span>
              <span className="text-right">Precio nuevo</span>
            </div>
            
            {history.map((record, idx) => {
              const prevPrice = typeof record.previousPrice === "string" ? parseFloat(record.previousPrice) : Number(record.previousPrice);
              const newPrice = typeof record.newPrice === "string" ? parseFloat(record.newPrice) : Number(record.newPrice);
              const isIncrease = newPrice > prevPrice;

              return (
                <div
                  key={record.id}
                  className={`grid grid-cols-3 items-center px-4 py-4 border-b border-border last:border-0 hover:bg-hover transition-colors ${idx % 2 === 0 ? "bg-surface" : "bg-base"}`}
                >
                  <div className="flex flex-col pr-2">
                    <span className="text-sm font-bold text-text-primary">{formatDate(record.createdAt)}</span>
                    {record.user?.username && (
                      <span className="text-xs text-text-secondary font-semibold">{record.user.username}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <span className="font-black text-md text-text-secondary line-through">${prevPrice.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-black text-md ${isIncrease ? "text-destructive" : "text-success"}`}>
                      ${newPrice.toFixed(2)}
                    </span>
                    <span className={`block text-xs font-bold mt-0.5 ${isIncrease ? "text-destructive" : "text-success"}`}>
                      {isIncrease ? "▲" : "▼"} ${Math.abs(newPrice - prevPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-8 py-3 border-2 border-border rounded-xl font-bold text-text-secondary hover:bg-hover transition-all">
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
