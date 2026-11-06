import { describe, expect, it } from 'vitest';
import { CONFIG_V1 } from '@/data/config-v1';
import { validarConfiguracion } from '@/domain/configSchema';
import { crearPartida } from '@/engine/core/createGame';
import { AHORA } from '../helpers';

describe('Validación de configuración (base de la prueba 19)', () => {
  it('la configuración v1 es válida', () => {
    expect(validarConfiguracion(CONFIG_V1)).toEqual({ valida: true, errores: [] });
  });

  it('rechaza una configuración inválida con mensajes comprensibles', () => {
    const mala = structuredClone(CONFIG_V1);
    mala.empresa.capitalInicial = -5;
    const r = validarConfiguracion(mala);
    expect(r.valida).toBe(false);
    expect(r.errores.join(' ')).toMatch(/capital inicial/i);
  });

  it('detecta precio menor que costo y pesos de puntuación que no suman 100%', () => {
    const mala = structuredClone(CONFIG_V1);
    mala.productos[0]!.precioVenta = 1000;
    mala.puntuacion.dimensiones[0]!.peso = 0.5;
    const r = validarConfiguracion(mala);
    expect(r.errores.some((e) => e.includes('pérdida'))).toBe(true);
    expect(r.errores.some((e) => e.includes('100%'))).toBe(true);
  });

  it('no deja crear una partida con una configuración inválida', () => {
    const mala = structuredClone(CONFIG_V1);
    mala.empresa.capacidadCediPallets = 0;
    const r = crearPartida(mala, { cargo: 'coord_operaciones', nombreJugador: 'x', semilla: 1, ahoraISO: AHORA });
    expect(r.ok).toBe(false);
  });
});
