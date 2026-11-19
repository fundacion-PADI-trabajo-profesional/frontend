# Preguntas para el evaluador + inicio sin "Evaluaciones" (18/11/2026)

Pedido de la Fundación vía Nacho. Decisiones y alternativas: ADR 0020 (`documentacion-ADR`).
Maqueta con las opciones que se mostraron: `PADI/maquetas/preguntas-evaluador.html` (fuera de git).
Capturas de lo implementado: `PADI/maquetas/capturas-preguntas-evaluador/`.

## Qué se pidió y qué eligió Nacho
1. Ocultar "Evaluaciones" en todas las vistas: se evalúa entrando por Estudiantes.
2. Quinta sección en la ficha de la evaluación, "Preguntas para el evaluador":
   sesiones completadas (sólo cierre; menos de 5 / entre 5 y 9 / 10 o más), tratamiento, CUD, observaciones.
3. En alumnos, junto al semáforo, ver si tiene CUD o está en tratamiento.
- Alumnos: **insignias de una letra** (C violeta, T azul) con leyenda. Sólo CUD y tratamiento; no hay marca de
  "tratamiento pendiente" ni opciones "no necesita / aún no empezó".
- Ficha: **quinta tarjeta en la misma lista** que las áreas.
- Sección: **todo en una pantalla**.

## Llamadas de diseño que tomó Claude (Nacho no las vio implementadas todavía)
- Tratamiento es Sí/No (se puede desmarcar) y CUD una casilla aparte; al guardar, la casilla sin marcar es "no".
- Nada es obligatorio. Estado de la tarjeta: No iniciada / En Progreso / Completada (completa = tratamiento
  respondido y, en cierre, sesiones). No toca puntaje ni semáforo.
- El dato de alumnos es el más reciente respondido en cualquier evaluación del chico (lo resuelve el backend).
- Ven el dato los mismos roles que ya ven las evaluaciones del chico. No entra en PDF ni Excel.
- "¿Recibió evaluación el año pasado?" (pedido original, evaluación inicial) no se pregunta: sale del historial.
- La entrada "ver evaluaciones de este docente" de la pantalla Docentes se dejó (es auditoría, no la sección).
- Con el alumno dado de baja la sección es de solo lectura, como el resto de la ficha.

## Dónde está cada cosa
- Regla pura: `src/utils/datosEvaluador.ts` (estado de la sección, insignias). Tests en `test/utils/`.
- API: `guardarDatosEvaluador` y `datosEvaluador` en `src/api/evaluaciones.ts`; `contexto_evaluador` en `src/api/estudiantes.ts`.
- Pantalla: `src/components/evaluaciones/PreguntasEvaluador.tsx`; tarjeta en `EvaluacionDetalle.tsx`.
- Insignias: `src/components/estudiantes/InsigniasContexto.tsx`, usadas en `EstudiantesCompacto`, `pages/Estudiantes.tsx`
  (docente) y `aulas/EstudiantesAulaView.tsx`.
- Inicio: tarjetas quitadas en `pages/dashboards/*`. "Volver" desde `/evaluaciones` respeta `backTo`
  (`pages/Evaluaciones.tsx`) y "Cancelar" del alta usa `onCancel` (`forms/EvaluacionForm.tsx`).
- Backend: `PUT /evaluaciones/:id/datos-evaluador`, `utils/datos-evaluador.ts`, SQL en `scripts/sql/2026-11-18-preguntas-evaluador.sql`.

## Orden de salida a producción (cada paso lo decide Nacho)
1. Correr el SQL en la base de producción (aditivo, idempotente). Sin esto el backend nuevo rompe todas las evaluaciones.
2. Mergear frontend a `main` (auto-deploy). Tolera el backend viejo: sin insignias, y guardar la sección da error.
3. Mergear backend a `main` (auto-deploy; su test de contrato necesita el frontend ya en `main`).
4. ADR 0020: mergear la rama `adr/0020-preguntas-evaluador` de `documentacion-ADR`.

## Fuera de alcance
Registro de la intervención durante el año; mostrar sesiones u observaciones en reportes, Excel o estadísticas.
