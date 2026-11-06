# Alimentos Andinos S.A.S. — Simulador de Decisiones Logísticas

Simulador académico para la asignatura **Procesos Logísticos de Distribución**. El estudiante asume un cargo en una distribuidora ficticia de alimentos (Girardot, Cundinamarca) y recorre 18 rondas: regional → nacional → internacional (Panamá).

> Empresa, clientes, proveedores, precios, tarifas, distancias y acontecimientos son **ficticios** (datos de simulación).

## Estado

| Fase | Contenido | Estado |
| --- | --- | --- |
| 1 | Plan técnico | Aprobado |
| 2 | Interfaz y navegación, creación de partida, permisos por cargo, guardado | **Entregada** |
| 3 | Motor mínimo y Ronda 1 | Pendiente |
| 4–8 | Rondas 2–18, evaluación, informes, validación | Pendiente |

## Uso local

```bash
npm install
npm run dev        # desarrollo
npm test           # pruebas unitarias y de aceptación
npm run build      # genera dist/index.html (un solo archivo)
```

Prueba de interfaz en computador (1366×768) y celular (390×844):

```bash
npm run build && python3 -m http.server 4173 --directory dist &
python3 -I tests/e2e/capturas.py http://localhost:4173/ ./capturas
```

## Arquitectura

```
src/domain    tipos, esquemas de validación, huella de configuración
src/data      configuración v1 (datos de simulación): cargos, rondas, productos, red, clientes, proveedores, flota
src/engine    motor puro: crear partida, autoridad del cargo, selectores derivados, invariantes, generador con semilla
src/store     puente React ↔ motor (sin reglas de negocio)
src/storage   guardado (IndexedDB + localStorage, dos copias, suma de verificación), importación, migraciones, descargas
src/screens   pantallas
tests/        unitarias, motor, aceptación y e2e
docs/         supuestos, fórmulas, cambios y registro de pruebas
```

Reglas: el motor no importa React, no usa la hora real ni `Math.random`; la interfaz no modifica datos por su cuenta.

## Guardado

La partida se guarda en el navegador y dispositivo donde se juega; no se sincroniza. La copia de seguridad es la exportación JSON (Configuración → Exportar partida), que se valida al importarla.
