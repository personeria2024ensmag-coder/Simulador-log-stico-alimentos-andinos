# Registro de cambios

## 0.2.0 — Fase 2 (2026-11-06)
- Proyecto base React + TypeScript + Vite, compilado a un solo HTML para publicación.
- Configuración v1 versionada con huella: 9 cargos con fichas completas, 18 rondas, 20 SKU, 25 clientes, 6 proveedores, 6 recursos de transporte, red ilustrativa de 3 etapas.
- Motor: creación de partida determinista con semilla, matriz de autoridad con escalamiento, invariantes globales, selectores de inventario, ocupación, finanzas, transporte y alertas.
- Guardado automático en IndexedDB con respaldo en localStorage, dos copias, suma de verificación, importación validada y exportación (capacidad `downloads` en la página publicada).
- Pantallas: inicio, nueva partida y cargo, organigrama interactivo, mapa de campaña, centro de control, configuración (lectura). El resto muestra la fase en que se habilita.
