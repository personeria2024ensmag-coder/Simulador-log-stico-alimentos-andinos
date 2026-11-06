import { type ReactNode, useState } from 'react';
import {
  AlertTriangle, BarChart3, Boxes, Building2, ClipboardList, Cloud, CloudOff, Gauge, History, Home, Map as MapIcon, Menu,
  Network, Settings2, ShoppingCart, Truck, Wallet, X, FileText, Loader2,
} from 'lucide-react';
import { useGame } from '@/store/gameStore';
import { fichaCargo } from '@/engine/core/authority';
import { resumenFinanciero, alertas as calcularAlertas } from '@/engine/core/selectors';
import { cx } from './ui';
import { fmtMillones } from './format';
import { ir, type Ruta } from './router';

interface ItemNav { ruta: Ruta; nombre: string; icono: ReactNode; fase?: number; requierePartida?: boolean }

export const NAV: { grupo: string; items: ItemNav[] }[] = [
  { grupo: 'Campaña', items: [
    { ruta: 'inicio', nombre: 'Inicio', icono: <Home size={17} /> },
    { ruta: 'control', nombre: 'Centro de control', icono: <Gauge size={17} />, requierePartida: true },
    { ruta: 'mapa', nombre: 'Mapa de campaña', icono: <MapIcon size={17} /> },
    { ruta: 'organigrama', nombre: 'Organigrama', icono: <Network size={17} /> },
  ] },
  { grupo: 'Operación', items: [
    { ruta: 'inventario', nombre: 'Inventario y lotes', icono: <Boxes size={17} />, fase: 3 },
    { ruta: 'pedidos', nombre: 'Pedidos y clientes', icono: <ClipboardList size={17} />, fase: 3 },
    { ruta: 'compras', nombre: 'Compras y proveedores', icono: <ShoppingCart size={17} />, fase: 3 },
    { ruta: 'transporte', nombre: 'Transporte y rutas', icono: <Truck size={17} />, fase: 4 },
    { ruta: 'finanzas', nombre: 'Finanzas y presupuesto', icono: <Wallet size={17} />, fase: 3 },
  ] },
  { grupo: 'Decisión y evaluación', items: [
    { ruta: 'crisis', nombre: 'Centro de crisis', icono: <AlertTriangle size={17} />, fase: 3 },
    { ruta: 'indicadores', nombre: 'Indicadores', icono: <BarChart3 size={17} />, fase: 3 },
    { ruta: 'historial', nombre: 'Historial de eventos', icono: <History size={17} />, fase: 3 },
    { ruta: 'informe', nombre: 'Informe final', icono: <FileText size={17} />, fase: 7 },
    { ruta: 'configuracion', nombre: 'Configuración', icono: <Settings2 size={17} /> },
  ] },
];

const FASE_ACTUAL = 2;

function EstadoGuardado() {
  const g = useGame((s) => s.guardado);
  if (g.tipo === 'guardando') return <span className="flex items-center gap-1.5 text-xs text-grafito-300"><Loader2 size={14} className="animate-spin" />Guardando…</span>;
  if (g.tipo === 'guardado') return <span className="flex items-center gap-1.5 text-xs text-bosque-200" title={`Guardado en ${g.almacen}`}><Cloud size={14} />Guardado en este navegador</span>;
  if (g.tipo === 'error' || g.tipo === 'sin_almacen') return <span className="flex items-center gap-1.5 text-xs font-medium text-ambar-100" title={g.mensaje}><CloudOff size={14} />Sin guardar: exporte su partida</span>;
  return null;
}

function Navegacion({ ruta, onNavegar }: { ruta: Ruta; onNavegar?: () => void }) {
  const hayPartida = useGame((s) => !!s.partida);
  return (
    <nav className="flex flex-col gap-5 px-3 py-4" aria-label="Navegación principal">
      {NAV.map((g) => (
        <div key={g.grupo}>
          <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-grafito-400">{g.grupo}</div>
          <ul className="flex flex-col gap-0.5">
            {g.items.map((it) => {
              const activo = ruta === it.ruta;
              const deshabilitado = it.requierePartida && !hayPartida;
              return (
                <li key={it.ruta}>
                  <a
                    href={`#${it.ruta}`}
                    onClick={(e) => { if (deshabilitado) { e.preventDefault(); ir('nueva-partida'); } onNavegar?.(); }}
                    className={cx(
                      'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                      activo ? 'bg-bosque-700 text-white' : 'text-grafito-200 hover:bg-grafito-700 hover:text-white',
                    )}
                    aria-current={activo ? 'page' : undefined}
                  >
                    <span className={activo ? 'text-white' : 'text-grafito-400'}>{it.icono}</span>
                    <span className="flex-1">{it.nombre}</span>
                    {it.fase && it.fase > FASE_ACTUAL && <span className="rounded bg-grafito-700 px-1 text-[10px] font-semibold text-grafito-300" title={`Operativa desde la Fase ${it.fase}`}>F{it.fase}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Marca() {
  return (
    <a href="#inicio" className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-bosque-600 text-white"><Building2 size={18} /></span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-white">Alimentos Andinos</span>
        <span className="block text-[11px] text-grafito-400">Simulador logístico</span>
      </span>
    </a>
  );
}

function BarraSuperior({ onMenu }: { onMenu: () => void }) {
  const partida = useGame((s) => s.partida);
  const fin = partida ? resumenFinanciero(partida) : null;
  const nAlertas = partida ? calcularAlertas(partida).filter((a) => a.nivel !== 'info').length : 0;
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-grafito-700 bg-grafito-800 px-3 text-white lg:px-5">
      <button className="rounded p-1.5 text-grafito-200 hover:bg-grafito-700 lg:hidden" onClick={onMenu} aria-label="Abrir menú"><Menu size={20} /></button>
      <div className="lg:hidden"><Marca /></div>
      {partida && fin ? (
        <div className="ml-auto flex items-center gap-4 overflow-hidden text-xs lg:ml-0 lg:w-full lg:gap-6">
          <div className="hidden lg:block"><span className="text-grafito-400">Cargo </span><span className="font-medium">{fichaCargo(partida, partida.meta.cargo).nombre}</span><span className="text-grafito-400"> · grado {partida.meta.grado}</span></div>
          <div className="hidden sm:block"><span className="text-grafito-400">Caja </span><span className="font-mono font-semibold">{fmtMillones(fin.caja)}</span></div>
          <div className="hidden md:block"><span className="text-grafito-400">Comprometido </span><span className="font-mono font-semibold">{fmtMillones(fin.comprometido)}</span></div>
          <div><span className="text-grafito-400">Día </span><span className="font-mono font-semibold">{partida.reloj.dia}</span><span className="text-grafito-400"> · Ronda </span><span className="font-mono font-semibold">{partida.reloj.ronda}</span></div>
          <a href="#control" className={cx('flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold', nAlertas ? 'bg-ambar-500 text-grafito-900' : 'bg-grafito-700 text-grafito-300')} title="Alertas activas"><AlertTriangle size={13} />{nAlertas}</a>
          <div className="ml-auto hidden lg:block"><EstadoGuardado /></div>
        </div>
      ) : (
        <div className="ml-auto text-xs text-grafito-400 lg:ml-0">Simulador académico · datos ficticios</div>
      )}
    </header>
  );
}

const MOVIL: ItemNav[] = [
  { ruta: 'control', nombre: 'Control', icono: <Gauge size={20} /> },
  { ruta: 'mapa', nombre: 'Campaña', icono: <MapIcon size={20} /> },
  { ruta: 'organigrama', nombre: 'Cargos', icono: <Network size={20} /> },
  { ruta: 'crisis', nombre: 'Crisis', icono: <AlertTriangle size={20} /> },
];

export function Layout({ ruta, children }: { ruta: Ruta; children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const hayPartida = useGame((s) => !!s.partida);
  return (
    <div className="min-h-screen bg-grafito-50 lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-grafito-800 lg:flex">
        <div className="flex h-14 items-center border-b border-grafito-700 px-4"><Marca /></div>
        <div className="flex-1 overflow-y-auto"><Navegacion ruta={ruta} /></div>
        <div className="border-t border-grafito-700 px-4 py-3 text-[11px] leading-snug text-grafito-400">Empresa, clientes, proveedores y cifras ficticios. Uso académico.</div>
      </aside>

      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <div className="absolute inset-0 bg-grafito-900/60" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-grafito-800">
            <div className="flex h-14 items-center justify-between border-b border-grafito-700 px-4"><Marca /><button aria-label="Cerrar menú" className="rounded p-1 text-grafito-300 hover:bg-grafito-700" onClick={() => setMenu(false)}><X size={20} /></button></div>
            <div className="flex-1 overflow-y-auto"><Navegacion ruta={ruta} onNavegar={() => setMenu(false)} /></div>
            <div className="border-t border-grafito-700 px-4 py-3"><EstadoGuardado /></div>
          </div>
        </div>
      )}

      <BarraSuperior onMenu={() => setMenu(true)} />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-6 lg:pb-10">{children}</main>

      {hayPartida && (
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-grafito-200 bg-white lg:hidden" aria-label="Navegación inferior">
          {MOVIL.map((it) => (
            <a key={it.ruta} href={`#${it.ruta}`} className={cx('flex flex-col items-center gap-0.5 py-2 text-[11px]', ruta === it.ruta ? 'text-bosque-700' : 'text-grafito-500')}>
              {it.icono}<span>{it.nombre}</span>
            </a>
          ))}
          <button onClick={() => setMenu(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-grafito-500"><Menu size={20} /><span>Más</span></button>
        </nav>
      )}
    </div>
  );
}
