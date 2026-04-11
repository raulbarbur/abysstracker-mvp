"use client";

import { useState, useEffect } from "react";

interface Variant {
  id: string;
  name: string;
  currentPrice: number;
  currentStock: number;
  minimumStock: number;
  active: boolean;
}

interface Product {
  id: string;
  name: string;
  active: boolean;
  variants: Variant[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");

  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [newVariant, setNewVariant] = useState({ name: "", currentPrice: 0, minimumStock: 0 });

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingProductName, setEditingProductName] = useState("");

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Error al obtener productos");
      const data = await res.json();
      setProducts(data.products);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProductName })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setIsProductModalOpen(false);
      setNewProductName("");
      fetchProducts();
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  };

  const handleToggleProductStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/products/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentStatus })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchProducts();
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  };

  const startEditingProduct = (p: Product) => {
    setEditingProductId(p.id);
    setEditingProductName(p.name);
  };

  const saveEditedProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingProductName })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setEditingProductId(null);
      fetchProducts();
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  };

  const openVariantModal = (productId: string) => {
    setActiveProductId(productId);
    setNewVariant({ name: "", currentPrice: 0, minimumStock: 0 });
    setIsVariantModalOpen(true);
  };

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProductId) return;
    try {
      const res = await fetch(`/api/products/${activeProductId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newVariant.name,
          currentPrice: Number(newVariant.currentPrice),
          minimumStock: Number(newVariant.minimumStock)
        })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setIsVariantModalOpen(false);
      fetchProducts();
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="w-10 h-10 animate-spin border-4 border-blue-500 rounded-full border-t-transparent shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white tracking-tight">Catálogo de Productos</h1>
        <button onClick={() => setIsProductModalOpen(true)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2">
          <span>+</span> Nuevo producto
        </button>
      </div>

      {error ? (
        <div className="p-4 bg-red-900/30 text-red-400 border border-red-500/30 rounded-xl font-medium">{error}</div>
      ) : (
        <div className="grid gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-gray-900/40 border border-gray-800/80 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
              <div className="p-5 border-b border-gray-800/80 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-4">
                  {editingProductId === product.id ? (
                    <div className="flex items-center gap-2">
                      <input type="text" value={editingProductName} onChange={e => setEditingProductName(e.target.value)} autoFocus className="px-3 py-1.5 bg-gray-950 border border-gray-700 rounded-lg text-white font-bold tracking-wide focus:outline-none focus:border-blue-500" />
                      <button onClick={() => saveEditedProduct(product.id)} className="px-3 py-1.5 bg-green-600/20 text-green-400 font-bold border border-green-500/30 rounded-lg hover:bg-green-600/30 transition-colors">Guardar</button>
                      <button onClick={() => setEditingProductId(null)} className="px-3 py-1.5 bg-gray-600/20 text-gray-400 font-bold border border-gray-500/30 rounded-lg hover:bg-gray-600/30 transition-colors">Cancelar</button>
                    </div>
                  ) : (
                    <h2 className="text-xl font-bold text-gray-100 flex items-center gap-3">
                      {product.name}
                      {!product.active && <span className="text-[10px] px-2 py-0.5 rounded shadow-inner uppercase tracking-wider font-black bg-red-500/20 text-red-500 border border-red-500/20">Inactivo</span>}
                      <button onClick={() => startEditingProduct(product)} className="text-sm font-medium text-gray-500 hover:text-blue-400 transition-colors bg-gray-800/50 px-2 py-0.5 rounded-md border border-gray-700">✏️ Editar</button>
                    </h2>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleToggleProductStatus(product.id, product.active)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${product.active ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20' : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'}`}
                  >
                    {product.active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => openVariantModal(product.id)} className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-400 font-bold text-xs rounded-lg transition-all shadow-inner">
                    + Nueva variante
                  </button>
                </div>
              </div>

              <div className="p-0 overflow-x-auto">
                {product.variants.length === 0 ? (
                  <p className="text-gray-500 text-sm font-medium italic text-center py-6">No hay variantes registradas en este producto</p>
                ) : (
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-950/50">
                      <tr className="text-gray-500 border-b border-gray-800/80 uppercase tracking-wider text-[10px] font-black">
                        <th className="px-5 py-3 font-medium">Nombre</th>
                        <th className="px-5 py-3 font-medium text-right">Precio Actual</th>
                        <th className="px-5 py-3 font-medium text-right">Stock</th>
                        <th className="px-5 py-3 font-medium text-right">Mínimo</th>
                        <th className="px-5 py-3 font-medium text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {product.variants.map((variant) => (
                        <tr key={variant.id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="px-5 py-3 font-bold text-gray-300">{variant.name}</td>
                          <td className="px-5 py-3 text-right font-mono text-green-400 font-bold text-lg">${Number(variant.currentPrice).toFixed(2)}</td>
                          <td className="px-5 py-3 text-right font-mono font-bold text-gray-200">{variant.currentStock}</td>
                          <td className="px-5 py-3 text-right font-mono font-bold text-gray-500">{variant.minimumStock}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow-sm ${variant.active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                              {variant.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-8 shadow-2xl relative">
            <h3 className="text-2xl font-black text-white mb-6">Crear Nuevo Producto</h3>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Nombre del Producto</label>
                <input type="text" value={newProductName} onChange={e => setNewProductName(e.target.value)} required className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-blue-500 shadow-inner" placeholder="Ej: Playera Básica" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-800/50 mt-6">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-[0_0_10px_rgba(37,99,235,0.3)] transition-all">Crear producto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isVariantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-8 shadow-2xl relative">
            <h3 className="text-2xl font-black text-white mb-6">Añadir Variante</h3>
            <form onSubmit={handleCreateVariant} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Descripción o Nombre</label>
                <input type="text" value={newVariant.name} onChange={e => setNewVariant({...newVariant, name: e.target.value})} required className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-blue-500 shadow-inner" placeholder="Ej: Talla M - Rojo" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Precio de Venta ($)</label>
                  <input type="number" step="0.01" min="0.01" value={newVariant.currentPrice || ''} onChange={e => setNewVariant({...newVariant, currentPrice: Number(e.target.value)})} required className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-blue-500 shadow-inner font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Stock Mínimo</label>
                  <input type="number" min="0" value={newVariant.minimumStock || ''} onChange={e => setNewVariant({...newVariant, minimumStock: Number(e.target.value)})} required className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-blue-500 shadow-inner font-mono" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-800/50 mt-6">
                <button type="button" onClick={() => setIsVariantModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-[0_0_10px_rgba(37,99,235,0.3)] transition-all">Guardar variante</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
