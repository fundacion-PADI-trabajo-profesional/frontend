# Asignar varias aulas a un docente de una vez

Fecha: 2026-10-30. Pedido de Cata (Fundación PADI): "alguna manera de cargar más
rápido las aulas a un docente, y no tener que asignar una por una".

## Qué pasaba

En Docentes → menú del docente → "Asignar aula", el diálogo tenía un desplegable
de a un aula; cada asignación recargaba la lista y había que volver a abrir el menú.

## Decisión

- El mismo diálogo pasa a selección múltiple (`Autocomplete multiple`) con las
  aulas disponibles del colegio del docente (ya filtradas por
  `filtrarAulasDisponibles`), un atajo "Seleccionar todas" y el botón "Asignar N aulas".
- Se mantiene el endpoint por aula (`POST /aulas/:id/asignar-docente`): una
  llamada por aula en paralelo (`Promise.allSettled`), porque el backend valida
  permisos por aula y las cantidades son chicas (un docente tiene pocas aulas). No
  hace falta un endpoint masivo nuevo.
- `resumenAsignaciones` (utils) convierte los resultados en un mensaje: silencio si
  todo salió bien; "Se asignaron 2 de 3 aulas. No se pudo asignar: …" si alguna falló.
- `etiquetaAula` centraliza el texto "4° - A (Mañana)" del selector.

## Verificación

`test/utils/docentes-aulas.test.ts` (etiqueta y resumen). El diálogo no tiene test
de componente: la página carga datos al montar y las utilidades concentran la lógica.
