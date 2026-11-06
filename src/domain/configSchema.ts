import { z } from 'zod';
import type { SimConfig } from './config';

/**
 * Validación de la configuración. Devuelve mensajes comprensibles en español.
 * Se usa al cargar la configuración base, al importar una partida y (Fase 7) en el editor.
 */

const entero = (campo: string) => z.number({ error: `${campo} debe ser un número` }).int(`${campo} debe ser un número entero`);
const positivo = (campo: string) => entero(campo).positive(`${campo} debe ser mayor que cero`);
const noNegativo = (campo: string) => entero(campo).nonnegative(`${campo} no puede ser negativo`);
const fraccion = (campo: string) => z.number().min(0, `${campo} no puede ser negativo`).max(1, `${campo} debe estar entre 0 y 1`);

const productoSchema = z.object({
  sku: z.string().min(1, 'Cada producto necesita un SKU'),
  nombre: z.string().min(1, 'Cada producto necesita un nombre'),
  categoria: z.enum(['seco', 'procesado', 'refrigerado']),
  unidadesPorPallet: positivo('Las unidades por pallet'),
  pesoKgUnidad: z.number().positive('El peso por unidad debe ser mayor que cero'),
  costoUnitario: positivo('El costo unitario'),
  precioVenta: positivo('El precio de venta'),
  vidaUtilDias: positivo('La vida útil'),
  rotacion: z.enum(['FIFO', 'FEFO']),
  demandaDiariaBase: noNegativo('La demanda diaria base'),
});

export const configSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'La versión debe tener el formato 1.0.0'),
  empresa: z.object({
    capitalInicial: positivo('El capital inicial'),
    capacidadCediPallets: positivo('La capacidad del CEDI'),
    posicionesNoDisponibles: noNegativo('Las posiciones no disponibles'),
    metaOtif: fraccion('La meta de OTIF'),
    metaExactitud: fraccion('La meta de exactitud'),
    umbralMerma: fraccion('El umbral de merma'),
  }).passthrough(),
  productos: z.array(productoSchema).min(1, 'Debe existir al menos un producto'),
  flota: z.array(z.object({ id: z.string(), capacidadKg: positivo('La capacidad del vehículo'), costoKm: noNegativo('El costo por km') }).passthrough()).min(1, 'Debe existir al menos un vehículo'),
  puntuacion: z.object({ dimensiones: z.array(z.object({ id: z.string(), peso: fraccion('El peso de cada dimensión') }).passthrough()) }),
}).passthrough();

export interface ResultadoValidacion {
  valida: boolean;
  errores: string[];
}

export function validarConfiguracion(config: unknown): ResultadoValidacion {
  const errores: string[] = [];
  const parsed = configSchema.safeParse(config);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const ruta = issue.path.length ? ` (${issue.path.join(' › ')})` : '';
      errores.push(`${issue.message}${ruta}`);
    }
    return { valida: false, errores };
  }
  const c = config as SimConfig;

  // Reglas de negocio
  const skus = new Set<string>();
  for (const p of c.productos) {
    if (skus.has(p.sku)) errores.push(`El SKU ${p.sku} está repetido.`);
    skus.add(p.sku);
    if (p.precioVenta <= p.costoUnitario) errores.push(`El producto ${p.sku} tiene precio de venta igual o menor que su costo; vender produciría pérdida.`);
    if (p.almacenamiento.tipo === 'refrigerado') {
      if (p.almacenamiento.tempMinC === undefined || p.almacenamiento.tempMaxC === undefined) errores.push(`El producto refrigerado ${p.sku} necesita un rango de temperatura en su ficha técnica.`);
      else if (p.almacenamiento.tempMinC >= p.almacenamiento.tempMaxC) errores.push(`El rango de temperatura de ${p.sku} es inválido: el mínimo debe ser menor que el máximo.`);
    }
  }
  const sumaPesos = c.puntuacion.dimensiones.reduce((s, d) => s + d.peso, 0);
  if (Math.abs(sumaPesos - 1) > 1e-9) errores.push(`Los pesos de la puntuación suman ${(sumaPesos * 100).toFixed(1)}%; deben sumar 100%.`);
  if (c.empresa.posicionesNoDisponibles >= c.empresa.capacidadCediPallets) errores.push('Las posiciones no disponibles no pueden igualar o superar la capacidad del CEDI.');
  for (const inv of c.inventarioInicial) {
    if (!skus.has(inv.sku)) errores.push(`El inventario inicial menciona el SKU ${inv.sku}, que no existe en el catálogo.`);
    for (const l of inv.lotes) if (!Number.isInteger(l.cantidad) || l.cantidad <= 0) errores.push(`El inventario inicial de ${inv.sku} tiene una cantidad inválida (${l.cantidad}).`);
  }
  const clientes = new Set(c.clientes.map((x) => x.id));
  const nodos = new Set(c.nodos.map((n) => n.id));
  for (const cl of c.clientes) if (!nodos.has(cl.nodoId)) errores.push(`El cliente ${cl.id} apunta a un nodo inexistente (${cl.nodoId}).`);
  for (const p of c.pedidosIniciales) {
    if (!clientes.has(p.clienteId)) errores.push(`El pedido ${p.id} apunta a un cliente inexistente.`);
    for (const l of p.lineas) {
      if (!skus.has(l.sku)) errores.push(`El pedido ${p.id} pide el SKU inexistente ${l.sku}.`);
      if (!Number.isInteger(l.solicitada) || l.solicitada <= 0) errores.push(`El pedido ${p.id} tiene una cantidad inválida para ${l.sku}.`);
    }
  }
  const cargos = new Set(c.cargos.map((x) => x.id));
  for (const cg of c.cargos) {
    if (cg.reportaA !== 'gerencia_general' && !cargos.has(cg.reportaA)) errores.push(`El cargo ${cg.nombre} reporta a un cargo inexistente.`);
    if (cg.topeGrado1 < 0) errores.push(`El tope de aprobación de ${cg.nombre} no puede ser negativo.`);
  }
  if (c.rondas.length !== 18) errores.push(`La campaña debe tener 18 rondas; la configuración tiene ${c.rondas.length}.`);
  return { valida: errores.length === 0, errores };
}

/** Huella estable (FNV-1a de 32 bits sobre JSON con claves ordenadas). */
export function huella(valor: unknown): string {
  const texto = jsonEstable(valor);
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function jsonEstable(valor: unknown): string {
  if (valor === null || typeof valor !== 'object') return JSON.stringify(valor);
  if (Array.isArray(valor)) return `[${valor.map(jsonEstable).join(',')}]`;
  const obj = valor as Record<string, unknown>;
  const claves = Object.keys(obj).filter((k) => obj[k] !== undefined).sort();
  return `{${claves.map((k) => `${JSON.stringify(k)}:${jsonEstable(obj[k])}`).join(',')}}`;
}
