import { useRef, useState } from 'react';
import { ArrowRight, FileUp, HardDrive, Layers, PlayCircle, ShieldCheck, Target, TriangleAlert } from 'lucide-react';
import { useGame } from '@/store/gameStore';
import { fichaCargo } from '@/engine/core/authority';
import { NOMBRE_ETAPA } from '@/data/rondas';
import { Boton, Dialogo, Tarjeta } from '@/components/ui';
import { ir } from '@/components/router';

export function Inicio() {
  const partida = useGame((s) => s.partida);
  const guardado = useGame((s) => s.guardado);
  const almacen = useGame((s) => s.almacen);
  const importar = useGame((s) => s.importar);
  const archivo = useRef<HTMLInputElement>(null);
  const [errores, setErrores] = useState<string[] | null>(null);
  const [confirmarTexto, setConfirmarTexto] = useState<string | null>(null);

  const leerArchivo = async (f: File) => {
    const texto = await f.text();
    if (partida) setConfirmarTexto(texto);
    else await hacerImportacion(texto);
  };
  const hacerImportacion = async (texto: string) => {
    setConfirmarTexto(null);
    const r = await importar(texto);
    if (r.ok) ir('control');
    else setErrores(r.errores);
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-xl bg-grafito-800 text-white shadow">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-bosque-200">Procesos Logísticos de Distribución · Simulador académico</p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">Alimentos Andinos S.A.S.<br /><span className="text-bosque-200">Simulador de Decisiones Logísticas</span></h1>
            <p className="mt-3 max-w-xl text-sm text-grafito-200">
              Asuma un cargo en una distribuidora ficticia de alimentos secos, procesados y refrigerados con base en Girardot. Estabilice una operación regional imperfecta,
              crezca a nivel nacional y lleve la empresa hasta Panamá. Cada decisión cambia inventarios, pedidos, flota y finanzas, y se evalúa con indicadores.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {partida ? (
                <>
                  <Boton onClick={() => ir('control')}><PlayCircle size={16} />Continuar partida</Boton>
                  <Boton variante="secundario" onClick={() => ir('nueva-partida')}>Nueva partida</Boton>
                </>
              ) : (
                <Boton onClick={() => ir('nueva-partida')}><PlayCircle size={16} />Nueva partida</Boton>
              )}
              <Boton variante="secundario" onClick={() => archivo.current?.click()}><FileUp size={16} />Importar partida (JSON)</Boton>
              <input ref={archivo} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void leerArchivo(f); e.target.value = ''; }} />
            </div>
          </div>
          <div className="rounded-lg border border-grafito-600 bg-grafito-700/60 p-4 text-sm">
            {guardado.tipo === 'iniciando' ? (
              <p className="text-grafito-300">Buscando una partida guardada…</p>
            ) : partida ? (
              <>
                <p className="text-xs uppercase tracking-wide text-grafito-400">Partida guardada</p>
                <p className="mt-1 font-mono text-sm">{partida.meta.id}</p>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <dt className="text-grafito-400">Jugador</dt><dd>{partida.meta.nombreJugador}</dd>
                  <dt className="text-grafito-400">Cargo</dt><dd>{fichaCargo(partida, partida.meta.cargo).nombre}</dd>
                  <dt className="text-grafito-400">Etapa</dt><dd>{NOMBRE_ETAPA[partida.reloj.etapa]}</dd>
                  <dt className="text-grafito-400">Ronda / día</dt><dd>{partida.reloj.ronda} / {partida.reloj.dia}</dd>
                </dl>
              </>
            ) : (
              <>
                <p className="text-xs uppercase tracking-wide text-grafito-400">Sin partida en este navegador</p>
                <p className="mt-2 text-grafito-200">Cree una partida nueva o importe una que haya exportado antes.</p>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Tarjeta titulo={<span className="flex items-center gap-2"><Layers size={16} className="text-bosque-600" />Tres etapas, 18 rondas</span>}>
          <p className="text-sm text-grafito-600">Regional (Alto Magdalena), nacional (Colombia) e internacional (Panamá). Seis rondas por etapa y evaluación de ascenso al cierre de las rondas 6 y 12.</p>
        </Tarjeta>
        <Tarjeta titulo={<span className="flex items-center gap-2"><Target size={16} className="text-bosque-600" />Un cargo, con autoridad real</span>}>
          <p className="text-sm text-grafito-600">Nueve cargos con responsabilidades, indicadores y topes de aprobación distintos. Lo que excede su autoridad se escala; nunca se aprueba en silencio.</p>
        </Tarjeta>
        <Tarjeta titulo={<span className="flex items-center gap-2"><ShieldCheck size={16} className="text-bosque-600" />Resultados verificables</span>}>
          <p className="text-sm text-grafito-600">Un motor con reglas y semilla registrada calcula cada consecuencia. Ninguna inteligencia artificial decide cifras, inventario ni ascensos.</p>
        </Tarjeta>
      </div>

      <Tarjeta titulo={<span className="flex items-center gap-2"><HardDrive size={16} className="text-grafito-500" />Dónde se guarda su progreso</span>}>
        <div className="grid gap-3 text-sm text-grafito-600 md:grid-cols-2">
          <p>La partida se guarda automáticamente <strong>en este navegador y este dispositivo</strong> ({almacen || 'detectando almacenamiento…'}). No se sincroniza con otros equipos ni con otras personas, y se pierde si borra los datos del navegador o usa modo incógnito.</p>
          <p>Para conservarla fuera del navegador o continuar en otro equipo, <strong>exporte la partida</strong> desde Configuración y luego impórtela aquí. El archivo se valida antes de abrirse.</p>
        </div>
      </Tarjeta>

      <p className="flex items-start gap-2 text-xs text-grafito-500"><TriangleAlert size={14} className="mt-0.5 shrink-0" />Alimentos Andinos S.A.S., sus clientes, proveedores, costos, tarifas, distancias y acontecimientos son ficticios. Los resultados no son estadísticas de empresas reales ni cotizaciones vigentes.</p>

      <Dialogo abierto={!!errores} titulo="No se pudo importar la partida" onCerrar={() => setErrores(null)} acciones={<Boton onClick={() => setErrores(null)}>Entendido</Boton>}>
        <ul className="list-disc space-y-1 pl-5">{errores?.map((e, i) => <li key={i}>{e}</li>)}</ul>
        <p className="mt-3 text-grafito-500">Su partida actual no se modificó.</p>
      </Dialogo>
      <Dialogo
        abierto={!!confirmarTexto}
        titulo="¿Reemplazar la partida actual?"
        onCerrar={() => setConfirmarTexto(null)}
        acciones={<><Boton variante="secundario" onClick={() => setConfirmarTexto(null)}>Cancelar</Boton><Boton variante="peligro" onClick={() => void hacerImportacion(confirmarTexto!)}>Importar y reemplazar<ArrowRight size={15} /></Boton></>}
      >
        Ya hay una partida guardada en este navegador. Si importa el archivo, la partida actual se reemplaza. Si quiere conservarla, cancele y expórtela primero desde Configuración.
      </Dialogo>
    </div>
  );
}
