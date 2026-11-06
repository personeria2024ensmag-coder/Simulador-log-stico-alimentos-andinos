/**
 * Generador pseudoaleatorio con semilla (mulberry32).
 * El estado vive dentro de la partida: mismos datos + decisiones + semilla = mismo resultado.
 * El motor nunca usa Math.random.
 */
export function siguiente(estado: number): { valor: number; estado: number } {
  let t = (estado + 0x6d2b79f5) >>> 0;
  let r = Math.imul(t ^ (t >>> 15), t | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  const valor = ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  return { valor, estado: t };
}

/** Semilla nueva para una partida. Es el único punto donde se admite azar externo, fuera del motor. */
export function semillaNueva(): number {
  const c = globalThis.crypto;
  if (c?.getRandomValues) {
    const a = new Uint32Array(1);
    c.getRandomValues(a);
    return a[0]! % 2_000_000_000;
  }
  return Date.now() % 2_000_000_000;
}
