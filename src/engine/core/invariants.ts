import type { GameState } from '@/domain/state';
import { fisicaRegistradaLote, reservadaLote } from './selectors';

/**
 * Invariantes globales. El motor las comprueba después de cada cambio;
 * si alguna falla, el cambio completo se descarta.
 */
export function verificarInvariantes(state: GameState): string[] {
  const errores: string[] = [];
  const lotes = new Map(state.inventario.lotes.map((l) => [l.id, l]));

  for (const m of state.inventario.movimientos) {
    if (!lotes.has(m.loteId)) errores.push(`Movimiento ${m.id} apunta a un lote inexistente.`);
    if (!Number.isInteger(m.delta)) errores.push(`Movimiento ${m.id} tiene una cantidad no entera.`);
  }
  for (const l of state.inventario.lotes) {
    const fisica = fisicaRegistradaLote(state, l.id);
    if (fisica < 0) errores.push(`El lote ${l.id} quedaría con existencia negativa (${fisica}).`);
    const reservada = reservadaLote(state, l.id);
    if (reservada > fisica) errores.push(`El lote ${l.id} tendría más unidades reservadas (${reservada}) que físicas (${fisica}).`);
  }
  for (const r of state.inventario.reservas) {
    if (r.cantidad <= 0) errores.push(`La reserva ${r.id} tiene una cantidad no positiva.`);
    const lote = lotes.get(r.loteId);
    if (lote && r.estado === 'activa' && lote.estadoCalidad !== 'apto') errores.push(`La reserva ${r.id} está sobre un lote no apto (${lote.id}).`);
  }
  const claves = new Set<string>();
  for (const a of state.finanzas.asientos) {
    if (claves.has(a.clave)) errores.push(`El asiento con clave ${a.clave} está duplicado.`);
    claves.add(a.clave);
    if (!Number.isInteger(a.monto) || a.monto < 0) errores.push(`El asiento ${a.id} tiene un monto inválido.`);
  }
  for (const p of state.pedidos) {
    for (const ln of p.lineas) {
      if (ln.entregada > ln.despachada) errores.push(`El pedido ${p.id} tendría más unidades entregadas que despachadas en ${ln.sku}.`);
      if (ln.despachada > ln.solicitada) errores.push(`El pedido ${p.id} tendría más unidades despachadas que solicitadas en ${ln.sku}.`);
      if ([ln.solicitada, ln.reservada, ln.preparada, ln.despachada, ln.entregada].some((x) => x < 0)) errores.push(`El pedido ${p.id} tiene cantidades negativas.`);
    }
  }
  const ocupacion = new Map<string, string>();
  for (const v of state.viajes) {
    if (v.estado === 'cancelado' || v.estado === 'completado') continue;
    const k = `${v.recursoId}@${v.dia}`;
    if (ocupacion.has(k)) errores.push(`El recurso ${v.recursoId} tendría dos viajes el día ${v.dia}.`);
    ocupacion.set(k, v.id);
  }
  return errores;
}
