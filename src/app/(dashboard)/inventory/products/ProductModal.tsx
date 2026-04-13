"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ProductType } from "./page";

interface ProductModalProps {
  product?: ProductType;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: ProductType | undefined) => void;
}

export function ProductModal({ product, isOpen, onClose, onSuccess }: ProductModalProps) {
  const [name, setName] = useState("");
  const [variants, setVariants] = useState([{ name: "Única", costPrice: "", currentPrice: "", minimumStock: "0" }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(product?.name || "");
      setVariants([{ name: "Única", costPrice: "", currentPrice: "", minimumStock: "0" }]);
      setError("");
    }
  }, [isOpen, product]);

  const validate = () => {
    if (!name.trim()) return "El nombre del producto es requerido.";
    if (name.trim().length > 100) return "El nombre máximo es 100 caracteres.";
    
    if (!product) {
      if (variants.length === 0) return "Debes agregar al menos una variante.";
      for (const v of variants) {
        if (!v.name.trim()) return "El nombre de la variante es requerido.";
        const cPrice = parseFloat(v.costPrice);
        const sPrice = parseFloat(v.currentPrice);
        if (isNaN(cPrice) || cPrice < 0) return "El precio de coste debe ser mayor o igual a 0.";
        if (isNaN(sPrice) || sPrice <= 0) return "El precio de venta debe ser mayor a 0.";
      }
    }
    return "";
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    setError("");
    try {
      const body: {
        name: string;
        variants?: {
          name: string;
          costPrice: number;
          currentPrice: number;
          minimumStock: number;
        }[];
      } = { name: name.trim() };
      
      if (!product) {
        body.variants = variants.map(v => ({
          name: v.name.trim(),
          costPrice: parseFloat(v.costPrice),
          currentPrice: parseFloat(v.currentPrice),
          minimumStock: parseInt(v.minimumStock) || 0
        }));
      }

      const res = await fetch(
        product ? `/api/products/${product.id}` : `/api/products`,
        {
          method: product ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al guardar."); return; }
      onSuccess(data.product || data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product ? "Editar Producto" : "Nuevo Producto"} maxWidth="xl">
      <div className="py-2 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-bold text-md text-text-primary">Nombre del producto</label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError(""); }}
            maxLength={100}
            autoFocus
            placeholder="Ej: Camiseta Premium"
            className="w-full px-4 py-4 rounded-xl border-2 bg-base font-semibold text-text-primary focus:outline-none focus:ring-4 transition-all border-border focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {!product && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-md text-text-primary">Variantes Iniciales</label>
              <button
                type="button"
                onClick={() => setVariants([...variants, { name: "", costPrice: "", currentPrice: "", minimumStock: "0" }])}
                className="text-primary font-bold text-sm flex items-center gap-1 hover:underline"
              >
                <Plus size={16} /> Agregar variante
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              {variants.map((variant, index) => (
                <div key={index} className="flex gap-2 items-end bg-base p-3 rounded-xl border border-border">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-xs font-bold text-text-secondary">Nombre</label>
                    <input
                      type="text"
                      value={variant.name}
                      onChange={e => {
                        const newVars = [...variants];
                        newVars[index].name = e.target.value;
                        setVariants(newVars);
                        setError("");
                      }}
                      placeholder="Ej: Talle M"
                      className="w-full px-3 py-2 rounded-lg border bg-surface text-text-primary focus:outline-none focus:border-primary text-sm font-medium"
                    />
                  </div>
                  <div className="w-24 flex flex-col gap-1">
                    <label className="text-xs font-bold text-text-secondary">Coste ($)</label>
                    <input
                      type="number"
                      value={variant.costPrice}
                      onChange={e => {
                        const newVars = [...variants];
                        newVars[index].costPrice = e.target.value;
                        setVariants(newVars);
                        setError("");
                      }}
                      placeholder="0.00"
                      min="0" step="0.01"
                      className="w-full px-3 py-2 rounded-lg border bg-surface text-text-primary focus:outline-none focus:border-primary text-sm font-medium"
                    />
                  </div>
                  <div className="w-24 flex flex-col gap-1">
                    <label className="text-xs font-bold text-text-secondary">Venta ($)</label>
                    <input
                      type="number"
                      value={variant.currentPrice}
                      onChange={e => {
                        const newVars = [...variants];
                        newVars[index].currentPrice = e.target.value;
                        setVariants(newVars);
                        setError("");
                      }}
                      placeholder="0.00"
                      min="0.01" step="0.01"
                      className="w-full px-3 py-2 rounded-lg border bg-surface text-text-primary focus:outline-none focus:border-primary text-sm font-medium"
                    />
                  </div>
                  {variants.length > 1 && (
                    <button
                      onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                      className="p-2 mb-[1px] text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-destructive text-sm font-bold">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-4 font-bold border-2 border-border rounded-xl text-text-secondary hover:bg-hover transition-all">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-4 font-black bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md shadow-primary/20 transition-all disabled:opacity-60 active:scale-[0.98]"
          >
            {loading ? "Guardando..." : (product ? "Guardar cambios" : "Crear producto")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
