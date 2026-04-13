/**
 * BrandName — Opción A
 * "Abyss" en text-text-primary + "Tracker" en text-primary (violeta).
 * Dos pesos distintos para darle profundidad sin necesitar íconos.
 *
 * Props:
 *   size  — controla el tamaño del texto vía className (default "text-lg")
 *   className — clases extra sobre el wrapper
 */
export function BrandName({
  size = "text-lg",
  className = "",
}: {
  size?: string;
  className?: string;
}) {
  return (
    <span
      className={`font-black tracking-tight select-none whitespace-nowrap leading-none ${size} ${className}`}
    >
      <span className="text-text-primary">Abyss</span>
      <span className="text-primary">Tracker</span>
    </span>
  );
}
