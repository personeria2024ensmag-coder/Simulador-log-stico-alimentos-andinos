import { describe, expect, it } from 'vitest';
import { siguiente } from '@/engine/rng/rng';

describe('Generador con semilla', () => {
  it('es determinista y está en [0, 1)', () => {
    const serie = (s: number) => { const out: number[] = []; let e = s; for (let i = 0; i < 100; i++) { const r = siguiente(e); out.push(r.valor); e = r.estado; } return out; };
    expect(serie(42)).toEqual(serie(42));
    expect(serie(42)).not.toEqual(serie(43));
    for (const v of serie(7)) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
  });
});
