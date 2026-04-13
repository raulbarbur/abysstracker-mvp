"use client";

import React, { useState } from "react";
import { ChevronUp, ChevronDown, CheckCircle, ShoppingCart } from "lucide-react";
import { CartItem } from "./page";

interface CartPanelProps {
  cartItems: CartItem[];
  updateQuantity: (id: string, d: number) => void;
  subtotal: number;
  onConfirmClick: () => void;
}

export function CartPanel({ cartItems, updateQuantity, subtotal, onConfirmClick }: CartPanelProps) {
  const [isExpandedMobile, setIsExpandedMobile] = useState(false);
  const totalItems = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isExpandedMobile && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in transition-opacity" 
          onClick={() => setIsExpandedMobile(false)}
        />
      )}

      {/* Panel */}
      <div className={`
        fixed lg:static left-0 bottom-0 w-full lg:w-full bg-surface border-t lg:border border-border 
        lg:rounded-2xl transition-all duration-300 z-50 lg:z-auto flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-xl
        ${isExpandedMobile ? 'h-[85vh] rounded-t-3xl' : 'h-[5rem] lg:h-full'}
      `}>
        {/* Mobile Header (toggles expansion) */}
        <div 
          className="lg:hidden relative flex items-center justify-between px-6 py-4 cursor-pointer active:bg-hover active:scale-[0.98] transition-all border-b border-border shadow-sm rounded-t-3xl bg-surface"
          onClick={() => setIsExpandedMobile(!isExpandedMobile)}
        >
          {isExpandedMobile && (
             <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-text-disabled/30 rounded-full" />
          )}
          <div className={`flex flex-col flex-1 ${isExpandedMobile ? 'mt-2' : ''}`}>
            <span className="font-bold text-lg text-text-primary">Carrito ({totalItems.toLocaleString('es-AR')})</span>
            <span className="text-sm font-semibold text-primary/80">${subtotal.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
          
          <div className="flex items-center gap-3">
             {!isExpandedMobile && cartItems.length > 0 && (
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   onConfirmClick();
                 }}
                 className="h-10 px-4 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-active text-white text-sm font-bold shadow-md shadow-primary/20 transition-all flex items-center gap-2"
               >
                 <CheckCircle size={18} />
                 <span className="hidden sm:inline">Cobrar</span>
               </button>
             )}
            <button className="p-2 rounded-full bg-base border border-border text-text-primary shadow-sm hover:text-primary transition-all">
              {isExpandedMobile ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex items-center px-6 py-5 border-b border-border bg-base/50 rounded-t-2xl">
          <ShoppingCart className="text-primary mr-3" />
          <h2 className="text-xl font-bold text-text-primary tracking-tight">Carrito Cotizador</h2>
        </div>

        {/* Content (Scrollable) */}
        <div className={`flex-1 overflow-y-auto px-4 lg:px-6 py-4 custom-scrollbar ${!isExpandedMobile ? 'hidden lg:block' : 'block'}`}>
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-text-disabled py-10">
              <ShoppingCart size={64} className="mb-4 opacity-50 text-text-secondary" />
              <p className="font-semibold text-center text-md text-text-secondary">El carrito está vacío.<br/>Selecciona productos para empezar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.variantId} className="flex flex-col bg-elevated px-5 py-4 rounded-xl border border-border">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col pr-4">
                      <span className="font-bold text-md break-words leading-tight">{item.productName}</span>
                      <span className="text-xs text-text-secondary break-words line-clamp-2 font-semibold uppercase">{item.variantName}</span>
                    </div>
                    <span className="font-black text-md text-primary bg-primary/10 px-2 py-1 rounded-md">
                      ${(item.unitPrice * item.quantity).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-text-secondary font-medium">${item.unitPrice.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} c/u</span>
                    
                    <div className="flex items-center bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
                      <button 
                        onClick={() => updateQuantity(item.variantId, -1)}
                        className="px-4 py-2 hover:bg-hover active:bg-base text-text-primary hover:text-destructive outline-none transition-colors"
                      >
                         − 
                      </button>
                      <span className="px-4 py-2 min-w-[3rem] text-center font-bold text-sm bg-base border-x border-border">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.variantId, 1)}
                        disabled={item.quantity >= item.currentStock}
                        className="px-4 py-2 hover:bg-hover active:bg-base text-text-primary hover:text-primary outline-none transition-colors disabled:opacity-30"
                      >
                         + 
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className={`p-6 border-t border-border bg-surface lg:rounded-b-2xl ${!isExpandedMobile && cartItems.length > 0 ? 'hidden lg:block' : ''}`}>
          <div className="flex justify-between items-center mb-6 bg-base p-4 rounded-xl border border-border shadow-inner">
            <span className="text-lg font-bold text-text-secondary uppercase tracking-wider">Total</span>
            <span className="text-3xl font-black text-text-primary tracking-tight">${subtotal.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
          
          <button
            onClick={() => {
               if (cartItems.length > 0) {
                 if (isExpandedMobile) setIsExpandedMobile(false);
                 onConfirmClick();
               }
            }}
            disabled={cartItems.length === 0}
            className="w-full min-h-[56px] rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-active text-white text-lg font-black shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-3 active:scale-[0.98]"
          >
             <CheckCircle size={24} />
             Confirmar Venta
          </button>
        </div>
      </div>
    </>
  );
}
