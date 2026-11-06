import { describe, expect, it } from 'vitest';
import { CONFIG_V1 } from '@/data/config-v1';
import { crearPartida } from '@/engine/core/createGame';
import { existenciasPorSku, resumenFinanciero, ocupacionCedi, pedidosPendientes } from '@/engine/core/selectors';
import { verificarInvariantes } from '@/engine/core/invariants';
import { huella } from '@/domain/configSchema';
import { AHORA, nuevaPartida } from '../helpers';

describe('Prueba 1 — la creación de una partida genera el estado inicial correcto', () => {
  const s = nuevaPartida();

  it('arranca en día 1, ronda 1, etapa regional, grado 1, en curso', () => {
    expect(s.reloj).toEqual({ dia: 1, ronda: 1, etapa: 1 });
    expect(s.meta.grado).toBe(1);
    expect(s.meta.estado).toBe('en_curso');
    expect(s.meta.cargo).toBe('coord_operaciones');
  });

  it('registra la semilla y la versión y huella de la configuración', () => {
    expect(s.meta.semilla).toBe(12345);
    expect(s.rng.semilla).toBe(12345);
    expect(s.meta.versionConfiguracion).toBe('1.0.0');
    expect(s.meta.huellaConfiguracion).toBe(huella(CONFIG_V1));
  });

  it('caja inicial = capital operativo de $250.000.000; nada comprometido ni pagado', () => {
    const f = resumenFinanciero(s);
    expect(f.caja).toBe(250_000_000);
    expect(f.comprometido).toBe(0);
    expect(f.pagos).toBe(0);
    expect(f.ingresos).toBe(0);
    expect(f.presupuestoLogistico).toBe(180_000_000);
  });

  it('carga 20 SKU, 25 clientes, 4 vehículos propios y 2 contratados', () => {
    expect(s.config.productos).toHaveLength(20);
    expect(s.clientes).toHaveLength(25);
    expect(s.flota.filter((v) => v.tipo === 'propio')).toHaveLength(4);
    expect(s.flota.filter((v) => v.tipo === 'contratado')).toHaveLength(2);
  });

  it('el inventario registrado coincide con la configuración, sin reservas, bloqueos ni tránsito', () => {
    const ex = existenciasPorSku(s);
    for (const inv of CONFIG_V1.inventarioInicial) {
      const total = inv.lotes.reduce((a, l) => a + l.cantidad, 0);
      const e = ex.find((x) => x.sku === inv.sku)!;
      expect(e.fisica).toBe(total);
      expect(e.disponible).toBe(total);
      expect(e.reservada).toBe(0);
      expect(e.bloqueada).toBe(0);
      expect(e.enTransito).toBe(0);
    }
  });

  it('el inventario inicial se registra como activo y no toca la caja', () => {
    const activo = s.finanzas.asientos.find((a) => a.tipo === 'activo_inventario')!;
    const valor = existenciasPorSku(s).reduce((a, e) => a + e.valorCosto, 0);
    expect(activo.monto).toBe(valor);
    expect(resumenFinanciero(s).caja).toBe(250_000_000);
  });

  it('hay 6 pedidos pendientes y ningún indicador histórico inventado', () => {
    expect(pedidosPendientes(s)).toHaveLength(6);
    expect(s.indicadores).toHaveLength(0);
    expect(s.decisiones).toHaveLength(0);
    expect(s.viajes).toHaveLength(0);
    expect(s.finanzas.asientos.some((a) => a.tipo === 'ingreso')).toBe(false);
  });

  it('cumple todas las invariantes', () => {
    expect(verificarInvariantes(s)).toEqual([]);
    expect(ocupacionCedi(s).ocupadas).toBeLessThanOrEqual(500);
  });

  it('la partida guarda una copia independiente de la configuración', () => {
    expect(s.config).not.toBe(CONFIG_V1);
    expect(s.config).toEqual(CONFIG_V1);
  });

  it('es determinista: misma semilla, mismo estado', () => {
    expect(JSON.stringify(nuevaPartida('coord_operaciones', 12345))).toBe(JSON.stringify(s));
  });

  it('rechaza un cargo inexistente o una semilla inválida con mensaje comprensible', () => {
    const r1 = crearPartida(CONFIG_V1, { cargo: 'gerente' as never, nombreJugador: 'x', semilla: 1, ahoraISO: AHORA });
    expect(r1.ok).toBe(false);
    const r2 = crearPartida(CONFIG_V1, { cargo: 'coord_operaciones', nombreJugador: 'x', semilla: -4, ahoraISO: AHORA });
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.errores[0]).toMatch(/semilla/);
  });
});
