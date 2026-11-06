import { useMemo, useState } from 'react';
import { CheckCircle2, Dices, Skull } from 'lucide-react';
import { CONFIG_V1 } from '@/data/config-v1';
import type { CargoId } from '@/domain/types';
import { useGame } from '@/store/gameStore';
import { semillaNueva } from '@/engine/rng/rng';
import { FichaCargoVista } from '@/components/FichaCargoVista';
import { Boton, Dialogo, EncabezadoPantalla, Insignia, Tarjeta, cx } from '@/components/ui';
import { fmtCOP } from '@/components/format';
import { ir } from '@/components/router';

const ORDEN: CargoId[] = ['director_nacional', 'director_comex', 'director_regional', 'coord_operaciones', 'jefe_abastecimiento', 'coord_calidad', 'jefe_inventarios', 'coord_transporte', 'analista_planeacion'];

export function NuevaPartida() {
  const existente = useGame((s) => s.partida);
  const crear = useGame((s) => s.nuevaPartida);
  const [cargo, setCargo] = useState<CargoId>('coord_operaciones');
  const [nombre, setNombre] = useState('');
  const [semilla, setSemilla] = useState<string>(() => String(semillaNueva()));
  const [confirmar, setConfirmar] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);
  const [creando, setCreando] = useState(false);
  const ficha = useMemo(() => CONFIG_V1.cargos.find((c) => c.id === cargo)!, [cargo]);

  const semillaValida = /^\d{1,10}$/.test(semilla) && Number(semilla) <= 2_000_000_000;

  const iniciar = async () => {
    setConfirmar(false);
    setCreando(true);
    const r = await crear({ cargo, nombreJugador: nombre, semilla: Number(semilla) });
    setCreando(false);
    if (r.ok) ir('control');
    else setErrores(r.errores);
  };

  return (
    <div>
      <EncabezadoPantalla titulo="Nueva partida" descripcion="Elija un solo cargo para toda la campaña. El cargo define qué decide directamente, qué debe escalar, qué información ve y cómo se le evalúa. Se mantiene en las 18 rondas; cada ascenso amplía su alcance y su tope de aprobación." />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <Tarjeta titulo="1. Cargo">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {ORDEN.map((id) => {
                const f = CONFIG_V1.cargos.find((c) => c.id === id)!;
                const sel = id === cargo;
                return (
                  <button key={id} onClick={() => setCargo(id)} aria-pressed={sel} className={cx('rounded-md border p-3 text-left transition-colors', sel ? 'border-bosque-600 bg-bosque-50 ring-1 ring-bosque-600' : 'border-grafito-200 bg-white hover:border-grafito-400')}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-grafito-900">{f.nombre}</span>
                      {sel && <CheckCircle2 size={16} className="shrink-0 text-bosque-600" />}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-grafito-500">
                      <Insignia tono={f.nivel === 'directivo' ? 'bien' : f.nivel === 'tactico' ? 'info' : 'neutro'}>{f.nivel === 'directivo' ? 'Directivo' : f.nivel === 'tactico' ? 'Táctico' : 'Operativo'}</Insignia>
                      <span className="font-mono">{f.topeGrado1 ? fmtCOP(f.topeGrado1) : 'sin tope de gasto'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 border-t border-grafito-100 pt-4 lg:hidden">
              <FichaCargoVista ficha={ficha} config={CONFIG_V1} compacta />
            </div>
          </Tarjeta>
          <Tarjeta titulo="2. Datos de la partida">
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="font-medium text-grafito-800">Nombre del jugador o del equipo</span>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} placeholder="Ej.: Equipo 3 — Procesos Logísticos" className="mt-1 w-full rounded-md border border-grafito-300 px-3 py-2 text-sm focus:border-bosque-600 focus:outline-none focus:ring-1 focus:ring-bosque-600" />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-grafito-800">Semilla del escenario</span>
                <div className="mt-1 flex gap-2">
                  <input value={semilla} onChange={(e) => setSemilla(e.target.value.trim())} inputMode="numeric" className={cx('w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-1', semillaValida ? 'border-grafito-300 focus:border-bosque-600 focus:ring-bosque-600' : 'border-alerta-500 focus:ring-alerta-500')} aria-invalid={!semillaValida} />
                  <Boton variante="secundario" onClick={() => setSemilla(String(semillaNueva()))} title="Generar otra semilla"><Dices size={16} /></Boton>
                </div>
                <span className={cx('mt-1 block text-xs', semillaValida ? 'text-grafito-500' : 'text-alerta-600')}>{semillaValida ? 'La semilla queda registrada. Con la misma semilla y las mismas decisiones, el resultado es idéntico; el docente puede usarla para comparar equipos.' : 'Escriba un número entero entre 0 y 2.000.000.000.'}</span>
              </label>
            </div>
          </Tarjeta>
          <Tarjeta titulo={<span className="flex items-center gap-2"><Skull size={16} className="text-alerta-600" />Condición de fracaso terminal</span>}>
            <p className="text-sm text-grafito-700">La única derrota definitiva es la <strong>insolvencia</strong>: caja negativa en dos cierres de ronda seguidos sin crédito disponible. Si ocurre, podrá empezar una partida nueva o recuperar una copia exportada.</p>
            <p className="mt-2 text-sm text-grafito-600">No alcanzar un ascenso no termina la campaña: la empresa sigue a la siguiente etapa, usted conserva su grado y recibe un plan correctivo con metas medibles.</p>
          </Tarjeta>
          <div className="flex justify-end">
            <Boton disabled={!semillaValida || creando} onClick={() => (existente ? setConfirmar(true) : void iniciar())}>{creando ? 'Creando…' : 'Iniciar campaña'}</Boton>
          </div>
          {errores.length > 0 && (
            <div role="alert" className="rounded-md border border-alerta-500 bg-alerta-50 p-3 text-sm text-alerta-700">
              <p className="font-medium">No se pudo crear la partida:</p>
              <ul className="mt-1 list-disc pl-5">{errores.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </div>
          )}
        </div>
        <Tarjeta titulo="Ficha completa del cargo" sub="Revise su autoridad antes de empezar" className="lg:sticky lg:top-20 lg:self-start">
          <FichaCargoVista ficha={ficha} config={CONFIG_V1} />
        </Tarjeta>
      </div>
      <Dialogo
        abierto={confirmar}
        titulo="¿Reemplazar la partida guardada?"
        onCerrar={() => setConfirmar(false)}
        acciones={<><Boton variante="secundario" onClick={() => setConfirmar(false)}>Cancelar</Boton><Boton variante="peligro" onClick={() => void iniciar()}>Reemplazar e iniciar</Boton></>}
      >
        Ya existe una partida en este navegador ({existente?.meta.id}). Si inicia una nueva, la anterior se reemplaza. Si quiere conservarla, cancele y expórtela desde Configuración.
      </Dialogo>
    </div>
  );
}
