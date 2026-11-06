import { describe, expect, it } from 'vitest';
import { evaluarAutoridad, topeAprobacion } from '@/engine/core/authority';
import type { GameState } from '@/domain/state';
import { nuevaPartida } from '../helpers';

const conGrado = (s: GameState, grado: 1 | 2 | 3): GameState => ({ ...s, meta: { ...s.meta, grado } });

describe('Prueba 2 — la selección del cargo aplica los permisos adecuados', () => {
  it('cada cargo tiene su tope de grado 1', () => {
    const esperado = { director_nacional: 120e6, director_comex: 120e6, director_regional: 60e6, coord_operaciones: 20e6, jefe_abastecimiento: 15e6, coord_calidad: 5e6, jefe_inventarios: 10e6, coord_transporte: 10e6, analista_planeacion: 0 } as const;
    for (const [cargo, tope] of Object.entries(esperado)) expect(topeAprobacion(nuevaPartida(cargo as never))).toBe(tope);
  });

  it('el ascenso multiplica el tope (×2 en grado 2, ×3 en grado 3)', () => {
    const s = nuevaPartida('jefe_abastecimiento');
    expect(topeAprobacion(conGrado(s, 2))).toBe(30e6);
    expect(topeAprobacion(conGrado(s, 3))).toBe(45e6);
  });

  it('Ronda 2: el Jefe de abastecimiento compra 1.000 unidades al alterno ($9.600.000) directamente', () => {
    const r = evaluarAutoridad(nuevaPartida('jefe_abastecimiento'), { tipo: 'compra', monto: 9_600_000 });
    expect(r.permitido).toBe(true);
  });

  it('una compra que supera el tope se escala al superior y no se aplica', () => {
    const r = evaluarAutoridad(nuevaPartida('jefe_abastecimiento'), { tipo: 'compra', monto: 15_000_001 });
    expect(r.permitido).toBe(false);
    if (!r.permitido) {
      expect(r.motivo).toBe('tope_excedido');
      expect(r.dirigidaA).toBe('director_regional');
      expect(r.procedimiento.length).toBeGreaterThan(0);
    }
  });

  it('el Analista de planeación propone pero no aprueba ningún gasto', () => {
    const r = evaluarAutoridad(nuevaPartida('analista_planeacion'), { tipo: 'ajustar_reposicion', monto: 1 });
    expect(r.permitido).toBe(false);
    if (!r.permitido) expect(r.dirigidaA).toBe('jefe_abastecimiento');
    expect(evaluarAutoridad(nuevaPartida('analista_planeacion'), { tipo: 'ajustar_pronostico', monto: 0 }).permitido).toBe(true);
  });

  it('una acción de otra área se coordina con su dueño', () => {
    const r = evaluarAutoridad(nuevaPartida('jefe_inventarios'), { tipo: 'contratar_transporte', monto: 500_000 });
    expect(r.permitido).toBe(false);
    if (!r.permitido) {
      expect(r.motivo).toBe('area_ajena');
      expect(r.dirigidaA).toBe('coord_transporte');
    }
    const c = evaluarAutoridad(nuevaPartida('jefe_inventarios'), { tipo: 'compra', monto: 100 });
    if (!c.permitido) expect(c.dirigidaA).toBe('jefe_abastecimiento');
  });

  it('liberar un lote siempre exige a Calidad, incluso a un director', () => {
    for (const cargo of ['director_nacional', 'director_regional', 'coord_operaciones', 'jefe_inventarios'] as const) {
      const r = evaluarAutoridad(nuevaPartida(cargo), { tipo: 'liberar_lote', monto: 0 });
      expect(r.permitido).toBe(false);
      if (!r.permitido) expect(r.motivo).toBe('autorizacion_calidad');
    }
    expect(evaluarAutoridad(nuevaPartida('coord_calidad'), { tipo: 'liberar_lote', monto: 0 }).permitido).toBe(true);
  });

  it('retener un lote es preventivo: cualquier cargo puede hacerlo', () => {
    for (const cargo of ['coord_transporte', 'analista_planeacion', 'director_comex'] as const) {
      expect(evaluarAutoridad(nuevaPartida(cargo), { tipo: 'bloquear_lote', monto: 0 }).permitido).toBe(true);
    }
  });

  it('los directores tienen mayor autoridad presupuestal que los especialistas', () => {
    const r = evaluarAutoridad(nuevaPartida('director_regional'), { tipo: 'contratar_transporte', monto: 40_000_000 });
    expect(r.permitido).toBe(true);
    const r2 = evaluarAutoridad(nuevaPartida('coord_transporte'), { tipo: 'contratar_transporte', monto: 40_000_000 });
    expect(r2.permitido).toBe(false);
  });
});
