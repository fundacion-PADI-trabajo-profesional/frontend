# Tipo de evaluación: por defecto según el historial, confirmación y cambio de tipo (frontend)

Fecha: 2026-11-02. Pedido de Cecilia (Fundación PADI): "double check de qué tipo de evaluación
estás haciendo, porque aparece por defecto inicial y muchas se equivocaron; y poder modificar de
inicial a final si te equivocaste". Spec hermana del backend:
`backend/docs/specs/2026-11-02-tipo-evaluacion-cierre.md` (freno de duplicados y `PATCH`).

## Qué pasa hoy

- `EvaluacionForm` (`src/components/forms/EvaluacionForm.tsx`) arranca con `tipoId: "inicial"`
  y lo vuelve a poner en `inicial` al limpiar. El selector "Tipo de Evaluación" tiene
  "Evaluacion Inicial" y "Evaluacion de Cierre". No mira si el alumno ya tiene una.
- Al enviar no hay confirmación: se crea y pasa al cuestionario.
- No hay forma de cambiar el tipo de una evaluación ya creada. `actualizarEvaluacionInstancia`
  en `src/api/evaluaciones.ts` existe pero nadie la llama y el backend no tiene esa ruta.
- El historial del alumno (`HistorialEstudiante`) lista sus evaluaciones con tipo y permite
  borrar. La lista de evaluaciones (`Evaluaciones`) permite ver/continuar y borrar.

## Decisión

1. **Tipo por defecto según el historial del alumno.** Al elegir alumno y sala, el formulario
   consulta `getEvaluacionesInstanciasByEstudiante(estudianteId)` y mira las de esa sala y de
   este año:
   - sin inicial → `inicial`, con la ayuda "Primera evaluación de sala 4 de este alumno";
   - con inicial y sin cierre → `cierre`, con la ayuda "Ya tiene la inicial de sala 4
     (12/03/2026)";
   - con inicial y cierre → `cierre`, con aviso "Ya tiene inicial y cierre de sala 4" (el
     backend va a rechazar el duplicado; se avisa antes).
   La ayuda va debajo del selector. La persona puede cambiar el tipo igual; la regla solo elige
   el valor inicial. Si cambia de alumno o de sala, se recalcula. Si la consulta falla, el
   selector queda en `inicial` sin ayuda (como hoy), nada se bloquea.
2. **Confirmación antes de crear** (el "double check"). Al tocar "Crear" se abre un diálogo:
   "Vas a crear una evaluación de **CIERRE** de sala 4 para **Juan Pérez**" con botones
   "Confirmar" y "Volver". Siempre, no solo cuando contradice el historial: es barato y es lo que
   pidió Cecilia. En modo edición no aplica (no existe hoy).
3. **Error de duplicado del backend.** Si `POST /evaluaciones` responde `400` con
   `error.code = "TIPO_DUPLICADO"`, se muestra el mensaje del servidor y un link "Ver la
   evaluación existente" al historial del alumno. No se reintenta.
4. **Cambiar el tipo.** Acción "Cambiar tipo" en dos lugares: cada fila del historial del alumno
   y cada fila de la lista de evaluaciones (al lado de "Eliminar", mismas reglas de visibilidad:
   la docente solo en las suyas). Abre un diálogo chico con el selector (Inicial / Cierre),
   el alumno y la sala, y botón "Guardar". Llama `cambiarTipoEvaluacion(id, tipo)` →
   `PATCH /evaluaciones/:id { tipo_id }`. Al volver, recarga la lista. Si el backend responde
   `400` duplicado, se muestra el mensaje y el diálogo queda abierto.
5. **API.** `actualizarEvaluacionInstancia` se reemplaza por `cambiarTipoEvaluacion(id, tipo)`
   (misma ruta `PATCH`, body `{ tipo_id }`). Se borra la función vieja y el modo "editar" muerto
   del formulario si no queda ningún uso.

Orden de deploy: después del backend. Si se mergea antes, el formulario sigue funcionando (la
regla por defecto usa un endpoint que ya existe) y "Cambiar tipo" daría error hasta el deploy
del backend; por eso se mergea después.

## Alternativas descartadas

- **Deshabilitar en el selector el tipo que ya existe**: menos pasos, pero esconde el estado
  ("¿por qué no puedo elegir inicial?"). Se prefiere ayuda visible + confirmación + error claro.
- **Regla por mes**: ver spec del backend; se equivoca con los que entran tarde.
- **Diálogo de confirmación solo cuando contradice el historial**: Cecilia pidió el double check
  en todos los casos; confirmar siempre cuesta un clic y evita el error más común.

## Verificación

- Tests (vitest, entorno node): `src/utils/tipo-evaluacion.ts` con la función pura
  `tipoPorDefecto(evaluacionesDelAlumno, salaId, anio) → { tipo, ayuda, aviso }` cubriendo los
  tres casos y "otra sala / otro año no cuentan"; `cambiarTipoEvaluacion` en `test/api`
  (ruta, método, body, error).
- `npm run lint`, `npm run test:coverage` (umbral 70 % sobre `src/api` y `src/utils`),
  `npm run build`.
- Manual en prod, después de los dos deploys: cargar una evaluación a un alumno con inicial
  previa y ver que arranca en Cierre con la ayuda; confirmar; cambiar el tipo de una de prueba
  desde el historial.
