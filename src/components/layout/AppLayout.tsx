"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { MobileMenu } from "./MobileMenu";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const redirectingRef = useRef(false);

  // Intercept all fetch calls — if any API returns 401 the session expired;
  // redirect immediately to login with a flag so the page can show a notice.
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401 && !redirectingRef.current) {
        redirectingRef.current = true;
        router.push("/login?session=expired");
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [router]);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setIsCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  const marginLeft = mounted && isCollapsed ? '60px' : '280px';

  return (
    <div className="min-h-screen bg-base text-text-primary font-sans">
      {/* Desktop Sidebar */}
      <Sidebar isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} mounted={mounted} />
      
      {/* Mobile Topbar & Drawer Menu */}
      <MobileMenu />

      {/* Main Content Area */}
      <div 
        className="transition-all duration-200 ease-in-out min-h-screen"
        style={{ paddingLeft: '0px' }} // Fallback
      >
        <div className="md:hidden h-0 w-0" />
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 768px) {
            .dynamic-ml-wrapper { 
              margin-left: ${marginLeft} !important; 
              width: calc(100% - ${marginLeft}) !important;
            }
          }
        `}} />
        {/* Usamos pt-20 en móvil por la barra top fija de h-16 (4rem) + py */}
        <main className="dynamic-ml-wrapper transition-all duration-200 ease-in-out w-full h-full px-4 md:px-6 pt-[calc(4rem+1.5rem)] md:pt-8 pb-6 md:pb-8 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
