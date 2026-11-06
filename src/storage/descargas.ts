/**
 * Descarga de archivos generados por la aplicación.
 * - Dentro de la página publicada en claude.ai se usa la capacidad `downloads` (el visor confirma).
 * - Fuera de ella (desarrollo local u otro hosting) se usa un enlace de descarga normal.
 * El resultado indica si el archivo realmente se entregó; la interfaz nunca anuncia una descarga que no ocurrió.
 */

type ResultadoDescarga = { ok: true; via: 'capacidad' | 'navegador' } | { ok: false; motivo: string; puedeCopiar: boolean };

interface ClaudeGlobal { use(nombre: string): Promise<unknown> }
interface Downloads { save(r: { filename: string; data: string | Blob }): Promise<{ status: string }> }

let downloadsPromesa: Promise<Downloads | null> | null = null;

function enArtifact(): boolean {
  return typeof window !== 'undefined' && typeof (window as unknown as { claude?: ClaudeGlobal }).claude?.use === 'function';
}

export function obtenerDescargas(): Promise<Downloads | null> {
  if (!enArtifact()) return Promise.resolve(null);
  if (!downloadsPromesa) {
    const c = (window as unknown as { claude: ClaudeGlobal }).claude;
    downloadsPromesa = c.use('downloads').then((d) => (d as Downloads | null) ?? null).catch(() => null);
  }
  return downloadsPromesa;
}

export async function descargarArchivo(nombre: string, contenido: string): Promise<ResultadoDescarga> {
  if (enArtifact()) {
    const d = await obtenerDescargas();
    if (!d) return { ok: false, motivo: 'Este visor no permite descargar archivos. Use «Copiar contenido» y péguelo en un archivo de texto.', puedeCopiar: true };
    try {
      const r = await d.save({ filename: nombre, data: contenido });
      if (r.status === 'saved' || r.status === 'delivered') return { ok: true, via: 'capacidad' };
      return { ok: false, motivo: 'La descarga no se completó.', puedeCopiar: true };
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === 'declined') return { ok: false, motivo: 'Descarga cancelada: no se guardó ningún archivo.', puedeCopiar: true };
      if (code === 'rate_limited') return { ok: false, motivo: 'Ya hay una descarga esperando confirmación. Inténtelo de nuevo en un momento.', puedeCopiar: true };
      return { ok: false, motivo: 'Este visor no permitió la descarga. Use «Copiar contenido».', puedeCopiar: true };
    }
  }
  try {
    const blob = new Blob([contenido], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return { ok: true, via: 'navegador' };
  } catch {
    return { ok: false, motivo: 'El navegador no permitió la descarga. Use «Copiar contenido».', puedeCopiar: true };
  }
}

export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}
