import type { FichaCargo } from '@/domain/config';
import type { GameState } from '@/domain/state';
import type { AreaId, CargoId, TipoAccion } from '@/domain/types';

export type ResultadoAutoridad =
  | { permitido: true; tope: number; explicacion: string }
  | {
      permitido: false;
      motivo: 'tope_excedido' | 'area_ajena' | 'autorizacion_calidad';
      dirigidaA: CargoId | 'gerencia_general';
      tope: number;
      explicacion: string;
      procedimiento: string[];
    };

export function fichaCargo(state: Pick<GameState, 'config'>, id: CargoId): FichaCargo {
  const f = state.config.cargos.find((c) => c.id === id);
  if (!f) throw new Error(`Cargo desconocido: ${id}`);
  return f;
}

export function topeAprobacion(state: Pick<GameState, 'config' | 'meta'>): number {
  const f = fichaCargo(state, state.meta.cargo);
  return f.topeGrado1 * state.config.topeMultiplicadorGrado[state.meta.grado];
}

/** Cargo especialista dueño de un área (el de menor alcance que la tiene como propia). */
export function duenoDeArea(state: Pick<GameState, 'config'>, area: AreaId): FichaCargo | undefined {
  return [...state.config.cargos]
    .filter((c) => c.areasPropias.includes(area))
    .sort((a, b) => a.areasPropias.length - b.areasPropias.length || b.nivelJerarquico - a.nivelJerarquico)[0];
}

const nombreDe = (state: Pick<GameState, 'config'>, id: CargoId | 'gerencia_general') =>
  id === 'gerencia_general' ? 'Gerencia General' : fichaCargo(state, id).nombre;

/**
 * Decide si el cargo del jugador puede ejecutar una acción directamente.
 * Si no, devuelve el procedimiento de escalamiento correspondiente; nunca la aplica en silencio.
 */
export function evaluarAutoridad(state: Pick<GameState, 'config' | 'meta'>, accion: { tipo: TipoAccion; monto: number }): ResultadoAutoridad {
  const cargo = fichaCargo(state, state.meta.cargo);
  const tope = topeAprobacion(state);
  const fmt = (n: number) => `$${n.toLocaleString('es-CO')}`;

  if (state.config.accionesConAutorizacionCalidad.includes(accion.tipo) && cargo.id !== 'coord_calidad') {
    return {
      permitido: false,
      motivo: 'autorizacion_calidad',
      dirigidaA: 'coord_calidad',
      tope,
      explicacion: 'Esta acción siempre requiere la autorización del Coordinador de calidad, inocuidad y trazabilidad, cualquiera que sea el cargo.',
      procedimiento: ['Registrar la solicitud con la justificación y las verificaciones realizadas', 'Calidad revisa las verificaciones requeridas', 'Calidad autoriza, pide más verificaciones o rechaza'],
    };
  }

  const preventiva = state.config.accionesPreventivasAbiertas.includes(accion.tipo);
  const area = state.config.areaPorAccion[accion.tipo];
  if (!preventiva && !cargo.areasPropias.includes(area)) {
    const dueno = duenoDeArea(state, area);
    const destino: CargoId | 'gerencia_general' = dueno?.id ?? cargo.reportaA;
    return {
      permitido: false,
      motivo: 'area_ajena',
      dirigidaA: destino,
      tope,
      explicacion: `La acción pertenece al área de ${area.replace('_', ' ')}, que no es propia de su cargo. Debe coordinarla con ${nombreDe(state, destino)}.`,
      procedimiento: ['Enviar una solicitud interárea con la necesidad y la fecha límite', `${nombreDe(state, destino)} decide y ejecuta`, 'La respuesta consume tiempo simulado'],
    };
  }

  if (accion.monto > tope) {
    return {
      permitido: false,
      motivo: 'tope_excedido',
      dirigidaA: cargo.reportaA,
      tope,
      explicacion: tope === 0
        ? `Su cargo propone pero no aprueba gasto. El valor (${fmt(accion.monto)}) debe aprobarlo ${nombreDe(state, cargo.reportaA)}.`
        : `El valor (${fmt(accion.monto)}) supera su tope de aprobación (${fmt(tope)}). Debe aprobarlo ${nombreDe(state, cargo.reportaA)}.`,
      procedimiento: ['Registrar la solicitud con la justificación escrita', `${nombreDe(state, cargo.reportaA)} la resuelve con reglas fijas: aprueba, aprueba en parte o rechaza`, 'La aprobación consume tiempo simulado'],
    };
  }

  return { permitido: true, tope, explicacion: preventiva ? 'Acción preventiva: cualquier cargo puede ejecutarla.' : `Dentro de la autoridad de su cargo (tope ${fmt(tope)}).` };
}
