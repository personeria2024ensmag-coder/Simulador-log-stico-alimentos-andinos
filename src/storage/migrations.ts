/**
 * Migraciones de esquema de partidas guardadas.
 * Cada cambio de esquema agrega aquí una función pura `vN → vN+1`, probada con partidas de ejemplo.
 * Esquema actual: 1 (no hay migraciones todavía).
 */
type Migracion = (sobre: Record<string, unknown>) => Record<string, unknown>;

const MIGRACIONES: Record<number, Migracion> = {
  // 1: (s) => ({ ...s, schemaVersion: 2, state: { ...(s.state as object), nuevoCampo: [] } }),
};

export function migrar(crudo: unknown): { ok: true; valor: unknown } | { ok: false; errores: string[] } {
  let s = crudo as Record<string, unknown>;
  let v = s.schemaVersion as number;
  while (MIGRACIONES[v]) {
    s = MIGRACIONES[v]!(s);
    v = s.schemaVersion as number;
  }
  if (typeof s.schemaVersion !== 'number') return { ok: false, errores: ['La partida no indica su versión de esquema.'] };
  return { ok: true, valor: s };
}
