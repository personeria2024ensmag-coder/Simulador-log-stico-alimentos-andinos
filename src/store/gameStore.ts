import { create } from 'zustand';
import { CONFIG_V1 } from '@/data/config-v1';
import type { GameState } from '@/domain/state';
import type { CargoId } from '@/domain/types';
import { crearPartida } from '@/engine/core/createGame';
import { semillaNueva } from '@/engine/rng/rng';
import { abrirSobre, crearPersistenciaNavegador, empaquetar, type Persistencia } from '@/storage/persistence';

/**
 * Puente entre React y el motor. No contiene reglas de negocio:
 * entrega órdenes al motor, guarda el resultado y expone el estado de guardado.
 */

export type EstadoGuardado =
  | { tipo: 'iniciando' }
  | { tipo: 'sin_partida' }
  | { tipo: 'guardado'; almacen: string; en: string }
  | { tipo: 'guardando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'sin_almacen'; mensaje: string };

interface Store {
  partida: GameState | null;
  guardado: EstadoGuardado;
  almacen: string;
  almacenDisponible: boolean;
  avisos: string[];
  persistencia: Persistencia | null;
  iniciar: () => Promise<void>;
  nuevaPartida: (op: { cargo: CargoId; nombreJugador: string; semilla?: number }) => Promise<{ ok: true } | { ok: false; errores: string[] }>;
  importar: (texto: string) => Promise<{ ok: true; avisos: string[] } | { ok: false; errores: string[] }>;
  exportarTexto: () => string | null;
  reiniciar: () => Promise<void>;
  descartarAviso: (i: number) => void;
}

const ahora = () => new Date().toISOString();

async function guardarCon(set: (p: Partial<Store>) => void, persistencia: Persistencia | null, partida: GameState, disponible: boolean) {
  if (!persistencia) return;
  set({ guardado: { tipo: 'guardando' } });
  try {
    const r = await persistencia.guardar(partida, ahora());
    if (!disponible) set({ guardado: { tipo: 'sin_almacen', mensaje: 'El progreso no se está guardando en este navegador. Exporte su partida para no perderla.' } });
    else set({ guardado: { tipo: 'guardado', almacen: r.almacen, en: ahora() } });
  } catch (e) {
    set({ guardado: { tipo: 'error', mensaje: e instanceof Error ? e.message : 'No se pudo guardar la partida.' } });
  }
}

export const useGame = create<Store>((set, get) => ({
  partida: null,
  guardado: { tipo: 'iniciando' },
  almacen: '',
  almacenDisponible: true,
  avisos: [],
  persistencia: null,

  iniciar: async () => {
    const { persistencia, disponible, detalle } = await crearPersistenciaNavegador();
    set({ persistencia, almacen: detalle, almacenDisponible: disponible });
    if (!disponible) {
      set({ guardado: { tipo: 'sin_almacen', mensaje: detalle } });
      return;
    }
    try {
      const r = await persistencia.cargar();
      if (r) set({ partida: r.state, avisos: r.avisos, guardado: { tipo: 'guardado', almacen: persistencia.nombreAlmacen, en: r.state.meta.actualizadaEn } });
      else set({ guardado: { tipo: 'sin_partida' } });
    } catch {
      set({ guardado: { tipo: 'error', mensaje: 'No se pudo leer la partida guardada.' } });
    }
  },

  nuevaPartida: async ({ cargo, nombreJugador, semilla }) => {
    const r = crearPartida(CONFIG_V1, { cargo, nombreJugador, semilla: semilla ?? semillaNueva(), ahoraISO: ahora() });
    if (!r.ok) return r;
    set({ partida: r.state, avisos: [] });
    await guardarCon(set, get().persistencia, r.state, get().almacenDisponible);
    return { ok: true };
  },

  importar: async (texto) => {
    const r = abrirSobre(texto);
    if (!r.ok) return r;
    set({ partida: r.state, avisos: r.avisos });
    await guardarCon(set, get().persistencia, r.state, get().almacenDisponible);
    return { ok: true, avisos: r.avisos };
  },

  exportarTexto: () => {
    const p = get().partida;
    return p ? JSON.stringify(empaquetar(p, ahora()), null, 2) : null;
  },

  reiniciar: async () => {
    await get().persistencia?.borrar();
    set({ partida: null, avisos: [], guardado: get().almacenDisponible ? { tipo: 'sin_partida' } : get().guardado });
  },

  descartarAviso: (i) => set({ avisos: get().avisos.filter((_, j) => j !== i) }),
}));
