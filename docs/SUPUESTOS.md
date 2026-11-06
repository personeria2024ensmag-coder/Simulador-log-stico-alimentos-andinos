# Supuestos documentados

Todos los valores son datos de simulación configurables en `src/data/config-v1.ts`.

1. **Capital operativo = caja.** Los $250.000.000 son caja disponible. El inventario inicial (≈ $1.298 M al costo) es un activo adicional; no es gasto ni caja.
2. **Ocupación del CEDI.** 500 posiciones; 55 están ocupadas por estibas vacías, averías y material de empaque (operación inicial imperfecta). Ocupación inicial: 381 posiciones (76,2%).
3. **Cobertura inicial.** Secos y procesados ≥ 10 días de demanda base. Refrigerados ≥ 2 plazos de su proveedor (vida útil corta: cubrir 10 días aumentaría la merma). El aceite (escenario Ronda 2) tiene 2,3 días a propósito.
4. **Exactitud inicial real**: 16 de 20 SKU coinciden (80%). Las diferencias físicas están ocultas hasta que se cuentan.
5. **Transporte.** Capacidad diaria de despacho = una ruta por vehículo y día. 6.200 kg/día frente a 5.606 kg/día de demanda base (holgura 10,6%). Capacidad refrigerada 900 kg frente a 693 kg.
6. **Temperaturas.** Los rangos de los refrigerados salen de la ficha técnica simulada de cada producto. No son criterio legal.
7. **Ronda** = 7 días simulados por defecto, configurable por ronda.
8. **Topes de aprobación** por cargo en grado 1; cada ascenso multiplica el tope (×2 grado 2, ×3 grado 3). El cargo se mantiene las 18 rondas.
9. **Acciones preventivas** (retener un lote, activar contingencia) las puede ejecutar cualquier cargo. Liberar un lote o decidir el destino de producto no apto siempre requiere a Calidad.
10. **Presupuestos de etapa** (logístico y de compras) son parámetros ilustrativos; se calibrarán en la Fase 3 con el motor de compras y pagos.
11. Distancias, tiempos y posiciones del mapa son ilustrativos; las ciudades se usan solo como nodos del escenario.
