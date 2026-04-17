"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, Download, ClipboardList } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 w-full bg-surface border-t border-border z-50 px-1 flex justify-around items-center h-16"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Link href="/dashboard" className={`flex flex-col items-center justify-center flex-1 h-full pt-1 pb-1 ${pathname === '/dashboard' ? 'text-primary' : 'text-text-secondary'}`}>
        <LayoutDashboard size={20} />
        <span className="text-xs mt-1 font-medium">Inicio</span>
      </Link>

      <Link href="/sales" className={`flex flex-col items-center justify-center flex-1 h-full pt-1 pb-1 ${pathname === '/sales' ? 'text-primary' : 'text-text-secondary'}`}>
        <ClipboardList size={20} />
        <span className="text-xs mt-1 font-medium">Ventas</span>
      </Link>

      {/* Botón Flotante Central (FAB) */}
      <div className="flex-1 flex justify-center h-full relative">
        <Link 
          href="/sales/new" 
          className="absolute -top-6 flex items-center justify-center w-13 h-13 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover transition-transform active:scale-95"
        >
          <ShoppingCart size={24} />
        </Link>
      </div>

      <Link href="/stock" className={`flex flex-col items-center justify-center flex-1 h-full pt-1 pb-1 ${pathname === '/stock' ? 'text-primary' : 'text-text-secondary'}`}>
        <Package size={20} />
        <span className="text-xs mt-1 font-medium">Inventario</span>
      </Link>

      <Link href="/exports" className={`flex flex-col items-center justify-center flex-1 h-full pt-1 pb-1 ${pathname === '/exports' ? 'text-primary' : 'text-text-secondary'}`}>
        <Download size={20} />
        <span className="text-xs mt-1 font-medium">Exports</span>
      </Link>
    </nav>
  );
}
