import { describe, expect, it } from 'vitest';
import { AlmacenIndexedDB, AlmacenMemoria, Persistencia, abrirSobre, empaquetar, type Almacen } from '@/storage/persistence';
import { AHORA, nuevaPartida } from '../helpers';

describe('Prueba 14 — el guardado y la recuperación conservan el mismo estado', () => {
  it('IndexedDB: guardar y cargar devuelve un estado idéntico', async () => {
    const p = new Persistencia(new AlmacenIndexedDB());
    const s = nuevaPartida('jefe_inventarios', 777);
    await p.guardar(s, AHORA);
    const r = await p.cargar();
    expect(r).not.toBeNull();
    expect(r!.origen).toBe('actual');
    expect(JSON.stringify(r!.state)).toBe(JSON.stringify(s));
  });

  it('conserva la copia anterior y la recupera si la actual se daña', async () => {
    const mem = new AlmacenMemoria();
    const p = new Persistencia(mem);
    const s1 = nuevaPartida('coord_calidad', 1);
    const s2 = nuevaPartida('coord_calidad', 2);
    await p.guardar(s1, AHORA);
    await p.guardar(s2, AHORA);
    mem.datos.set('partida-actual', mem.datos.get('partida-actual')!.replace('"dia":1', '"dia":99'));
    const r = await p.cargar();
    expect(r!.origen).toBe('anterior');
    expect(r!.state.meta.semilla).toBe(1);
  });

  it('si el almacén principal falla, guarda en el respaldo; si todos fallan, lo informa', async () => {
    const roto: Almacen = { nombre: 'roto', leer: async () => undefined, escribir: async () => { throw new Error('cuota excedida'); }, borrar: async () => {} };
    const mem = new AlmacenMemoria();
    const p = new Persistencia(roto, mem);
    const s = nuevaPartida();
    expect((await p.guardar(s, AHORA)).almacen).toBe('memoria');
    await expect(new Persistencia(roto).guardar(s, AHORA)).rejects.toThrow(/No se pudo guardar/);
  });

  it('cargar no modifica el estado (no avanza reloj ni ejecuta efectos)', async () => {
    const p = new Persistencia(new AlmacenMemoria());
    const s = nuevaPartida();
    await p.guardar(s, AHORA);
    const a = await p.cargar();
    const b = await p.cargar();
    expect(a!.state.reloj).toEqual(s.reloj);
    expect(JSON.stringify(a!.state)).toBe(JSON.stringify(b!.state));
  });

  it('importar: acepta una exportación íntegra y rechaza archivos alterados o ajenos', () => {
    const s = nuevaPartida();
    const texto = JSON.stringify(empaquetar(s, AHORA));
    expect(abrirSobre(texto).ok).toBe(true);
    const alterado = texto.replace('"capitalInicial":250000000', '"capitalInicial":999999999');
    const r = abrirSobre(alterado);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores[0]).toMatch(/suma de verificación/);
    const ajeno = abrirSobre('{"hola":1}');
    expect(ajeno.ok).toBe(false);
    expect(abrirSobre('no es json').ok).toBe(false);
    const futuro = abrirSobre(JSON.stringify({ ...empaquetar(s, AHORA), schemaVersion: 99 }));
    expect(futuro.ok).toBe(false);
    if (!futuro.ok) expect(futuro.errores[0]).toMatch(/más reciente/);
  });
});
