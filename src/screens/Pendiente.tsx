import { Hammer } from 'lucide-react';
import type { Ruta } from '@/components/router';
import { EncabezadoPantalla, Vacio } from '@/components/ui';

const INFO: Partial<Record<Ruta, { titulo: string; fase: number; contenido: string }>> = {
  inventario: { titulo: 'Inventario y lotes', fase: 3, contenido: 'Existencias por estado (física, disponible, reservada, bloqueada, en tránsito, comprometida y en devolución), lotes con vencimiento, movimientos auditables y conteos.' },
  pedidos: { titulo: 'Pedidos y clientes', fase: 3, contenido: 'Ciclo completo del pedido (pendiente, reservado, en preparación, despachado, entregado), entregas parciales, cancelaciones con liberación de reservas y nivel de servicio por cliente.' },
  compras: { titulo: 'Compras y proveedores', fase: 3, contenido: 'Órdenes de compra, mercancía en tránsito hasta su recepción, recepciones parciales y desempeño de proveedores.' },
  transporte: { titulo: 'Transporte, flota y rutas', fase: 4, contenido: 'Asignación de vehículos por franja, rutas, contratación adicional, averías, costos y emisiones estimadas.' },
  finanzas: { titulo: 'Finanzas y presupuesto', fase: 3, contenido: 'Presupuesto autorizado, comprometido, costo reconocido, pagos, ingresos y flujo de caja, sin contar dos veces un mismo valor.' },
  crisis: { titulo: 'Centro de crisis y decisiones', fase: 3, contenido: 'Eventos abiertos con plazo, opciones con su impacto económico antes de confirmar y escalamientos según la autoridad del cargo.' },
  indicadores: { titulo: 'Indicadores y evaluación', fase: 3, contenido: 'Indicadores por ronda, por etapa y acumulados, con numerador y denominador; la puntuación completa y los bloqueos llegan en la Fase 7.' },
  historial: { titulo: 'Historial de eventos', fase: 3, contenido: 'Bitácora filtrable de decisiones, efectos, eventos y alertas.' },
  informe: { titulo: 'Informe final', fase: 7, contenido: 'Informe completo de la campaña con exportación real en JSON, CSV y PDF.' },
};

export function Pendiente({ ruta }: { ruta: Ruta }) {
  const i = INFO[ruta];
  if (!i) return null;
  return (
    <div>
      <EncabezadoPantalla titulo={i.titulo} />
      <Vacio titulo={`Disponible en la Fase ${i.fase} del desarrollo`} icono={<Hammer size={28} />}>
        <p>{i.contenido}</p>
        <p className="mt-2">Esta pantalla no tiene botones todavía para no simular acciones que el motor aún no ejecuta.</p>
      </Vacio>
    </div>
  );
}
