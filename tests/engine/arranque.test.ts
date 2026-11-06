import { describe, expect, it } from 'vitest';
import { capacidadTransporte, existenciasPorSku, exactitudRealOculta, ocupacionCedi, producto } from '@/engine/core/selectors';
import { nuevaPartida } from '../helpers';

/** Comprobaciones de arranque del plan (sección «Datos iniciales y comprobación de arranque»). */
describe('Datos iniciales: la operación arranca viable y cada problema existe', () => {
  const s = nuevaPartida();
  const ex = existenciasPorSku(s);

  it('margen bruto positivo en los 20 SKU', () => {
    for (const p of s.config.productos) expect(p.precioVenta).toBeGreaterThan(p.costoUnitario);
  });

  it('cobertura ≥ 10 días en secos y procesados no afectados; refrigerados ≥ 2 plazos de su proveedor; aceite (Ronda 2) < 5 días', () => {
    for (const e of ex) {
      if (e.sku === 'AA-P04') continue;
      const p = producto(s, e.sku);
      if (p.categoria === 'refrigerado') {
        // Vida útil corta (21–90 días): se reponen con frecuencia; cubrir 10 días aumentaría la merma.
        const plazo = s.proveedores.find((x) => x.skus.includes(e.sku))!.plazoEntregaDias;
        expect(e.coberturaDias!, e.sku).toBeGreaterThanOrEqual(2 * plazo);
      } else {
        expect(e.coberturaDias!, e.sku).toBeGreaterThanOrEqual(10);
      }
    }
    const aceite = ex.find((e) => e.sku === 'AA-P04')!;
    expect(aceite.coberturaDias!).toBeLessThan(5);
  });

  it('los pedidos pendientes iniciales se pueden atender con el inventario disponible', () => {
    for (const e of ex) expect(e.disponible, e.sku).toBeGreaterThanOrEqual(e.comprometidaPedidos);
  });

  it('ocupación inicial del CEDI entre 75% y 80% (375–400 posiciones)', () => {
    const o = ocupacionCedi(s);
    expect(o.ocupadas).toBeGreaterThanOrEqual(375);
    expect(o.ocupadas).toBeLessThanOrEqual(400);
  });

  it('exactitud real inicial = 16 de 20 SKU (80%), bajo la meta del 98%', () => {
    expect(exactitudRealOculta(s)).toEqual({ coinciden: 16, total: 20 });
  });

  it('flota: cubre la demanda diaria normal con ~10% de holgura; frío cubierto', () => {
    const c = capacidadTransporte(s);
    const holgura = c.capacidadKgTotal / c.demandaKgDiaria;
    expect(holgura).toBeGreaterThanOrEqual(1.05);
    expect(holgura).toBeLessThanOrEqual(1.2);
    expect(c.capacidadRefrigeradaKg).toBeGreaterThanOrEqual(c.demandaRefrigeradaKgDiaria * 1.1);
  });

  it('hay lotes que vencen dentro de la Ronda 5 (días 29–35) para el escenario FEFO', () => {
    const enR5 = s.inventario.lotes.filter((l) => l.diaVencimiento >= 29 && l.diaVencimiento <= 35);
    expect(enR5.length).toBeGreaterThanOrEqual(3);
  });

  it('ningún lote inicial está vencido el día 1', () => {
    for (const l of s.inventario.lotes) expect(l.diaVencimiento, l.id).toBeGreaterThan(1);
  });

  it('los límites de temperatura vienen de la ficha técnica simulada', () => {
    for (const p of s.config.productos.filter((x) => x.categoria === 'refrigerado')) {
      expect(producto(s, p.sku).almacenamiento.fuente).toBe('Ficha técnica simulada');
      expect(p.almacenamiento.tempMinC).toBeDefined();
    }
  });

  it('el escenario de referencia de la Ronda 2 está en la configuración (8.000 habitual, 9.600 alterno, 5 y 1 días)', () => {
    const hab = s.proveedores.find((p) => p.id === 'PRV-03')!;
    const alt = s.proveedores.find((p) => p.id === 'PRV-04')!;
    expect([hab.precios['AA-P04'], hab.plazoEntregaDias]).toEqual([8000, 5]);
    expect([alt.precios['AA-P04'], alt.plazoEntregaDias]).toEqual([9600, 1]);
    expect(1000 * 8000).toBe(8_000_000);
    expect(400 * 9600 + 600 * 8000).toBe(8_640_000);
  });
});
