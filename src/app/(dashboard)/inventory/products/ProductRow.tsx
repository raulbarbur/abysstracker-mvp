"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronRight, Pencil, Power, Plus, PackageOpen, ArrowUpDown, History, MoreHorizontal } from "lucide-react";
import { ProductType, VariantType } from "./page";

interface ProductRowProps {
  product: ProductType;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEditProduct: () => void;
  onToggleStatus: () => void;
  onNewVariant: () => void;
  onEditVariant: (v: VariantType) => void;
  onToggleVariant: (v: VariantType) => void;
  onStockMovement: (v: VariantType) => void;
  onPriceHistory: (v: VariantType) => void;
}

function getStockStyle(variant: VariantType) {
  const { currentStock, minimumStock } = variant;
  if (minimumStock === 0) return { badge: "text-success bg-success/10 border-success/20", dot: "bg-success", label: "OK" };
  if (currentStock <= 0) return { badge: "text-destructive bg-destructive/10 border-destructive/20", dot: "bg-destructive", label: "Sin stock" };
  if (currentStock <= minimumStock) return { badge: "text-warning bg-warning/10 border-warning/20", dot: "bg-warning", label: "Stock bajo" };
  return { badge: "text-success bg-success/10 border-success/20", dot: "bg-success", label: "OK" };
}

/* ─── Dropdown de acciones secundarias de variante ─────────────────────── */
function VariantActionMenu({
  variant,
  onPriceHistory,
  onToggleVariant,
}: {
  variant: VariantType;
  onPriceHistory: () => void;
  onToggleVariant: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all active:scale-95 ${
          open
            ? "bg-primary/10 border-primary text-primary"
            : "bg-base border-border hover:border-primary hover:text-primary text-text-secondary"
        }`}
        aria-label="Más opciones"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-20 bg-surface border border-border rounded-2xl shadow-lg min-w-47.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => { onPriceHistory(); setOpen(false); }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-text-secondary hover:bg-hover hover:text-text-primary transition-colors text-left"
          >
            <History size={15} />
            Historial de precios
          </button>
          <div className="h-px bg-border" />
          <button
            onClick={() => { onToggleVariant(); setOpen(false); }}
            className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-bold transition-colors text-left ${
              variant.active
                ? "text-destructive hover:bg-destructive/10"
                : "text-success hover:bg-success/10"
            }`}
          >
            <Power size={15} />
            {variant.active ? "Desactivar" : "Activar"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── ProductRow ──────────────────────────────────────────────────────── */
export function ProductRow({
  product, isExpanded, onToggleExpand,
  onEditProduct, onToggleStatus, onNewVariant,
  onEditVariant, onToggleVariant, onStockMovement, onPriceHistory
}: ProductRowProps) {
  const activeVariants = product.variants.filter(v => v.active).length;

  return (
    <div className={`border-b border-border last:border-0 transition-all first:rounded-t-2xl last:rounded-b-2xl overflow-visible ${isExpanded ? "bg-base" : "bg-surface hover:bg-hover"}`}>
      {/* ── Product Header Row ────────────────── */}
      <div className="flex items-center gap-3 px-4 py-4">
        {/* Expand toggle */}
        <button
          onClick={onToggleExpand}
          className={`p-2 rounded-xl hover:bg-surface transition-all active:scale-90 shrink-0 ${isExpanded ? "text-primary bg-primary/10" : "text-text-disabled"}`}
        >
          <ChevronRight size={20} className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
        </button>

        {/* Product info — clickable */}
        <div className="flex-1 flex flex-col cursor-pointer min-w-0" onClick={onToggleExpand}>
          <span className={`font-black text-lg leading-tight wrap-break-word line-clamp-2 ${product.active ? "text-text-primary" : "text-text-disabled line-through"}`}>
            {product.name}
          </span>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide ${product.active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
              {product.active ? "Activo" : "Inactivo"}
            </span>
            <span className="text-xs text-text-secondary font-semibold">
              {product.variants.length} variante{product.variants.length !== 1 ? "s" : ""}
              {product.variants.length > 0 && ` · ${activeVariants} activa${activeVariants !== 1 ? "s" : ""}`}
            </span>
          </div>
        </div>

        {/* Product actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onEditProduct(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-base border border-border hover:border-primary hover:text-primary text-text-secondary transition-all active:scale-95 text-sm font-bold"
          >
            <Pencil size={14} />
            <span className="hidden sm:inline">Editar</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleStatus(); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all active:scale-95 text-sm font-bold ${
              product.active
                ? "bg-base border-border hover:border-destructive hover:text-destructive text-text-secondary"
                : "bg-base border-border hover:border-success hover:text-success text-text-disabled"
            }`}
          >
            <Power size={14} />
            <span className="hidden sm:inline">{product.active ? "Desactivar" : "Activar"}</span>
          </button>
        </div>
      </div>

      {/* ── Variants Section ──────────────────── */}
      {isExpanded && (
        <div className="px-4 pb-5 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="ml-0 sm:ml-10 bg-surface rounded-2xl border border-border overflow-visible shadow-sm">
            {/* Variants header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-base/60 rounded-t-2xl">
              <span className="font-bold text-xs text-text-secondary uppercase tracking-wider">Variantes</span>
              <button
                onClick={onNewVariant}
                disabled={!product.active}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-sm shadow-primary/20"
              >
                <Plus size={16} />
                Nueva variante
              </button>
            </div>

            {product.variants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-text-disabled">
                <PackageOpen size={40} className="mb-3 opacity-40" />
                <p className="font-semibold">Sin variantes registradas.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {product.variants.map(variant => {
                  const price = typeof variant.currentPrice === "string" ? parseFloat(variant.currentPrice) : Number(variant.currentPrice);
                  const cost = typeof variant.costPrice === "string" ? parseFloat(variant.costPrice) : Number(variant.costPrice);
                  const { badge: stockBadge, dot: stockDot } = getStockStyle(variant);

                  return (
                    <div
                      key={variant.id}
                      className={`px-5 py-4 transition-colors ${!variant.active ? "bg-base/30" : "hover:bg-hover/30"}`}
                    >
                      {/* Info row — opacity solo acá, NO en los botones */}
                      <div className={`flex flex-wrap items-start justify-between gap-3 mb-3 transition-opacity ${!variant.active ? "opacity-55" : ""}`}>
                        {/* Left: nombre + status + precios */}
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-bold text-lg leading-tight ${variant.active ? "text-text-primary" : "text-text-disabled line-through"}`}>
                              {variant.name}
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${variant.active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                              {variant.active ? "Activa" : "Inactiva"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-md font-black text-primary">${price.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            <span className="text-xs text-text-secondary font-semibold">
                              Costo: ${cost.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </span>
                          </div>
                        </div>

                        {/* Right: stock badge + mínimo */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-sm ${stockBadge}`}>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${stockDot}`} />
                            <span>{variant.currentStock.toLocaleString('es-AR')} en stock</span>
                          </div>
                          {variant.minimumStock > 0 && (
                            <span className="text-xs text-text-secondary font-semibold whitespace-nowrap">
                              mín. {variant.minimumStock.toLocaleString('es-AR')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons — NUNCA con opacity */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => onEditVariant(variant)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-base border border-border hover:border-primary hover:text-primary text-text-secondary font-bold text-sm transition-all active:scale-95"
                        >
                          <Pencil size={14} />
                          Editar
                        </button>

                        <button
                          onClick={() => onStockMovement(variant)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-base border border-border hover:border-primary hover:bg-primary/10 hover:text-primary text-text-secondary font-bold text-sm transition-all active:scale-95"
                        >
                          <ArrowUpDown size={14} />
                          Stock
                        </button>

                        <div className="ml-auto">
                          <VariantActionMenu
                            variant={variant}
                            onPriceHistory={() => onPriceHistory(variant)}
                            onToggleVariant={() => onToggleVariant(variant)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
