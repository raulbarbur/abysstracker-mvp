"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { ProductRow } from "./ProductRow";
import { ProductModal } from "./ProductModal";
import { VariantModal } from "./VariantModal";
import { StockMovementModal } from "./StockMovementModal";
import { ToggleStatusModal } from "./ToggleStatusModal";
import { PriceHistoryModal } from "./PriceHistoryModal";

export interface VariantType {
  id: string;
  name: string;
  currentPrice: string | number;
  costPrice: string | number;
  currentStock: number;
  minimumStock: number;
  active: boolean;
  productId: string;
}

export interface ProductType {
  id: string;
  name: string;
  active: boolean;
  variants: VariantType[];
}

type ModalState =
  | { type: "none" }
  | { type: "newProduct" }
  | { type: "editProduct"; product: ProductType }
  | { type: "newVariant"; product: ProductType }
  | { type: "editVariant"; variant: VariantType; product: ProductType }
  | { type: "stock"; variant: VariantType }
  | { type: "toggleProduct"; product: ProductType }
  | { type: "toggleVariant"; variant: VariantType }
  | { type: "priceHistory"; variant: VariantType };

/* ─── Skeleton de carga ──────────────────────────────────────────────── */
function ProductSkeleton() {
  return (
    <div className="divide-y divide-border">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center gap-3 px-4 py-4 animate-pulse">
          <div className="w-9 h-9 rounded-xl bg-border flex-shrink-0" />
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="h-5 bg-border rounded-lg" style={{ width: `${40 + (i * 13) % 30}%` }} />
            <div className="flex gap-2">
              <div className="h-3.5 bg-border rounded-lg w-14" />
              <div className="h-3.5 bg-border rounded-lg w-20" />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="h-9 w-20 bg-border rounded-xl hidden sm:block" />
            <div className="h-9 w-24 bg-border rounded-xl hidden sm:block" />
            <div className="h-9 w-9 bg-border rounded-xl sm:hidden" />
            <div className="h-9 w-9 bg-border rounded-xl sm:hidden" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Página principal ───────────────────────────────────────────────── */
export default function ProductsPage() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [query, setQuery] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.trim().toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.variants.some(v => v.name.toLowerCase().includes(q))
    );
  }, [products, query]);

  const updateProductInList = (updatedProduct: ProductType) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p));
  };

  const addProductToList = (newProduct: ProductType) => {
    setProducts(prev => [{ ...newProduct, variants: newProduct.variants || [] }, ...prev]);
  };

  const updateVariantInList = (productId: string, updatedVariant: VariantType) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      const hasVariant = p.variants.some(v => v.id === updatedVariant.id);
      const variants = hasVariant
        ? p.variants.map(v => v.id === updatedVariant.id ? updatedVariant : v)
        : [...p.variants, updatedVariant];
      return { ...p, variants };
    }));
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight mb-1">Inventario de Productos</h1>
          <p className="text-text-secondary text-sm font-semibold">Gestioná catálogos, precios y movimientos de stock.</p>
        </div>
        <button
          id="btn-nuevo-producto"
          onClick={() => setModal({ type: "newProduct" })}
          className="flex items-center justify-center gap-3 px-6 py-3.5 bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-black rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] w-full sm:w-auto"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      {/* ── Barra de búsqueda ─────────────────────────────── */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none" />
        <input
          type="search"
          id="search-productos"
          placeholder="Buscar producto o variante..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-2xl text-sm font-medium text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* ── Lista de productos ────────────────────────────── */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm">
        {loading ? (
          <ProductSkeleton />
        ) : filteredProducts.length === 0 && query ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-disabled gap-2">
            <Search size={36} className="opacity-30" />
            <p className="font-bold text-base">Sin resultados para <span className="text-text-secondary">&ldquo;{query}&rdquo;</span></p>
            <button
              onClick={() => setQuery("")}
              className="mt-1 text-primary font-bold text-sm hover:underline"
            >
              Limpiar búsqueda
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-disabled">
            <p className="font-bold text-lg">Sin productos registrados.</p>
            <button onClick={() => setModal({ type: "newProduct" })} className="mt-4 text-primary font-bold underline">
              Crear el primero
            </button>
          </div>
        ) : (
          filteredProducts.map(product => (
            <ProductRow
              key={product.id}
              product={product}
              isExpanded={expandedProductId === product.id}
              onToggleExpand={() => setExpandedProductId(prev => prev === product.id ? null : product.id)}
              onEditProduct={() => setModal({ type: "editProduct", product })}
              onToggleStatus={() => setModal({ type: "toggleProduct", product })}
              onNewVariant={() => setModal({ type: "newVariant", product })}
              onEditVariant={(v) => setModal({ type: "editVariant", variant: v, product })}
              onToggleVariant={(v) => setModal({ type: "toggleVariant", variant: v })}
              onStockMovement={(v) => setModal({ type: "stock", variant: v })}
              onPriceHistory={(v) => setModal({ type: "priceHistory", variant: v })}
            />
          ))
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────── */}
      {(modal.type === "newProduct" || modal.type === "editProduct") && (
        <ProductModal
          product={modal.type === "editProduct" ? modal.product : undefined}
          isOpen
          onClose={() => setModal({ type: "none" })}
          onSuccess={(p) => {
            if (modal.type === "newProduct") addProductToList(p as ProductType);
            else updateProductInList(p as ProductType);
            setModal({ type: "none" });
          }}
        />
      )}

      {(modal.type === "newVariant" || modal.type === "editVariant") && (
        <VariantModal
          product={modal.type === "newVariant" ? modal.product : modal.product}
          variant={modal.type === "editVariant" ? modal.variant : undefined}
          isOpen
          onClose={() => setModal({ type: "none" })}
          onSuccess={(v) => {
            const productId = modal.type === "newVariant" ? modal.product.id : modal.product.id;
            updateVariantInList(productId, v);
            setModal({ type: "none" });
          }}
        />
      )}

      {modal.type === "stock" && (
        <StockMovementModal
          variant={modal.variant}
          isOpen
          onClose={() => setModal({ type: "none" })}
          onSuccess={(variantId, newStock) => {
            setProducts(prev => prev.map(p => ({
              ...p,
              variants: p.variants.map(v => v.id === variantId ? { ...v, currentStock: newStock } : v)
            })));
            setModal({ type: "none" });
          }}
        />
      )}

      {modal.type === "toggleProduct" && (
        <ToggleStatusModal
          name={modal.product.name}
          isActive={modal.product.active}
          entityType="product"
          isOpen
          onClose={() => setModal({ type: "none" })}
          onConfirm={async () => {
            const res = await fetch(`/api/products/${modal.product.id}/status`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ active: !(modal.product.active) })
            });
            if (res.ok) {
              const data = await res.json();
              updateProductInList({ ...data, variants: modal.product.variants });
              setModal({ type: "none" });
              return true;
            }
            return false;
          }}
        />
      )}

      {modal.type === "toggleVariant" && (
        <ToggleStatusModal
          name={modal.variant.name}
          isActive={modal.variant.active}
          entityType="variant"
          isOpen
          onClose={() => setModal({ type: "none" })}
          onConfirm={async () => {
            const res = await fetch(`/api/variants/${modal.variant.id}/status`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ active: !(modal.variant.active) })
            });
            if (res.ok) {
              const data = await res.json();
              updateVariantInList(data.productId, data);
              setModal({ type: "none" });
              return true;
            }
            return false;
          }}
        />
      )}

      {modal.type === "priceHistory" && (
        <PriceHistoryModal
          variant={modal.variant}
          isOpen
          onClose={() => setModal({ type: "none" })}
        />
      )}
    </div>
  );
}
