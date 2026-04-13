"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Loader2, PackageOpen, Plus, Check } from "lucide-react";
import { CartItem } from "./page";

interface Product {
  id: string;
  name: string;
  variants: Variant[];
}

interface Variant {
  id: string;
  name: string;
  currentPrice: string | number;
  currentStock: number;
  active: boolean;
}

interface ProductBrowserProps {
  onAddToCart: (item: Omit<CartItem, 'quantity'>) => void;
  cartItems: CartItem[];
}

export function ProductBrowser({ onAddToCart, cartItems }: ProductBrowserProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("Todos");
  const [recentlyAdded, setRecentlyAdded] = useState<Record<string, boolean>>({});

  const filters = ["Todos", "Con Stock", "Sin Stock"];

  useEffect(() => {
    fetch('/api/products?active=true')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const flatVariants = useMemo(() => {
    const list: Array<{ variant: Variant, product: Product }> = [];
    products.forEach(p => {
      p.variants.filter(v => v.active).forEach(v => {
        list.push({ variant: v, product: p });
      });
    });
    return list;
  }, [products]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return flatVariants.filter(item => 
      item.variant.name.toLowerCase().includes(query) || 
      item.product.name.toLowerCase().includes(query)
    );
  }, [searchQuery, flatVariants]);

  const renderAddButton = (variant: Variant, product: Product) => {
    const stock = variant.currentStock;
    const price = typeof variant.currentPrice === 'string' ? parseFloat(variant.currentPrice) : variant.currentPrice;
    const cartItem = cartItems.find(i => i.variantId === variant.id);
    const qtyInCart = cartItem?.quantity || 0;
    const remainingStock = stock - qtyInCart;

    const isOos = remainingStock <= 0;
    const isAdded = recentlyAdded[variant.id];

    return (
      <button
        onClick={() => {
          if (!isOos) {
            onAddToCart({
              variantId: variant.id,
              variantName: variant.name,
              productName: product.name,
              unitPrice: price,
              currentStock: stock,
            });
            setRecentlyAdded(prev => ({...prev, [variant.id]: true}));
            setTimeout(() => {
              setRecentlyAdded(prev => ({...prev, [variant.id]: false}));
            }, 600);
          }
        }}
        disabled={isOos}
        className={`relative flex flex-col md:flex-row items-start md:items-center justify-between w-full p-4 md:p-5 rounded-2xl border text-left transition-all overflow-hidden group min-h-[120px] md:min-h-[100px] ${
          isOos 
            ? 'bg-base border-transparent opacity-50 cursor-not-allowed' 
            : 'bg-surface border-border hover:border-primary/50 hover:bg-hover cursor-pointer active:scale-[0.98] shadow-sm'
        }`}
      >
        <div className="flex flex-col gap-1 pr-0 md:pr-14 mb-8 md:mb-0">
          <span className="font-bold text-sm md:text-lg leading-tight text-text-primary group-hover:text-primary transition-colors">{variant.name}</span>
          <span className="text-xs md:text-sm font-semibold text-text-secondary uppercase tracking-wider">{product.name}</span>
          
          <div className="flex flex-wrap gap-1.5 md:gap-3 mt-2">
            <span className="text-xs md:text-sm font-black text-text-primary px-2 py-1 rounded bg-elevated border border-border">
              ${price.toFixed(2)}
            </span>
            <span className={`text-xs md:text-sm font-bold px-2 py-1 rounded ${isOos ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
              Stock: {stock}
            </span>
          </div>
        </div>

        {/* Floating Add icon */}
        <div className={`absolute right-3 bottom-3 md:right-5 md:top-1/2 md:-translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${isOos ? 'bg-base text-text-disabled' : isAdded ? 'bg-success/20 text-success scale-110' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white group-active:scale-95 shadow-sm'}`}>
           {isAdded ? <Check size={20} className="md:w-[24px] md:h-[24px]" /> : <Plus size={20} className="md:w-[24px] md:h-[24px]" />}
        </div>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-primary gap-4">
        <Loader2 className="w-12 h-12 animate-spin" />
        <span className="font-bold text-md animate-pulse">Generando catálogo en vivo...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-surface lg:bg-base lg:rounded-2xl overflow-hidden lg:shadow-md lg:border border-border">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 relative bg-base">
        <div className="space-y-6">
          <div className="relative sticky top-0 z-10">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary" size={24} />
            <input 
              type="text" 
              placeholder="Busque un producto o variante..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-5 py-5 rounded-2xl border-2 border-border bg-surface text-lg md:text-xl font-bold focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all shadow-md"
            />
          </div>

          <div className="flex flex-wrap gap-2 pb-2 pt-1">
             {filters.map(f => (
               <button 
                 key={f}
                 onClick={() => setActiveFilter(f)}
                 className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                   activeFilter === f 
                     ? 'bg-primary text-white shadow-md'
                     : 'bg-surface border border-border text-text-secondary hover:bg-hover'
                 }`}
               >
                 {f}
               </button>
             ))}
          </div>

          <div className="pb-20 lg:pb-0">
            {searchQuery.trim() !== "" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {searchResults.length === 0 ? (
                  <div className="col-span-full py-20 flex flex-col justify-center items-center text-text-secondary">
                    <PackageOpen size={64} className="mb-6 opacity-30 text-destructive" />
                    <p className="font-bold text-lg text-center text-destructive">No se encontraron variantes activas.</p>
                  </div>
                ) : (
                  searchResults.map(item => (
                    <div key={item.variant.id}>{renderAddButton(item.variant, item.product)}</div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {products.length === 0 && (
                  <div className="py-20 flex flex-col justify-center items-center text-text-disabled">
                    <p className="font-bold text-lg text-center">Catálogo vacío.</p>
                  </div>
                )}
                {products.filter(p => {
                   if (activeFilter === "Todos") return true;
                   if (activeFilter === "Con Stock") return p.variants.some(v => v.currentStock > 0);
                   if (activeFilter === "Sin Stock") return p.variants.every(v => v.currentStock <= 0);
                   return true;
                }).map(product => {
                  const variants = product.variants.filter(v => v.active);
                  if (variants.length === 0) return null;
                  
                  const isExpanded = expandedProduct === product.id;

                  return (
                    <div key={product.id} className="bg-surface rounded-2xl overflow-hidden border border-border shadow-sm transition-all focus-within:ring-2 ring-primary/30">
                      <button
                        onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                        className={`w-full p-5 md:p-6 flex items-center justify-between font-black text-lg md:text-xl hover:bg-hover active:bg-elevated transition-colors outline-none ${isExpanded ? 'bg-elevated text-primary border-b border-border' : 'text-text-primary'}`}
                      >
                        <span>{product.name}</span>
                        <span className="text-sm font-bold px-4 py-1.5 bg-base border border-border rounded-xl text-text-secondary shadow-sm hidden md:block">
                          {variants.length} variantes
                        </span>
                        <span className="md:hidden text-md font-bold px-3 py-1 bg-base border border-border rounded-lg text-text-secondary shadow-sm">
                          {variants.length}
                        </span>
                      </button>
                      
                      {isExpanded && (
                        <div className="p-3 md:p-6 bg-base grid grid-cols-2 md:grid-cols-2 xl:grid-cols-2 gap-3 md:gap-4 animate-in slide-in-from-top-4 fade-in duration-300 shadow-inner">
                          {variants.map(variant => (
                            <div key={variant.id}>{renderAddButton(variant, product)}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
