import { CONFIG_V1 } from '@/data/config-v1';
import { crearPartida } from '@/engine/core/createGame';
import type { CargoId } from '@/domain/types';
import type { GameState } from '@/domain/state';

export const AHORA = '2026-11-06T12:00:00.000Z';

export function nuevaPartida(cargo: CargoId = 'coord_operaciones', semilla = 12345): GameState {
  const r = crearPartida(CONFIG_V1, { cargo, nombreJugador: 'Prueba', semilla, ahoraISO: AHORA });
  if (!r.ok) throw new Error(r.errores.join('\n'));
  return r.state;
}
