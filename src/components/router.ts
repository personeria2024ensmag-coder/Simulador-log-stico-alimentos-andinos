import { useEffect, useState } from 'react';

/**
 * Navegación por hash simple (#nombre), compatible con la página publicada:
 * solo letras, dígitos y guiones; nunca rutas con barras ni parámetros.
 */
export type Ruta =
  | 'inicio' | 'nueva-partida' | 'organigrama' | 'mapa' | 'control'
  | 'inventario' | 'pedidos' | 'compras' | 'transporte' | 'finanzas'
  | 'crisis' | 'indicadores' | 'historial' | 'informe' | 'configuracion';

export const RUTAS: Ruta[] = ['inicio', 'nueva-partida', 'organigrama', 'mapa', 'control', 'inventario', 'pedidos', 'compras', 'transporte', 'finanzas', 'crisis', 'indicadores', 'historial', 'informe', 'configuracion'];

function leer(): Ruta {
  const h = (typeof location !== 'undefined' ? location.hash : '').replace(/^#/, '');
  return (RUTAS as string[]).includes(h) ? (h as Ruta) : 'inicio';
}

export function ir(r: Ruta) {
  if (location.hash.replace(/^#/, '') !== r) location.hash = r;
  window.scrollTo?.({ top: 0 });
}

export function useRuta(): Ruta {
  const [ruta, setRuta] = useState<Ruta>(leer());
  useEffect(() => {
    const f = () => setRuta(leer());
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return ruta;
}
