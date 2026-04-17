"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, AlertTriangle, Hand } from "lucide-react";
import { Banner } from "@/components/ui/Banner";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";

/* --- Decorative Sparkline Component --- */
const Sparkline = ({ type }: { type: 'primary' | 'success' | 'info' }) => {
  // Will inherit text-primary, text-success etc
  let dPath = "M0,20 Q10,10 20,25 T40,15 T60,30 T80,10 T100,5";
  let dArea = "M0,40 L0,20 Q10,10 20,25 T40,15 T60,30 T80,10 T100,5 L100,40 Z";
  
  if (type === 'success') {
    dPath = "M0,35 Q15,30 25,20 T50,25 T70,10 T100,2";
    dArea = "M0,40 L0,35 Q15,30 25,20 T50,25 T70,10 T100,2 L100,40 Z";
  } else if (type === 'info') {
    dPath = "M0,15 Q15,5 30,20 T60,15 T80,25 T100,10";
    dArea = "M0,40 L0,15 Q15,5 30,20 T60,15 T80,25 T100,10 L100,40 Z";
  }

  return (
    <div className={`absolute inset-x-0 bottom-0 h-20 opacity-[0.04] group-hover:opacity-10 transition-opacity duration-500 pointer-events-none text-${type}`}>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
        <path d={dArea} fill="currentColor" />
        <path d={dPath} fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
};

interface DashboardData {
  salesToday: { count: number; totalAmount: number };
  monthlyStats: { revenue: number; profit: number; count: number };
  topVariants: { variantId: string; variantName: string; productName: string; totalQuantitySold: number }[];
  latestMovements: { id: string; type: string; quantity: number; variantName: string; productName: string; username: string; createdAt: string }[];
  lowStockAlerts: { variantId: string; variantName: string; productName: string; productId: string; currentStock: number; minimumStock: number }[];
}

function getRelativeTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'hace un momento';
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours} h`;
  if (diffDays === 1) return 'hace 1 día';
  return `hace ${diffDays} días`;
}

export default function DashboardIndexPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Fallo al obtener los datos");
      const json = await res.json();
      setData(json);
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
      else setError("Ocurrió un error general");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto w-full mt-4">
        <Banner 
          variant="error" 
          title="Falló la conexión" 
          message={error} 
          className="mb-6"
        />
        <button 
          onClick={loadData}
          className="px-5 py-2.5 bg-surface border border-border text-primary rounded-lg hover:bg-hover transition-colors text-sm font-semibold"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { salesToday, monthlyStats, topVariants, latestMovements, lowStockAlerts } = data || {};
  const formatMoney = (amount: number) => `$${Number(amount).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Buenos días" : currentHour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-6 md:gap-8 pb-10">
      
      {/* HEADER BIENVENIDA */}
      <div className="flex flex-col gap-1.5 pt-2">
        <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight flex items-center gap-2"><Hand className="w-7 h-7 text-yellow-500" /> ¡{greeting}!</h1>
        <p className="text-sm md:text-base text-text-secondary font-medium">Resumen de rendimiento comercial y estado del inventario en tiempo real.</p>
      </div>

      {/* SECCIÓN SUPERIOR: CARRUSEL MÓVIL / 3 COLUMNAS DESKTOP (KPIs) */}
      <div className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 gap-4 md:gap-6 pb-2 -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* CARD: VENTAS HOY */}
        <div className="relative min-w-[85vw] sm:min-w-[300px] md:min-w-0 snap-center shrink-0 bg-surface border border-border rounded-2xl p-6 md:p-7 shadow-sm flex flex-col gap-4 overflow-hidden group hover:border-primary/30 transition-all duration-300">
           <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 blur-[40px] rounded-full group-hover:bg-primary/20 transition-all duration-500"></div>
           <Sparkline type="primary" />
           <div className="relative flex items-center gap-3">
             <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
               <TrendingUp className="w-5 h-5 flex-shrink-0" />
             </div>
             <span className="text-sm font-black text-text-secondary uppercase tracking-[0.15em]">Ventas Hoy</span>
           </div>
           
           {isLoading ? (
             <div className="relative flex flex-col gap-3 mt-2">
               <Skeleton className="h-10 w-48 rounded-lg" />
               <Skeleton className="h-5 w-32 rounded-md" />
             </div>
           ) : (
             <div className="relative flex flex-col mt-3">
               <span className="text-[2.5rem] leading-none font-black text-text-primary tracking-tight drop-shadow-sm">
                 {formatMoney(salesToday?.totalAmount || 0)}
               </span>
               <span className="text-sm font-semibold text-text-secondary mt-3">
                 {salesToday?.count || 0} {(salesToday?.count === 1) ? 'operación cerrada' : 'operaciones cerradas'}
               </span>
             </div>
           )}
        </div>

        {/* CARD: INGRESOS DEL MES */}
        <div className="relative min-w-[85vw] sm:min-w-[300px] md:min-w-0 snap-center shrink-0 bg-surface border border-border rounded-2xl p-6 md:p-7 shadow-sm flex flex-col gap-4 overflow-hidden group hover:border-success/30 transition-all duration-300">
           <div className="absolute -top-10 -right-10 w-32 h-32 bg-success/5 blur-[40px] rounded-full group-hover:bg-success/20 transition-all duration-500"></div>
           <Sparkline type="success" />
           <div className="relative flex items-center gap-3">
             <div className="p-2.5 rounded-xl bg-success/10 text-success">
               <TrendingUp className="w-5 h-5 flex-shrink-0" />
             </div>
             <span className="text-sm font-black text-text-secondary uppercase tracking-[0.15em]">Ingresos Mensuales</span>
           </div>
           
           {isLoading ? (
             <div className="relative flex flex-col gap-3 mt-2">
               <Skeleton className="h-10 w-48 rounded-lg" />
               <Skeleton className="h-5 w-32 rounded-md" />
             </div>
           ) : (
             <div className="relative flex flex-col mt-3">
               <span className="text-[2.5rem] leading-none font-black text-text-primary tracking-tight shadow-success/10 drop-shadow-sm">
                 {formatMoney(monthlyStats?.revenue || 0)}
               </span>
               <span className="text-sm font-semibold text-text-secondary mt-3">
                 {monthlyStats?.count || 0} {(monthlyStats?.count === 1) ? 'operación acumulada' : 'operaciones acumuladas'}
               </span>
             </div>
           )}
        </div>

        {/* CARD: GANANCIAS DEL MES */}
        <div className="relative min-w-[85vw] sm:min-w-[300px] md:min-w-0 snap-center shrink-0 bg-surface border border-border rounded-2xl p-6 md:p-7 shadow-sm flex flex-col gap-4 overflow-hidden group hover:border-info/30 transition-all duration-300">
           <div className="absolute -top-10 -right-10 w-32 h-32 bg-info/5 blur-[40px] rounded-full group-hover:bg-info/20 transition-all duration-500"></div>
           <Sparkline type="info" />
           <div className="relative flex items-center gap-3">
             <div className="p-2.5 rounded-xl bg-info/10 text-info">
               <TrendingUp className="w-5 h-5 flex-shrink-0" />
             </div>
             <span className="text-sm font-black text-text-secondary uppercase tracking-[0.15em]">Ganancia Neta</span>
           </div>
           
           {isLoading ? (
             <div className="relative flex flex-col gap-3 mt-2">
               <Skeleton className="h-10 w-48 rounded-lg" />
               <Skeleton className="h-5 w-32 rounded-md" />
             </div>
           ) : (
             <div className="relative flex flex-col mt-3">
               <span className="text-[2.5rem] leading-none font-black text-text-primary tracking-tight shadow-info/10 drop-shadow-sm">
                 {formatMoney(monthlyStats?.profit || 0)}
               </span>
               <span className="text-sm font-semibold text-text-secondary mt-3">
                 Costo de inventario deducido
               </span>
             </div>
           )}
        </div>
      </div>

      {/* SECCIÓN INFERIOR: 3 COLUMNAS DESKTOP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6 items-start">
        
        {/* CARD: TOP 5 VARIANTES (Movida abajo) */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-5">Productos más vendidos</h3>
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex flex-col gap-1.5 w-full max-w-[140px]">
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <Skeleton className="h-6 w-12 rounded-md flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : (topVariants && topVariants.length > 0) ? (
            <div className="flex flex-col gap-4">
              {topVariants.slice(0, 5).map((v, i) => (
                <div key={v.variantId} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="text-text-disabled font-bold text-sm w-3 text-center group-hover:text-primary transition-colors">{i + 1}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-text-primary leading-tight">{v.productName}</span>
                      <span className="text-xs text-text-secondary font-semibold uppercase tracking-wide truncate max-w-[150px]">{v.variantName}</span>
                    </div>
                  </div>
                  <span className="font-bold text-primary text-sm flex-shrink-0 bg-primary/10 px-2 py-0.5 rounded-md">{v.totalQuantitySold}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-8">
              <span className="text-sm font-medium text-text-disabled">Sin ventas</span>
            </div>
          )}
        </div>
        
        {/* CARD: ALERTAS DE STOCK BAJO */}
        {(!isLoading && lowStockAlerts && lowStockAlerts.length > 0) ? (
          <div className="bg-elevated border border-border border-l-4 border-l-destructive rounded-xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="text-destructive w-5 h-5 flex-shrink-0" />
                <h3 className="text-sm font-bold text-destructive uppercase tracking-wider">Stock bajo</h3>
              </div>
              <Badge variant="destructive" className="px-2">{lowStockAlerts.length}</Badge>
            </div>
            
            <div className="flex flex-col gap-4">
              {lowStockAlerts.slice(0, 10).map((alert) => {
                const isZero = alert.currentStock === 0;
                return (
                  <div key={alert.variantId} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <div className="flex flex-col flex-1 pr-3 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-text-primary">{alert.variantName}</span>
                        {isZero && <Badge variant="destructive" className="scale-75 origin-left tracking-widest text-xs">SIN STOCK</Badge>}
                      </div>
                      <span className="text-xs text-text-secondary truncate mt-0.5">{alert.productName}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-baseline gap-0.5 bg-surface px-2 py-1 rounded-md border border-border/50">
                        <span className={`text-sm font-bold ${isZero ? 'text-destructive' : 'text-warning'}`}>{alert.currentStock}</span>
                        <span className="text-xs text-text-secondary font-medium">/{alert.minimumStock}</span>
                      </div>
                      <Link
                        href={`/inventory/products?expand=${alert.productId}`}
                        className="px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors whitespace-nowrap"
                      >
                        Ir a stock
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : isLoading ? (
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col">
            <Skeleton className="h-5 w-32 mb-6" />
            <div className="flex flex-col gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex flex-col gap-1.5 w-full max-w-[150px]">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                  <Skeleton className="h-8 w-14 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* CARD: ÚLTIMOS MOVIMIENTOS */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-5">Últimos movimientos</h3>
          {isLoading ? (
            <div className="flex flex-col gap-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-4 w-full">
                    <Skeleton className="h-6 w-10 rounded-sm flex-shrink-0" />
                    <div className="flex flex-col gap-1.5 w-full max-w-[140px]">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          ) : (latestMovements && latestMovements.length > 0) ? (
            <div className="flex flex-col gap-4">
              {latestMovements.slice(0, 7).map((m) => {
                let badgeClass = "bg-surface text-text-secondary";
                let qtyClass = "text-text-primary";
                let typeLabel = m.type;
                let sign = "";
                
                if (m.type === 'IN') { 
                  badgeClass = "bg-success/15 text-success border-success/30"; 
                  qtyClass = "text-success"; 
                  typeLabel = 'Ingreso'; 
                  sign = "+"; 
                } else if (m.type === 'OUT') { 
                  badgeClass = "bg-blue-500/15 text-blue-400 border-blue-400/30"; 
                  qtyClass = "text-blue-400"; 
                  typeLabel = 'Venta'; 
                  sign = "-"; 
                } else if (m.type === 'ADJUSTMENT') { 
                  badgeClass = "bg-warning/15 text-warning border-warning/30"; 
                  qtyClass = "text-warning"; 
                  typeLabel = 'Ajuste'; 
                  sign = m.quantity >= 0 ? "+" : ""; 
                } else if (m.type === 'LOSS') { 
                  badgeClass = "bg-destructive/15 text-destructive border-destructive/30"; 
                  qtyClass = "text-destructive"; 
                  typeLabel = 'Pérdida'; 
                  sign = "-"; 
                } 
                
                return (
                  <div key={m.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0 group">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg border text-xs uppercase font-black tracking-widest flex-shrink-0 ${badgeClass}`}>
                        {typeLabel}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-text-primary leading-tight group-hover:text-primary transition-colors truncate">{m.productName}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-xs text-text-secondary font-semibold uppercase tracking-wide truncate max-w-[100px]`}>{m.variantName}</span>
                          <span className={`text-xs font-black tabular-nums ${qtyClass}`}>{sign}{m.quantity}</span>
                          <span className="text-xs text-text-secondary truncate"><span className="text-text-disabled mx-0.5">•</span> por <span className="font-medium text-text-primary/70">{m.username}</span></span>
                        </div>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex text-xs font-medium text-text-secondary flex-shrink-0 bg-base border border-border/50 px-2 py-1 rounded-md ml-2">{getRelativeTime(m.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-8">
              <span className="text-sm font-medium text-text-disabled">Sin actividad reciente</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
