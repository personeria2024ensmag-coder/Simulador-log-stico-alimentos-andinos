# Registro de pruebas

## 2026-11-06 — Fase 2 (versión 0.2.0)

### Vitest — 40 pruebas, 40 aprobadas
| Archivo | Cubre | Resultado |
| --- | --- | --- |
| `acceptance/p01-creacion-partida` | **Prueba 1**: estado inicial correcto, semilla y huella registradas, caja $250 M, determinismo, rechazo de cargo o semilla inválidos | 11/11 |
| `acceptance/p02-permisos-cargo` | **Prueba 2**: topes por cargo y grado, escalamiento por tope, por área ajena y por autorización de Calidad, acciones preventivas | 9/9 |
| `acceptance/p14-guardado` | **Prueba 14**: guardar y cargar idéntico (IndexedDB), recuperación de la copia anterior, respaldo ante fallo, carga sin efectos, importación íntegra y rechazo de archivos alterados, ajenos o de versión futura | 5/5 |
| `engine/arranque` | Comprobaciones de arranque del plan (márgenes, cobertura, ocupación 76,2%, exactitud 80%, holgura de flota, lotes que vencen en la Ronda 5, escenario Ronda 2) | 10/10 |
| `unit/config` | Configuración válida; inválida rechazada con mensajes comprensibles (base de la prueba 19) | 4/4 |
| `unit/rng` | Generador determinista | 1/1 |

Ajuste durante la fase: la regla «cobertura ≥ 10 días» falló para los refrigerados (7 días). Se corrigió la regla, no los datos: los refrigerados se exigen ≥ 2 plazos de su proveedor (ver SUPUESTOS.md, punto 3).

### Interfaz (Playwright + Chrome) — 22 comprobaciones, 22 aprobadas
Computador 1366×768 y celular 390×844: crear partida, centro de control con caja y pedidos, recuperación tras recargar, navegación a organigrama, mapa, configuración e inventario, semilla visible, sin desbordamiento horizontal, sin errores de JavaScript.

### Pendientes de fases siguientes
Pruebas 3–13 y 15–20 del documento maestro (Fases 3–8). La proyección de caja de la Etapa I se verificará cuando exista el motor de compras y pagos (Fase 3).
