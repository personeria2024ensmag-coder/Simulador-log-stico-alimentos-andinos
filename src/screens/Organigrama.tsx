import { useState } from 'react';
import { CONFIG_V1 } from '@/data/config-v1';
import type { FichaCargo } from '@/domain/config';
import type { AreaId, CargoId } from '@/domain/types';
import { useGame } from '@/store/gameStore';
import { FichaCargoVista } from '@/components/FichaCargoVista';
import { EncabezadoPantalla, Insignia, Tarjeta, cx } from '@/components/ui';
import { fmtMillones } from '@/components/format';

const AREA: Record<AreaId, string> = {
  inventarios: 'Inventarios', transporte: 'Transporte', abastecimiento: 'Abastecimiento', planeacion: 'Planeación', calidad: 'Calidad',
  operaciones: 'Operaciones', finanzas: 'Presupuesto', red_nacional: 'Red nacional', comercio_exterior: 'Comercio exterior',
};

function hijos(config: typeof CONFIG_V1, id: CargoId | 'gerencia_general'): FichaCargo[] {
  return config.cargos.filter((c) => c.reportaA === id);
}

function Nodo({ ficha, sel, propio, onSel }: { ficha: FichaCargo; sel: boolean; propio: boolean; onSel: () => void }) {
  return (
    <button
      onClick={onSel}
      aria-pressed={sel}
      className={cx(
        'w-36 rounded-md border bg-white px-2 py-2 text-left shadow-sm transition xl:w-40',
        sel ? 'border-bosque-600 ring-2 ring-bosque-600' : 'border-grafito-300 hover:border-grafito-500',
        propio && 'bg-bosque-50',
      )}
    >
      <div className="text-[12px] font-semibold leading-tight text-grafito-900">{ficha.nombre}</div>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <span className="font-mono text-[11px] text-grafito-500">{ficha.topeGrado1 ? fmtMillones(ficha.topeGrado1) : 'sin tope'}</span>
        {propio && <Insignia tono="bien">Su cargo</Insignia>}
      </div>
    </button>
  );
}

function Rama({ id, config, sel, propio, onSel }: { id: CargoId; config: typeof CONFIG_V1; sel: CargoId; propio?: CargoId; onSel: (c: CargoId) => void }) {
  const f = config.cargos.find((c) => c.id === id)!;
  const hs = hijos(config, id);
  return (
    <li>
      <Nodo ficha={f} sel={sel === id} propio={propio === id} onSel={() => onSel(id)} />
      {hs.length > 0 && <ul>{hs.map((h) => <Rama key={h.id} id={h.id} config={config} sel={sel} propio={propio} onSel={onSel} />)}</ul>}
    </li>
  );
}

function RamaMovil({ id, config, sel, propio, onSel, nivel }: { id: CargoId; config: typeof CONFIG_V1; sel: CargoId; propio?: CargoId; onSel: (c: CargoId) => void; nivel: number }) {
  const f = config.cargos.find((c) => c.id === id)!;
  return (
    <>
      <li style={{ paddingLeft: nivel * 16 }} className="relative">
        {nivel > 0 && <span className="absolute top-0 h-1/2 border-l border-b border-grafito-300" style={{ left: nivel * 16 - 10, width: 8 }} />}
        <button onClick={() => onSel(id)} className={cx('my-1 w-full rounded-md border bg-white px-3 py-2 text-left text-sm', sel === id ? 'border-bosque-600 ring-1 ring-bosque-600' : 'border-grafito-200', propio === id && 'bg-bosque-50')}>
          <span className="font-medium text-grafito-900">{f.nombre}</span>
          {propio === id && <span className="ml-2"><Insignia tono="bien">Su cargo</Insignia></span>}
        </button>
      </li>
      {hijos(config, id).map((h) => <RamaMovil key={h.id} id={h.id} config={config} sel={sel} propio={propio} onSel={onSel} nivel={nivel + 1} />)}
    </>
  );
}

export function Organigrama() {
  const partida = useGame((s) => s.partida);
  const config = partida?.config ?? CONFIG_V1;
  const propio = partida?.meta.cargo;
  const [sel, setSel] = useState<CargoId>(propio ?? 'director_regional');
  const ficha = config.cargos.find((c) => c.id === sel)!;
  const raiz = hijos(config, 'gerencia_general');

  return (
    <div>
      <EncabezadoPantalla titulo="Organigrama" descripcion="Toque un cargo para ver su ficha. Los topes de aprobación están en grado 1 y son datos de simulación. Liberar un lote retenido siempre requiere a Calidad, cualquiera que sea el cargo." />
      <Tarjeta className="mb-5">
        <div className="hidden overflow-x-auto md:block">
          <div className="org mx-auto w-max min-w-full pb-2">
            <ul>
              <li>
                <div className="mx-auto w-44 rounded-md border border-dashed border-grafito-400 bg-grafito-100 px-2 py-2 text-center text-[12px] font-semibold text-grafito-700">Gerencia General<div className="text-[11px] font-normal text-grafito-500">no jugable · aprueba escalamientos máximos</div></div>
                <ul>{raiz.map((r) => <Rama key={r.id} id={r.id} config={config} sel={sel} propio={propio} onSel={setSel} />)}</ul>
              </li>
            </ul>
          </div>
        </div>
        <ul className="md:hidden">
          <li className="mb-1 rounded-md border border-dashed border-grafito-400 bg-grafito-100 px-3 py-2 text-sm font-semibold text-grafito-700">Gerencia General <span className="font-normal text-grafito-500">(no jugable)</span></li>
          {raiz.map((r) => <RamaMovil key={r.id} id={r.id} config={config} sel={sel} propio={propio} onSel={setSel} nivel={1} />)}
        </ul>
      </Tarjeta>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Tarjeta titulo="Ficha del cargo"><FichaCargoVista ficha={ficha} config={config} /></Tarjeta>
        <div className="space-y-5">
          <Tarjeta titulo="Relaciones entre áreas" sub="Áreas que decide directamente; el resto se coordina con su dueño">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(AREA) as AreaId[]).map((a) => (
                <span key={a} className={cx('rounded px-2 py-1 text-xs', ficha.areasPropias.includes(a) ? 'bg-bosque-700 text-white' : 'bg-grafito-100 text-grafito-500')}>{AREA[a]}</span>
              ))}
            </div>
          </Tarjeta>
          <Tarjeta titulo="Responsabilidades frente a resultados" sub="Se llena al cierre de cada ronda con los indicadores de la partida">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-grafito-500"><th className="pb-1 font-medium">Indicador</th><th className="pb-1 text-right font-medium">Resultado</th></tr></thead>
              <tbody>
                {ficha.indicadores.map((i) => (
                  <tr key={i} className="border-t border-grafito-100"><td className="py-1.5 text-grafito-700">{i}</td><td className="py-1.5 text-right text-grafito-400">No disponible</td></tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-grafito-500">Todavía no hay rondas cerradas. Un indicador sin datos se muestra como «No disponible» y no resta puntos.</p>
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}
