/**
 * Modelo de dominio del simulador Alimentos Andinos S.A.S.
 *
 * Convenciones:
 * - Cantidades en unidades enteras del producto.
 * - Dinero en pesos colombianos (COP) enteros. Las operaciones en USD guardan la moneda y la tasa usada.
 * - El tiempo es un día simulado entero (día 1 = inicio de la campaña). Nunca se usa la fecha real en el motor.
 * - Todos los datos son ficticios (datos de simulación).
 */

export type Money = number;
export type Dia = number;

export type EtapaId = 1 | 2 | 3;
export type Grado = 1 | 2 | 3;

export type CargoId =
  | 'coord_operaciones'
  | 'jefe_inventarios'
  | 'coord_transporte'
  | 'jefe_abastecimiento'
  | 'analista_planeacion'
  | 'coord_calidad'
  | 'director_regional'
  | 'director_nacional'
  | 'director_comex';

/** Áreas funcionales: cada acción del simulador pertenece a una sola área. */
export type AreaId =
  | 'inventarios'
  | 'transporte'
  | 'abastecimiento'
  | 'planeacion'
  | 'calidad'
  | 'operaciones'
  | 'finanzas'
  | 'red_nacional'
  | 'comercio_exterior';

export type NivelCargo = 'directivo' | 'tactico' | 'operativo';

/** Tipos de acción que el motor reconoce. Cada uno declara su área dueña en la configuración. */
export type TipoAccion =
  | 'conteo_inventario'
  | 'ajuste_inventario'
  | 'reubicacion'
  | 'compra'
  | 'recepcion'
  | 'reserva_pedido'
  | 'despacho'
  | 'asignar_transporte'
  | 'contratar_transporte'
  | 'reprogramar_pedido'
  | 'cancelar_pedido'
  | 'bloquear_lote'
  | 'liberar_lote'
  | 'destino_producto_no_apto'
  | 'transferencia'
  | 'ajustar_pronostico'
  | 'ajustar_reposicion'
  | 'reasignar_presupuesto'
  | 'contrato_transportador'
  | 'inversion_red'
  | 'confirmar_exportacion'
  | 'seleccion_transporte_internacional'
  | 'activar_contingencia';

export type CategoriaProducto = 'seco' | 'procesado' | 'refrigerado';
export type ReglaRotacion = 'FIFO' | 'FEFO';

export interface CondicionesAlmacenamiento {
  tipo: 'ambiente' | 'refrigerado';
  /** Límites del escenario. Proceden de la ficha técnica simulada del producto; no son criterio legal. */
  tempMinC?: number;
  tempMaxC?: number;
  fuente: 'Ficha técnica simulada';
  observaciones: string;
}

export interface Producto {
  sku: string;
  nombre: string;
  categoria: CategoriaProducto;
  unidadMedida: string;
  unidadesPorPallet: number;
  pesoKgUnidad: number;
  costoUnitario: Money;
  precioVenta: Money;
  almacenamiento: CondicionesAlmacenamiento;
  vidaUtilDias: number;
  rotacion: ReglaRotacion;
  /** Demanda base pronosticada (unidades por día). Dato de simulación, no histórico. */
  demandaDiariaBase: number;
  activo: boolean;
}

export type TipoNodo = 'cedi' | 'municipio' | 'ciudad' | 'puerto' | 'destino_internacional';

export interface Nodo {
  id: string;
  nombre: string;
  tipo: TipoNodo;
  etapa: EtapaId;
  pais: 'Colombia' | 'Panamá';
  capacidadPallets?: number;
  /** Posición en el mapa ilustrativo (0–1000 × 0–700). No es una coordenada geográfica. */
  x: number;
  y: number;
}

export interface ConexionMapa {
  desde: string;
  hasta: string;
  etapa: EtapaId;
  /** Distancia simulada en km. No es una medición geográfica. */
  distanciaSimKm: number;
  /** Tiempo de tránsito simulado en horas. */
  tiempoSimHoras: number;
  modo: 'terrestre' | 'maritimo' | 'aereo';
}

export type EstadoCalidad = 'apto' | 'cuarentena' | 'bloqueado' | 'rechazado';

export interface Lote {
  id: string;
  sku: string;
  nodoId: string;
  ubicacion: string;
  diaRecepcion: Dia;
  diaVencimiento: Dia;
  estadoCalidad: EstadoCalidad;
  costoUnitario: Money;
}

export type TipoMovimiento =
  | 'saldo_inicial'
  | 'recepcion'
  | 'despacho'
  | 'ajuste'
  | 'merma'
  | 'transferencia_salida'
  | 'transferencia_entrada'
  | 'devolucion';

/** Libro de movimientos: solo se agregan registros. La existencia física registrada es la suma de deltas por lote. */
export interface MovimientoInventario {
  id: string;
  loteId: string;
  tipo: TipoMovimiento;
  delta: number;
  dia: Dia;
  motivo: string;
  referencia: string;
  autor: string;
}

export interface Reserva {
  id: string;
  pedidoId: string;
  loteId: string;
  cantidad: number;
  estado: 'activa' | 'consumida' | 'liberada';
}

export interface RetencionCalidad {
  id: string;
  loteId: string;
  cantidad: number;
  motivo: string;
  verificacionesRequeridas: string[];
  verificacionesHechas: string[];
  autorizaciones: string[];
  estado: 'abierta' | 'liberada' | 'rechazada';
  diaApertura: Dia;
}

/**
 * Verdad física oculta para escenarios de exactitud de inventario.
 * El jugador solo la descubre mediante conteos. No se muestra en pantalla.
 */
export interface DiferenciaFisicaOculta {
  loteId: string;
  /** Unidades físicas reales − unidades registradas en el sistema. */
  diferencia: number;
  /** Ubicación física real cuando la mercancía está mal ubicada. */
  ubicacionReal?: string;
  causa: string;
}

export type EstadoPedido =
  | 'pendiente'
  | 'reservado'
  | 'en_preparacion'
  | 'despachado'
  | 'parcialmente_entregado'
  | 'entregado'
  | 'cancelado'
  | 'en_devolucion';

export interface LineaPedido {
  sku: string;
  solicitada: number;
  reservada: number;
  preparada: number;
  despachada: number;
  entregada: number;
}

export interface EntregaRegistrada {
  dia: Dia;
  viajeId: string;
  lineas: { sku: string; cantidad: number; aceptada: number }[];
  evidencia: string;
}

export interface Pedido {
  id: string;
  clienteId: string;
  destinoNodoId: string;
  diaCreacion: Dia;
  diaPrometido: Dia;
  lineas: LineaPedido[];
  estado: EstadoPedido;
  canceladoPor?: 'cliente' | 'empresa';
  costosAsociados: Money;
  motivos: string[];
  entregas: EntregaRegistrada[];
}

export interface Cliente {
  id: string;
  nombre: string;
  nodoId: string;
  segmento: 'A' | 'B' | 'C';
  tipo: string;
  ventanaEntrega: string;
  /** Satisfacción simulada 0–100. */
  satisfaccion: number;
  diasPago: number;
}

export interface Proveedor {
  id: string;
  nombre: string;
  skus: string[];
  /** Precio por SKU en COP. Si un SKU no aparece, se usa el costo del producto. */
  precios: Record<string, Money>;
  plazoEntregaDias: number;
  /** Probabilidad simulada de entregar a tiempo (0–1). */
  confiabilidad: number;
  capacidadUnidadesDia: number;
  diasPago: number;
  tipo: 'habitual' | 'alterno';
}

export type EstadoOrdenCompra = 'emitida' | 'en_transito' | 'recibida_parcial' | 'recibida' | 'cancelada';

export interface OrdenCompra {
  id: string;
  proveedorId: string;
  lineas: { sku: string; cantidad: number; precioUnitario: Money; recibida: number }[];
  diaEmision: Dia;
  diaPrevisto: Dia;
  diaDespacho?: Dia;
  diaRecepcion?: Dia;
  estado: EstadoOrdenCompra;
  incidencias: string[];
  costosAdicionales: Money;
}

export type EstadoRecurso = 'disponible' | 'en_ruta' | 'averiado' | 'mantenimiento';

export interface RecursoTransporte {
  id: string;
  nombre: string;
  tipo: 'propio' | 'contratado';
  proveedor?: string;
  capacidadKg: number;
  capacidadPallets: number;
  refrigerado: boolean;
  estado: EstadoRecurso;
  /** Costo variable simulado por km. */
  costoKm: Money;
  /** Costo fijo simulado por día disponible (propios) o por servicio (contratados). */
  costoFijoDia: Money;
  consumoLitrosKm: number;
  /** Factor de emisión ficticio y configurable, kg CO2e por km. */
  factorEmisionKgKm: number;
  /** Puntualidad simulada (0–1); relevante para transportadores contratados. */
  confiabilidad: number;
}

export interface Viaje {
  id: string;
  recursoId: string;
  origenNodoId: string;
  paradas: { nodoId: string; pedidoIds: string[] }[];
  distanciaSimKm: number;
  horasPrevistas: number;
  horasReales?: number;
  costo: Money;
  estado: 'programado' | 'en_curso' | 'completado' | 'cancelado';
  dia: Dia;
  incidencias: string[];
  combustibleLitros: number;
}

export type TipoAsiento = 'aporte_capital' | 'presupuesto' | 'compromiso' | 'liberacion_compromiso' | 'costo' | 'pago' | 'ingreso' | 'cobro' | 'activo_inventario';

/** Categorías de costo mutuamente excluyentes (secc. 13 del documento maestro). */
export type CategoriaCosto =
  | 'transporte'
  | 'almacenamiento_manipulacion'
  | 'mantenimiento_inventario'
  | 'merma_deterioro'
  | 'distribucion_despacho'
  | 'devoluciones_inversa'
  | 'costo_ventas'
  | 'compra_mercancia'
  | 'administrativo'
  | 'financiero';

export interface AsientoFinanciero {
  id: string;
  tipo: TipoAsiento;
  categoria?: CategoriaCosto;
  monto: Money;
  moneda: 'COP' | 'USD';
  tasaCambio?: number;
  dia: Dia;
  referencia: string;
  /** Clave única (referencia + tipo). El motor rechaza una clave repetida. */
  clave: string;
  descripcion: string;
}

export type Severidad = 'baja' | 'media' | 'alta' | 'critica';

export interface EventoPartida {
  id: string;
  plantillaId: string;
  etapa: EtapaId;
  ronda: number;
  diaActivacion: Dia;
  severidad: Severidad;
  diaLimite: Dia;
  titulo: string;
  estado: 'abierto' | 'resuelto' | 'vencido';
  decisionId?: string;
  resultado?: string;
}

export interface EfectoProgramado {
  id: string;
  origen: string;
  diaActivacion: Dia;
  condicion: string;
  accion: { tipo: string; datos: Record<string, unknown> };
  estado: 'pendiente' | 'aplicado' | 'cancelado';
}

export interface RegistroDecision {
  id: string;
  dia: Dia;
  ronda: number;
  cargo: CargoId;
  tipo: TipoAccion | 'sistema';
  parametros: Record<string, unknown>;
  justificacion: string;
  escalamiento?: SolicitudEscalamiento;
  efectos: string[];
}

export interface SolicitudEscalamiento {
  id: string;
  tipoAccion: TipoAccion;
  motivo: 'tope_excedido' | 'area_ajena' | 'autorizacion_calidad';
  dirigidaA: CargoId | 'gerencia_general';
  monto: Money;
  estado: 'pendiente' | 'aprobada' | 'aprobada_parcial' | 'rechazada';
}

export interface IndicadorCierre {
  codigo: string;
  ronda: number;
  etapa: EtapaId;
  periodo: 'ronda' | 'etapa' | 'acumulado';
  valor: number | null;
  numerador: number | null;
  denominador: number | null;
  unidad: string;
  versionFormula: string;
}

export interface EntradaBitacora {
  id: string;
  dia: Dia;
  ronda: number;
  tipo: 'sistema' | 'decision' | 'evento' | 'alerta';
  mensaje: string;
}

export type EstadoCampana = 'en_curso' | 'evaluacion_etapa' | 'finalizada' | 'insolvente';

export interface MetaPartida {
  id: string;
  nombreJugador: string;
  creadaEn: string; // fecha real ISO, solo como registro de guardado
  actualizadaEn: string;
  estado: EstadoCampana;
  cargo: CargoId;
  grado: Grado;
  semilla: number;
  versionConfiguracion: string;
  huellaConfiguracion: string;
}
