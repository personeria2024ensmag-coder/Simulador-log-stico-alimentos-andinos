import type { SimConfig } from '@/domain/config';
import { huella, validarConfiguracion } from '@/domain/configSchema';
import { SCHEMA_VERSION, type GameState } from '@/domain/state';
import type { AsientoFinanciero, CargoId, Lote, MovimientoInventario, Pedido } from '@/domain/types';
import { verificarInvariantes } from './invariants';

export interface OpcionesNuevaPartida {
  cargo: CargoId;
  nombreJugador: string;
  semilla: number;
  /** Fecha real ISO, solo como registro. El motor no la usa para calcular. */
  ahoraISO: string;
}

export type ResultadoCreacion = { ok: true; state: GameState } | { ok: false; errores: string[] };

/**
 * Crea el estado inicial de una partida a partir de una configuración.
 * La partida guarda una copia profunda de la configuración (versionada) para que
 * cambios posteriores en la configuración general no la alteren.
 */
export function crearPartida(configuracion: SimConfig, op: OpcionesNuevaPartida): ResultadoCreacion {
  const validacion = validarConfiguracion(configuracion);
  if (!validacion.valida) return { ok: false, errores: validacion.errores };
  if (!configuracion.cargos.some((c) => c.id === op.cargo)) return { ok: false, errores: ['El cargo seleccionado no existe en la configuración.'] };
  if (!Number.isInteger(op.semilla) || op.semilla < 0) return { ok: false, errores: ['La semilla debe ser un entero no negativo.'] };

  const config: SimConfig = structuredClone(configuracion);
  const dia = 1;

  const lotes: Lote[] = [];
  const movimientos: MovimientoInventario[] = [];
  let valorInventario = 0;
  for (const inv of config.inventarioInicial) {
    const prod = config.productos.find((p) => p.sku === inv.sku)!;
    inv.lotes.forEach((l, i) => {
      const id = `L-${inv.sku}-${String(i + 1).padStart(2, '0')}`;
      const costo = l.costoUnitario ?? prod.costoUnitario;
      lotes.push({
        id,
        sku: inv.sku,
        nodoId: 'CEDI-GIR',
        ubicacion: l.ubicacion,
        diaRecepcion: l.diaRecepcion,
        diaVencimiento: l.diaRecepcion + prod.vidaUtilDias,
        estadoCalidad: 'apto',
        costoUnitario: costo,
      });
      movimientos.push({ id: `MOV-${id}-0`, loteId: id, tipo: 'saldo_inicial', delta: l.cantidad, dia: 0, motivo: 'Saldo inicial registrado en el sistema', referencia: 'CONFIG', autor: 'sistema' });
      valorInventario += l.cantidad * costo;
    });
  }

  const diferenciasOcultas = config.diferenciasFisicas.map((d) => {
    const lote = lotes.filter((l) => l.sku === d.sku)[d.indiceLote];
    if (!lote) throw new Error(`Diferencia física apunta a un lote inexistente: ${d.sku}#${d.indiceLote}`);
    return { loteId: lote.id, diferencia: d.diferencia, ubicacionReal: d.ubicacionReal, causa: d.causa };
  });

  const pedidos: Pedido[] = config.pedidosIniciales.map((p) => ({
    ...structuredClone(p),
    estado: 'pendiente',
    costosAsociados: 0,
    motivos: [],
    entregas: [],
  }));

  const pres = config.presupuestoEtapa[1];
  const asientos: AsientoFinanciero[] = [
    { id: 'FIN-0001', tipo: 'aporte_capital', monto: config.empresa.capitalInicial, moneda: 'COP', dia: 0, referencia: 'CAPITAL', clave: 'CAPITAL:aporte_capital', descripcion: 'Capital operativo inicial (caja disponible)' },
    { id: 'FIN-0002', tipo: 'activo_inventario', monto: valorInventario, moneda: 'COP', dia: 0, referencia: 'INV-INICIAL', clave: 'INV-INICIAL:activo_inventario', descripcion: 'Inventario inicial valorado al costo (activo, no es gasto ni caja)' },
    { id: 'FIN-0003', tipo: 'presupuesto', categoria: 'transporte', monto: pres.logistico, moneda: 'COP', dia: 0, referencia: 'PRES-E1-LOG', clave: 'PRES-E1-LOG:presupuesto', descripcion: 'Presupuesto logístico aprobado — Etapa I' },
    { id: 'FIN-0004', tipo: 'presupuesto', categoria: 'compra_mercancia', monto: pres.compras, moneda: 'COP', dia: 0, referencia: 'PRES-E1-COM', clave: 'PRES-E1-COM:presupuesto', descripcion: 'Presupuesto de compras aprobado — Etapa I' },
  ];

  const cargo = config.cargos.find((c) => c.id === op.cargo)!;
  const state: GameState = {
    schemaVersion: SCHEMA_VERSION,
    meta: {
      id: `AA-${op.semilla.toString(36).toUpperCase()}`,
      nombreJugador: op.nombreJugador.trim() || 'Jugador',
      creadaEn: op.ahoraISO,
      actualizadaEn: op.ahoraISO,
      estado: 'en_curso',
      cargo: op.cargo,
      grado: 1,
      semilla: op.semilla,
      versionConfiguracion: config.version,
      huellaConfiguracion: huella(config),
    },
    config,
    reloj: { dia, ronda: 1, etapa: 1 },
    rng: { semilla: op.semilla, estado: op.semilla },
    contadores: { decision: 0, movimiento: 0, asiento: asientos.length, evento: 0, bitacora: 2 },
    inventario: { lotes, movimientos, reservas: [], retenciones: [], diferenciasOcultas, conteos: [] },
    pedidos,
    clientes: structuredClone(config.clientes),
    proveedores: structuredClone(config.proveedores),
    ordenesCompra: [],
    flota: structuredClone(config.flota),
    viajes: [],
    finanzas: { asientos },
    eventos: [],
    efectosProgramados: [],
    decisiones: [],
    escalamientos: [],
    indicadores: [],
    bitacora: [
      { id: 'BIT-0001', dia: 0, ronda: 1, tipo: 'sistema', mensaje: `Partida creada. Cargo: ${cargo.nombre}. Semilla registrada: ${op.semilla}.` },
      { id: 'BIT-0002', dia: 0, ronda: 1, tipo: 'sistema', mensaje: `Configuración ${config.version} copiada en la partida (huella ${huella(config)}).` },
    ],
  };

  const errores = verificarInvariantes(state);
  if (errores.length) return { ok: false, errores };
  return { ok: true, state };
}
