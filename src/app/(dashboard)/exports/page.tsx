"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Loader2, XCircle, CalendarDays, User, Package, ChevronDown, ChevronUp } from "lucide-react";

/* ─────────────────────────────────────────────────────── */
/*  Types                                                   */
/* ─────────────────────────────────────────────────────── */
interface UserOption { id: string; username: string; }
interface ProductOption { id: string; name: string; }

/* ─────────────────────────────────────────────────────── */
/*  Shared primitive: labelled field wrapper               */
/* ─────────────────────────────────────────────────────── */
function FilterLabel({ label, icon: Icon, children }: {
  label: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon size={12} className="flex-shrink-0" />}
        {label}
      </label>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Shared styled date input                               */
/* ─────────────────────────────────────────────────────── */
function DateInput({ id, value, onChange }: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      id={id}
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="
        w-full min-h-[40px] rounded-lg border border-border bg-surface
        px-3 py-2 text-sm text-text-primary
        placeholder:text-text-disabled
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30
        focus-visible:border-primary transition-colors
        [color-scheme:dark]
      "
    />
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Shared styled select                                   */
/* ─────────────────────────────────────────────────────── */
function FilterSelect({ id, value, onChange, placeholder, options }: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="
        w-full min-h-[40px] rounded-lg border border-border bg-surface
        px-3 py-2 text-sm text-text-primary
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30
        focus-visible:border-primary transition-colors cursor-pointer
        appearance-none
        bg-[url('data:image/svg+xml;charset=utf-8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22><path stroke=%22%236b7280%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22m6 8 4 4 4-4%22/></svg>')] 
        bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.25rem_1.25rem]
        pr-8
      "
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Inline error banner for a section                      */
/* ─────────────────────────────────────────────────────── */
function InlineError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <XCircle size={16} className="flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Download button                                         */
/* ─────────────────────────────────────────────────────── */
function DownloadButton({ id, isLoading, onClick }: {
  id: string;
  isLoading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="
        inline-flex items-center justify-center gap-2 rounded-lg border border-transparent
        bg-primary text-white font-semibold text-sm
        min-h-[42px] px-5 py-2.5
        hover:bg-primary-hover active:bg-primary-active
        transition-colors shadow-sm
        disabled:pointer-events-none disabled:opacity-60
        w-full sm:w-auto
      "
    >
      {isLoading
        ? <Loader2 size={16} className="animate-spin flex-shrink-0" />
        : <Download size={16} className="flex-shrink-0" />
      }
      {isLoading ? "Generando…" : "Descargar .xlsx"}
    </button>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Section card shell                                      */
/* ─────────────────────────────────────────────────────── */
function ExportCard({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showContent = !isMobile || isExpanded;

  return (
    <section className="bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-sm flex flex-col gap-4 sm:gap-5 transition-all">
      <div 
        className={`flex justify-between items-center ${showContent ? 'border-b border-border pb-4' : ''} sm:border-b sm:border-border sm:pb-4 ${isMobile ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'}`}
        onClick={() => { if(isMobile) setIsExpanded(!isExpanded); }}
      >
        <div className="flex flex-col gap-0.5 pr-2">
          <h2 className="text-base font-bold text-text-primary tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-text-secondary leading-tight mt-1">{subtitle}</p>}
        </div>
        {isMobile && (
          <div className="flex-shrink-0 text-text-secondary bg-base border border-border rounded-full p-1.5 shadow-sm">
             {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
          </div>
        )}
      </div>
      {showContent && (
        <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Core download logic (shared)                           */
/* ─────────────────────────────────────────────────────── */
async function downloadExport(
  url: string,
  filename: string,
): Promise<string | null> {
  const res = await fetch(url);

  // Non-blob (error) response
  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || contentType.includes("application/json")) {
    const data = await res.json().catch(() => ({}));
    return (data as { error?: string }).error || "Ocurrió un error al generar la exportación.";
  }

  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
  return null; // success
}

/* ─────────────────────────────────────────────────────── */
/*  Main page                                              */
/* ─────────────────────────────────────────────────────── */
export default function ExportacionesPage() {
  /* ── Shared option lists ── */
  const [users, setUsers] = useState<UserOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  const loadOptions = useCallback(async () => {
    try {
      const [uRes, pRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/products"),
      ]);
      const [uData, pData] = await Promise.all([uRes.json(), pRes.json()]);
      if (uData.users) setUsers(uData.users);
      if (pData.products) setProducts(pData.products);
    } catch {
      // options stay empty — selects will only show "Todos"
    } finally {
      setOptionsLoaded(true);
    }
  }, []);

  useEffect(() => { loadOptions(); }, [loadOptions]);

  const userOptions = users.map((u) => ({ value: u.id, label: u.username }));
  const productOptions = products.map((p) => ({ value: p.id, label: p.name }));

  /* ── Sales state ── */
  const [salesFrom, setSalesFrom] = useState("");
  const [salesTo, setSalesTo] = useState("");
  const [salesUser, setSalesUser] = useState("");
  const [salesProduct, setSalesProduct] = useState("");
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);

  const handleSalesDownload = async () => {
    setSalesError(null);
    setSalesLoading(true);
    const params = new URLSearchParams();
    if (salesFrom) params.set("dateFrom", salesFrom);
    if (salesTo) params.set("dateTo", salesTo);
    if (salesUser) params.set("userId", salesUser);
    if (salesProduct) params.set("productId", salesProduct);
    const err = await downloadExport(`/api/exports/sales?${params}`, "ventas.xlsx");
    if (err) setSalesError(err);
    setSalesLoading(false);
  };

  /* ── Stock state ── */
  const [stockProduct, setStockProduct] = useState("");
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);

  const handleStockDownload = async () => {
    setStockError(null);
    setStockLoading(true);
    const params = new URLSearchParams();
    if (stockProduct) params.set("productId", stockProduct);
    const err = await downloadExport(`/api/exports/stock?${params}`, "stock.xlsx");
    if (err) setStockError(err);
    setStockLoading(false);
  };

  /* ── Movements state ── */
  const [movFrom, setMovFrom] = useState("");
  const [movTo, setMovTo] = useState("");
  const [movUser, setMovUser] = useState("");
  const [movProduct, setMovProduct] = useState("");
  const [movLoading, setMovLoading] = useState(false);
  const [movError, setMovError] = useState<string | null>(null);

  const handleMovementsDownload = async () => {
    setMovError(null);
    setMovLoading(true);
    const params = new URLSearchParams();
    if (movFrom) params.set("dateFrom", movFrom);
    if (movTo) params.set("dateTo", movTo);
    if (movUser) params.set("userId", movUser);
    if (movProduct) params.set("productId", movProduct);
    const err = await downloadExport(`/api/exports/movements?${params}`, "movimientos.xlsx");
    if (err) setMovError(err);
    setMovLoading(false);
  };

  /* ── Skeleton pill while options load ── */
  const skeletonSelect = (
    <div className="min-h-[40px] w-full rounded-lg border border-border bg-elevated animate-pulse" />
  );

  return (
    <div className="max-w-[720px] mx-auto w-full flex flex-col gap-6 pb-10">

      {/* Page header */}
      <div className="flex flex-col gap-1 pt-1">
        <h1 className="text-2xl font-black text-text-primary tracking-tight">Exportaciones</h1>
        <p className="text-sm text-text-secondary">
          Descargá reportes en formato .xlsx. El límite es de 10.000 registros por exportación.
        </p>
      </div>

      {/* Section 1: Sales export */}
      <ExportCard
        title="Exportar ventas"
        subtitle="Historial de ventas con sus líneas, montos e información de usuario."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FilterLabel label="Fecha desde" icon={CalendarDays}>
            <DateInput
              id="export-sales-date-from"
              value={salesFrom}
              onChange={(v) => { setSalesFrom(v); setSalesError(null); }}
            />
          </FilterLabel>

          <FilterLabel label="Fecha hasta" icon={CalendarDays}>
            <DateInput
              id="export-sales-date-to"
              value={salesTo}
              onChange={(v) => { setSalesTo(v); setSalesError(null); }}
            />
          </FilterLabel>

          <FilterLabel label="Usuario" icon={User}>
            {!optionsLoaded ? skeletonSelect : (
              <FilterSelect
                id="export-sales-user"
                value={salesUser}
                onChange={(v) => { setSalesUser(v); setSalesError(null); }}
                placeholder="Todos los usuarios"
                options={userOptions}
              />
            )}
          </FilterLabel>

          <FilterLabel label="Producto" icon={Package}>
            {!optionsLoaded ? skeletonSelect : (
              <FilterSelect
                id="export-sales-product"
                value={salesProduct}
                onChange={(v) => { setSalesProduct(v); setSalesError(null); }}
                placeholder="Todos los productos"
                options={productOptions}
              />
            )}
          </FilterLabel>
        </div>

        <div className="flex flex-col gap-3 pt-1">
          <DownloadButton
            id="export-sales-btn"
            isLoading={salesLoading}
            onClick={handleSalesDownload}
          />
          {salesError && <InlineError message={salesError} />}
        </div>
      </ExportCard>

      {/* Section 2: Current stock export */}
      <ExportCard
        title="Exportar stock actual"
        subtitle="Snapshot del stock disponible por variante al momento de la descarga."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FilterLabel label="Producto (opcional)" icon={Package}>
            {!optionsLoaded ? skeletonSelect : (
              <FilterSelect
                id="export-stock-product"
                value={stockProduct}
                onChange={(v) => { setStockProduct(v); setStockError(null); }}
                placeholder="Todos los productos"
                options={productOptions}
              />
            )}
          </FilterLabel>
        </div>

        <div className="flex flex-col gap-3 pt-1">
          <DownloadButton
            id="export-stock-btn"
            isLoading={stockLoading}
            onClick={handleStockDownload}
          />
          {stockError && <InlineError message={stockError} />}
        </div>
      </ExportCard>

      {/* Section 3: Movements export */}
      <ExportCard
        title="Exportar movimientos"
        subtitle="Registro de entradas, salidas, ajustes y pérdidas de stock."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FilterLabel label="Fecha desde" icon={CalendarDays}>
            <DateInput
              id="export-mov-date-from"
              value={movFrom}
              onChange={(v) => { setMovFrom(v); setMovError(null); }}
            />
          </FilterLabel>

          <FilterLabel label="Fecha hasta" icon={CalendarDays}>
            <DateInput
              id="export-mov-date-to"
              value={movTo}
              onChange={(v) => { setMovTo(v); setMovError(null); }}
            />
          </FilterLabel>

          <FilterLabel label="Usuario" icon={User}>
            {!optionsLoaded ? skeletonSelect : (
              <FilterSelect
                id="export-mov-user"
                value={movUser}
                onChange={(v) => { setMovUser(v); setMovError(null); }}
                placeholder="Todos los usuarios"
                options={userOptions}
              />
            )}
          </FilterLabel>

          <FilterLabel label="Producto" icon={Package}>
            {!optionsLoaded ? skeletonSelect : (
              <FilterSelect
                id="export-mov-product"
                value={movProduct}
                onChange={(v) => { setMovProduct(v); setMovError(null); }}
                placeholder="Todos los productos"
                options={productOptions}
              />
            )}
          </FilterLabel>
        </div>

        <div className="flex flex-col gap-3 pt-1">
          <DownloadButton
            id="export-mov-btn"
            isLoading={movLoading}
            onClick={handleMovementsDownload}
          />
          {movError && <InlineError message={movError} />}
        </div>
      </ExportCard>

    </div>
  );
}
