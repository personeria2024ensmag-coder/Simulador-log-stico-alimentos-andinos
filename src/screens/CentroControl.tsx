import { AlertOctagon, AlertTriangle, Boxes, ClipboardList, Info, Target, Truck, Wallet, Warehouse } from 'lucide-react';
import { useGame } from '@/store/gameStore';
import { fichaCargo, topeAprobacion } from '@/engine/core/authority';
import { alertas, capacidadTransporte, existenciasPorSku, ocupacionCedi, pedidosPendientes, producto, resumenFinanciero } from '@/engine/core/selectors';
import { NOMBRE_ETAPA } from '@/data/rondas';
import { Boton, EncabezadoPantalla, EtiquetaSimulacion, Insignia, Kpi, Tarjeta, Vacio, cx } from '@/components/ui';
import { fmtCOP, fmtDec, fmtMillones, fmtNum, fmtPct } from '@/components/format';
import { ir } from '@/components/router';

export function CentroControl() {
  const p = useGame((s) => s.partida);
  if (!p) {
    return (
      <Vacio titulo="No hay una partida en curso" icono={<Info size={28} />}>
        <p>Cree una partida para ver el centro de control.</p>
        <div className="mt-4"><Boton onClick={() => ir('nueva-partida')}>Nueva partida</Boton></div>
      </Vacio>
    );
  }
  const fin = resumenFinanciero(p);
  const occ = ocupacionCedi(p);
  const cap = capacidadTransporte(p);
  const pend = pedidosPendientes(p);
  const ex = existenciasPorSku(p);
  const al = alertas(p);
  const ronda = p.config.rondas.find((r) => r.numero === p.reloj.ronda)!;
  const cargo = fichaCargo(p, p.meta.cargo);
  const u = p.config.alertas;
  const criticos = ex.filter((e) => e.coberturaDias !== null).sort((a, b) => (a.coberturaDias ?? 0) - (b.coberturaDias ?? 0)).slice(0, 6);
  const conteos = p.inventario.conteos;
  const unidadesPend = pend.reduce((s, o) => s + o.lineas.reduce((a, l) => a + l.solicitada - l.entregada, 0), 0);

  return (
    <div>
      <EncabezadoPantalla
        titulo="Centro de control logístico"
        descripcion={<>{NOMBRE_ETAPA[p.reloj.etapa]} · Ronda {p.reloj.ronda} · Día simulado {p.reloj.dia} · {cargo.nombre} (grado {p.meta.grado}, tope {topeAprobacion(p) ? fmtCOP(topeAprobacion(p)) : 'sin tope de gasto'})</>}
        derecha={<EtiquetaSimulacion />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi etiqueta="Caja disponible" icono={<Wallet size={14} />} valor={fmtMillones(fin.caja)} detalle={`Capital inicial ${fmtMillones(p.config.empresa.capitalInicial)}`} tono={fin.caja < p.config.empresa.capitalInicial * u.cajaFraccionAdvertencia ? 'critico' : 'bien'} />
        <Kpi etiqueta="Presupuesto comprometido" icono={<Target size={14} />} valor={fmtMillones(fin.comprometido)} detalle={`Logístico aprobado ${fmtMillones(fin.presupuestoLogistico)} · compras ${fmtMillones(fin.presupuestoCompras)}`} />
        <Kpi etiqueta="Inventario al costo" icono={<Boxes size={14} />} valor={fmtMillones(fin.inventarioValorizado)} detalle={`${fmtNum(ex.reduce((s, e) => s + e.fisica, 0))} unidades registradas`} />
        <Kpi etiqueta="Pedidos pendientes" icono={<ClipboardList size={14} />} valor={fmtNum(pend.length)} detalle={`${fmtNum(unidadesPend)} unidades por entregar`} tono={pend.some((o) => o.diaPrometido <= p.reloj.dia) ? 'advertencia' : 'neutro'} />
        <Kpi etiqueta="Ocupación del CEDI" icono={<Warehouse size={14} />} valor={fmtPct(occ.fraccion)} detalle={`${occ.ocupadas} de ${occ.capacidad} posiciones · ${occ.noDisponibles} sin producto vendible`} tono={occ.fraccion >= u.ocupacionCediCritica ? 'critico' : occ.fraccion >= u.ocupacionCediAdvertencia ? 'advertencia' : 'bien'} />
        <Kpi etiqueta="Capacidad de despacho" icono={<Truck size={14} />} valor={`${fmtNum(cap.capacidadKgDisponible)} kg/día`} detalle={`${cap.vehiculosDisponibles} de ${cap.vehiculosTotales} recursos disponibles · demanda base ${fmtNum(cap.demandaKgDiaria)} kg/día`} tono={cap.capacidadKgDisponible < cap.demandaKgDiaria ? 'critico' : 'bien'} />
        <Kpi etiqueta="OTIF" valor="No disponible" detalle="Aún no hay pedidos elegibles cerrados" tono="nd" />
        <Kpi etiqueta="Exactitud de inventario" valor={conteos.length ? fmtPct(conteos.filter((c) => c.coincide).length / conteos.length) : 'No disponible'} detalle={conteos.length ? `${conteos.length} SKU contados` : 'Ningún SKU contado todavía'} tono="nd" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <div className="space-y-5">
          <Tarjeta titulo={`Ronda ${ronda.numero}: ${ronda.titulo}`} sub={ronda.sintesis}>
            <p className="text-sm text-grafito-700"><span className="font-medium">Qué practica: </span>{ronda.mecanica}</p>
            <p className="mt-1 text-sm text-grafito-700"><span className="font-medium">Indicadores: </span>{ronda.indicadores.join(', ')}</p>
            <div className="mt-3 rounded-md border border-ambar-500/40 bg-ambar-50 p-3 text-sm text-ambar-700">
              Las decisiones de esta ronda se habilitan en la Fase 3 del desarrollo. Por ahora puede revisar el estado inicial de la empresa, su cargo y las alertas; nada de lo que ve aquí es un botón sin efecto.
            </div>
          </Tarjeta>

          <Tarjeta titulo="Pedidos pendientes" sub="Preparado, despachado y entregado son estados distintos">
            {pend.length === 0 ? (
              <p className="text-sm text-grafito-500">No hay pedidos pendientes.</p>
            ) : (
              <div className="-mx-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead><tr className="border-b border-grafito-100 text-left text-xs text-grafito-500"><th className="px-4 py-2 font-medium">Pedido</th><th className="px-2 py-2 font-medium">Cliente</th><th className="px-2 py-2 font-medium">Promesa</th><th className="px-2 py-2 font-medium">Líneas</th><th className="px-4 py-2 text-right font-medium">Estado</th></tr></thead>
                  <tbody>
                    {pend.map((o) => {
                      const cl = p.clientes.find((c) => c.id === o.clienteId)!;
                      const dias = o.diaPrometido - p.reloj.dia;
                      return (
                        <tr key={o.id} className="border-b border-grafito-100 last:border-0">
                          <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">{o.id}</td>
                          <td className="px-2 py-2"><div className="text-grafito-900">{cl.nombre}</div><div className="text-xs text-grafito-500">Segmento {cl.segmento} · ventana {cl.ventanaEntrega}</div></td>
                          <td className="px-2 py-2"><span className="font-mono">Día {o.diaPrometido}</span>{dias <= 0 && <Insignia tono="advertencia">{dias === 0 ? 'hoy' : 'vencida'}</Insignia>}</td>
                          <td className="px-2 py-2 text-xs text-grafito-600">{o.lineas.map((l) => `${producto(p, l.sku).nombre} × ${fmtNum(l.solicitada)}`).join(' · ')}</td>
                          <td className="px-4 py-2 text-right"><Insignia>{o.estado}</Insignia></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Tarjeta>
        </div>

        <div className="space-y-5">
          <Tarjeta titulo={`Alertas (${al.length})`}>
            {al.length === 0 ? <p className="text-sm text-grafito-500">Sin alertas activas.</p> : (
              <ul className="space-y-2">
                {al.map((a) => (
                  <li key={a.id} className={cx('flex gap-2 rounded-md border p-2.5 text-sm', a.nivel === 'critica' ? 'border-alerta-500/40 bg-alerta-50' : a.nivel === 'advertencia' ? 'border-ambar-500/40 bg-ambar-50' : 'border-grafito-200')}>
                    {a.nivel === 'critica' ? <AlertOctagon size={16} className="mt-0.5 shrink-0 text-alerta-600" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0 text-ambar-600" />}
                    <div><div className="font-medium text-grafito-900">{a.titulo}</div><div className="text-xs text-grafito-600">{a.detalle}</div></div>
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>

          <Tarjeta titulo="Cobertura más baja" sub="Disponible ÷ demanda base diaria (pronóstico simulado)">
            <ul className="space-y-2">
              {criticos.map((e) => {
                const prod = producto(p, e.sku);
                const c = e.coberturaDias ?? 0;
                return (
                  <li key={e.sku}>
                    <div className="flex justify-between text-sm"><span className="text-grafito-800">{prod.nombre}</span><span className={cx('font-mono', c < u.coberturaDiasAdvertencia ? 'font-semibold text-alerta-600' : 'text-grafito-700')}>{fmtDec(c)} días</span></div>
                    <div className="mt-1 h-1.5 rounded bg-grafito-100"><div className={cx('h-1.5 rounded', c < u.coberturaDiasAdvertencia ? 'bg-alerta-500' : c < 10 ? 'bg-ambar-500' : 'bg-bosque-500')} style={{ width: `${Math.min(100, (c / 30) * 100)}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          </Tarjeta>

          <Tarjeta titulo="Flota" sub={`${p.flota.filter((v) => v.tipo === 'propio').length} propios · ${p.flota.filter((v) => v.tipo === 'contratado').length} contratados`}>
            <ul className="divide-y divide-grafito-100 text-sm">
              {p.flota.map((v) => (
                <li key={v.id} className="flex items-center justify-between py-1.5">
                  <span><span className="font-mono text-xs text-grafito-500">{v.id}</span> {v.nombre}{v.refrigerado && <span className="ml-1"><Insignia tono="info">frío</Insignia></span>}</span>
                  <span className="text-xs text-grafito-600">{fmtNum(v.capacidadKg)} kg · <Insignia tono={v.estado === 'disponible' ? 'bien' : 'critico'}>{v.estado}</Insignia></span>
                </li>
              ))}
            </ul>
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}
