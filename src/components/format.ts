const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const num = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const dec1 = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

export const fmtCOP = (n: number) => cop.format(n);
export const fmtNum = (n: number) => num.format(n);
export const fmtPct = (f: number) => `${dec1.format(f * 100)}%`;
export const fmtDec = (n: number) => dec1.format(n);
/** Millones abreviados: $1.234,5 M */
export const fmtMillones = (n: number) => `$${dec1.format(n / 1_000_000)} M`;
