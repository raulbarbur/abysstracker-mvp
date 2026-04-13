"use client";

import React, { useState } from "react";
import { ProductBrowser } from "./ProductBrowser";
import { CartPanel } from "./CartPanel";
import { ConfirmModal } from "./ConfirmModal";
import { PdfViewerModal } from "../PdfViewerModal";

export interface CartItem {
  variantId: string;
  variantName: string;
  productName: string;
  unitPrice: number;
  currentStock: number;
  quantity: number;
}

export default function NewSalePage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{url: string, title: string} | null>(null);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.variantId === item.variantId);
      if (existing) {
        if (existing.quantity >= item.currentStock) return prev; 
        return prev.map(i => 
          i.variantId === item.variantId 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (variantId: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(i => {
        if (i.variantId === variantId) {
          const newQty = i.quantity + delta;
          if (newQty <= 0) return null; 
          if (newQty > i.currentStock) return i;
          return { ...i, quantity: newQty };
        }
        return i;
      }).filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => setCartItems([]);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);

  return (
    <div className="h-full flex flex-col lg:flex-row relative lg:gap-6">
      {/* Left Area: Product Browser */}
      <div className="flex-1 min-w-0 h-[calc(100vh-10rem)] lg:h-[calc(100vh-6rem)]">
        <ProductBrowser onAddToCart={addToCart} cartItems={cartItems} />
      </div>

      {/* Right Area / Bottom Sheet: Cart */}
      <div className="lg:w-[380px] xl:w-[420px] 2xl:w-[30%] flex-shrink-0 lg:h-[calc(100vh-6rem)]">
        <CartPanel 
          cartItems={cartItems}
          updateQuantity={updateQuantity}
          subtotal={subtotal}
          onConfirmClick={() => setIsConfirmModalOpen(true)}
        />
      </div>

      <ConfirmModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        cartItems={cartItems}
        subtotal={subtotal}
        onSuccess={(saleId, invoiceNumber) => {
          clearCart();
          setPdfPreview({ url: `/api/sales/${saleId}/ticket`, title: `Ticket de Venta - ${invoiceNumber}` });
        }}
      />

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
