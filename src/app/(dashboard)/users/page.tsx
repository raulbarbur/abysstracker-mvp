"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, UserCheck, UserX, ShieldOff } from "lucide-react";
import { NewUserModal } from "./NewUserModal";
import { ToggleUserModal } from "./ToggleUserModal";

interface UserType {
  id: string;
  username: string;
  active: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<UserType | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, meRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/auth/me"),
      ]);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
      if (meRes.ok) {
        const me = await meRes.json();
        setCurrentUserId(me.userId);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleUserCreated = (newUser: unknown) => {
    setUsers(prev => [newUser as UserType, ...prev]);
    setIsNewModalOpen(false);
  };

  const handleToggled = (updatedUser: unknown) => {
    const user = updatedUser as UserType;
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...user } : u));
    setToggleTarget(null);
  };

  const formatDate = (dt: string) =>
    new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(dt));

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight mb-2">Usuarios</h1>
          <p className="text-text-secondary text-md font-semibold">Gestión de accesos y permisos del sistema.</p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-3 px-6 py-4 bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-black rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
        >
          <Plus size={20} />
          Nuevo usuario
        </button>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary gap-4">
            <Loader2 className="animate-spin w-12 h-12" />
            <p className="font-bold">Cargando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-disabled">
            <p className="font-bold text-lg">Sin usuarios registrados.</p>
          </div>
        ) : (
          <>
            {/* Desktop header */}
            <div className="hidden md:grid grid-cols-[1fr_130px_240px] gap-4 px-6 py-3 border-b border-border bg-base text-xs font-black text-text-secondary uppercase tracking-wider">
              <span>Usuario</span>
              <span>Estado</span>
              <span>Acción</span>
            </div>

            <div className="divide-y divide-border">
              {users.map(user => {
                const isSelf = user.id === currentUserId;

                return (
                  <div key={user.id} className={`transition-colors relative ${isSelf ? "bg-primary/5 border-l-4 border-l-primary hover:bg-primary/10" : "hover:bg-hover"}`}>
                    {/* ── Mobile layout ── */}
                    <div className="md:hidden px-5 py-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg flex-shrink-0 ${user.active ? "bg-primary/15 text-primary" : "bg-base text-text-disabled border border-border"}`}>
                            {user.username[0].toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className={`font-black text-lg leading-tight ${user.active ? "text-text-primary" : "text-text-disabled"}`}>
                              {user.username}
                            </span>
                            <span className="text-xs text-text-secondary font-semibold">Desde {formatDate(user.createdAt)}</span>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase flex-shrink-0 ${user.active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                          {user.active ? "Activo" : "Inactivo"}
                        </span>
                      </div>

                      {isSelf ? (
                        <p className="text-sm text-text-disabled font-semibold flex items-center gap-2">
                          <ShieldOff size={14} />
                          No es posible desactivar la cuenta en uso.
                        </p>
                      ) : (
                        <button
                          onClick={() => setToggleTarget(user)}
                          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all active:scale-[0.98] ${
                            user.active
                              ? "border-destructive/40 text-destructive hover:bg-destructive hover:text-white hover:border-destructive"
                              : "border-success/40 text-success hover:bg-success hover:text-white hover:border-success"
                          }`}
                        >
                          {user.active ? <UserX size={16} /> : <UserCheck size={16} />}
                          {user.active ? "Desactivar usuario" : "Activar usuario"}
                        </button>
                      )}
                    </div>

                    {/* ── Desktop layout ── */}
                    <div className="hidden md:grid grid-cols-[1fr_130px_240px] gap-4 items-center px-6 py-5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg flex-shrink-0 ${user.active ? "bg-primary/15 text-primary" : "bg-base text-text-disabled border border-border"}`}>
                          {user.username[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`font-black text-lg break-words line-clamp-2 min-w-0 ${user.active ? "text-text-primary" : "text-text-disabled"}`}>
                            {user.username}
                          </span>
                          <span className="text-xs text-text-secondary font-semibold">Desde {formatDate(user.createdAt)}</span>
                        </div>
                      </div>

                      <div>
                        <span className={`text-xs font-bold px-2.5 py-1.5 rounded-lg uppercase ${user.active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                          {user.active ? "Activo" : "Inactivo"}
                        </span>
                      </div>

                      <div className="flex items-center justify-end">
                        {isSelf ? (
                          <span className="text-sm text-text-disabled font-semibold flex items-center gap-1.5 leading-tight">
                            <ShieldOff size={14} className="flex-shrink-0" />
                            No es posible desactivar la cuenta en uso.
                          </span>
                        ) : (
                          <button
                            onClick={() => setToggleTarget(user)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 font-bold text-sm transition-all active:scale-[0.98] ${
                              user.active
                                ? "border-destructive/40 text-destructive hover:bg-destructive hover:text-white hover:border-destructive"
                                : "border-success/40 text-success hover:bg-success hover:text-white hover:border-success"
                            }`}
                          >
                            {user.active ? <UserX size={16} /> : <UserCheck size={16} />}
                            {user.active ? "Desactivar" : "Activar"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <NewUserModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={handleUserCreated}
      />

      {toggleTarget && (
        <ToggleUserModal
          user={toggleTarget}
          isOpen={!!toggleTarget}
          onClose={() => setToggleTarget(null)}
          onSuccess={handleToggled}
        />
      )}
    </div>
  );
}
