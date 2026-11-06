import { type ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export function Tarjeta({ titulo, accion, children, className, sub }: { titulo?: ReactNode; sub?: ReactNode; accion?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-lg border border-grafito-200 bg-white shadow-sm', className)}>
      {(titulo || accion) && (
        <header className="flex items-start justify-between gap-3 border-b border-grafito-100 px-4 py-3">
          <div>
            {titulo && <h2 className="text-sm font-semibold text-grafito-800">{titulo}</h2>}
            {sub && <p className="mt-0.5 text-xs text-grafito-500">{sub}</p>}
          </div>
          {accion}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Kpi({ etiqueta, valor, detalle, tono = 'neutro', icono }: { etiqueta: string; valor: ReactNode; detalle?: ReactNode; tono?: 'neutro' | 'bien' | 'advertencia' | 'critico' | 'nd'; icono?: ReactNode }) {
  const borde = { neutro: 'border-l-grafito-300', bien: 'border-l-bosque-500', advertencia: 'border-l-ambar-500', critico: 'border-l-alerta-500', nd: 'border-l-grafito-200' }[tono];
  return (
    <div className={cx('rounded-lg border border-grafito-200 border-l-4 bg-white px-4 py-3 shadow-sm', borde)}>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-grafito-500">
        {icono}
        <span>{etiqueta}</span>
      </div>
      <div className={cx('mt-1 font-semibold tabular-nums', tono === 'nd' ? 'font-sans text-base text-grafito-400' : 'font-mono text-lg text-grafito-900 sm:text-xl')}>{valor}</div>
      {detalle && <div className="mt-1 text-xs text-grafito-500">{detalle}</div>}
    </div>
  );
}

export function Insignia({ children, tono = 'neutro' }: { children: ReactNode; tono?: 'neutro' | 'bien' | 'advertencia' | 'critico' | 'info' }) {
  const c = {
    neutro: 'bg-grafito-100 text-grafito-700',
    bien: 'bg-bosque-100 text-bosque-800',
    advertencia: 'bg-ambar-100 text-ambar-700',
    critico: 'bg-alerta-100 text-alerta-700',
    info: 'bg-sky-100 text-sky-800',
  }[tono];
  return <span className={cx('inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold', c)}>{children}</span>;
}

type BotonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: 'primario' | 'secundario' | 'peligro' | 'fantasma' };
export function Boton({ variante = 'primario', className, ...p }: BotonProps) {
  const v = {
    primario: 'bg-bosque-700 text-white hover:bg-bosque-800 disabled:bg-grafito-300',
    secundario: 'border border-grafito-300 bg-white text-grafito-800 hover:bg-grafito-50 disabled:text-grafito-400',
    peligro: 'bg-alerta-600 text-white hover:bg-alerta-700',
    fantasma: 'text-grafito-700 hover:bg-grafito-100',
  }[variante];
  return <button {...p} className={cx('inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-bosque-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed', v, className)} />;
}

export function EtiquetaSimulacion({ className }: { className?: string }) {
  return <span className={cx('inline-flex items-center rounded border border-dashed border-grafito-300 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-grafito-500', className)}>Dato de simulación</span>;
}

export function Dialogo({ abierto, titulo, children, onCerrar, acciones }: { abierto: boolean; titulo: string; children: ReactNode; onCerrar: () => void; acciones?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const f = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', f);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', f);
  }, [abierto, onCerrar]);
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-grafito-900/50 p-0 sm:items-center sm:p-4" onClick={onCerrar}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full overflow-auto rounded-t-xl bg-white shadow-xl outline-none sm:max-w-lg sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-grafito-100 px-5 py-3">
          <h2 className="text-base font-semibold text-grafito-900">{titulo}</h2>
          <button aria-label="Cerrar" onClick={onCerrar} className="rounded p-1 text-grafito-500 hover:bg-grafito-100"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 text-sm text-grafito-700">{children}</div>
        {acciones && <div className="flex flex-wrap justify-end gap-2 border-t border-grafito-100 px-5 py-3">{acciones}</div>}
      </div>
    </div>
  );
}

export function Vacio({ titulo, children, icono }: { titulo: string; children?: ReactNode; icono?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-grafito-300 bg-white px-6 py-12 text-center">
      {icono && <div className="mb-3 text-grafito-400">{icono}</div>}
      <h3 className="text-sm font-semibold text-grafito-800">{titulo}</h3>
      {children && <div className="mt-2 max-w-md text-sm text-grafito-500">{children}</div>}
    </div>
  );
}

export function EncabezadoPantalla({ titulo, descripcion, derecha }: { titulo: string; descripcion?: ReactNode; derecha?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-grafito-900 sm:text-2xl">{titulo}</h1>
        {descripcion && <p className="mt-1 max-w-3xl text-sm text-grafito-600">{descripcion}</p>}
      </div>
      {derecha && <div className="self-start sm:self-auto">{derecha}</div>}
    </div>
  );
}
