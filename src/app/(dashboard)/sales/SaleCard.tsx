"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, X, AlertOctagon, Receipt, ShoppingBag, Banknote, ArrowLeftRight } from "lucide-react";
import { SaleType } from "./page";
import dynamic from "next/dynamic";

const PdfViewerModal = dynamic(
  () => import("./PdfViewerModal").then((mod) => mod.PdfViewerModal),
  { ssr: false }
);

interface SaleDetailPanelProps {
  sale: SaleType;
  onCancelClick: () => void;
}

export function SaleDetailPanel({ sale, onCancelClick }: SaleDetailPanelProps) {
  const [pdfPreview, setPdfPreview] = useState<{url: string, title: string} | null>(null);
  
  const totalAmount = sale.lines.reduce((acc, l) => acc + (l.quantity * l.unitPrice), 0);
  const isActive = sale.status === "ACTIVE";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar px-1 min-h-[0px] pb-4">
        {sale.lines.map((line, idx) => (
          <div key={idx} className="flex justify-between items-center py-4 border-b border-border hover:bg-hover px-3 rounded-xl transition-colors">
            <div className="flex flex-col pr-4">
              <span className="font-bold text-md md:text-lg text-text-primary whitespace-pre-wrap leading-tight">{line.variant.name}</span>
              <span className="text-sm text-text-secondary font-semibold mt-1">
                {line.quantity} × ${(typeof line.unitPrice === 'string' ? parseFloat(line.unitPrice) : Number(line.unitPrice)).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} - <span className="uppercase text-xs tracking-wider">{line.variant.product.name}</span>
              </span>
            </div>
            <span className="font-black text-md md:text-lg text-text-primary bg-surface border border-border px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap">
              ${(line.quantity * (typeof line.unitPrice === 'string' ? parseFloat(line.unitPrice) : Number(line.unitPrice))).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 flex justify-between items-center bg-elevated px-6 py-5 rounded-2xl border border-border shadow-inner flex-shrink-0">
        <div className="flex flex-col gap-1">
          <span className="text-xl font-bold text-text-secondary uppercase tracking-widest leading-none">Total</span>
          {sale.paymentMethod && (
            <span className="flex items-center gap-1 text-xs font-semibold text-text-secondary">
              {sale.paymentMethod === "CASH" ? <Banknote size={13} /> : <ArrowLeftRight size={13} />}
              {sale.paymentMethod === "CASH" ? "Efectivo" : "Transferencia"}
            </span>
          )}
        </div>
        <span className="text-4xl md:text-5xl font-black text-primary drop-shadow-sm leading-none">${totalAmount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
      </div>

      {isActive ? (
        <div className="mt-6 flex-shrink-0 space-y-3">
           {sale.invoice && (
             <button 
               onClick={() => setPdfPreview({ url: `/api/sales/${sale.id}/ticket`, title: `Ticket de Compra - ${sale.invoice?.invoiceNumber}` })}
               className="w-full py-4 rounded-xl font-bold text-lg border-2 border-border bg-base text-text-primary hover:bg-hover transition-colors flex items-center justify-center gap-3 shadow-sm active:scale-[0.98]"
             >
               <Receipt size={22} className="text-primary" />
               Ver Ticket de Compra
             </button>
           )}
           <button 
             onClick={onCancelClick}
             className="w-full py-4 rounded-xl font-black text-xl border-2 border-destructive text-destructive hover:bg-destructive hover:text-white transition-colors flex items-center justify-center gap-3 active:scale-[0.98]"
           >
             <AlertOctagon size={24} />
             Anular Venta (Reintegro)
           </button>
        </div>
      ) : (
        <div className="mt-6 p-6 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive flex-shrink-0 shadow-sm">
           <h4 className="font-black text-xl mb-3 flex items-center gap-3"><AlertOctagon size={24}/> Operación Anulada</h4>
           <div className="flex flex-col gap-2 border-t border-destructive/20 pt-4">
             <p className="text-md font-semibold">Desautorizado por: <span className="text-text-primary">{sale.cancelledByUser?.username || "Sistema"}</span></p>
             {sale.cancellationDate && <p className="text-md font-semibold mb-2">Fecha: <span className="text-text-primary">{new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(sale.cancellationDate))}</span></p>}
             <p className="text-md font-semibold p-4 bg-surface/50 rounded-xl border border-destructive/20">Declaración: {sale.cancellationReason}</p>
             {sale.invoice && (
               <div className="mt-4">
                 <button 
                   onClick={() => setPdfPreview({ url: `/api/sales/${sale.id}/ticket`, title: `Ticket Original - ${sale.invoice?.invoiceNumber}` })}
                   className="w-full py-3 rounded-lg font-bold text-md border border-border bg-base text-text-primary hover:bg-hover transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                 >
                   <Receipt size={20} className="text-primary" />
                   Ver Ticket de Operación
                 </button>
               </div>
             )}
           </div>
        </div>
      )}

      {pdfPreview && (
        <PdfViewerModal
          isOpen={true}
          onClose={() => setPdfPreview(null)}
          pdfUrl={pdfPreview.url}
          title={pdfPreview.title}
        />
      )}
    </div>
  );
}

interface SaleCardProps {
  sale: SaleType;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCancelClick: () => void;
}

export function SaleCard({ sale, isExpanded, onToggleExpand, onCancelClick }: SaleCardProps) {
  const dateObj = new Date(sale.date);
  const formattedDateStr = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', year: '2-digit'
  }).format(dateObj);
  const formattedTimeStr = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(dateObj);
  
  const totalAmount = sale.lines.reduce((acc, l) => acc + (l.quantity * l.unitPrice), 0);
  const totalItems = sale.lines.reduce((acc, l) => acc + l.quantity, 0);
  const isActive = sale.status === "ACTIVE";

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024); // Use lg breakpoint
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <div 
        className={`w-full group outline-none overflow-hidden relative cursor-pointer select-none transition-all duration-200 border-b border-border
          ${isExpanded && !isMobile ? 'bg-hover' : 'bg-surface hover:bg-hover active:bg-base'}
        `}
        onClick={onToggleExpand}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${isActive ? 'bg-success' : 'bg-destructive/80'}`} />
        
        <div className="flex justify-between items-center p-3 pl-5 md:p-4 md:pl-6 gap-2">
          <div className="flex gap-2 md:gap-4 items-center min-w-0 flex-1">
            <div className={`p-2 rounded-full hidden md:flex text-text-secondary transition-transform flex-shrink-0 ${isExpanded && !isMobile ? 'translate-x-1 text-primary' : ''}`}>
              <ChevronRight size={24} />
            </div>
             <div className="flex flex-col min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1.5 flex-wrap">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-black text-md sm:text-lg md:text-xl text-text-primary tracking-tighter capitalize leading-none">{formattedDateStr}</span>
                    <span className="font-bold text-xs sm:text-sm text-text-secondary leading-none">{formattedTimeStr}</span>
                  </div>
                  <span className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex-shrink-0 whitespace-nowrap w-max ${isActive ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                    {isActive ? "ACTIVA" : "ANULADA"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs md:text-sm font-semibold text-text-secondary mt-0.5">
                  <div className="flex items-center gap-1 bg-primary/5 text-primary border border-primary/20 px-1.5 py-0.5 rounded shadow-sm flex-shrink-0 whitespace-nowrap">
                    <ShoppingBag size={12} className="md:w-3.5 md:h-3.5" />
                    <span className="leading-none">{totalItems} art.</span>
                  </div>
                  {sale.invoice?.invoiceNumber ? <span className="font-mono bg-border/40 border border-border/60 px-1.5 py-0.5 rounded text-[10px] text-text-primary shadow-sm leading-none flex-shrink-0 whitespace-nowrap">#{sale.invoice.invoiceNumber}</span> : null}
                  <span className="break-words line-clamp-2 max-w-[80px] sm:max-w-[150px] flex-shrink-0">{sale.user.username}</span>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 pl-1">
             <span className={`font-black tracking-tighter whitespace-nowrap ${isActive ? 'text-text-primary' : 'text-text-secondary line-through opacity-50'} text-lg sm:text-xl md:text-2xl lg:text-3xl`}>
               ${totalAmount.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
             </span>
             <div className="lg:hidden text-text-secondary flex-shrink-0">
               <ChevronRight size={20} className="md:w-6 md:h-6" />
             </div>
          </div>
        </div>
      </div>

      {isMobile && isExpanded && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in transition-opacity" onClick={onToggleExpand} />
          <div className="relative w-full bg-surface border-t border-border rounded-t-3xl shadow-2xl flex flex-col h-[85vh] animate-in slide-in-from-bottom-full duration-300">
            
            <div className="flex justify-between items-center p-6 border-b border-border bg-base rounded-t-3xl flex-shrink-0">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-black text-xl text-text-primary tracking-tighter capitalize leading-none">{formattedDateStr}</span>
                  <span className="font-bold text-sm text-text-secondary leading-none">{formattedTimeStr}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${isActive ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                    {isActive ? "ACTIVA" : "ANULADA"}
                  </span>
                  {sale.invoice?.invoiceNumber ? <span className="font-mono bg-border/40 border border-border/60 px-1.5 py-0.5 rounded text-[10px] text-text-primary shadow-sm leading-none font-bold">Ticket #{sale.invoice.invoiceNumber}</span> : null}
                </div>
              </div>
              <button onClick={onToggleExpand} className="p-3 bg-surface border border-border rounded-full hover:bg-hover active:scale-95 transition-transform">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-5 flex-1 relative flex flex-col min-h-[0px] overflow-hidden bg-base">
               <SaleDetailPanel sale={sale} onCancelClick={onCancelClick} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
