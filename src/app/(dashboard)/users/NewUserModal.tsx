"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: unknown) => void;
}

export function NewUserModal({ isOpen, onClose, onSuccess }: NewUserModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUsername("");
      setPassword("");
      setShowPassword(false);
      setErrors({});
      setApiError("");
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors: { username?: string; password?: string } = {};
    if (!username.trim()) {
      newErrors.username = "El nombre de usuario es requerido.";
    } else if (username.length < 3) {
      newErrors.username = "Mínimo 3 caracteres.";
    } else if (username.length > 50) {
      newErrors.username = "Máximo 50 caracteres.";
    } else if (/\s/.test(username)) {
      newErrors.username = "No puede contener espacios.";
    }

    if (!password) {
      newErrors.password = "La contraseña es requerida.";
    } else if (password.length < 8) {
      newErrors.password = "Mínimo 8 caracteres.";
    }

    return newErrors;
  };

  const handleSave = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error || "Error al crear el usuario.");
        return;
      }
      onSuccess(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Usuario">
      <div className="py-2 flex flex-col gap-5">
        {apiError && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl font-bold text-sm">
            {apiError}
          </div>
        )}

        {/* Username */}
        <div className="flex flex-col gap-2">
          <label className="font-bold text-md text-text-primary">Nombre de usuario</label>
          <input
            type="text"
            value={username}
            onChange={e => { setUsername(e.target.value); setErrors(prev => ({ ...prev, username: "" })); }}
            autoFocus
            autoComplete="off"
            placeholder="Ej: vendedor01"
            maxLength={50}
            className={`w-full px-4 py-4 rounded-xl border-2 bg-base font-semibold text-text-primary focus:outline-none focus:ring-4 transition-all ${errors.username ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary/20 focus:border-primary"}`}
          />
          {errors.username && <p className="text-destructive text-sm font-bold">{errors.username}</p>}
          <p className="text-xs text-text-secondary font-semibold">3-50 caracteres, sin espacios.</p>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <label className="font-bold text-md text-text-primary">Contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: "" })); }}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              className={`w-full px-4 py-4 pr-14 rounded-xl border-2 bg-base font-semibold text-text-primary focus:outline-none focus:ring-4 transition-all ${errors.password ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary/20 focus:border-primary"}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors p-1"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && <p className="text-destructive text-sm font-bold">{errors.password}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-4 font-bold border-2 border-border rounded-xl text-text-secondary hover:bg-hover transition-all">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-4 font-black bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md shadow-primary/20 transition-all disabled:opacity-60 active:scale-[0.98]"
          >
            {loading ? "Creando..." : "Crear usuario"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
