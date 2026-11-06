import { useState } from 'react';
import { Anchor, CheckCircle2, Circle, Lock, PlayCircle, Plane, Ship, Truck, Warehouse } from 'lucide-react';
import { CONFIG_V1 } from '@/data/config-v1';
import { NOMBRE_ETAPA } from '@/data/rondas';
import type { EtapaId } from '@/domain/types';
import { useGame } from '@/store/gameStore';
import { EncabezadoPantalla, Insignia, Tarjeta, cx } from '@/components/ui';

const FASE_ACTUAL = 2;

export function MapaCampana() {
  const partida = useGame((s) => s.partida);
  const config = partida?.config ?? CONFIG_V1;
  const actual = partida?.reloj.ronda ?? 0;
  const [etapa, setEtapa] = useState<EtapaId>(partida?.reloj.etapa ?? 1);
  const [nodoSel, setNodoSel] = useState<string | null>(null);

  const rondas = config.rondas.filter((r) => r.etapa === etapa);
  const crudos = config.nodos.filter((n) => n.etapa === etapa);
  // Se reescala la red ilustrativa para ocupar el lienzo (las posiciones no son geográficas).
  const xs = crudos.map((n) => n.x), ys = crudos.map((n) => n.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const nodos = crudos.map((n) => ({ ...n, x: 110 + ((n.x - x0) / Math.max(1, x1 - x0)) * 780, y: 80 + ((n.y - y0) / Math.max(1, y1 - y0)) * 470 }));
  const conexiones = config.conexiones.filter((c) => c.etapa === etapa);
  const pos = new Map(nodos.map((n) => [n.id, n]));
  const clientesPorNodo = (id: string) => config.clientes.filter((c) => c.nodoId === id).length;
  const sel = nodoSel ? pos.get(nodoSel) : undefined;
  const conexionSel = sel ? conexiones.filter((c) => c.desde === sel.id || c.hasta === sel.id) : [];

  return (
    <div>
      <EncabezadoPantalla titulo="Mapa de campaña" descripcion="Tres etapas de seis rondas. Cada etapa cierra con una evaluación de desempeño; el ascenso se decide al final de las rondas 6 y 12." />
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-grafito-200 p-1" role="tablist">
        {([1, 2, 3] as EtapaId[]).map((e) => (
          <button key={e} role="tab" aria-selected={etapa === e} onClick={() => { setEtapa(e); setNodoSel(null); }} className={cx('flex-1 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium', etapa === e ? 'bg-white text-grafito-900 shadow-sm' : 'text-grafito-600 hover:text-grafito-900')}>
            Etapa {e === 1 ? 'I' : e === 2 ? 'II' : 'III'} <span className="hidden sm:inline">· {NOMBRE_ETAPA[e]}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr]">
        <Tarjeta titulo={NOMBRE_ETAPA[etapa]} sub={etapa === 1 ? 'Estabilizar una operación regional imperfecta' : etapa === 2 ? 'Expandir la red sin perder el control' : 'Exportar con rentabilidad y cumplimiento'}>
          <ol className="space-y-2">
            {rondas.map((r) => {
              const esActual = partida && r.numero === actual;
              const cerrada = partida && r.numero < actual;
              const disponibleEnFase = r.faseImplementacion > FASE_ACTUAL;
              return (
                <li key={r.numero} className={cx('rounded-md border p-3', esActual ? 'border-bosque-600 bg-bosque-50' : 'border-grafito-200 bg-white')}>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0">
                      {cerrada ? <CheckCircle2 size={18} className="text-bosque-600" /> : esActual ? <PlayCircle size={18} className="text-bosque-700" /> : disponibleEnFase ? <Lock size={18} className="text-grafito-400" /> : <Circle size={18} className="text-grafito-300" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-grafito-500">R{r.numero}</span>
                        <span className="text-sm font-semibold text-grafito-900">{r.titulo}</span>
                        {esActual && <Insignia tono="bien">Ronda actual</Insignia>}
                        {(r.numero === 6 || r.numero === 12) && <Insignia tono="info">Evaluación de ascenso</Insignia>}
                        {r.numero === 18 && <Insignia tono="info">Informe final</Insignia>}
                      </div>
                      <p className="mt-1 text-sm text-grafito-600">{r.sintesis}</p>
                      <p className="mt-1 text-xs text-grafito-500"><span className="font-medium">Qué practica: </span>{r.mecanica}</p>
                      {disponibleEnFase && <p className="mt-1 text-xs font-medium text-ambar-700">Jugable desde la Fase {r.faseImplementacion} del desarrollo.</p>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Tarjeta>

        <Tarjeta titulo="Red logística de la etapa" sub="Representación ilustrativa: las posiciones no son geográficas y las distancias y tiempos son simulados.">
          <svg viewBox="0 0 1000 600" className="h-auto w-full rounded-md bg-grafito-50" role="img" aria-label={`Red ilustrativa de la etapa ${etapa}`}>
            {conexiones.map((c) => {
              const a = pos.get(c.desde), b = pos.get(c.hasta);
              if (!a || !b) return null;
              const resaltada = sel && (c.desde === sel.id || c.hasta === sel.id);
              return (
                <line key={`${c.desde}-${c.hasta}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={resaltada ? '#22643f' : c.modo === 'maritimo' ? '#5b8fb9' : c.modo === 'aereo' ? '#a07ad1' : '#a9afb6'}
                  strokeWidth={resaltada ? 5 : 2.5} strokeDasharray={c.modo === 'maritimo' ? '10 7' : c.modo === 'aereo' ? '3 6' : undefined} />
              );
            })}
            {nodos.map((n) => {
              const esCedi = n.tipo === 'cedi';
              const activo = nodoSel === n.id;
              const r = esCedi ? 22 : n.tipo === 'municipio' ? 10 + Math.min(8, clientesPorNodo(n.id) * 2) : 15;
              const color = esCedi ? '#1b4f33' : n.pais === 'Panamá' ? '#5b8fb9' : n.tipo === 'puerto' ? '#33383d' : '#2f7d51';
              return (
                <g key={n.id} onClick={() => setNodoSel(activo ? null : n.id)} style={{ cursor: 'pointer' }}>
                  <circle cx={n.x} cy={n.y} r={r + (activo ? 5 : 0)} fill={color} stroke="#fff" strokeWidth={3} />
                  <text x={n.x} y={n.y - r - 9} textAnchor="middle" fontSize={esCedi ? 30 : 26} fontWeight={esCedi ? 700 : 500} fill="#24282c" paintOrder="stroke" stroke="#f4f5f6" strokeWidth={5}>{n.nombre}</text>
                </g>
              );
            })}
          </svg>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-grafito-600">
            <span className="flex items-center gap-1"><Warehouse size={13} />CEDI</span>
            <span className="flex items-center gap-1"><Truck size={13} />Terrestre</span>
            {etapa === 3 && <><span className="flex items-center gap-1"><Ship size={13} />Marítimo (línea discontinua)</span><span className="flex items-center gap-1"><Plane size={13} />Aéreo (punteado)</span><span className="flex items-center gap-1"><Anchor size={13} />Puerto</span></>}
            {etapa === 1 && <span>El tamaño del punto crece con el número de clientes del municipio.</span>}
          </div>
          {sel ? (
            <div className="mt-3 rounded-md bg-grafito-50 p-3 text-sm">
              <p className="font-semibold text-grafito-900">{sel.nombre} <span className="font-normal text-grafito-500">· {sel.pais}</span></p>
              {etapa === 1 && sel.tipo === 'municipio' && <p className="text-grafito-600">{clientesPorNodo(sel.id)} cliente(s) activo(s).</p>}
              {sel.capacidadPallets && <p className="text-grafito-600">Capacidad: {sel.capacidadPallets} posiciones de pallet.</p>}
              {conexionSel.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-grafito-600">
                  {conexionSel.map((c) => {
                    const otro = pos.get(c.desde === sel.id ? c.hasta : c.desde);
                    return <li key={`${c.desde}-${c.hasta}`}>→ {otro?.nombre}: {c.distanciaSimKm} km simulados · {c.tiempoSimHoras} h simuladas · {c.modo}</li>;
                  })}
                </ul>
              )}
            </div>
          ) : (
            <p className="mt-3 text-xs text-grafito-500">Toque un nodo para ver sus conexiones simuladas.</p>
          )}
        </Tarjeta>
      </div>
    </div>
  );
}
