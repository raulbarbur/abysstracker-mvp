"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2, XCircle, Sun, Moon } from "lucide-react";
import { usePreferences } from "@/components/preferences-provider";
import { BrandName } from "@/components/ui/BrandName";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("session") === "expired";
  const { theme, toggleTheme, toggleFontSize } = usePreferences();

  /* Redirect if already authenticated */
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => { if (r.ok) router.replace("/dashboard"); })
      .catch(() => {});
  }, [router]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push("/dashboard");
        return;
      }

      // On error: clear password, keep username, show banner
      setPassword("");
      if (res.status === 401) {
        setError("Credenciales inválidas.");
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || "Ocurrió un error. Intenta nuevamente.");
      }
    } catch {
      setPassword("");
      setError("Error de conectividad. Verifique su conexión y vuelva a intentarlo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-base px-4 py-12">
      {/* Subtle radial glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(124,58,237,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Quick accessibility toggles */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-100">
        <button 
          type="button"
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface border border-border text-text-secondary hover:text-primary hover:bg-hover active:scale-95 transition-all shadow-sm"
          title="Cambiar Tema"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button 
          type="button"
          onClick={toggleFontSize}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface border border-border text-text-secondary hover:text-primary hover:bg-hover active:scale-95 transition-all shadow-sm"
          title="Tamaño de Fuente"
        >
          <span className="font-bold text-lg leading-none">Aa</span>
        </button>
      </div>

      <div className="relative z-10 w-full max-w-105 flex flex-col gap-8">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 select-none">
          <Image
            src="/logo.png"
            alt="AbyssTracker logo"
            width={85}
            height={85}
            className="logo-breathe"
            priority
          />
          <h1 className="text-2xl font-black tracking-tight">
            <BrandName size="text-2xl" />
          </h1>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-widest">
            Gestión Centralizada
          </p>
        </div>

        {/* Session expired notice */}
        {sessionExpired && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning font-semibold"
          >
            <span className="mt-0.5 shrink-0">⚠</span>
            <span>Tu sesión expiró. Iniciá sesión nuevamente para continuar.</span>
          </div>
        )}

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-xl flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-text-primary">Iniciar sesión</h2>
            <p className="text-sm text-text-secondary">
              Ingrese sus credenciales de acceso para continuar.
            </p>
          </div>

          <form
            id="login-form"
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-5"
          >
            {/* Username field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-username"
                className="text-sm font-semibold text-text-primary"
              >
                Usuario
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                autoComplete="username"
                autoFocus
                required
                placeholder="Ej: admin"
                className="
                  w-full min-h-11 rounded-lg border border-border bg-elevated
                  px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-primary/30 focus-visible:border-primary
                  transition-colors
                "
              />
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-password"
                className="text-sm font-semibold text-text-primary"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="
                    w-full min-h-11 rounded-lg border border-border bg-elevated
                    px-3 pr-11 py-2 text-sm text-text-primary placeholder:text-text-disabled
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-primary/30 focus-visible:border-primary
                    transition-colors
                  "
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Inline error banner */}
            {error && (
              <div
                id="login-error-banner"
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium"
              >
                <XCircle size={16} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="
                w-full min-h-11.5 rounded-lg bg-primary hover:bg-primary-hover
                active:bg-primary-active text-white font-semibold text-sm
                flex items-center justify-center gap-2 mt-1
                transition-colors shadow-sm shadow-primary/20
                disabled:pointer-events-none disabled:opacity-60
              "
            >
              {isLoading && <Loader2 size={16} className="animate-spin shrink-0" />}
              {isLoading ? "Validando…" : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
