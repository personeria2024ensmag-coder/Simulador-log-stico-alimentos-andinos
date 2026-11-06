import type { SimConfig } from './config';
import type {
  AsientoFinanciero,
  Cliente,
  DiferenciaFisicaOculta,
  EfectoProgramado,
  EntradaBitacora,
  EtapaId,
  EventoPartida,
  IndicadorCierre,
  Lote,
  MetaPartida,
  MovimientoInventario,
  OrdenCompra,
  Pedido,
  Proveedor,
  RecursoTransporte,
  RegistroDecision,
  Reserva,
  RetencionCalidad,
  SolicitudEscalamiento,
  Viaje,
} from './types';

export const SCHEMA_VERSION = 1;

/** Estado completo y serializable de una partida. */
export interface GameState {
  schemaVersion: number;
  meta: MetaPartida;
  /** Copia de la configuración con la que empezó la partida. No cambia si cambia la configuración general. */
  config: SimConfig;
  reloj: { dia: number; ronda: number; etapa: EtapaId };
  rng: { semilla: number; estado: number };
  contadores: Record<string, number>;
  inventario: {
    lotes: Lote[];
    movimientos: MovimientoInventario[];
    reservas: Reserva[];
    retenciones: RetencionCalidad[];
    /** Diferencias físicas no descubiertas (verdad oculta del escenario). */
    diferenciasOcultas: DiferenciaFisicaOculta[];
    /** SKU contados con su resultado, para el indicador de exactitud. */
    conteos: { dia: number; sku: string; coincide: boolean; diferencia: number }[];
  };
  pedidos: Pedido[];
  clientes: Cliente[];
  proveedores: Proveedor[];
  ordenesCompra: OrdenCompra[];
  flota: RecursoTransporte[];
  viajes: Viaje[];
  finanzas: { asientos: AsientoFinanciero[] };
  eventos: EventoPartida[];
  efectosProgramados: EfectoProgramado[];
  decisiones: RegistroDecision[];
  escalamientos: SolicitudEscalamiento[];
  indicadores: IndicadorCierre[];
  bitacora: EntradaBitacora[];
}
