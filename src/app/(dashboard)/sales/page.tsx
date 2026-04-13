"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FilterBar } from "./FilterBar";
import { SaleCard, SaleDetailPanel } from "./SaleCard";
import { CancelModal } from "./CancelModal";
import { Loader2, Receipt, AlertOctagon, TrendingUp, Info } from "lucide-react";

export interface SaleType {
  id: string;
  date: string;
  status: "ACTIVE" | "CANCELLED";
  cancellationReason?: string;
  cancellationDate?: string;
  user: { username: string };
  cancelledByUserId?: string;
  cancelledByUser?: { username: string } | null;
  lines: {
    variantId: string;
    quantity: number;
    unitPrice: number;
    variant: {
      name: string;
      product: { name: string };
    };
  }[];
  invoice?: {
    id: string;
    invoiceNumber: string;
  } | null;
}

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<SaleType[]>([]);
  const [usersList, setUsersList] = useState<{id: string, username: string}[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [userIdFilter, setUserIdFilter] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [ticketSearch, setTicketSearch] = useState<string>("");

  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [cancelSaleId, setCancelSaleId] = useState<string | null>(null);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (userIdFilter !== "ALL") params.append("userId", userIdFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const res = await fetch(`/api/sales?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSales(data.sales || []);
        if (data.sales && data.sales.length > 0) {
          if (window.innerWidth >= 1024) {
            setExpandedSaleId(prev => prev || data.sales[0].id);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, userIdFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchSales();
    
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsersList(data.users || []));
  }, [fetchSales]);

  const filteredSales = useMemo(() => {
    if (!ticketSearch) return sales;
    const term = ticketSearch.toLowerCase();
    return sales.filter(s => s.invoice?.invoiceNumber.toLowerCase().includes(term));
  }, [sales, ticketSearch]);

  const handleSaleCancelled = (saleId: string, updatedSaleData: unknown) => {
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, ...(updatedSaleData as Partial<SaleType>), status: "CANCELLED" } : s));
  };

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setUserIdFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setTicketSearch("");
  };

  const hasActiveFilters = statusFilter !== "ALL" || userIdFilter !== "ALL" || dateFrom !== "" || dateTo !== "" || ticketSearch !== "";

  const summary = useMemo(() => {
    let totalCobrado = 0;
    let totalAnulado = 0;
    filteredSales.forEach(s => {
      const sTotal = s.lines.reduce((acc, l) => acc + (l.quantity * Number(l.unitPrice)), 0);
      if (s.status === "ACTIVE") totalCobrado += sTotal;
      else totalAnulado += sTotal;
    });
    return { totalCobrado, totalAnulado, count: filteredSales.length };
  }, [filteredSales]);

  const selectedSaleObj = filteredSales.find(s => s.id === expandedSaleId);

  return (
    <div className="flex flex-col h-full gap-5 mx-auto max-w-[1400px]">
      <div>
        <h1 className="text-3xl font-black text-text-primary tracking-tight mb-2">Historial de Ventas</h1>
        <p className="text-text-secondary text-md font-semibold">Resumen analítico y lista maestra de transacciones.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border shadow-sm rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Total Cobrado (Activo)</p>
            <p className="text-3xl font-black text-primary">${summary.totalCobrado.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
          <div className="p-4 bg-primary/10 text-primary rounded-xl hidden sm:block">
            <TrendingUp size={28} />
          </div>
        </div>
        <div className="bg-surface border border-border shadow-sm rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Tickets Emitidos</p>
            <p className="text-3xl font-black text-text-primary">{summary.count.toLocaleString('es-AR')}</p>
          </div>
          <div className="p-4 bg-base border border-border text-text-secondary rounded-xl hidden sm:block">
            <Receipt size={28} />
          </div>
        </div>
        <div className="bg-surface border border-border shadow-sm rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Anulaciones</p>
            <p className="text-3xl font-black text-destructive">-${summary.totalAnulado.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
          <div className="p-4 bg-destructive/10 text-destructive rounded-xl hidden sm:block">
            <AlertOctagon size={28} />
          </div>
        </div>
      </div>

      <FilterBar 
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        userIdFilter={userIdFilter}
        setUserIdFilter={setUserIdFilter}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        ticketSearch={ticketSearch}
        setTicketSearch={setTicketSearch}
        usersList={usersList}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-[0px]">
        <div className="flex-1 lg:w-[50%] xl:w-[45%] bg-surface border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col relative h-[500px] lg:h-full">
          {loading ? (
            <div className="flex-1 flex flex-col justify-center items-center py-20 text-text-secondary w-full">
               <Loader2 className="animate-spin w-12 h-12 mb-4" />
               <p className="font-bold">Cargando operaciones...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center py-20 text-text-disabled">
               <p className="font-bold text-lg">No se encontraron ventas para estos filtros.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
               {filteredSales.map((sale) => (
                 <SaleCard
                   key={sale.id}
                   sale={sale}
                   isExpanded={expandedSaleId === sale.id}
                   onToggleExpand={() => setExpandedSaleId(prev => prev === sale.id ? null : sale.id)}
                   onCancelClick={() => setCancelSaleId(sale.id)}
                 />
               ))}
            </div>
          )}
        </div>

        {selectedSaleObj ? (
          <div className="hidden lg:flex flex-col w-[50%] xl:w-[55%] bg-surface border border-border rounded-2xl shadow-sm overflow-hidden h-full">
            <div className="px-6 py-5 border-b border-border bg-base flex flex-col justify-center h-[5rem] flex-shrink-0">
              <span className="font-black text-xl text-text-primary leading-none">Detalle de Operación</span>
              {selectedSaleObj.invoice?.invoiceNumber && (
                <span className="text-sm font-semibold text-text-secondary mt-1">Ticket #{selectedSaleObj.invoice.invoiceNumber}</span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-base">
              <SaleDetailPanel sale={selectedSaleObj} onCancelClick={() => setCancelSaleId(selectedSaleObj.id)} />
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-col w-[50%] xl:w-[55%] bg-surface border border-border rounded-2xl shadow-sm h-full items-center justify-center text-text-disabled p-10 text-center">
            <Info size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-bold">Seleccione un comprobante</p>
            <p className="text-sm">Haga clic en una venta de la lista para ver sus detalles</p>
          </div>
        )}
      </div>

      <CancelModal
        saleId={cancelSaleId}
        isOpen={!!cancelSaleId}
        onClose={() => setCancelSaleId(null)}
        onSuccess={handleSaleCancelled}
      />
    </div>
  );
}
