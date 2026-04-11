"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error(error);
      setIsLoggingOut(false);
    }
  };

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Productos", href: "/products", icon: "📦" },
    { name: "Stock", href: "/stock", icon: "🏢" },
    { name: "Ventas", href: "/sales", icon: "💰" },
    { name: "Usuarios", href: "/users", icon: "👥" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex text-gray-100 font-sans selection:bg-blue-500/30">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-gray-900 border-r border-gray-800/80 flex flex-col fixed h-full z-20 shadow-2xl">
        <div className="h-20 flex items-center px-8 border-b border-gray-800/80">
          <div className="flex items-center gap-3">
            <div className="w-3 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
            <h1 className="text-2xl font-black tracking-tight text-white">Abyss<span className="text-blue-500">Tracker</span></h1>
          </div>
        </div>
        
        <nav className="flex-1 py-8 px-5 space-y-2.5 overflow-y-auto">
          <p className="px-3 text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Módulos</p>
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold tracking-wide text-sm ${
                  isActive
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.07)]"
                    : "text-gray-400 hover:bg-gray-800/80 hover:text-gray-200 border border-transparent"
                }`}
              >
                <span className={`text-xl ${isActive ? "opacity-100" : "opacity-70 grayscale"}`}>{link.icon}</span>
                {link.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-6 border-t border-gray-800/80 bg-gray-900/50">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-bold tracking-wide text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 transition-all shadow-sm disabled:opacity-50 text-sm"
          >
            {isLoggingOut ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></span> 
                Cerrando sesión...
              </span>
            ) : (
              <>
                <span>🚪</span> Cerrar sesión
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Extensible Content */}
      <main className="flex-1 ml-72 flex flex-col min-h-screen bg-[#060A14] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.07),rgba(255,255,255,0))]">
        <header className="h-20 backdrop-blur-md border-b border-gray-800/50 flex items-center justify-between px-10 sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <h2 className="text-lg font-medium text-gray-300 tracking-wide capitalize">
                {pathname.replace('/', '') || 'Gestor'}
             </h2>
          </div>
          
          <div className="flex items-center gap-4 bg-gray-900/50 px-4 py-2 rounded-full border border-gray-800/80 shadow-inner">
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Conectado como</span>
              <span className="text-sm font-bold text-gray-300">Administrador</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black shadow-[0_0_15px_rgba(59,130,246,0.4)]">
              A
            </div>
          </div>
        </header>

        <div className="flex-1 p-10 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
