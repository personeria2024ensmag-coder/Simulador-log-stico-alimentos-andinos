import type {
  AreaId,
  CargoId,
  Cliente,
  ConexionMapa,
  DiferenciaFisicaOculta,
  EtapaId,
  Lote,
  NivelCargo,
  Nodo,
  Pedido,
  Producto,
  Proveedor,
  RecursoTransporte,
  TipoAccion,
} from './types';

export interface FichaCargo {
  id: CargoId;
  nombre: string;
  nivel: NivelCargo;
  /** 1 = más alto en el organigrama. */
  nivelJerarquico: number;
  reportaA: CargoId | 'gerencia_general';
  objetivo: string;
  responsabilidades: string[];
  indicadores: string[];
  recursosQueAutoriza: string[];
  requiereAprobacion: string[];
  riesgos: string[];
  objetivosDesempeno: string[];
  ejemplosDecisiones: string[];
  competencias: string[];
  /** Áreas cuyas acciones decide directamente. */
  areasPropias: AreaId[];
  /** Tope de aprobación de gasto en grado 1, COP. 0 = propone pero no aprueba gasto. */
  topeGrado1: number;
  profundidad: string;
}

export interface DefinicionRonda {
  numero: number;
  etapa: EtapaId;
  titulo: string;
  sintesis: string;
  mecanica: string;
  indicadores: string[];
  /** Fase del plan en que la ronda queda jugable. */
  faseImplementacion: number;
  diasSimulados: number;
}

export interface DimensionPuntaje {
  id: 'servicio' | 'costos' | 'inventarios' | 'cumplimiento' | 'resiliencia' | 'sostenibilidad';
  nombre: string;
  peso: number;
  indicadores: string[];
}

export interface RequisitosAscenso {
  puntuacionMinima: number;
  otifMinimo: number;
  exactitudMinima: number;
  mermaMaxima: number;
  cajaMinimaFraccionCapital: number;
}

export interface UmbralesAlerta {
  ocupacionCediAdvertencia: number;
  ocupacionCediCritica: number;
  coberturaDiasAdvertencia: number;
  vencimientoDiasAdvertencia: number;
  cajaFraccionAdvertencia: number;
}

export interface InventarioInicialSku {
  sku: string;
  lotes: { cantidad: number; diaRecepcion: number; ubicacion: string; costoUnitario?: number }[];
}

export interface SimConfig {
  version: string;
  descripcion: string;
  empresa: {
    nombre: string;
    capitalInicial: number;
    clientesActivos: number;
    capacidadCediPallets: number;
    /** Posiciones ocupadas por elementos no vendibles (estibas vacías, averías, material de empaque). */
    posicionesNoDisponibles: number;
    vehiculosPropios: number;
    transportadoresContratados: number;
    horizontePlanificacionDias: number;
    metaOtif: number;
    metaExactitud: number;
    umbralMerma: number;
    diasPagoProveedores: number;
  };
  presupuestoEtapa: Record<EtapaId, { logistico: number; compras: number }>;
  topeMultiplicadorGrado: Record<1 | 2 | 3, number>;
  areaPorAccion: Record<TipoAccion, AreaId>;
  /** Acciones que siempre requieren autorización del área de calidad. */
  accionesConAutorizacionCalidad: TipoAccion[];
  /** Acciones preventivas que cualquier cargo puede ejecutar (p. ej. retener un lote ante una alerta). */
  accionesPreventivasAbiertas: TipoAccion[];
  cargos: FichaCargo[];
  productos: Producto[];
  nodos: Nodo[];
  conexiones: ConexionMapa[];
  clientes: Cliente[];
  proveedores: Proveedor[];
  flota: RecursoTransporte[];
  inventarioInicial: InventarioInicialSku[];
  diferenciasFisicas: (Omit<DiferenciaFisicaOculta, 'loteId'> & { sku: string; indiceLote: number })[];
  pedidosIniciales: Omit<Pedido, 'estado' | 'costosAsociados' | 'motivos' | 'entregas'>[];
  rondas: DefinicionRonda[];
  puntuacion: { dimensiones: DimensionPuntaje[] };
  ascenso: RequisitosAscenso;
  alertas: UmbralesAlerta;
}

export type LoteInicial = Lote;
