"use client";

import { useState, useEffect } from "react";

interface DashboardData {
  salesToday: { count: number; totalAmount: number };
  topVariants: { variantId: string; variantName: string; productName: string; totalQuantitySold: number }[];
  latestMovements: { id: string; type: string; quantity: number; variantName: string; username: string; createdAt: string }[];
  lowStockAlerts: { variantId: string; variantName: string; productName: string; currentStock: number; minimumStock: number }[];
}

export default function DashboardIndexPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
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
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 font-bold tracking-wide">
        Error: {error || "Datos no disponibles"}
      </div>
    );
  }

  const { salesToday, topVariants, latestMovements, lowStockAlerts } = data;

  const formatMoney = (amount: number) => `$${Number(amount).toFixed(2)}`;
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white tracking-tight">Panel Principal</h1>
      </div>

      {lowStockAlerts && lowStockAlerts.length > 0 && (
        <div className="p-6 rounded-2xl bg-orange-950/30 border border-orange-500/30 shadow-2xl relative overflow-hidden group backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,1)]"></div>
          <h2 className="text-xl font-bold text-orange-400 mb-6 flex items-center gap-3">
            <span className="text-2xl animate-pulse">⚠️</span> Alertas de stock bajo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {lowStockAlerts.map((alert) => (
              <div key={alert.variantId} className="p-5 rounded-xl bg-black/50 border border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-950/20 transition-all cursor-default shadow-inner">
                <span className="text-[10px] font-black text-orange-500/60 uppercase tracking-widest">{alert.productName}</span>
                <p className="text-gray-100 font-bold mb-3 mt-1 truncate">{alert.variantName}</p>
                <div className="flex justify-between items-end border-t border-orange-500/10 pt-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Actual</span>
                    <span className="text-orange-400 font-bold text-xl leading-none">{alert.currentStock}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Mínimo</span>
                    <span className="text-gray-400 font-bold leading-none">{alert.minimumStock}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-900/50 to-indigo-900/30 border border-blue-500/30 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-blue-500/20 blur-3xl rounded-full pointer-events-none"></div>
          <p className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-3 relative z-10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Ventas de hoy
          </p>
          <div className="flex items-baseline gap-4 relative z-10">
            <h3 className="text-5xl font-black text-white tracking-tighter">{formatMoney(salesToday.totalAmount)}</h3>
          </div>
          <p className="text-gray-400 text-sm font-medium mt-3 relative z-10"><span className="text-white font-bold">{salesToday.count}</span> operaciones completadas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-8 rounded-2xl bg-gray-900/60 border border-gray-800/80 shadow-2xl backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-6 border-b border-gray-800 pb-4 tracking-wide">Top 5 variantes más vendidas <span className="text-sm font-medium text-gray-500">(últimos 7 días)</span></h3>
          <div className="space-y-3">
            {topVariants.length === 0 ? (
              <p className="text-gray-500 text-center py-10 font-medium">No hay datos suficientes</p>
            ) : (
              topVariants.map((v, i) => (
                <div key={v.variantId} className="flex items-center justify-between p-4 rounded-xl bg-black/20 hover:bg-gray-800/50 border border-transparent hover:border-gray-700 transition-all">
                  <div className="flex items-center gap-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black font-mono shadow-inner ${i === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : i === 1 ? 'bg-gray-300/10 text-gray-300 border border-gray-400/20' : i === 2 ? 'bg-amber-700/20 text-amber-500 border border-amber-600/20' : 'bg-gray-800 text-gray-500'}`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-200">{v.variantName}</p>
                      <p className="text-xs text-gray-500 font-bold tracking-wider uppercase mt-1">{v.productName}</p>
                    </div>
                  </div>
                  <div className="px-5 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 shadow-inner">
                    <span className="font-bold text-blue-400 text-lg">{v.totalQuantitySold} <span className="text-[10px] uppercase tracking-wider opacity-70">uds</span></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-8 rounded-2xl bg-gray-900/60 border border-gray-800/80 shadow-2xl backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-6 border-b border-gray-800 pb-4 tracking-wide">Últimos movimientos de stock</h3>
          <div className="space-y-3">
            {latestMovements.length === 0 ? (
              <p className="text-gray-500 text-center py-10 font-medium">Sin actividad reciente</p>
            ) : (
              latestMovements.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4 rounded-xl bg-black/20 hover:bg-gray-800/50 border border-transparent hover:border-gray-700 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded shadow-inner ${
                        m.type === 'IN' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                        m.type === 'OUT' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                        m.type === 'LOSS' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                      }`}>
                        {m.type}
                      </span>
                      <span className="text-xs font-mono font-medium text-gray-500">{formatDate(m.createdAt)}</span>
                    </div>
                    <p className="font-bold text-gray-300 text-sm truncate max-w-[200px] sm:max-w-xs">{m.variantName}</p>
                  </div>
                  <div className="text-right flex flex-col items-end justify-center">
                    <p className={`font-mono font-black text-lg leading-none mb-1 shadow-sm ${m.type === 'IN' || m.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {m.type === 'LOSS' || m.type === 'OUT' ? '-' : (m.type === 'IN' || m.quantity > 0 ? '+' : '')}{m.quantity}
                    </p>
                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{m.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
