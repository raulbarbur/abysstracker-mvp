"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, PackageOpen } from "lucide-react";
import { MovementFilterBar } from "./MovementFilterBar";

export type MovementType = "IN" | "OUT" | "ADJUSTMENT" | "LOSS";

export interface MovementRow {
  id: string;
  type: MovementType;
  quantity: number;
  reason?: string;
  createdAt: string;
  user: { username: string };
  variant: {
    name: string;
    product: { name: string };
  };
}

const TYPE_CONFIG: Record<MovementType, { label: string; color: string; sign: "+" | "-" | "±" }> = {
  IN:         { label: "Ingreso",    color: "bg-success/15 text-success border-success/30",          sign: "+" },
  OUT:        { label: "Venta",      color: "bg-blue-500/15 text-blue-400 border-blue-400/30",       sign: "-" },
  ADJUSTMENT: { label: "Ajuste",     color: "bg-warning/15 text-warning border-warning/30",           sign: "±" },
  LOSS:       { label: "Pérdida",    color: "bg-destructive/15 text-destructive border-destructive/30", sign: "-" },
};

function getSignedQty(movement: MovementRow): { display: string; color: string } {
  const { type, quantity } = movement;
  if (type === "IN")  return { display: `+${quantity}`, color: "text-success font-black" };
  if (type === "OUT") return { display: `-${quantity}`, color: "text-blue-400 font-black" };
  if (type === "LOSS") return { display: `-${quantity}`, color: "text-destructive font-black" };
  // ADJUSTMENT: quantity can be negative (subtract) or positive (add)
  if (quantity >= 0) return { display: `+${quantity}`, color: "text-warning font-black" };
  return { display: `${quantity}`, color: "text-warning font-black" };
}

function formatDate(dt: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(dt));
}

export default function MovimientosPage() {
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState<MovementType[]>([]);
  const [variantSearch, setVariantSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]   = useState("");

  const hasActiveFilters = typeFilter.length > 0 || variantSearch !== "" || dateFrom !== "" || dateTo !== "";

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter.length === 1) params.append("type", typeFilter[0]);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo)   params.append("dateTo",   dateTo);
      const res = await fetch(`/api/stock/movements?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements || []);
      }
    } finally {
      setLoading(false);
    }
  }, [typeFilter, dateFrom, dateTo]);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);

  const clearFilters = () => {
    setTypeFilter([]);
    setVariantSearch("");
    setDateFrom("");
    setDateTo("");
  };

  // Client-side filter for variant/product text search (API doesn't support it)
  const filtered = movements.filter(m => {
    if (!variantSearch.trim()) return true;
    const q = variantSearch.toLowerCase();
    return (
      m.variant.name.toLowerCase().includes(q) ||
      m.variant.product.name.toLowerCase().includes(q)
    );
  });

  // Multi-type client filter when more than 1 type selected
  const displayed = typeFilter.length > 1
    ? filtered.filter(m => typeFilter.includes(m.type))
    : filtered;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-text-primary tracking-tight mb-2">Movimientos de Stock</h1>
        <p className="text-text-secondary text-md font-semibold">Historial completo de entradas, salidas, ajustes y pérdidas.</p>
      </div>

      <MovementFilterBar
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        variantSearch={variantSearch}
        setVariantSearch={setVariantSearch}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary gap-4">
            <Loader2 className="animate-spin w-12 h-12" />
            <p className="font-bold">Cargando movimientos...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-disabled">
            <PackageOpen size={56} className="mb-4 opacity-30" />
            <p className="font-bold text-lg">Sin movimientos para estos filtros.</p>
          </div>
        ) : (
          <>
            {/* Table header — desktop only */}
            <div className="hidden md:grid grid-cols-[140px_1fr_90px_1fr_140px] gap-4 px-6 py-3 border-b border-border bg-base text-xs font-black text-text-secondary uppercase tracking-wider">
              <span>Tipo</span>
              <span>Variante / Producto</span>
              <span className="text-center">Cantidad</span>
              <span>Motivo / Usuario</span>
              <span className="text-right">Fecha</span>
            </div>

            <div className="divide-y divide-border">
              {displayed.map(m => {
                const cfg = TYPE_CONFIG[m.type];
                const { display: qtyDisplay, color: qtyColor } = getSignedQty(m);

                // Left strip color per type
                const stripColor: Record<MovementType, string> = {
                  IN:         "bg-success",
                  OUT:        "bg-blue-400",
                  ADJUSTMENT: "bg-warning",
                  LOSS:       "bg-destructive",
                };

                return (
                  <div key={m.id} className="hover:bg-hover transition-colors">

                    {/* ── MOBILE: accent-strip card ── */}
                    <div className="md:hidden flex min-h-[88px]">
                      {/* Left color strip */}
                      <div className={`w-1.5 flex-shrink-0 rounded-l-none ${stripColor[m.type]}`} />

                      <div className="flex-1 px-4 py-3.5 flex flex-col gap-2 min-w-0">
                        {/* Row 1: badge + quantity */}
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-black uppercase tracking-wide ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          <span className={`text-2xl tabular-nums leading-none ${qtyColor}`}>{qtyDisplay}</span>
                        </div>

                        {/* Row 2: variant name */}
                        <span className="font-bold text-md text-text-primary leading-tight break-words line-clamp-2">{m.variant.name}</span>

                        {/* Row 3: product · user · date */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider break-words line-clamp-2">{m.variant.product.name}</span>
                          <span className="text-xs text-text-secondary font-semibold tabular-nums flex-shrink-0">{formatDate(m.createdAt)}</span>
                        </div>

                        {/* Row 4: reason (if present) */}
                        {m.reason && (
                          <span className="text-xs text-text-secondary italic break-words line-clamp-2">&quot;{m.reason}&quot; · {m.user.username}</span>
                        )}
                        {!m.reason && (
                          <span className="text-xs text-text-disabled">{m.user.username}</span>
                        )}
                      </div>
                    </div>

                    {/* ── DESKTOP: table row ── */}
                    <div className="hidden md:flex min-h-[72px]">
                      {/* Left color strip */}
                      <div className={`w-1.5 flex-shrink-0 ${stripColor[m.type]}`} />
                      <div className="flex-1 grid grid-cols-[140px_1fr_90px_1fr_140px] gap-4 px-6 py-4">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-xl border text-sm font-black uppercase tracking-wide ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex flex-col justify-center min-w-0">
                          <span className="font-bold text-md text-text-primary leading-tight break-words line-clamp-2">{m.variant.name}</span>
                          <span className="text-sm text-text-secondary font-semibold uppercase tracking-wider break-words line-clamp-2">{m.variant.product.name}</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <span className={`text-2xl tabular-nums leading-none ${qtyColor}`}>{qtyDisplay}</span>
                        </div>
                        <div className="flex flex-col justify-center min-w-0">
                          {m.reason
                            ? <span className="text-sm text-text-secondary font-semibold italic break-words line-clamp-3">&quot;{m.reason}&quot;</span>
                            : <span className="text-sm text-text-disabled">—</span>}
                          <span className="text-xs text-text-secondary font-bold mt-0.5">{m.user.username}</span>
                        </div>
                        <div className="flex items-center justify-end">
                          <span className="text-sm text-text-secondary font-semibold tabular-nums">{formatDate(m.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
