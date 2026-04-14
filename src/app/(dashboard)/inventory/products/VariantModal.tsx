"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { ProductType, VariantType } from "./page";

interface VariantModalProps {
  product: ProductType;
  variant?: VariantType;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (variant: VariantType) => void;
}

export function VariantModal({ product, variant, isOpen, onClose, onSuccess }: VariantModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [minStock, setMinStock] = useState("0");
  const [initialStock, setInitialStock] = useState("0");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(variant?.name || "");
      setPrice(variant ? String(typeof variant.currentPrice === "string" ? parseFloat(variant.currentPrice) : variant.currentPrice) : "");
      setCostPrice(variant ? String(typeof variant.costPrice === "string" ? parseFloat(variant.costPrice) : variant.costPrice) : "0");
      setMinStock(variant ? String(variant.minimumStock) : "0");
      setInitialStock("0");
      setErrors({});
      setApiError("");
    }
  }, [isOpen, variant]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "El nombre es requerido.";
    else if (name.trim().length > 100) newErrors.name = "Máximo 100 caracteres.";
    
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0.01) newErrors.currentPrice = "El precio debe ser mayor a $0.01.";

    const costNum = parseFloat(costPrice);
    if (isNaN(costNum) || costNum < 0) newErrors.costPrice = "El costo debe ser mayor o igual a $0.";
    
    const minNum = parseInt(minStock);
    if (isNaN(minNum) || minNum < 0 || !Number.isInteger(minNum)) newErrors.minimumStock = "Debe ser un número entero ≥ 0.";
    
    return newErrors;
  };

  const handleSave = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setLoading(true);
    setApiError("");
    try {
      const body: {
        name: string;
        currentPrice: number;
        costPrice: number;
        minimumStock: number;
        initialStock?: number;
      } = {
        name: name.trim(),
        currentPrice: parseFloat(price),
        costPrice: parseFloat(costPrice),
        minimumStock: parseInt(minStock)
      };
      if (!variant) {
        body.initialStock = parseInt(initialStock) || 0;
      }
      const res = variant
        ? await fetch(`/api/variants/${variant.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch(`/api/products/${product.id}/variants`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

      const data = await res.json();
      if (!res.ok) { setApiError(data.error || "Error al guardar."); return; }
      onSuccess({ ...data, productId: product.id });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={variant ? "Editar Variante" : `Nueva Variante · ${product.name}`}>
      <div className="py-2 flex flex-col gap-4">
        {apiError && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl font-bold text-sm">
            {apiError}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="font-bold text-md text-text-primary">Nombre de la variante</label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: "" })); }}
            maxLength={100}
            autoFocus
            placeholder="Ej: Talle M - Azul"
            className={`w-full px-4 py-4 rounded-xl border-2 bg-base font-semibold text-text-primary focus:outline-none focus:ring-4 transition-all ${errors.name ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary/20 focus:border-primary"}`}
          />
          {errors.name && <p className="text-destructive text-sm font-bold">{errors.name}</p>}
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <label className="font-bold text-md text-text-primary">Precio de Coste ($)</label>
            <input
              type="number"
              value={costPrice}
              onChange={e => { setCostPrice(e.target.value); setErrors(prev => ({ ...prev, costPrice: "" })); }}
              min="0"
              step="0.01"
              placeholder="0.00"
              className={`w-full px-4 py-4 rounded-xl border-2 bg-base font-semibold text-text-primary focus:outline-none focus:ring-4 transition-all ${errors.costPrice ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary/20 focus:border-primary"}`}
            />
            {errors.costPrice && <p className="text-destructive text-sm font-bold">{errors.costPrice}</p>}
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <label className="font-bold text-md text-text-primary">Precio de Venta ($)</label>
            <input
              type="number"
              value={price}
              onChange={e => { setPrice(e.target.value); setErrors(prev => ({ ...prev, currentPrice: "" })); }}
              min="0.01"
              step="0.01"
              placeholder="0.00"
              className={`w-full px-4 py-4 rounded-xl border-2 bg-base font-semibold text-text-primary focus:outline-none focus:ring-4 transition-all ${errors.currentPrice ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary/20 focus:border-primary"}`}
            />
            {errors.currentPrice && <p className="text-destructive text-sm font-bold">{errors.currentPrice}</p>}
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <label className="font-bold text-md text-text-primary">Stock mínimo</label>
            <input
              type="number"
              value={minStock}
              onChange={e => { setMinStock(e.target.value); setErrors(prev => ({ ...prev, minimumStock: "" })); }}
              min="0"
              step="1"
              placeholder="0"
              className={`w-full px-4 py-4 rounded-xl border-2 bg-base font-semibold text-text-primary focus:outline-none focus:ring-4 transition-all ${errors.minimumStock ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary/20 focus:border-primary"}`}
            />
            {errors.minimumStock && <p className="text-destructive text-sm font-bold">{errors.minimumStock}</p>}
            <p className="text-xs text-text-secondary font-semibold">Ingrese 0 para desactivar las alertas de stock para esta variante.</p>
          </div>
        </div>

        {!variant && (
          <div className="flex flex-col gap-2">
            <label className="font-bold text-md text-text-primary">Stock inicial</label>
            <input
              type="number"
              value={initialStock}
              onChange={e => setInitialStock(e.target.value)}
              min="0"
              step="1"
              placeholder="0"
              className="w-full px-4 py-4 rounded-xl border-2 bg-base font-semibold text-text-primary focus:outline-none focus:ring-4 transition-all border-border focus:ring-primary/20 focus:border-primary"
            />
            <p className="text-xs text-text-secondary font-semibold">Cantidad de unidades disponibles al crear la variante.</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-4 font-bold border-2 border-border rounded-xl text-text-secondary hover:bg-hover transition-all">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-4 font-black bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md shadow-primary/20 transition-all disabled:opacity-60 active:scale-[0.98]"
          >
            {loading ? "Guardando..." : (variant ? "Guardar cambios" : "Crear variante")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
