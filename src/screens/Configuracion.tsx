import { useRef, useState } from 'react';
import { Copy, Download, FileUp, RotateCcw } from 'lucide-react';
import { CONFIG_V1 } from '@/data/config-v1';
import { huella } from '@/domain/configSchema';
import { useGame } from '@/store/gameStore';
import { copiarTexto, descargarArchivo } from '@/storage/descargas';
import { Boton, Dialogo, EncabezadoPantalla, EtiquetaSimulacion, Insignia, Tarjeta } from '@/components/ui';
import { fmtCOP, fmtNum, fmtPct } from '@/components/format';
import { ir } from '@/components/router';

function Fila({ k, v, nota }: { k: string; v: React.ReactNode; nota?: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-3 border-b border-grafito-100 py-1.5 last:border-0">
      <dt className="text-sm text-grafito-600">{k}{nota && <span className="block text-xs text-grafito-400">{nota}</span>}</dt>
      <dd className="text-right font-mono text-sm text-grafito-900">{v}</dd>
    </div>
  );
}

export function Configuracion() {
  const partida = useGame((s) => s.partida);
  const guardado = useGame((s) => s.guardado);
  const almacen = useGame((s) => s.almacen);
  const exportarTexto = useGame((s) => s.exportarTexto);
  const importar = useGame((s) => s.importar);
  const reiniciar = useGame((s) => s.reiniciar);
  const [mensaje, setMensaje] = useState<{ tono: 'bien' | 'critico' | 'advertencia'; texto: string } | null>(null);
  const [reinicio, setReinicio] = useState(false);
  const [importErr, setImportErr] = useState<string[] | null>(null);
  const [confirmarImport, setConfirmarImport] = useState<string | null>(null);
  const archivo = useRef<HTMLInputElement>(null);

  const config = partida?.config ?? CONFIG_V1;
  const e = config.empresa;
  const huellaGeneral = huella(CONFIG_V1);

  const exportar = async () => {
    const t = exportarTexto();
    if (!t) return;
    const r = await descargarArchivo(`alimentos-andinos-${partida!.meta.id}-dia${partida!.reloj.dia}.json`, t);
    setMensaje(r.ok ? { tono: 'bien', texto: 'Archivo de la partida generado y entregado al navegador.' } : { tono: 'advertencia', texto: r.motivo });
  };
  const copiar = async () => {
    const t = exportarTexto();
    if (!t) return;
    const ok = await copiarTexto(t);
    setMensaje(ok ? { tono: 'bien', texto: 'Contenido de la partida copiado. Péguelo en un archivo .json para conservarlo.' } : { tono: 'critico', texto: 'El navegador no permitió copiar al portapapeles.' });
  };
  const hacerImport = async (texto: string) => {
    setConfirmarImport(null);
    const r = await importar(texto);
    if (r.ok) setMensaje({ tono: 'bien', texto: `Partida importada y validada.${r.avisos.length ? ' ' + r.avisos.join(' ') : ''}` });
    else setImportErr(r.errores);
  };

  return (
    <div>
      <EncabezadoPantalla titulo="Configuración del simulador" descripcion="Parámetros de la campaña, en lectura. La edición validada llega en la Fase 7. Cada partida guarda su propia copia: cambiar la configuración general no altera partidas iniciadas." derecha={<EtiquetaSimulacion />} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Tarjeta titulo="Partida y copia de seguridad" sub={`Almacenamiento: ${almacen || 'detectando…'}`}>
          {partida ? (
            <dl>
              <Fila k="Partida" v={partida.meta.id} />
              <Fila k="Semilla registrada" v={partida.meta.semilla} />
              <Fila k="Configuración de la partida" v={`${partida.meta.versionConfiguracion} · ${partida.meta.huellaConfiguracion}`} nota={partida.meta.huellaConfiguracion === huellaGeneral ? 'Igual a la configuración general vigente' : 'Distinta de la configuración general vigente (se conserva la de la partida)'} />
              <Fila k="Estado de guardado" v={guardado.tipo === 'guardado' ? <Insignia tono="bien">guardado</Insignia> : guardado.tipo === 'guardando' ? <Insignia>guardando</Insignia> : <Insignia tono="critico">sin guardar</Insignia>} />
            </dl>
          ) : <p className="text-sm text-grafito-500">No hay partida en este navegador.</p>}
          {(guardado.tipo === 'error' || guardado.tipo === 'sin_almacen') && <p className="mt-2 rounded-md bg-alerta-50 p-2 text-sm text-alerta-700">{guardado.mensaje}</p>}
          <p className="mt-3 text-xs text-grafito-500">El guardado es por navegador y dispositivo y no se sincroniza. La exportación JSON es su copia de seguridad; al importarla se valida la estructura, la suma de verificación y las reglas del simulador.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Boton variante="secundario" disabled={!partida} onClick={() => void exportar()}><Download size={15} />Exportar partida</Boton>
            <Boton variante="secundario" disabled={!partida} onClick={() => void copiar()}><Copy size={15} />Copiar contenido</Boton>
            <Boton variante="secundario" onClick={() => archivo.current?.click()}><FileUp size={15} />Importar</Boton>
            <Boton variante="fantasma" className="text-alerta-600" disabled={!partida} onClick={() => setReinicio(true)}><RotateCcw size={15} />Reiniciar</Boton>
            <input ref={archivo} type="file" accept="application/json,.json" className="hidden" onChange={async (ev) => { const f = ev.target.files?.[0]; ev.target.value = ''; if (!f) return; const t = await f.text(); if (partida) setConfirmarImport(t); else void hacerImport(t); }} />
          </div>
          {mensaje && <p role="status" className={`mt-3 rounded-md p-2 text-sm ${mensaje.tono === 'bien' ? 'bg-bosque-50 text-bosque-800' : mensaje.tono === 'advertencia' ? 'bg-ambar-50 text-ambar-700' : 'bg-alerta-50 text-alerta-700'}`}>{mensaje.texto}</p>}
        </Tarjeta>

        <Tarjeta titulo="Perfil de la empresa" sub={`Configuración ${config.version}`}>
          <dl>
            <Fila k="Capital operativo inicial (caja)" v={fmtCOP(e.capitalInicial)} />
            <Fila k="Clientes activos" v={e.clientesActivos} />
            <Fila k="Referencias (SKU)" v={config.productos.length} />
            <Fila k="Capacidad del CEDI regional" v={`${e.capacidadCediPallets} posiciones`} nota={`${e.posicionesNoDisponibles} ocupadas por estibas vacías, averías y material de empaque`} />
            <Fila k="Vehículos propios / contratados" v={`${e.vehiculosPropios} / ${e.transportadoresContratados}`} />
            <Fila k="Horizonte de planificación" v={`${e.horizontePlanificacionDias} días`} />
            <Fila k="Meta de OTIF" v={fmtPct(e.metaOtif)} />
            <Fila k="Meta de exactitud de inventario" v={fmtPct(e.metaExactitud)} />
            <Fila k="Umbral de merma" v={fmtPct(e.umbralMerma)} nota="Del valor de mercancía gestionada en el periodo" />
          </dl>
        </Tarjeta>

        <Tarjeta titulo="Puntuación global" sub="Pesos de las seis dimensiones">
          <dl>{config.puntuacion.dimensiones.map((d) => <Fila key={d.id} k={d.nombre} v={fmtPct(d.peso)} nota={d.indicadores.join(', ')} />)}</dl>
        </Tarjeta>

        <Tarjeta titulo="Condiciones de ascenso" sub="Rondas 6 y 12; se exigen todas, además de no tener condiciones de bloqueo">
          <dl>
            <Fila k="Puntuación mínima de la etapa" v={config.ascenso.puntuacionMinima} />
            <Fila k="OTIF mínimo de la etapa" v={fmtPct(config.ascenso.otifMinimo)} />
            <Fila k="Exactitud mínima" v={fmtPct(config.ascenso.exactitudMinima)} />
            <Fila k="Merma máxima" v={fmtPct(config.ascenso.mermaMaxima)} />
            <Fila k="Caja mínima" v={`${fmtPct(config.ascenso.cajaMinimaFraccionCapital)} del capital inicial`} />
            <Fila k="Multiplicador de tope por grado" v={`×${config.topeMultiplicadorGrado[1]} · ×${config.topeMultiplicadorGrado[2]} · ×${config.topeMultiplicadorGrado[3]}`} />
          </dl>
        </Tarjeta>
      </div>

      <Tarjeta titulo="Catálogo de productos" sub="Límites de temperatura tomados de la ficha técnica simulada de cada producto; no son criterio legal" className="mt-5">
        <div className="-mx-4 overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead><tr className="border-b border-grafito-100 text-left text-xs text-grafito-500">
              <th className="px-4 py-2 font-medium">SKU</th><th className="px-2 py-2 font-medium">Producto</th><th className="px-2 py-2 font-medium">Categoría</th><th className="px-2 py-2 text-right font-medium">Costo</th><th className="px-2 py-2 text-right font-medium">Precio</th><th className="px-2 py-2 text-right font-medium">Und/pallet</th><th className="px-2 py-2 text-right font-medium">Vida útil</th><th className="px-2 py-2 font-medium">Rotación</th><th className="px-2 py-2 font-medium">Conservación</th><th className="px-4 py-2 text-right font-medium">Demanda base/día</th>
            </tr></thead>
            <tbody>
              {config.productos.map((p) => (
                <tr key={p.sku} className="border-b border-grafito-100 last:border-0">
                  <td className="px-4 py-1.5 font-mono text-xs">{p.sku}</td>
                  <td className="px-2 py-1.5">{p.nombre}</td>
                  <td className="px-2 py-1.5 capitalize">{p.categoria}</td>
                  <td className="px-2 py-1.5 text-right font-mono">{fmtCOP(p.costoUnitario)}</td>
                  <td className="px-2 py-1.5 text-right font-mono">{fmtCOP(p.precioVenta)}</td>
                  <td className="px-2 py-1.5 text-right font-mono">{fmtNum(p.unidadesPorPallet)}</td>
                  <td className="px-2 py-1.5 text-right font-mono">{p.vidaUtilDias} d</td>
                  <td className="px-2 py-1.5">{p.rotacion}</td>
                  <td className="px-2 py-1.5 text-xs">{p.almacenamiento.tipo === 'refrigerado' ? `${p.almacenamiento.tempMinC} a ${p.almacenamiento.tempMaxC} °C` : 'Ambiente'}</td>
                  <td className="px-4 py-1.5 text-right font-mono">{fmtNum(p.demandaDiariaBase)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tarjeta>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Tarjeta titulo="Proveedores">
          <ul className="divide-y divide-grafito-100 text-sm">
            {config.proveedores.map((v) => (
              <li key={v.id} className="py-2">
                <div className="flex justify-between gap-2"><span className="font-medium text-grafito-900">{v.nombre}</span><Insignia tono={v.tipo === 'alterno' ? 'info' : 'neutro'}>{v.tipo}</Insignia></div>
                <div className="text-xs text-grafito-500">Plazo {v.plazoEntregaDias} día(s) · confiabilidad simulada {fmtPct(v.confiabilidad)} · pago a {v.diasPago} días · {v.skus.length} SKU{Object.keys(v.precios).length ? ` · precio ${Object.entries(v.precios).map(([s, pr]) => `${s} ${fmtCOP(pr)}`).join(', ')}` : ''}</div>
              </li>
            ))}
          </ul>
        </Tarjeta>
        <Tarjeta titulo="Flota y tarifas simuladas">
          <ul className="divide-y divide-grafito-100 text-sm">
            {config.flota.map((v) => (
              <li key={v.id} className="py-2">
                <div className="flex justify-between gap-2"><span className="font-medium text-grafito-900">{v.nombre}</span><Insignia>{v.tipo}</Insignia></div>
                <div className="text-xs text-grafito-500">{fmtNum(v.capacidadKg)} kg · {v.capacidadPallets} pallets{v.refrigerado ? ' · refrigerado' : ''} · {fmtCOP(v.costoKm)}/km · fijo {fmtCOP(v.costoFijoDia)}/día · {v.factorEmisionKgKm} kg CO2e/km (ficticio)</div>
              </li>
            ))}
          </ul>
        </Tarjeta>
      </div>

      <Dialogo abierto={reinicio} titulo="¿Reiniciar la partida?" onCerrar={() => setReinicio(false)} acciones={<><Boton variante="secundario" onClick={() => setReinicio(false)}>Cancelar</Boton><Boton variante="secundario" onClick={() => void exportar()}><Download size={15} />Exportar antes</Boton><Boton variante="peligro" onClick={async () => { setReinicio(false); await reiniciar(); ir('inicio'); }}>Borrar y reiniciar</Boton></>}>
        Se borrará la partida {partida?.meta.id} de este navegador, junto con su copia anterior. Esta acción no se puede deshacer. Si quiere conservarla, expórtela primero.
      </Dialogo>
      <Dialogo abierto={!!confirmarImport} titulo="¿Reemplazar la partida actual?" onCerrar={() => setConfirmarImport(null)} acciones={<><Boton variante="secundario" onClick={() => setConfirmarImport(null)}>Cancelar</Boton><Boton variante="peligro" onClick={() => void hacerImport(confirmarImport!)}>Importar y reemplazar</Boton></>}>
        La partida importada reemplazará la que está guardada en este navegador.
      </Dialogo>
      <Dialogo abierto={!!importErr} titulo="No se pudo importar la partida" onCerrar={() => setImportErr(null)} acciones={<Boton onClick={() => setImportErr(null)}>Entendido</Boton>}>
        <ul className="list-disc space-y-1 pl-5">{importErr?.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <p className="mt-3 text-grafito-500">Su partida actual no se modificó.</p>
      </Dialogo>
    </div>
  );
}
