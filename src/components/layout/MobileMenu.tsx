"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LayoutDashboard, ShoppingCart, ClipboardList, Package, ArrowLeftRight, Download, Users, LogOut, UserCircle2, Sun, Moon } from "lucide-react";
import { Drawer } from "../ui/Drawer";
import { usePreferences } from "../preferences-provider";
import { BrandName } from "../ui/BrandName";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, toggleFontSize } = usePreferences();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (e) {
      console.error(e);
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
    { href: "/sales/new", icon: ShoppingCart, label: "Nueva Venta", highlighted: true },
    { href: "/sales", icon: ClipboardList, label: "Historial de Ventas" },
    { href: "/inventory/products", icon: Package, label: "Productos & Variantes" },
    { href: "/inventory/movements", icon: ArrowLeftRight, label: "Movimientos de Stock" },
    { href: "/exports", icon: Download, label: "Exportaciones" },
    { href: "/users", icon: Users, label: "Usuarios" },
    { href: "/profile", icon: UserCircle2, label: "Mi Perfil" },
  ];

  return (
    <>
      {/* Mobile Topbar */}
      <header 
        className="md:hidden fixed top-0 left-0 w-full h-16 bg-surface border-b border-border z-40 flex items-center justify-between px-4"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <BrandName size="text-lg" />
        <button 
          onClick={() => setIsOpen(true)}
          className="p-1.5 text-text-secondary hover:text-primary transition-colors rounded-md active:bg-hover"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile Drawer */}
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={<BrandName size="text-xl" />}
        footer={
          <div className="flex items-center justify-between w-full pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                U
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-text-primary leading-tight">Usuario</span>
                <span className="text-xs text-text-secondary">Admin</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleTheme} 
                className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-primary rounded-lg transition-colors bg-elevated border border-border"
                title="Cambiar Tema"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button 
                onClick={toggleFontSize} 
                className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-primary rounded-lg transition-colors bg-elevated border border-border"
                title="Tamaño de Fuente"
              >
                <span className="font-bold text-sm leading-none">Aa</span>
              </button>
              <button 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent disabled:opacity-50"
                title="Cerrar Sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-2 pt-2 pb-6">
          {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            if (item.highlighted) {
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="group flex items-center gap-4 px-4 py-3.5 my-1 rounded-xl bg-primary text-white hover:bg-primary-hover active:bg-primary-active font-medium shadow-sm transition-all"
                >
                  <item.icon size={20} className="shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            }

            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-colors ${
                  isActive 
                    ? 'bg-elevated text-primary border border-border shadow-sm' 
                    : 'text-text-secondary hover:bg-hover hover:text-text-primary'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-primary' : ''} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </Drawer>
    </>
  );
}
