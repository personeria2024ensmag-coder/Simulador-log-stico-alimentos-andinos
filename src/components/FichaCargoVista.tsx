import type { FichaCargo } from '@/domain/config';
import type { SimConfig } from '@/domain/config';
import { Insignia } from './ui';
import { fmtCOP } from './format';

const NIVEL: Record<FichaCargo['nivel'], string> = { directivo: 'Directivo', tactico: 'Táctico', operativo: 'Operativo' };

function Lista({ titulo, items }: { titulo: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-grafito-500">{titulo}</h4>
      <ul className="mt-1 space-y-0.5 text-sm text-grafito-700">
        {items.map((x) => <li key={x} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-bosque-500" />{x}</li>)}
      </ul>
    </div>
  );
}

export function FichaCargoVista({ ficha, config, compacta }: { ficha: FichaCargo; config: SimConfig; compacta?: boolean }) {
  const jefe = ficha.reportaA === 'gerencia_general' ? 'Gerencia General (no jugable)' : config.cargos.find((c) => c.id === ficha.reportaA)?.nombre;
  const m = config.topeMultiplicadorGrado;
  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-grafito-900">{ficha.nombre}</h3>
          <Insignia tono={ficha.nivel === 'directivo' ? 'bien' : ficha.nivel === 'tactico' ? 'info' : 'neutro'}>{NIVEL[ficha.nivel]} · nivel {ficha.nivelJerarquico}</Insignia>
        </div>
        <p className="mt-1 text-sm text-grafito-600">Reporta a: {jefe}</p>
        <p className="mt-2 text-sm text-grafito-800"><span className="font-medium">Objetivo principal: </span>{ficha.objetivo}</p>
      </div>
      <div className="rounded-md bg-grafito-50 p-3 text-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-grafito-500">Tope de aprobación de gasto <span className="font-normal normal-case">(dato de simulación)</span></div>
        {ficha.topeGrado1 === 0 ? (
          <p className="mt-1 text-grafito-700">Propone, pero no aprueba gasto: todo gasto se escala.</p>
        ) : (
          <div className="mt-1 grid grid-cols-1 gap-2 font-mono text-[13px] sm:grid-cols-3">
            <div><div className="font-sans text-[11px] text-grafito-500">Grado 1 · regional</div>{fmtCOP(ficha.topeGrado1 * m[1])}</div>
            <div><div className="font-sans text-[11px] text-grafito-500">Grado 2 · nacional</div>{fmtCOP(ficha.topeGrado1 * m[2])}</div>
            <div><div className="font-sans text-[11px] text-grafito-500">Grado 3 · internacional</div>{fmtCOP(ficha.topeGrado1 * m[3])}</div>
          </div>
        )}
        <p className="mt-2 text-xs text-grafito-500">{ficha.profundidad}</p>
      </div>
      <div className={compacta ? 'grid gap-4' : 'grid gap-4 md:grid-cols-2'}>
        <Lista titulo="Responsabilidades" items={ficha.responsabilidades} />
        <Lista titulo="Indicadores bajo su control" items={ficha.indicadores} />
        {!compacta && <Lista titulo="Recursos que puede autorizar" items={ficha.recursosQueAutoriza} />}
        {!compacta && <Lista titulo="Requiere aprobación superior" items={ficha.requiereAprobacion} />}
        {!compacta && <Lista titulo="Riesgos que debe vigilar" items={ficha.riesgos} />}
        <Lista titulo="Objetivos de desempeño" items={ficha.objetivosDesempeno} />
        {!compacta && <Lista titulo="Ejemplos de decisiones" items={ficha.ejemplosDecisiones} />}
        {!compacta && <Lista titulo="Competencias que se evalúan" items={ficha.competencias} />}
      </div>
    </div>
  );
}
