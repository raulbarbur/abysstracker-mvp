"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { 
  LayoutDashboard, ShoppingCart, ClipboardList, Package, 
  ArrowLeftRight, Download, Users, LogOut, PanelLeftClose, PanelRightClose,
  UserCircle2, Sun, Moon
} from "lucide-react";
import { usePreferences } from "../preferences-provider";
import { BrandName } from "../ui/BrandName";

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  mounted: boolean;
}

export function Sidebar({ isCollapsed, toggleCollapse, mounted }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, toggleFontSize } = usePreferences();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    <aside 
      className={`hidden md:flex flex-col fixed top-0 left-0 h-full bg-surface border-r border-border transition-all duration-200 ease-in-out z-40 ${isCollapsed ? 'w-[60px]' : 'w-[280px]'}`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-border flex-shrink-0 gap-2">
        {/* Brand — expanded */}
        {!isCollapsed && <BrandName size="text-lg" />}

        {/* Brand — collapsed */}
        {isCollapsed && (
          <span className="font-black text-xl text-primary mx-auto select-none">A</span>
        )}

        {!isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="text-text-disabled hover:text-primary transition-colors p-1 flex-shrink-0"
            title="Colapsar"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-2 custom-scrollbar">
        {isCollapsed && (
          <button onClick={toggleCollapse} className="text-text-secondary hover:text-primary transition-colors p-2 mx-auto mb-4" title="Expandir">
            <PanelRightClose size={18} />
          </button>
        )}

        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          
          if (item.highlighted) {
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`group flex items-center mt-2 mb-2 rounded-md transition-colors ${
                  isCollapsed ? 'justify-center p-2' : 'px-3 py-2.5'
                } bg-primary hover:bg-primary-hover text-white shadow-sm hover:shadow relative`}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {!isCollapsed && <span className="ml-3 font-medium text-sm break-words line-clamp-2">{item.label}</span>}
              </Link>
            );
          }

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`group flex items-center rounded-md transition-colors relative ${
                isCollapsed ? 'justify-center p-2' : 'px-3 py-2.5'
              } ${
                isActive 
                  ? 'bg-elevated text-primary before:content-[""] before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-primary' 
                  : 'text-text-secondary hover:bg-hover hover:text-primary'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon size={20} className={`flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
              {!isCollapsed && <span className="ml-3 font-medium text-sm break-words line-clamp-2">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-2">
        <div className={`flex flex-col gap-3 ${isCollapsed ? 'px-1 py-3' : 'px-2 py-3'} rounded-md bg-elevated`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold flex-shrink-0">
              U
            </div>
            {!isCollapsed && (
              <div className="ml-3 flex flex-col min-w-0">
                <span className="text-sm font-semibold leading-tight break-words line-clamp-2">Usuario</span>
                <span className="text-xs text-text-secondary break-words line-clamp-1">Admin</span>
              </div>
            )}
          </div>
          
          <div className={`flex items-center border-t border-border pt-3 ${isCollapsed ? 'flex-col gap-2' : 'justify-around'}`}>
            <button onClick={toggleTheme} className="w-[28px] h-[28px] flex items-center justify-center text-text-secondary hover:text-primary rounded-md hover:bg-hover transition-colors" title="Cambiar Tema">
              {mounted && theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button onClick={toggleFontSize} className="w-[28px] h-[28px] flex items-center justify-center text-text-secondary hover:text-primary rounded-md hover:bg-hover transition-colors" title="Tamaño de Fuente">
              <span className="font-bold text-[15px] leading-none block">Aa</span>
            </button>
            <button onClick={handleLogout} disabled={isLoggingOut} className="w-[28px] h-[28px] flex items-center justify-center text-destructive hover:text-destructive-hover rounded-md hover:bg-destructive/10 transition-colors disabled:opacity-50" title="Cerrar Sesión">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
