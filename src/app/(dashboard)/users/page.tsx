"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  username: string;
  active: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Create
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });

  // Password Modal
  const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Error obteniendo usuarios");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setIsModalOpen(false);
      setForm({ username: "", password: "" });
      fetchUsers();
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchUsers();
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      alert("Las nuevas contraseñas no coinciden");
      return;
    }
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setIsPwdModalOpen(false);
      setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      alert("Contraseña actualizada exitosamente");
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="w-12 h-12 animate-spin border-4 border-blue-500/20 border-t-blue-500 rounded-full"></div></div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-black text-white tracking-tight">Gestión de Usuarios</h1>
           <p className="text-gray-500 text-sm font-medium mt-1">Control total de credenciales operativas</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setIsPwdModalOpen(true)} className="px-5 py-2.5 bg-gray-900 border border-gray-700 hover:bg-gray-800 hover:border-gray-600 text-white font-bold rounded-xl text-sm transition-all shadow-inner">
            Cambiar mi contraseña
          </button>
          <button onClick={() => setIsModalOpen(true)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2">
            <span>+</span> Nuevo Administrador
          </button>
        </div>
      </div>

      <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/40 text-gray-500 uppercase tracking-widest text-[10px] font-black border-b border-gray-800/80">
              <tr>
                <th className="px-8 py-5">Identificador de Usuario</th>
                <th className="px-8 py-5">Fecha de Alta</th>
                <th className="px-8 py-5 text-center">Configuración</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/30">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-8 py-5 flex items-center gap-4">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                       {u.username.substring(0,2)}
                     </div>
                     <span className="font-bold text-gray-200 tracking-wide">{u.username}</span>
                  </td>
                  <td className="px-8 py-5 font-mono text-xs text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString("es-ES", { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button 
                      onClick={() => handleToggleActive(u.id, u.active)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-black transition-all border shadow-inner ${u.active ? 'bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'}`}
                    >
                      {u.active ? 'Desactivar' : 'Activar Cuenta'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800/80 rounded-2xl w-full max-w-md p-8 shadow-2xl relative">
            <h3 className="text-2xl font-black text-white mb-6">Nuevo Operador</h3>
            <form onSubmit={handleCreateUser} className="space-y-5">
              <div>
                <label className="block text-sm font-bold tracking-wide text-gray-400 mb-2">Nombre de Usuario</label>
                <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-blue-500 shadow-inner" placeholder="Ej: cajero_1" />
              </div>
              <div>
                <label className="block text-sm font-bold tracking-wide text-gray-400 mb-2">Contraseña Principal</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} minLength={6} required className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-blue-500 shadow-inner tracking-[0.2em]" placeholder="••••••••" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-800/50 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-400 hover:text-white transition-colors">Abortar</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-[0_0_10px_rgba(37,99,235,0.3)]">Registrar credencial</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPwdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800/80 rounded-2xl w-full max-w-md p-8 shadow-2xl relative">
             <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 text-blue-500 text-xl shadow-[0_0_15px_rgba(59,130,246,0.2)]">🔒</div>
            <h3 className="text-2xl font-black text-white mb-6">Seguridad Privada</h3>
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Pase de confirmidad actual</label>
                <input type="password" value={pwdForm.currentPassword} onChange={e => setPwdForm({...pwdForm, currentPassword: e.target.value})} required className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-blue-500 shadow-inner tracking-[0.2em]" />
              </div>
              <div className="border border-gray-800 rounded-xl p-4 bg-black/30 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Nuevo Cifrado</label>
                  <input type="password" value={pwdForm.newPassword} onChange={e => setPwdForm({...pwdForm, newPassword: e.target.value})} minLength={6} required className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-blue-500 shadow-inner tracking-[0.2em]" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Verificación de Cifrado</label>
                  <input type="password" value={pwdForm.confirmPassword} onChange={e => setPwdForm({...pwdForm, confirmPassword: e.target.value})} minLength={6} required className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-blue-500 shadow-inner tracking-[0.2em]" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-800/50 mt-6">
                <button type="button" onClick={() => setIsPwdModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-400 hover:text-white transition-colors">Volver sin cambios</button>
                <button type="submit" className="px-5 py-2.5 bg-gray-100 hover:bg-white text-gray-900 rounded-xl font-black transition-all">Encriptar nueva llave</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
