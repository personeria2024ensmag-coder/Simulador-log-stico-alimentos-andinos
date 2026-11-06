import type { GameState } from '@/domain/state';
import type { Lote, Producto } from '@/domain/types';

/**
 * Selectores puros: todo lo que se muestra se deriva del estado, nunca se guarda duplicado.
 */

export function producto(state: GameState, sku: string): Producto {
  const p = state.config.productos.find((x) => x.sku === sku);
  if (!p) throw new Error(`SKU desconocido: ${sku}`);
  return p;
}

/** Existencia física registrada en el sistema para un lote (suma del libro de movimientos). */
export function fisicaRegistradaLote(state: GameState, loteId: string): number {
  let total = 0;
  for (const m of state.inventario.movimientos) if (m.loteId === loteId) total += m.delta;
  return total;
}

export function reservadaLote(state: GameState, loteId: string): number {
  let total = 0;
  for (const r of state.inventario.reservas) if (r.loteId === loteId && r.estado === 'activa') total += r.cantidad;
  return total;
}

export function bloqueadaLote(state: GameState, lote: Lote): number {
  if (lote.estadoCalidad !== 'apto') return fisicaRegistradaLote(state, lote.id);
  let total = 0;
  for (const r of state.inventario.retenciones) if (r.loteId === lote.id && r.estado === 'abierta') total += r.cantidad;
  return total;
}

export interface ExistenciaLote {
  lote: Lote;
  fisica: number;
  reservada: number;
  bloqueada: number;
  disponible: number;
}

export function existenciaLote(state: GameState, lote: Lote): ExistenciaLote {
  const fisica = fisicaRegistradaLote(state, lote.id);
  const reservada = reservadaLote(state, lote.id);
  const bloqueada = Math.min(fisica, bloqueadaLote(state, lote));
  const disponible = Math.max(0, fisica - reservada - bloqueada);
  return { lote, fisica, reservada, bloqueada, disponible };
}

export interface ExistenciaSku {
  sku: string;
  fisica: number;
  reservada: number;
  bloqueada: number;
  disponible: number;
  enTransito: number;
  comprometidaPedidos: number;
  enDevolucion: number;
  valorCosto: number;
  pallets: number;
  coberturaDias: number | null;
  proximoVencimiento: number | null;
}

export function existenciasPorSku(state: GameState): ExistenciaSku[] {
  return state.config.productos.map((p) => {
    const lotes = state.inventario.lotes.filter((l) => l.sku === p.sku);
    let fisica = 0, reservada = 0, bloqueada = 0, disponible = 0, valor = 0, pallets = 0;
    let proximo: number | null = null;
    for (const l of lotes) {
      const e = existenciaLote(state, l);
      fisica += e.fisica;
      reservada += e.reservada;
      bloqueada += e.bloqueada;
      disponible += e.disponible;
      valor += e.fisica * l.costoUnitario;
      if (e.fisica > 0) {
        pallets += Math.ceil(e.fisica / p.unidadesPorPallet);
        if (proximo === null || l.diaVencimiento < proximo) proximo = l.diaVencimiento;
      }
    }
    let enTransito = 0;
    for (const oc of state.ordenesCompra) {
      if (oc.estado === 'emitida' || oc.estado === 'en_transito' || oc.estado === 'recibida_parcial') {
        for (const ln of oc.lineas) if (ln.sku === p.sku) enTransito += ln.cantidad - ln.recibida;
      }
    }
    let comprometida = 0;
    for (const ped of state.pedidos) {
      if (ped.estado === 'cancelado' || ped.estado === 'entregado') continue;
      for (const ln of ped.lineas) if (ln.sku === p.sku) comprometida += Math.max(0, ln.solicitada - ln.entregada);
    }
    const cobertura = p.demandaDiariaBase > 0 ? disponible / p.demandaDiariaBase : null;
    return {
      sku: p.sku,
      fisica,
      reservada,
      bloqueada,
      disponible,
      enTransito,
      comprometidaPedidos: comprometida,
      enDevolucion: 0,
      valorCosto: valor,
      pallets,
      coberturaDias: cobertura,
      proximoVencimiento: proximo,
    };
  });
}

export interface OcupacionCedi {
  capacidad: number;
  palletsProducto: number;
  noDisponibles: number;
  ocupadas: number;
  fraccion: number;
}

export function ocupacionCedi(state: GameState): OcupacionCedi {
  const palletsProducto = existenciasPorSku(state).reduce((s, e) => s + e.pallets, 0);
  const capacidad = state.config.empresa.capacidadCediPallets;
  const noDisponibles = state.config.empresa.posicionesNoDisponibles;
  const ocupadas = palletsProducto + noDisponibles;
  return { capacidad, palletsProducto, noDisponibles, ocupadas, fraccion: ocupadas / capacidad };
}

export interface ResumenFinanciero {
  caja: number;
  presupuestoLogistico: number;
  presupuestoCompras: number;
  comprometido: number;
  costosReconocidos: number;
  pagos: number;
  ingresos: number;
  inventarioValorizado: number;
}

/**
 * Caja = aportes + cobros − pagos. El compromiso no mueve caja; el costo reconocido tampoco hasta que se paga.
 * Esta separación evita contar dos veces una misma compra.
 */
export function resumenFinanciero(state: GameState): ResumenFinanciero {
  let caja = 0, presupuestoLogistico = 0, presupuestoCompras = 0, comprometido = 0, costos = 0, pagos = 0, ingresos = 0;
  for (const a of state.finanzas.asientos) {
    switch (a.tipo) {
      case 'aporte_capital': caja += a.monto; break;
      case 'cobro': caja += a.monto; break;
      case 'pago': caja -= a.monto; pagos += a.monto; break;
      case 'presupuesto':
        if (a.categoria === 'compra_mercancia') presupuestoCompras += a.monto;
        else presupuestoLogistico += a.monto;
        break;
      case 'compromiso': comprometido += a.monto; break;
      case 'liberacion_compromiso': comprometido -= a.monto; break;
      case 'costo': costos += a.monto; break;
      case 'ingreso': ingresos += a.monto; break;
      case 'activo_inventario': break;
    }
  }
  const inventarioValorizado = existenciasPorSku(state).reduce((s, e) => s + e.valorCosto, 0);
  return { caja, presupuestoLogistico, presupuestoCompras, comprometido, costosReconocidos: costos, pagos, ingresos, inventarioValorizado };
}

export interface CapacidadTransporte {
  capacidadKgDisponible: number;
  capacidadKgTotal: number;
  capacidadRefrigeradaKg: number;
  vehiculosDisponibles: number;
  vehiculosTotales: number;
  demandaKgDiaria: number;
  demandaRefrigeradaKgDiaria: number;
}

/** Capacidad diaria de despacho (una ruta por vehículo y día). Un vehículo averiado no suma capacidad. */
export function capacidadTransporte(state: GameState): CapacidadTransporte {
  let disp = 0, total = 0, frio = 0, vd = 0;
  for (const v of state.flota) {
    total += v.capacidadKg;
    if (v.estado === 'disponible') {
      disp += v.capacidadKg;
      vd += 1;
      if (v.refrigerado) frio += v.capacidadKg;
    }
  }
  let dem = 0, demFrio = 0;
  for (const p of state.config.productos) {
    const kg = p.demandaDiariaBase * p.pesoKgUnidad;
    dem += kg;
    if (p.categoria === 'refrigerado') demFrio += kg;
  }
  return { capacidadKgDisponible: disp, capacidadKgTotal: total, capacidadRefrigeradaKg: frio, vehiculosDisponibles: vd, vehiculosTotales: state.flota.length, demandaKgDiaria: dem, demandaRefrigeradaKgDiaria: demFrio };
}

export function pedidosPendientes(state: GameState) {
  return state.pedidos.filter((p) => !['entregado', 'cancelado'].includes(p.estado));
}

/** Exactitud real oculta (para comprobar el escenario). El jugador solo ve la exactitud de lo que ha contado. */
export function exactitudRealOculta(state: GameState): { coinciden: number; total: number } {
  const skusConDiferencia = new Set(
    state.inventario.diferenciasOcultas.filter((d) => d.diferencia !== 0).map((d) => state.inventario.lotes.find((l) => l.id === d.loteId)?.sku),
  );
  const total = state.config.productos.length;
  return { coinciden: total - skusConDiferencia.size, total };
}

export interface Alerta {
  id: string;
  nivel: 'info' | 'advertencia' | 'critica';
  titulo: string;
  detalle: string;
}

export function alertas(state: GameState): Alerta[] {
  const out: Alerta[] = [];
  const u = state.config.alertas;
  const occ = ocupacionCedi(state);
  if (occ.fraccion >= u.ocupacionCediCritica) out.push({ id: 'ocupacion', nivel: 'critica', titulo: 'CEDI al límite', detalle: `Ocupación de ${(occ.fraccion * 100).toLocaleString('es-CO', { maximumFractionDigits: 1 })}%.` });
  else if (occ.fraccion >= u.ocupacionCediAdvertencia) out.push({ id: 'ocupacion', nivel: 'advertencia', titulo: 'Ocupación alta del CEDI', detalle: `Ocupación de ${(occ.fraccion * 100).toLocaleString('es-CO', { maximumFractionDigits: 1 })}%.` });

  const ex = existenciasPorSku(state);
  for (const e of ex) {
    const p = producto(state, e.sku);
    if (e.coberturaDias !== null && e.coberturaDias < u.coberturaDiasAdvertencia) {
      out.push({ id: `cobertura-${e.sku}`, nivel: e.disponible < e.comprometidaPedidos ? 'critica' : 'advertencia', titulo: `Cobertura baja: ${p.nombre}`, detalle: `${e.disponible.toLocaleString('es-CO')} unidades disponibles cubren ${e.coberturaDias.toLocaleString('es-CO', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} días de demanda base; hay ${e.comprometidaPedidos.toLocaleString('es-CO')} comprometidas en pedidos.` });
    }
  }
  for (const l of state.inventario.lotes) {
    const restantes = l.diaVencimiento - state.reloj.dia;
    if (fisicaRegistradaLote(state, l.id) > 0 && restantes <= u.vencimientoDiasAdvertencia) {
      const p = producto(state, l.sku);
      out.push({ id: `venc-${l.id}`, nivel: restantes <= 3 ? 'critica' : 'advertencia', titulo: `Lote por vencer: ${p.nombre}`, detalle: `El lote ${l.id} vence en ${restantes} día(s) simulados.` });
    }
  }
  const pend = pedidosPendientes(state);
  const vencidos = pend.filter((p) => p.diaPrometido <= state.reloj.dia);
  if (vencidos.length) out.push({ id: 'pedidos-hoy', nivel: 'advertencia', titulo: 'Pedidos con promesa para hoy o vencida', detalle: `${vencidos.length} pedido(s) deben entregarse a más tardar hoy (día ${state.reloj.dia}).` });
  const fin = resumenFinanciero(state);
  if (fin.caja < state.config.empresa.capitalInicial * u.cajaFraccionAdvertencia) out.push({ id: 'caja', nivel: 'critica', titulo: 'Caja baja', detalle: 'La caja está por debajo del umbral de alerta.' });
  const orden = { critica: 0, advertencia: 1, info: 2 } as const;
  return out.sort((a, b) => orden[a.nivel] - orden[b.nivel]);
}
