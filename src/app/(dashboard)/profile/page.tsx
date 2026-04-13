"use client";

import { useState, useEffect, useId } from "react";
import { Eye, EyeOff, Moon, Sun, Type, ALargeSmall, CheckCircle2, XCircle } from "lucide-react";
import { usePreferences } from "@/components/preferences-provider";
import { Button } from "@/components/ui/Button";
import type { ThemePreference, FontSizePreference } from "@/lib/preferences";

/* ────────────────────────────────────────────────────────── */
/*  Inline PasswordField (with show/hide toggle)             */
/* ────────────────────────────────────────────────────────── */
interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete?: string;
}

function PasswordField({ id, label, value, onChange, error, autoComplete }: PasswordFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-text-primary">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={`
            w-full min-h-[44px] rounded-lg border bg-surface px-3 pr-11 py-2 text-sm text-text-primary
            placeholder:text-text-disabled
            focus-visible:outline-none focus-visible:ring-2 transition-colors
            ${error
              ? "border-destructive focus-visible:ring-destructive/30"
              : "border-border focus-visible:ring-primary/30 focus-visible:border-primary"
            }
          `}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1 mt-0.5">
          <XCircle size={12} className="flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Appearance Card                                           */
/* ────────────────────────────────────────────────────────── */
interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  id: string;
}

function OptionCard({ selected, onClick, children, id }: OptionCardProps) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`
        flex-1 flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-4 py-5
        transition-all duration-150 cursor-pointer select-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
        ${selected
          ? "border-primary bg-primary/8 shadow-[0_0_0_1px_var(--color-primary)]"
          : "border-border bg-surface hover:bg-hover hover:border-primary/40"
        }
      `}
    >
      {children}
    </button>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Section Shell                                             */
/* ────────────────────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col gap-5">
      <h2 className="text-base font-bold text-text-primary tracking-tight border-b border-border pb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Main Page                                                 */
/* ────────────────────────────────────────────────────────── */
export default function PerfilPage() {
  /* ── Account ── */
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.username) setUsername(d.username); })
      .catch(() => {});
  }, []);

  /* ── Password form ── */
  const currentId = useId();
  const newId = useId();
  const confirmId = useId();

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const [fieldErrors, setFieldErrors] = useState<{
    current?: string;
    new?: string;
    confirm?: string;
  }>({});
  const [pwdStatus, setPwdStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const validatePwdForm = () => {
    const errors: typeof fieldErrors = {};
    if (!currentPwd) errors.current = "Este campo es obligatorio.";
    if (!newPwd) errors.new = "Este campo es obligatorio.";
    else if (newPwd.length < 8) errors.new = "La contraseña debe tener al menos 8 caracteres.";
    if (!confirmPwd) errors.confirm = "Este campo es obligatorio.";
    else if (newPwd && confirmPwd && newPwd !== confirmPwd)
      errors.confirm = "Las contraseñas no coinciden.";
    return errors;
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdStatus(null);

    const errors = validatePwdForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPwd,
          newPassword: newPwd,
          newPasswordConfirmation: confirmPwd,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwdStatus({ type: "success", msg: "Contraseña actualizada correctamente." });
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
        setFieldErrors({});
      } else {
        const msg: string = data.error || "Ocurrió un error. Intenta nuevamente.";
        // Map known server errors to specific fields
        if (msg.toLowerCase().includes("actual")) {
          setFieldErrors({ current: msg });
        } else if (msg.toLowerCase().includes("coincid")) {
          setFieldErrors({ confirm: msg });
        } else {
          setPwdStatus({ type: "error", msg });
        }
      }
    } catch {
      setPwdStatus({ type: "error", msg: "Error de red. Intenta nuevamente." });
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Appearance ── */
  const { theme, fontSize, setTheme, setFontSize, persistPreferences } = usePreferences();
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefStatus, setPrefStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleTheme = (t: ThemePreference) => {
    if (t !== theme) setTheme(t);
  };

  const handleFontSize = (fs: FontSizePreference) => {
    if (fs !== fontSize) {
      setFontSize(fs);
      setPrefStatus(null);
    }
  };

  const handleSavePreferences = async () => {
    setIsSavingPrefs(true);
    setPrefStatus(null);
    const ok = await persistPreferences();
    if (ok) {
      setPrefStatus({ type: "success", msg: "Preferencias guardadas correctamente." });
    } else {
      setPrefStatus({ type: "error", msg: "Error al guardar preferencias." });
    }
    setIsSavingPrefs(false);
  };

  return (
    <div className="max-w-[640px] mx-auto w-full flex flex-col gap-6 pb-10">
      {/* Page header */}
      <div className="flex flex-col gap-1 pt-1">
        <h1 className="text-2xl font-black text-text-primary tracking-tight">Mi Perfil</h1>
        <p className="text-sm text-text-secondary">Gestión de cuenta y preferencias de visualización.</p>
      </div>

      {/* Section 1: Account */}
      <Section title="Mi cuenta">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-primary">
            Nombre de usuario
          </label>
          <div
            id="perfil-username-display"
            className="
              min-h-[44px] w-full rounded-lg border border-border bg-elevated
              px-3 py-2 text-sm text-text-secondary flex items-center
              cursor-not-allowed select-none
            "
          >
            {username === null ? (
              <span className="animate-pulse bg-border rounded w-28 h-4 inline-block" />
            ) : (
              <span className="font-medium text-text-primary">{username}</span>
            )}
          </div>
          <p className="text-xs text-text-disabled mt-0.5">
            El nombre de usuario no puede modificarse desde aquí.
          </p>
        </div>
      </Section>

      {/* Section 2: Change password */}
      <Section title="Cambiar contraseña">
        <form
          id="perfil-password-form"
          onSubmit={handleSavePassword}
          noValidate
          className="flex flex-col gap-4"
        >
          <PasswordField
            id={currentId}
            label="Contraseña actual"
            value={currentPwd}
            onChange={(v) => { setCurrentPwd(v); setFieldErrors((p) => ({ ...p, current: undefined })); setPwdStatus(null); }}
            error={fieldErrors.current}
            autoComplete="current-password"
          />
          <PasswordField
            id={newId}
            label="Nueva contraseña"
            value={newPwd}
            onChange={(v) => { setNewPwd(v); setFieldErrors((p) => ({ ...p, new: undefined })); setPwdStatus(null); }}
            error={fieldErrors.new}
            autoComplete="new-password"
          />
          <PasswordField
            id={confirmId}
            label="Confirmar nueva contraseña"
            value={confirmPwd}
            onChange={(v) => { setConfirmPwd(v); setFieldErrors((p) => ({ ...p, confirm: undefined })); setPwdStatus(null); }}
            error={fieldErrors.confirm}
            autoComplete="new-password"
          />

          {/* Inline status banner */}
          {pwdStatus && (
            <div
              id="perfil-pwd-status-banner"
              role="alert"
              className={`
                flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium
                ${pwdStatus.type === "success"
                  ? "bg-success/10 border-success/20 text-success"
                  : "bg-destructive/10 border-destructive/20 text-destructive"
                }
              `}
            >
              {pwdStatus.type === "success"
                ? <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                : <XCircle size={16} className="flex-shrink-0 mt-0.5" />
              }
              {pwdStatus.msg}
            </div>
          )}

          <div className="pt-1">
            <Button
              id="perfil-save-password-btn"
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              disabled={isSaving}
            >
              Guardar contraseña
            </Button>
          </div>
        </form>
      </Section>

      {/* Section 3: Appearance */}
      <Section title="Apariencia">
        {/* Theme toggle */}
        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-text-primary">Tema</span>
          <div className="flex gap-3" role="group" aria-label="Seleccionar tema">
            <OptionCard
              id="perfil-theme-dark"
              selected={theme === "dark"}
              onClick={() => handleTheme("dark")}
            >
              <Moon size={22} className={theme === "dark" ? "text-primary" : "text-text-secondary"} />
              <span className={`text-sm font-semibold ${theme === "dark" ? "text-primary" : "text-text-secondary"}`}>
                Oscuro
              </span>
            </OptionCard>

            <OptionCard
              id="perfil-theme-light"
              selected={theme === "light"}
              onClick={() => handleTheme("light")}
            >
              <Sun size={22} className={theme === "light" ? "text-primary" : "text-text-secondary"} />
              <span className={`text-sm font-semibold ${theme === "light" ? "text-primary" : "text-text-secondary"}`}>
                Claro
              </span>
            </OptionCard>
          </div>
        </div>

        {/* Font size toggle */}
        <div className="flex flex-col gap-3 pt-1 border-t border-border">
          <span className="text-sm font-semibold text-text-primary pt-1">Tamaño de texto</span>
          <div className="flex gap-3" role="group" aria-label="Seleccionar tamaño de texto">
            <OptionCard
              id="perfil-fontsize-normal"
              selected={fontSize === "normal"}
              onClick={() => handleFontSize("normal")}
            >
              <Type size={18} className={fontSize === "normal" ? "text-primary" : "text-text-secondary"} />
              {/* Label rendered at normal size explicitly via inline style */}
              <span
                style={{ fontSize: "14px" }}
                className={`font-semibold leading-none ${fontSize === "normal" ? "text-primary" : "text-text-secondary"}`}
              >
                Normal
              </span>
            </OptionCard>

            <OptionCard
              id="perfil-fontsize-large"
              selected={fontSize === "large"}
              onClick={() => handleFontSize("large")}
            >
              <ALargeSmall size={22} className={fontSize === "large" ? "text-primary" : "text-text-secondary"} />
              {/* Label rendered at large size so user sees the difference */}
              <span
                style={{ fontSize: "20px" }}
                className={`font-semibold leading-none ${fontSize === "large" ? "text-primary" : "text-text-secondary"}`}
              >
                Extra grande
              </span>
            </OptionCard>
          </div>
          
          {prefStatus && (
            <div
              role="alert"
              className={`
                mt-2 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium
                ${prefStatus.type === "success"
                  ? "bg-success/10 border-success/20 text-success"
                  : "bg-destructive/10 border-destructive/20 text-destructive"
                }
              `}
            >
              {prefStatus.type === "success"
                ? <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                : <XCircle size={16} className="flex-shrink-0 mt-0.5" />
              }
              {prefStatus.msg}
            </div>
          )}

          <div className="pt-3">
            <Button
              onClick={handleSavePreferences}
              variant="primary"
              size="md"
              isLoading={isSavingPrefs}
              disabled={isSavingPrefs}
            >
              Guardar preferencias
            </Button>
          </div>

          <p className="text-xs text-text-disabled">
            Los cambios se previsualizan de inmediato, pero deben guardarse para persistir en tu perfil.
          </p>
        </div>
      </Section>
    </div>
  );
}
