import { useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { useGame } from '@/store/gameStore';
import { useRuta } from '@/components/router';
import { Layout } from '@/components/Layout';
import { Inicio } from '@/screens/Inicio';
import { NuevaPartida } from '@/screens/NuevaPartida';
import { Organigrama } from '@/screens/Organigrama';
import { MapaCampana } from '@/screens/MapaCampana';
import { CentroControl } from '@/screens/CentroControl';
import { Configuracion } from '@/screens/Configuracion';
import { Pendiente } from '@/screens/Pendiente';

export default function App() {
  const ruta = useRuta();
  const iniciar = useGame((s) => s.iniciar);
  const guardado = useGame((s) => s.guardado);
  const avisos = useGame((s) => s.avisos);
  const descartar = useGame((s) => s.descartarAviso);

  useEffect(() => { void iniciar(); }, [iniciar]);

  let pantalla: React.ReactNode;
  switch (ruta) {
    case 'inicio': pantalla = <Inicio />; break;
    case 'nueva-partida': pantalla = <NuevaPartida />; break;
    case 'organigrama': pantalla = <Organigrama />; break;
    case 'mapa': pantalla = <MapaCampana />; break;
    case 'control': pantalla = <CentroControl />; break;
    case 'configuracion': pantalla = <Configuracion />; break;
    default: pantalla = <Pendiente ruta={ruta} />;
  }

  return (
    <Layout ruta={ruta}>
      {(guardado.tipo === 'error' || guardado.tipo === 'sin_almacen') && (
        <div role="alert" className="mb-4 rounded-md border border-ambar-500 bg-ambar-50 px-4 py-2.5 text-sm text-ambar-700">
          <strong>El progreso no se está guardando.</strong> {guardado.mensaje} <a href="#configuracion" className="font-medium underline">Exportar partida</a>
        </div>
      )}
      {avisos.map((a, i) => (
        <div key={i} className="mb-3 flex items-start justify-between gap-3 rounded-md border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-800">
          <span>{a}</span><button aria-label="Cerrar aviso" onClick={() => descartar(i)}><X size={16} /></button>
        </div>
      ))}
      {guardado.tipo === 'iniciando' && ruta !== 'inicio' ? (
        <div className="flex items-center gap-2 py-16 text-sm text-grafito-500"><Loader2 size={18} className="animate-spin" />Cargando la partida guardada…</div>
      ) : pantalla}
    </Layout>
  );
}
