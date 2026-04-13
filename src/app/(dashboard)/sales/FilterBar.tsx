"use client";

import React, { useState } from "react";
import { Filter, X, ChevronDown, ChevronUp, Search } from "lucide-react";

interface FilterBarProps {
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  userIdFilter: string;
  setUserIdFilter: (s: string) => void;
  dateFrom: string;
  setDateFrom: (d: string) => void;
  dateTo: string;
  setDateTo: (d: string) => void;
  ticketSearch: string;
  setTicketSearch: (s: string) => void;
  usersList: {id: string, username: string}[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function FilterBar({
  statusFilter, setStatusFilter,
  userIdFilter, setUserIdFilter,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
  ticketSearch, setTicketSearch,
  usersList,
  hasActiveFilters, onClearFilters
}: FilterBarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(true);

  const activeChips = [];
  if (ticketSearch) activeChips.push({ label: `Ticket: ${ticketSearch}`, onRemove: () => setTicketSearch("") });
  if (statusFilter !== "ALL") activeChips.push({ label: `Estado: ${statusFilter}`, onRemove: () => setStatusFilter("ALL") });
  if (userIdFilter !== "ALL") activeChips.push({ label: `Vendedor: ${usersList.find(u => u.id === userIdFilter)?.username || userIdFilter}`, onRemove: () => setUserIdFilter("ALL") });
  if (dateFrom) activeChips.push({ label: `Desde: ${dateFrom}`, onRemove: () => setDateFrom("") });
  if (dateTo) activeChips.push({ label: `Hasta: ${dateTo}`, onRemove: () => setDateTo("") });

  const FormControls = () => (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-5 md:p-0">
      <div className="flex flex-col">
        <label className="text-xs font-bold text-text-secondary uppercase mb-1">Buscar Ticket</label>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input 
            type="text" 
            placeholder="F-202..."
            value={ticketSearch} 
            onChange={e => setTicketSearch(e.target.value)}
            className="w-full p-3 pl-10 rounded-xl border border-border bg-base text-text-primary focus:ring-2 focus:ring-primary outline-none font-semibold uppercase"
          />
        </div>
      </div>

      <div className="flex flex-col">
        <label className="text-xs font-bold text-text-secondary uppercase mb-1">Estado</label>
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)}
          className="p-3 rounded-xl border border-border bg-base text-text-primary focus:ring-2 focus:ring-primary outline-none cursor-pointer font-semibold"
        >
          <option value="ALL">Todas</option>
          <option value="ACTIVE">Activa (Completada)</option>
          <option value="CANCELLED">Anulada</option>
        </select>
      </div>

      <div className="flex flex-col">
        <label className="text-xs font-bold text-text-secondary uppercase mb-1">Vendedor</label>
        <select 
          value={userIdFilter} 
          onChange={e => setUserIdFilter(e.target.value)}
          className="p-3 rounded-xl border border-border bg-base text-text-primary focus:ring-2 focus:ring-primary outline-none cursor-pointer font-semibold"
        >
          <option value="ALL">Todos los Vendedores</option>
          {usersList.map((u) => (
            <option key={u.id} value={u.id}>{u.username}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label className="text-xs font-bold text-text-secondary uppercase mb-1">Desde Fecha</label>
        <input 
          type="date" 
          value={dateFrom} 
          onChange={e => setDateFrom(e.target.value)}
          className="p-3 rounded-xl border border-border bg-base text-text-primary focus:ring-2 focus:ring-primary outline-none font-semibold"
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs font-bold text-text-secondary uppercase mb-1">Hasta Fecha</label>
        <input 
          type="date" 
          value={dateTo} 
          onChange={e => setDateTo(e.target.value)}
          className="p-3 rounded-xl border border-border bg-base text-text-primary focus:ring-2 focus:ring-primary outline-none font-semibold"
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full max-w-full z-20 relative">
      <div className="md:hidden">
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="w-full flex items-center justify-between p-4 bg-surface border border-border rounded-xl shadow-sm text-text-primary font-bold active:scale-[0.98] transition-transform outline-none"
        >
          <div className="flex items-center gap-3">
            <Filter size={24} className="text-primary"/>
            <span className="text-lg">Filtros de Búsqueda</span>
          </div>
          {hasActiveFilters && (
            <span className="bg-primary text-white text-md font-bold px-3 py-1 rounded-full">{activeChips.length}</span>
          )}
        </button>
      </div>

      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in transition-opacity" onClick={() => setIsMobileOpen(false)} />
          <div className="relative w-full bg-surface border-t border-border rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center p-6 border-b border-border bg-base rounded-t-3xl">
              <span className="font-black text-xl">Filtros</span>
              <button onClick={() => setIsMobileOpen(false)} className="p-3 bg-surface border border-border focus:ring-2 ring-primary rounded-full hover:bg-hover transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="overflow-y-auto">
              <FormControls />
            </div>
            <div className="p-5 border-t border-border bg-base flex gap-3 pb-8">
              <button 
                onClick={onClearFilters}
                disabled={!hasActiveFilters}
                className="flex-1 py-4 font-bold border-2 border-border rounded-xl disabled:opacity-50 text-text-secondary disabled:bg-base bg-surface"
              >
                Limpiar
              </button>
              <button onClick={() => setIsMobileOpen(false)} className="flex-1 py-4 font-black bg-primary text-white rounded-xl shadow-md">
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden md:flex flex-col p-5 bg-surface border border-border rounded-2xl shadow-sm">
        <button 
          onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
          className="flex justify-between items-center w-full focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <Filter size={20} className="text-primary" />
            <span className="font-bold text-md cursor-pointer hover:text-primary transition-colors">Filtros Avanzados</span>
            {hasActiveFilters && (
              <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Activos ({activeChips.length})
              </span>
            )}
          </div>
          {isDesktopCollapsed ? <ChevronDown size={20} className="text-text-secondary hover:text-primary transition-colors" /> : <ChevronUp size={20} className="text-text-secondary hover:text-primary transition-colors" />}
        </button>
        
        {!isDesktopCollapsed && (
          <div className="mt-5 pt-5 border-t border-border animate-in slide-in-from-top-4 fade-in duration-200">
            <FormControls />
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-4 px-1 pb-1">
          {activeChips.map((chip, i) => (
            <span key={i} className="flex items-center gap-2 px-3.5 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-bold shadow-sm animate-in zoom-in-95 leading-none">
              {chip.label}
              <button onClick={chip.onRemove} className="hover:bg-primary hover:text-white rounded-full p-0.5 transition-colors">
                <X size={14} />
              </button>
            </span>
          ))}
          <button onClick={onClearFilters} className="text-sm font-bold text-text-secondary hover:text-destructive underline ml-2 transition-colors px-2 py-2">
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
