"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Datos inválidos al procesar la autenticación");
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado de conexión");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-950 to-gray-950"></div>
      
      <div className="w-full max-w-md p-10 rounded-2xl bg-gray-900/80 border border-gray-800 shadow-2xl z-10 backdrop-blur-xl relative">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
            AbyssTracker
          </h1>
          <p className="text-gray-400 mt-3 text-sm font-medium uppercase tracking-widest">
            Gestión Centralizada
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-sm font-medium text-center shadow-inner">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold tracking-wide text-gray-300">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-3.5 rounded-xl bg-gray-950/50 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner"
              placeholder="Ej: admin"
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold tracking-wide text-gray-300">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 rounded-xl bg-gray-950/50 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner"
              placeholder="••••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold tracking-wide transition-all shadow-[0_0_30px_rgba(37,99,235,0.25)] hover:shadow-[0_0_40px_rgba(79,70,229,0.4)] disabled:opacity-50 disabled:cursor-wait uppercase text-sm"
          >
            {isLoading ? "Validando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
