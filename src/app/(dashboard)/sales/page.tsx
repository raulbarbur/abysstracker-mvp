"use client";

import { useState, useEffect } from "react";

interface Variant {
  variantId: string;
  variantName: string;
  productName: string;
  currentPrice: number;
  currentStock: number;
}

interface SaleLineForm {
  variantId: string;
  quantity: number;
  price: number;
  name: string;
}

interface SaleLine {
  quantity: number;
  unitPrice: number;
  variant?: { name?: string; product?: { name?: string } };
}

interface Sale {
  id: string;
  date: string;
  status: string;
  user: { username: string };
  lines: SaleLine[];
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);

  // New Sale State
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [cartLines, setCartLines] = useState<SaleLineForm[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Cancel State
  const [cancelSaleId, setCancelSaleId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const fetchData = async () => {
    try {
      const [resSales, resStock] = await Promise.all([
        fetch("/api/sales"),
        fetch("/api/stock/current") // Using stock/current to get active variants to sell
      ]);
      const dataSales = await resSales.json();
      const dataStock = await resStock.json();

      setSales(dataSales.sales || []);
      setVariants((dataStock.stock || []).filter((v: any) => v.currentStock > 0)); // Only stock > 0
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddToCart = () => {
    if (!selectedVariantId || selectedQuantity <= 0) return;
    const v = variants.find(x => x.variantId === selectedVariantId);
    if (!v) return;

    if (selectedQuantity > v.currentStock) {
      alert(`No hay stock suficiente. Stock actual: ${v.currentStock}`);
      return;
    }

    const existing = cartLines.find(x => x.variantId === selectedVariantId);
    if (existing) {
      setCartLines(cartLines.map(x => x.variantId === selectedVariantId ? { ...x, quantity: x.quantity + selectedQuantity } : x));
    } else {
      setCartLines([...cartLines, { variantId: v.variantId, quantity: selectedQuantity, price: v.currentPrice, name: `${v.productName} - ${v.variantName}` }]);
    }
    
    setSelectedVariantId("");
    setSelectedQuantity(1);
  };

  const removeCartLine = (id: string) => {
    setCartLines(cartLines.filter(x => x.variantId !== id));
  };

  const handleConfirmSale = async () => {
    if (cartLines.length === 0) return;
    try {
      const payload = { lines: cartLines.map(x => ({ variantId: x.variantId, quantity: x.quantity })) };
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error((await res.json()).error);
      
      setIsNewSaleOpen(false);
      setCartLines([]);
      fetchData();
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  };

  const handleCancelSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelSaleId) return;
    try {
      const res = await fetch(`/api/sales/${cancelSaleId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancellationReason: cancelReason })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setCancelSaleId(null);
      setCancelReason("");
      fetchData();
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  };

  const handleDownloadSales = () => {
    window.location.href = "/api/exports/sales";
  };

  const totalCart = cartLines.reduce((acc, current) => acc + (current.price * current.quantity), 0);

  if (loading) return <div className="flex justify-center p-10"><div className="w-12 h-12 animate-spin border-4 border-blue-500/20 border-t-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div></div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white tracking-tight">Registro de Ventas</h1>
        <div className="flex items-center gap-3">
          <button onClick={handleDownloadSales} className="px-5 py-2.5 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-white font-bold rounded-xl text-sm transition-all shadow-inner">
            📥 Exportar Ventas
          </button>
          <button onClick={() => setIsNewSaleOpen(true)} className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all flex items-center gap-2">
            <span>🛒</span> Nueva Venta
          </button>
        </div>
      </div>

      {!isNewSaleOpen ? (
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-950 text-gray-500 uppercase tracking-widest text-[10px] font-black border-b border-gray-800/80">
                <tr>
                  <th className="px-6 py-5">Identificador & Fecha</th>
                  <th className="px-6 py-5">Usuario</th>
                  <th className="px-6 py-5">Desglose de Líneas</th>
                  <th className="px-6 py-5 text-right">Total Contable</th>
                  <th className="px-6 py-5 text-center">Estado</th>
                  <th className="px-6 py-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {sales.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">Aún no hay ventas registradas</td></tr>
                ) : sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono text-[10px] text-gray-600 uppercase font-black">{sale.id.slice(0, 8)}</p>
                      <p className="font-bold text-gray-300 mt-1">{new Date(sale.date).toLocaleString("es-ES", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">{sale.user.username}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {(sale.lines || []).map((line, idx) => (
                           <div key={idx} className="flex gap-2 items-center text-xs">
                             <span className="font-mono text-gray-500 font-bold">{line.quantity}x</span>
                             <span className="text-gray-300 truncate max-w-[200px]">{line.variant?.product?.name ?? ''} - {line.variant?.name ?? ''}</span>
                           </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-black text-xl text-green-400">
                      ${(sale.lines || []).reduce((acc, l) => acc + (Number(l.unitPrice) * l.quantity), 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded shadow-inner ${sale.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {sale.status === 'ACTIVE' ? 'Completada' : 'Anulada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {sale.status === 'ACTIVE' && (
                        <button onClick={() => setCancelSaleId(sale.id)} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold tracking-wide text-xs rounded-lg transition-all border border-red-500/20 hover:border-red-500/40">
                          Revertir Venta
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl relative">
           <h2 className="text-2xl font-black text-white tracking-tight flex justify-between items-center mb-8 border-b border-gray-800 pb-5">
             <span className="flex items-center gap-3">Punto de Venta / Crear Ticket</span>
             <button onClick={() => setIsNewSaleOpen(false)} className="text-gray-500 hover:text-gray-300 font-bold text-sm">Cerrar y descartar</button>
           </h2>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
             {/* LEFT: ADD TOOL */}
             <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-950/50 p-6 rounded-xl border border-gray-800/80 shadow-inner">
                  <h3 className="font-bold text-gray-300 mb-4 tracking-wide uppercase text-xs">Agregar Variante al ticket</h3>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Producto disponible</label>
                      <select value={selectedVariantId} onChange={e => setSelectedVariantId(e.target.value)} className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white font-medium focus:outline-none focus:border-blue-500">
                        <option value="">Selecciona (Stock &gt; 0)...</option>
                        {variants.map(v => (
                          <option key={v.variantId} value={v.variantId}>{v.productName} - {v.variantName} (${Number(v.currentPrice).toFixed(2)})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Uds.</label>
                      <input type="number" min="1" value={selectedQuantity} onChange={e => setSelectedQuantity(Number(e.target.value))} className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500" />
                    </div>
                    <button onClick={handleAddToCart} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_10px_rgba(37,99,235,0.2)]">
                      Añadir
                    </button>
                  </div>
                </div>

                <div className="bg-gray-950/30 rounded-xl border border-gray-800/50 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-black/40 text-gray-500 uppercase tracking-widest text-[9px] font-black">
                      <tr>
                        <th className="px-5 py-3">Concepto</th>
                        <th className="px-5 py-3 text-center">Uds.</th>
                        <th className="px-5 py-3 text-right">P.U.</th>
                        <th className="px-5 py-3 text-right">Subtotal</th>
                        <th className="px-5 py-3 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/30">
                      {cartLines.length === 0 && <tr><td colSpan={5} className="px-5 py-6 text-center text-gray-600 font-medium italic">No hay ítems en la venta actual</td></tr>}
                      {cartLines.map((line) => (
                        <tr key={line.variantId} className="hover:bg-gray-900/50">
                          <td className="px-5 py-4 font-bold text-gray-300">{line.name}</td>
                          <td className="px-5 py-4 text-center font-mono font-bold">{line.quantity}</td>
                          <td className="px-5 py-4 text-right font-mono text-gray-400">${Number(line.price || 0).toFixed(2)}</td>
                          <td className="px-5 py-4 text-right font-mono font-bold text-green-400">${(Number(line.price || 0) * line.quantity).toFixed(2)}</td>
                          <td className="px-5 py-4 text-center">
                            <button onClick={() => removeCartLine(line.variantId)} className="text-red-500 hover:text-red-400 font-bold p-1">✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>

             {/* RIGHT: TICKET TOTAL & CONFIRM */}
             <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 flex flex-col shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[50px] rounded-full"></div>
                <h3 className="font-black text-gray-400 mb-6 uppercase tracking-widest text-xs border-b border-gray-800 pb-3">Resumen de Venta</h3>
                
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-center text-sm text-gray-400 font-medium">
                    <span>Líneas de ticket</span>
                    <span>{cartLines.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-400 font-medium">
                    <span>Unidades totales</span>
                    <span>{cartLines.reduce((acc, l) => acc + l.quantity, 0)}</span>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-6 mt-6">
                  <div className="flex justify-between items-baseline mb-6">
                     <span className="text-lg font-bold text-gray-300">Total a Cobrar</span>
                     <span className="text-4xl font-black text-green-400 font-mono tracking-tighter shadow-sm blur-none">${totalCart.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={handleConfirmSale}
                    disabled={cartLines.length === 0}
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black uppercase tracking-widest text-sm rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Procesar Cobro
                  </button>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* Modal Declinación */}
      {cancelSaleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-red-500/30 rounded-2xl w-full max-w-md p-8 shadow-2xl relative">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/30 text-red-500 text-2xl font-bold">!</div>
            <h3 className="text-2xl font-black text-white mb-2">Revertir Operación</h3>
            <p className="text-sm font-medium text-gray-400 mb-6">Esta acción es <span className="text-red-400 font-bold">destructiva</span> y devolverá todo el inventario procesado en el ticket de forma matemática.</p>
            <form onSubmit={handleCancelSale} className="space-y-5">
              <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-red-400/80 mb-2">Motivo de Anulación Oficial</label>
                <textarea 
                  value={cancelReason} 
                  onChange={e => setCancelReason(e.target.value)} 
                  required 
                  className="w-full px-4 py-3 bg-gray-950 border border-red-500/20 rounded-xl text-white focus:outline-none focus:border-red-500 shadow-inner resize-none h-24" 
                  placeholder="Se debe detallar obligatoriamente por auditoría..." 
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800/80">
                <button type="button" onClick={() => setCancelSaleId(null)} className="px-5 py-2.5 text-sm font-bold text-gray-400 hover:text-white transition-colors">Cancelar Mantenimiento</button>
                <button type="submit" className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all">Ejecutar Reversión</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
