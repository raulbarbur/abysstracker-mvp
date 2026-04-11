"use client";

import { useState, useEffect } from "react";

interface StockVariant {
  variantId: string;
  variantName: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
}

interface Movement {
  id: string;
  type: string;
  quantity: number;
  variantName: string;
  username: string;
  createdAt: string;
}

export default function StockPage() {
  const [stock, setStock] = useState<StockVariant[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveForm, setMoveForm] = useState({ variantId: "", type: "IN", quantity: 1, reason: "" });

  const fetchData = async () => {
    try {
      const [resStock, resMov] = await Promise.all([
        fetch("/api/stock/current"),
        fetch("/api/stock/movements")
      ]);
      const dataStock = await resStock.json();
      const dataMov = await resMov.json();
      setStock(dataStock.stock || []);
      
      const movFormatted = (dataMov.movements || []).map((m: { id: string, type: string, quantity: number, variant: { name: string }, user: { username: string }, createdAt: string }) => ({
        id: m.id, type: m.type, quantity: m.quantity, variantName: m.variant?.name, username: m.user?.username, createdAt: m.createdAt
      }));
      setMovements(movFormatted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/stock/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: moveForm.variantId,
          type: moveForm.type,
          quantity: Number(moveForm.quantity),
          reason: moveForm.reason
        })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setIsMoveModalOpen(false);
      setMoveForm({ variantId: "", type: "IN", quantity: 1, reason: "" });
      fetchData();
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  };

  const handleDownloadStock = () => {
    window.location.href = "/api/exports/stock";
  };
  const handleDownloadMovements = () => {
    window.location.href = "/api/exports/movements";
  };

  if (loading) return <div className="flex justify-center p-10"><div className="w-12 h-12 animate-spin border-4 border-blue-500/20 border-t-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div></div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white tracking-tight">Inventario de Stock</h1>
        <div className="flex items-center gap-3">
          <button onClick={handleDownloadStock} className="px-5 py-2.5 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-white font-bold rounded-xl text-sm transition-all shadow-inner">
            📥 Exportar Stock
          </button>
          <button onClick={() => setIsMoveModalOpen(true)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2">
            <span>⇄</span> Registrar movimiento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* STOCK ACTUAL PANEL */}
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl flex flex-col max-h-[800px]">
          <div className="p-6 border-b border-gray-800/80 flex items-center justify-between bg-black/40">
            <h3 className="font-bold text-gray-100 text-lg tracking-wide">Stock Actual</h3>
            <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full">{stock.length} variantes</span>
          </div>
          <div className="overflow-x-auto flex-1 h-full custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-950 text-gray-500 uppercase tracking-widest text-[10px] font-black sticky top-0 z-10 shadow-md">
                <tr>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Variante</th>
                  <th className="px-6 py-4 text-right">Cantidad</th>
                  <th className="px-6 py-4 text-right">Mínimo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {stock.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">No hay registros de inventario disponibles</td>
                  </tr>
                ) : stock.map((s) => {
                  const isLow = s.minimumStock > 0 && s.currentStock < s.minimumStock;
                  return (
                    <tr key={s.variantId} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-400 text-xs uppercase tracking-wider">{s.productName}</td>
                      <td className="px-6 py-4 font-bold text-gray-200">
                         {s.variantName}
                         {isLow && <span className="ml-3 text-[9px] bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(249,115,22,0.2)] border border-orange-500/30 font-black uppercase tracking-widest">Alerta crítico</span>}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-black text-xl">
                        <span className={isLow ? "text-orange-400" : "text-green-400"}>{s.currentStock}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-gray-500">{s.minimumStock}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* HISTORIAL PANEL */}
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl flex flex-col max-h-[800px]">
          <div className="p-6 border-b border-gray-800/80 flex items-center justify-between bg-black/40">
            <h3 className="font-bold text-gray-100 text-lg tracking-wide">Historial Transaccional</h3>
            <button onClick={handleDownloadMovements} className="text-xs font-bold text-blue-400 hover:text-white px-4 py-2 hover:bg-blue-600/30 bg-blue-600/10 border border-blue-500/20 rounded-lg transition-all shadow-inner">
              📥 Exportar
            </button>
          </div>
          <div className="overflow-x-auto flex-1 h-full custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-950 text-gray-500 uppercase tracking-widest text-[10px] font-black sticky top-0 z-10 shadow-md">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Línea</th>
                  <th className="px-6 py-4 text-right">Flujo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">El historial de almacén está vacío</td>
                  </tr>
                ) : movements.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400 font-medium">
                      {new Date(m.createdAt).toLocaleString("es-ES", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded shadow-inner ${
                          m.type === 'IN' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                          m.type === 'OUT' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                          m.type === 'LOSS' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' :
                          'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                        }`}>
                          {m.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-200">{m.variantName}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{m.username}</p>
                    </td>
                    <td className={`px-6 py-4 text-right font-mono font-black text-xl leading-none ${m.type === 'IN' || m.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                       {m.type === 'LOSS' || m.type === 'OUT' ? '-' : (m.type === 'IN' || m.quantity > 0 ? '+' : '')}{m.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {isMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg p-8 shadow-2xl relative">
            <h3 className="text-2xl font-black text-white mb-6">Registrar Movimiento</h3>
            <form onSubmit={handleStockMovement} className="space-y-5">
              <div>
                <label className="block text-sm font-bold tracking-wide text-gray-400 mb-2">Punto del Catálogo</label>
                <select value={moveForm.variantId} onChange={e => setMoveForm({...moveForm, variantId: e.target.value})} required className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-gray-200 font-medium focus:outline-none focus:border-blue-500 shadow-inner">
                  <option value="" disabled>Localiza la Variante...</option>
                  {stock.map(s => (
                    <option key={s.variantId} value={s.variantId}>{s.productName} ➔ {s.variantName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold tracking-wide text-gray-400 mb-2">Clasificación</label>
                  <select value={moveForm.type} onChange={e => setMoveForm({...moveForm, type: e.target.value})} className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium focus:outline-none focus:border-blue-500 shadow-inner">
                    <option value="IN">Ingreso Neto (IN)</option>
                    <option value="ADJUSTMENT">Ajuste Libre</option>
                    <option value="LOSS">Pérdida Declarada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold tracking-wide text-gray-400 mb-2">Modificador</label>
                  <input type="number" value={moveForm.quantity || ''} onChange={e => setMoveForm({...moveForm, quantity: Number(e.target.value)})} required className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-blue-500 shadow-inner" />
                  <p className="text-[10px] text-gray-500 font-medium mt-1.5 leading-tight pl-1">Se permiten <span className="text-red-400">negativos</span> únicamente durante los ajustes.</p>
                </div>
              </div>
              {(moveForm.type === 'LOSS' || moveForm.type === 'ADJUSTMENT') && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-bold tracking-wide text-gray-400 mb-2">Causa Probable <span className="text-red-500">*</span></label>
                  <input type="text" value={moveForm.reason} onChange={e => setMoveForm({...moveForm, reason: e.target.value})} required className="w-full px-4 py-3 bg-gray-950 border border-red-500/20 rounded-xl text-white focus:outline-none focus:border-red-500 shadow-inner placeholder-gray-700" placeholder="Ej: Mercancía en mal estado" />
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-800/50 mt-6">
                <button type="button" onClick={() => setIsMoveModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-400 hover:text-white transition-colors">Descartar</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-[0_0_10px_rgba(37,99,235,0.3)] transition-all">Sellar Movimiento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
