"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface UserType {
  id: string;
  username: string;
  active: boolean;
}

interface ToggleUserModalProps {
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: unknown) => void;
}

export function ToggleUserModal({ user, isOpen, onClose, onSuccess }: ToggleUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isDeactivating = user.active;

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !user.active }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al actualizar el usuario.");
        return;
      }
      onSuccess(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title={isDeactivating ? `¿Desactivar a ${user.username}?` : `¿Reactivar a ${user.username}?`}
    >
      <div className="py-2 flex flex-col gap-5">
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl font-bold text-sm">
            {error}
          </div>
        )}

        <div className={`p-5 rounded-2xl border flex items-start gap-4 ${isDeactivating ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-primary/10 border-primary/20 text-primary"}`}>
          {isDeactivating
            ? <AlertTriangle size={28} className="flex-shrink-0 mt-0.5" />
            : <CheckCircle size={28} className="flex-shrink-0 mt-0.5" />
          }
          <p className="font-semibold text-md leading-relaxed">
            {isDeactivating
              ? `Este usuario no podrá iniciar sesión hasta que lo reactives. Sus ventas y movimientos registrados se conservan.`
              : `Este usuario podrá volver a iniciar sesión en el sistema con sus credenciales actuales.`
            }
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-4 border-2 border-border rounded-xl font-bold text-text-secondary hover:bg-hover transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 py-4 rounded-xl font-black text-white shadow-md flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60 ${
              isDeactivating
                ? "bg-destructive hover:bg-destructive-hover shadow-destructive/20"
                : "bg-primary hover:bg-primary-hover shadow-primary/20"
            }`}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading
              ? "Procesando..."
              : isDeactivating
              ? "Confirmar desactivación"
              : "Confirmar reactivación"
            }
          </button>
        </div>
      </div>
    </Modal>
  );
}
