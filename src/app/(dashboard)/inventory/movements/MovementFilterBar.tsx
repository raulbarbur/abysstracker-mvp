"use client";

import React, { useState } from "react";
import { Filter, X, ChevronDown, ChevronUp, Search } from "lucide-react";
import { MovementType } from "./page";

const ALL_TYPES: { type: MovementType; label: string; color: string; selected: string }[] = [
  { type: "IN",         label: "Ingreso",  color: "border-border text-text-secondary hover:border-success/50 hover:text-success",    selected: "border-success bg-success/10 text-success" },
  { type: "OUT",        label: "Venta",    color: "border-border text-text-secondary hover:border-blue-400/50 hover:text-blue-400",  selected: "border-blue-400 bg-blue-500/10 text-blue-400" },
  { type: "ADJUSTMENT", label: "Ajuste",  color: "border-border text-text-secondary hover:border-warning/50 hover:text-warning",     selected: "border-warning bg-warning/10 text-warning" },
  { type: "LOSS",       label: "Pérdida", color: "border-border text-text-secondary hover:border-destructive/50 hover:text-destructive", selected: "border-destructive bg-destructive/10 text-destructive" },
];

interface MovementFilterBarProps {
  typeFilter: MovementType[];
  setTypeFilter: (types: MovementType[]) => void;
  variantSearch: string;
  setVariantSearch: (s: string) => void;
  dateFrom: string;
  setDateFrom: (d: string) => void;
  dateTo: string;
  setDateTo: (d: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function MovementFilterBar({
  typeFilter, setTypeFilter,
  variantSearch, setVariantSearch,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
  hasActiveFilters, onClearFilters
}: MovementFilterBarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  const toggleType = (t: MovementType) => {
    setTypeFilter(typeFilter.includes(t) ? typeFilter.filter(x => x !== t) : [...typeFilter, t]);
  };

  const TypeChips = () => (
    <div className="flex flex-wrap gap-2">
      {ALL_TYPES.map(opt => {
        const isSelected = typeFilter.includes(opt.type);
        return (
          <button
            key={opt.type}
            onClick={() => toggleType(opt.type)}
            className={`px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all active:scale-95 ${isSelected ? opt.selected : opt.color}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  const FormControls = () => (
    <div className="flex flex-col gap-5 p-5 md:p-0">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-black text-text-secondary uppercase tracking-wider">Tipo de movimiento</label>
        <TypeChips />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-black text-text-secondary uppercase tracking-wider">Buscar variante / producto</label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input
            type="text"
            value={variantSearch}
            onChange={e => setVariantSearch(e.target.value)}
            placeholder="Nombre de variante o producto..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-border bg-base text-text-primary font-semibold focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black text-text-secondary uppercase tracking-wider">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-border bg-base text-text-primary font-semibold focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black text-text-secondary uppercase tracking-wider">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-border bg-base text-text-primary font-semibold focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>
    </div>
  );

  // Chips to show active filters
  const activeChips: { label: string; onRemove: () => void }[] = [
    ...typeFilter.map(t => ({
      label: ALL_TYPES.find(x => x.type === t)?.label || t,
      onRemove: () => toggleType(t),
    })),
    ...(variantSearch ? [{ label: `"${variantSearch}"`, onRemove: () => setVariantSearch("") }] : []),
    ...(dateFrom ? [{ label: `Desde: ${dateFrom}`, onRemove: () => setDateFrom("") }] : []),
    ...(dateTo   ? [{ label: `Hasta: ${dateTo}`,   onRemove: () => setDateTo("") }]   : []),
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* ── Mobile trigger ── */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="w-full flex items-center justify-between p-4 bg-surface border border-border rounded-2xl shadow-sm font-bold text-text-primary active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <Filter size={22} className="text-primary" />
            <span className="text-lg">Filtros</span>
          </div>
          {hasActiveFilters && (
            <span className="bg-primary text-white text-sm font-black px-3 py-1 rounded-full">{activeChips.length}</span>
          )}
        </button>
      </div>

      {/* ── Mobile sheet ── */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsMobileOpen(false)} />
          <div className="relative w-full bg-surface border-t border-border rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center p-6 border-b border-border bg-base rounded-t-3xl flex-shrink-0">
              <span className="font-black text-xl">Filtros</span>
              <button onClick={() => setIsMobileOpen(false)} className="p-3 bg-surface border border-border rounded-full hover:bg-hover transition-colors">
                <X size={22} />
              </button>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1">
              <FormControls />
            </div>
            <div className="p-5 border-t border-border bg-base flex gap-3 pb-8 flex-shrink-0">
              <button onClick={() => { onClearFilters(); }} disabled={!hasActiveFilters} className="flex-1 py-4 font-bold border-2 border-border rounded-xl disabled:opacity-40 text-text-secondary">
                Limpiar
              </button>
              <button onClick={() => setIsMobileOpen(false)} className="flex-1 py-4 font-black bg-primary text-white rounded-xl shadow-md">
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop collapsible bar ── */}
      <div className="hidden md:flex flex-col bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
          className="flex justify-between items-center px-6 py-4 w-full focus:outline-none hover:bg-hover transition-colors"
        >
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-primary" />
            <span className="font-bold text-md">Filtros avanzados</span>
            {hasActiveFilters && (
              <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-black px-2.5 py-0.5 rounded-full">
                {activeChips.length} activos
              </span>
            )}
          </div>
          {isDesktopCollapsed ? <ChevronDown size={18} className="text-text-secondary" /> : <ChevronUp size={18} className="text-text-secondary" />}
        </button>

        {!isDesktopCollapsed && (
          <div className="px-6 pb-6 border-t border-border animate-in slide-in-from-top-4 fade-in duration-200">
            <div className="pt-5">
              <FormControls />
            </div>
          </div>
        )}
      </div>

      {/* ── Active filter chips ── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          {activeChips.map((chip, i) => (
            <span key={i} className="flex items-center gap-2 px-3.5 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-bold shadow-sm animate-in zoom-in-95">
              {chip.label}
              <button onClick={chip.onRemove} className="hover:bg-primary hover:text-white rounded-full p-0.5 transition-colors">
                <X size={13} />
              </button>
            </span>
          ))}
          <button onClick={onClearFilters} className="text-sm font-bold text-text-secondary hover:text-destructive underline ml-1 transition-colors px-1 py-2">
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
