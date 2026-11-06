# Fórmulas

Las fórmulas viven en funciones puras del motor. Fase 2 implementa solo las derivaciones de estado:

| Concepto | Fórmula | Archivo |
| --- | --- | --- |
| Existencia física registrada (lote) | Σ deltas del libro de movimientos | `engine/core/selectors.ts` |
| Existencia disponible | max(0, física − reservada − bloqueada) | ídem |
| Cobertura (días) | disponible ÷ demanda base diaria; «No disponible» si la demanda es 0 | ídem |
| Ocupación del CEDI | (Σ ⌈unidades del lote ÷ unidades por pallet⌉ + posiciones no disponibles) ÷ capacidad | ídem |
| Caja | aportes + cobros − pagos (compromisos y costos no mueven caja) | ídem |
| Tope de aprobación | tope grado 1 × multiplicador del grado | `engine/core/authority.ts` |

OTIF, fill rate, exactitud, costo logístico y demás indicadores de la sección 13 del documento maestro se implementan desde la Fase 3. Con denominador cero se muestran como «No disponible».
