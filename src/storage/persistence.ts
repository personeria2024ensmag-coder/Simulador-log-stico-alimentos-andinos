import { createStore, get, set, del } from 'idb-keyval';
import { z } from 'zod';
import { huella, validarConfiguracion } from '@/domain/configSchema';
import { SCHEMA_VERSION, type GameState } from '@/domain/state';
import { verificarInvariantes } from '@/engine/core/invariants';
import { migrar } from './migrations';

/**
 * Capa de persistencia independiente del motor.
 * - Almacén principal: IndexedDB. Respaldo: localStorage.
 * - Se guardan dos copias (actual y anterior), cada una con versión de esquema y suma de verificación.
 * - Cargar nunca ejecuta efectos ni avanza el reloj: solo devuelve el estado guardado.
 */

export interface Sobre {
  formato: 'alimentos-andinos-partida';
  schemaVersion: number;
  guardadoEn: string;
  checksum: string;
  state: GameState;
}

export interface Almacen {
  nombre: string;
  leer(clave: string): Promise<string | undefined>;
  escribir(clave: string, valor: string): Promise<void>;
  borrar(clave: string): Promise<void>;
}

export class AlmacenIndexedDB implements Almacen {
  nombre = 'IndexedDB';
  private store = createStore('alimentos-andinos', 'partidas');
  async leer(clave: string) { return (await get<string>(clave, this.store)) ?? undefined; }
  async escribir(clave: string, valor: string) { await set(clave, valor, this.store); }
  async borrar(clave: string) { await del(clave, this.store); }
}

export class AlmacenLocalStorage implements Almacen {
  nombre = 'localStorage';
  async leer(clave: string) { return globalThis.localStorage.getItem(`aa:${clave}`) ?? undefined; }
  async escribir(clave: string, valor: string) { globalThis.localStorage.setItem(`aa:${clave}`, valor); }
  async borrar(clave: string) { globalThis.localStorage.removeItem(`aa:${clave}`); }
}

export class AlmacenMemoria implements Almacen {
  nombre = 'memoria';
  datos = new Map<string, string>();
  async leer(clave: string) { return this.datos.get(clave); }
  async escribir(clave: string, valor: string) { this.datos.set(clave, valor); }
  async borrar(clave: string) { this.datos.delete(clave); }
}

const CLAVE_ACTUAL = 'partida-actual';
const CLAVE_ANTERIOR = 'partida-anterior';

export function empaquetar(state: GameState, ahoraISO: string): Sobre {
  return { formato: 'alimentos-andinos-partida', schemaVersion: SCHEMA_VERSION, guardadoEn: ahoraISO, checksum: huella(state), state };
}

const sobreSchema = z.object({
  formato: z.literal('alimentos-andinos-partida', { error: 'El archivo no es una partida del simulador Alimentos Andinos.' }),
  schemaVersion: z.number().int().positive(),
  guardadoEn: z.string(),
  checksum: z.string(),
  state: z.object({
    schemaVersion: z.number(),
    meta: z.object({ id: z.string(), cargo: z.string(), grado: z.number(), semilla: z.number() }).passthrough(),
    config: z.unknown(),
    reloj: z.object({ dia: z.number(), ronda: z.number(), etapa: z.number() }),
    inventario: z.object({ lotes: z.array(z.unknown()), movimientos: z.array(z.unknown()) }).passthrough(),
    finanzas: z.object({ asientos: z.array(z.unknown()) }),
  }).passthrough(),
});

export type ResultadoLectura = { ok: true; state: GameState; avisos: string[] } | { ok: false; errores: string[] };

/** Valida un sobre (de almacenamiento o importado) y devuelve el estado si es íntegro. */
export function abrirSobre(texto: string): ResultadoLectura {
  let crudo: unknown;
  try {
    crudo = JSON.parse(texto);
  } catch {
    return { ok: false, errores: ['El archivo no es un JSON válido.'] };
  }
  const avisos: string[] = [];
  const v = (crudo as { schemaVersion?: unknown })?.schemaVersion;
  if (typeof v === 'number' && v > SCHEMA_VERSION) {
    return { ok: false, errores: [`La partida fue creada con una versión más reciente del simulador (esquema ${v}). Esta versión solo abre hasta el esquema ${SCHEMA_VERSION}.`] };
  }
  if (typeof v === 'number' && v < SCHEMA_VERSION) {
    const m = migrar(crudo);
    if (!m.ok) return { ok: false, errores: m.errores };
    crudo = m.valor;
    avisos.push(`La partida se migró del esquema ${v} al ${SCHEMA_VERSION}.`);
  }
  const parsed = sobreSchema.safeParse(crudo);
  if (!parsed.success) {
    return { ok: false, errores: parsed.error.issues.map((i) => `${i.message}${i.path.length ? ` (${i.path.join(' › ')})` : ''}`) };
  }
  const sobre = crudo as Sobre;
  if (huella(sobre.state) !== sobre.checksum) {
    return { ok: false, errores: ['La suma de verificación no coincide: el archivo fue modificado o está dañado.'] };
  }
  const vc = validarConfiguracion(sobre.state.config);
  if (!vc.valida) return { ok: false, errores: ['La configuración guardada en la partida no es válida:', ...vc.errores] };
  const inv = verificarInvariantes(sobre.state);
  if (inv.length) return { ok: false, errores: ['La partida no cumple las reglas del simulador:', ...inv] };
  return { ok: true, state: sobre.state, avisos };
}

export class Persistencia {
  constructor(private principal: Almacen, private respaldo?: Almacen) {}

  get nombreAlmacen() { return this.principal.nombre; }

  /** Guarda la partida. La copia actual pasa a ser la anterior. Lanza error si no pudo guardar en ningún almacén. */
  async guardar(state: GameState, ahoraISO: string): Promise<{ almacen: string }> {
    const texto = JSON.stringify(empaquetar(state, ahoraISO));
    const almacenes = [this.principal, this.respaldo].filter(Boolean) as Almacen[];
    let ultimoError: unknown;
    for (const a of almacenes) {
      try {
        const actual = await a.leer(CLAVE_ACTUAL);
        if (actual) await a.escribir(CLAVE_ANTERIOR, actual);
        await a.escribir(CLAVE_ACTUAL, texto);
        const verificado = await a.leer(CLAVE_ACTUAL);
        if (verificado !== texto) throw new Error('La lectura de verificación no coincide con lo escrito.');
        return { almacen: a.nombre };
      } catch (e) {
        ultimoError = e;
      }
    }
    throw new Error(`No se pudo guardar la partida: ${ultimoError instanceof Error ? ultimoError.message : String(ultimoError)}`);
  }

  /** Recupera la última partida íntegra: la actual, o la anterior si la actual está dañada. */
  async cargar(): Promise<{ state: GameState; origen: 'actual' | 'anterior'; avisos: string[] } | null> {
    const almacenes = [this.principal, this.respaldo].filter(Boolean) as Almacen[];
    for (const a of almacenes) {
      let texto: string | undefined;
      try { texto = await a.leer(CLAVE_ACTUAL); } catch { continue; }
      if (texto) {
        const r = abrirSobre(texto);
        if (r.ok) return { state: r.state, origen: 'actual', avisos: r.avisos };
        const previo = await a.leer(CLAVE_ANTERIOR).catch(() => undefined);
        if (previo) {
          const r2 = abrirSobre(previo);
          if (r2.ok) return { state: r2.state, origen: 'anterior', avisos: ['La copia más reciente estaba dañada; se recuperó la anterior.', ...r2.avisos] };
        }
      }
    }
    return null;
  }

  async borrar(): Promise<void> {
    for (const a of [this.principal, this.respaldo].filter(Boolean) as Almacen[]) {
      try { await a.borrar(CLAVE_ACTUAL); await a.borrar(CLAVE_ANTERIOR); } catch { /* se ignora: se intentó en todos */ }
    }
  }
}

/** Detecta el mejor almacén disponible en este navegador. */
export async function crearPersistenciaNavegador(): Promise<{ persistencia: Persistencia; disponible: boolean; detalle: string }> {
  const prueba = async (a: Almacen) => {
    await a.escribir('prueba', 'ok');
    const ok = (await a.leer('prueba')) === 'ok';
    await a.borrar('prueba');
    return ok;
  };
  let idb: Almacen | undefined;
  let ls: Almacen | undefined;
  try { const a = new AlmacenIndexedDB(); if (await prueba(a)) idb = a; } catch { /* no disponible */ }
  try { const a = new AlmacenLocalStorage(); if (await prueba(a)) ls = a; } catch { /* no disponible */ }
  if (idb) return { persistencia: new Persistencia(idb, ls), disponible: true, detalle: ls ? 'IndexedDB con respaldo en localStorage' : 'IndexedDB' };
  if (ls) return { persistencia: new Persistencia(ls), disponible: true, detalle: 'localStorage' };
  return { persistencia: new Persistencia(new AlmacenMemoria()), disponible: false, detalle: 'Este navegador no permite guardar datos en esta página. El progreso solo dura mientras la página esté abierta: exporte su partida.' };
}
