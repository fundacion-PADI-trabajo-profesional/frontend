# Tipo de evaluación por defecto, confirmación y "Cambiar tipo" — plan (frontend)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El formulario de evaluación elige el tipo según el historial del alumno, pide confirmación antes de crear, muestra bien el error de duplicado, y el historial y la lista permiten cambiar el tipo de una evaluación.

**Architecture:** La regla de tipo por defecto y la de visibilidad son funciones puras en `src/utils/tipo-evaluacion.ts` (testeables en node, cubiertas por coverage). La API gana `cambiarTipoEvaluacion` (PATCH) y un error con `code`. La UI suma un diálogo de confirmación en el formulario y un `ModalCambiarTipo` reutilizado por `HistorialEstudiante` y `EvaluacionesList`.

**Tech Stack:** React 19, TypeScript, MUI, vitest (entorno node; solo `src/api/**` y `src/utils/**` entran en coverage, umbral 70 %).

**Spec:** `docs/specs/2026-11-02-tipo-evaluacion-por-defecto.md`. Backend: `backend/docs/specs/2026-11-02-tipo-evaluacion-cierre.md` (PATCH `/evaluaciones/:id { tipo_id }`; 400 con `error.code` `"TIPO_DUPLICADO"` o `"TIPO_INVALIDO"`).

## Global Constraints

- Tipos: `"inicial" | "cierre"`. Etiquetas en UI: "Evaluacion Inicial" / "Evaluacion de Cierre" (las del selector actual).
- Fechas en los textos: `formatearFecha` de `src/utils/fechas.ts` (UTC, `dd/mm/yyyy`). "Este año" = `new Date().getUTCFullYear()`; el año de una evaluación = `createdAt.getUTCFullYear()`.
- Textos exactos (sala 4 de ejemplo): ayuda sin inicial `Primera evaluación de sala 4 de este alumno`; ayuda con una inicial `Ya tiene la inicial de sala 4 (12/03/2026)`; aviso con inicial y cierre `Ya tiene inicial y cierre de sala 4`; aviso con 2+ iniciales sin cierre `Tiene 2 evaluaciones iniciales de sala 4 (12/03/2026, 20/10/2026): una de ellas es probablemente el cierre. Cambiale el tipo desde el historial en vez de crear otra.`; aviso con cierre sin inicial `Ya tiene el cierre de sala 4 (20/10/2026) y no tiene inicial`.
- Ruta del historial: `/historial-estudiante?estudianteId=<id>&nombre=<nombre>` (como `EstudiantesList.tsx:101`).
- "Eliminar" no cambia de visibilidad en ninguna pantalla.
- Comandos: `npx vitest run <archivo>`, `npm run lint`, `npm run test:coverage`, `npm run build`. No hay backend local: la UI se verifica con lint + build y en prod después del deploy.

## Review Focus

1. Cambiar de alumno mientras la consulta del historial del anterior está en vuelo: la respuesta vieja no debe pisar el tipo del alumno nuevo. Guardia de cancelación en Task 3 (verificación por lectura: no hay DOM en tests).
2. Historial con una evaluación de **otra sala** o de **otro año**: no cuenta para la regla. Test en Task 1.
3. Alumno con cierre y sin inicial: no debe decir "Primera evaluación". Test en Task 1.
4. Error 400 `TIPO_DUPLICADO` al crear: el formulario muestra el mensaje del servidor y el link al historial; no redirige ni pasa al cuestionario. Test del `code` en Task 2; render en Task 3.
5. Docente que ve una evaluación ajena en la lista (de un aula compartida): "Cambiar tipo" no aparece; director sí lo ve. Test en Task 1.

---

### Task 1: Reglas puras: tipo por defecto y visibilidad

**Files:**
- Create: `src/utils/tipo-evaluacion.ts`
- Test: `test/utils/tipo-evaluacion.test.ts`

**Interfaces:**
- Produces: `type TipoEvaluacion = "inicial" | "cierre"`; `ETIQUETA_TIPO: Record<TipoEvaluacion, string>` (`inicial: "Evaluacion Inicial"`, `cierre: "Evaluacion de Cierre"`); `tipoPorDefecto(evaluaciones: Array<{ salaId: number; tipoId: string; createdAt: Date }>, salaId: number, anio: number): { tipo: TipoEvaluacion; ayuda: string | null; aviso: string | null }`; `puedeCambiarTipo(profile: { id?: string; rol?: string } | null, evaluacion: { profesorId: string }): boolean`.

- [ ] **Step 1: Test que falla** (helper `ev(tipoId, fecha, salaId = 4)`):
  - sin evaluaciones → `{ tipo: "inicial", ayuda: "Primera evaluación de sala 4 de este alumno", aviso: null }`.
  - una inicial 2026-03-12 → `{ tipo: "cierre", ayuda: "Ya tiene la inicial de sala 4 (12/03/2026)", aviso: null }`.
  - inicial + cierre → `{ tipo: "cierre", ayuda: null, aviso: "Ya tiene inicial y cierre de sala 4" }`.
  - dos iniciales (12/03 y 20/10, pasadas en orden inverso) sin cierre → `tipo "cierre"`, `aviso` igual al texto de las constraints con las fechas ascendentes.
  - cierre 20/10 sin inicial → `{ tipo: "inicial", ayuda: null, aviso: "Ya tiene el cierre de sala 4 (20/10/2026) y no tiene inicial" }`.
  - inicial de sala 3 y otra de 2025 con `salaId 4, anio 2026` → caso "sin evaluaciones".
  - `puedeCambiarTipo`: docente `id "d1"` sobre `profesorId "d1"` → true; sobre `"d2"` → false; director/encargado_zona/equipo_padi → true siempre; `null` o rol vacío → false.
- [ ] **Step 2: Correr** `npx vitest run test/utils/tipo-evaluacion.test.ts` → FAIL (módulo inexistente).
- [ ] **Step 3: Implementar** en `src/utils/tipo-evaluacion.ts` usando `formatearFecha`.
- [ ] **Step 4: Correr** → PASS.
- [ ] **Step 5: Commit** `feat(evaluaciones): regla pura de tipo por defecto y visibilidad de "Cambiar tipo"`.

### Task 2: API: `cambiarTipoEvaluacion` y error con código

**Files:**
- Modify: `src/api/evaluaciones.ts` (reemplaza `actualizarEvaluacionInstancia`, línea 321; `crearEvaluacionInstancia` líneas 258-280)
- Test: `test/api/evaluaciones.test.ts` (reemplazar el `describe("actualizarEvaluacionInstancia")`, línea 275)

**Interfaces:**
- Produces: `class EvaluacionApiError extends Error { code?: string }` (constructor `(message: string, code?: string)`); `cambiarTipoEvaluacion(id: string, tipo: TipoEvaluacion): Promise<EvaluacionInstancia>` → `PATCH ${API_URL}/evaluaciones/${id}` con `getAuthHeaders()` y body `JSON.stringify({ tipo_id: tipo })`; respuesta `mapToCamelCase(data.data)`. Tanto esta como `crearEvaluacionInstancia` lanzan `new EvaluacionApiError(responseData.message || <fallback>, responseData.error?.code)` cuando `!res.ok`.
- Se elimina `actualizarEvaluacionInstancia` (sin usos fuera del formulario; Task 3 lo saca de ahí).

- [ ] **Step 1: Tests que fallan**: `cambiarTipoEvaluacion("ev-1", "cierre")` llama a `${API}/evaluaciones/ev-1` con `method "PATCH"` y `JSON.parse(body)` igual a `{ tipo_id: "cierre" }` y devuelve `tipoId` mapeado; con `mockFetchResponse({ message: "ya tiene", error: { code: "TIPO_DUPLICADO" } }, false, 400)` rechaza con `EvaluacionApiError` cuyo `code` es `"TIPO_DUPLICADO"` y `message` `"ya tiene"`. `crearEvaluacionInstancia` con la misma respuesta 400 también expone `code`.
- [ ] **Step 2: Correr** `npx vitest run test/api/evaluaciones.test.ts` → FAIL (import inexistente). El import de `actualizarEvaluacionInstancia` se saca del test en este paso.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Correr** → PASS. Luego `npm run build` → falla en `EvaluacionForm.tsx` por el import borrado: se arregla en Task 3 (no commitear build rojo: Task 2 y 3 pueden ir en el mismo commit si se prefiere; o dejar `actualizarEvaluacionInstancia` hasta Task 3). **Decisión:** eliminar la función vieja recién en Task 3 para que cada commit compile.
- [ ] **Step 5: Commit** `feat(api): cambiarTipoEvaluacion (PATCH) y errores con código`.

### Task 3: Formulario: tipo por defecto, confirmación y error de duplicado

**Files:**
- Modify: `src/components/forms/EvaluacionForm.tsx`
- Modify: `src/api/evaluaciones.ts` (borrar `actualizarEvaluacionInstancia`)

**Interfaces:**
- Consumes: `tipoPorDefecto`, `ETIQUETA_TIPO` (Task 1); `getEvaluacionesInstanciasByEstudiante`, `EvaluacionApiError` (Task 2).

- [ ] **Step 1: Sacar el modo edición muerto**: props `evaluacionAEditar`, el `useEffect` que lo consume, la rama `MODO EDITAR` de `handleSubmit`, el campo "Estado" condicional, el título "Editar Evaluación" y el import de `actualizarEvaluacionInstancia`. Borrar `actualizarEvaluacionInstancia` de `src/api/evaluaciones.ts`. `npm run build` → verde.
- [ ] **Step 2: Sugerencia de tipo.** Estado `sugerencia: { ayuda: string | null; aviso: string | null }` (inicial `{ ayuda: null, aviso: null }`). `useEffect` sobre `[formData.estudianteId, formData.salaId]`: si faltan, limpiar; si no, `let cancelado = false`, `getEvaluacionesInstanciasByEstudiante(estudianteId)` → `tipoPorDefecto(evs, Number(salaId), new Date().getUTCFullYear())` → si `!cancelado`, `setFormData(prev => ({ ...prev, tipoId: r.tipo }))` y `setSugerencia`; en `catch` dejar `tipoId` como está y sugerencia vacía; cleanup `cancelado = true`. Render: `helperText={sugerencia.ayuda ?? undefined}` en el `TextField` select; debajo, si `sugerencia.aviso`, `<Alert severity="warning">` con el texto y un `<Link component={RouterLink} to={rutaHistorial}>Ver historial</Link>` donde `rutaHistorial = /historial-estudiante?${new URLSearchParams({ estudianteId, nombre }).toString()}` (`nombre` = `"Apellido, Nombre"` del `selectedEstudiante.personas`).
- [ ] **Step 3: Confirmación.** `handleSubmit` valida (como hoy: alumno, sala, perfil, DNI) y en vez de crear hace `setConfirmarAbierto(true)`. `Dialog` con título "Confirmar evaluación", texto `Vas a crear una evaluación de <b>{ETIQUETA_TIPO[tipo].toUpperCase()}</b> de sala {salaId} para <b>{nombre}</b>.` y botones "Volver" (`outlined`) y "Confirmar" (`contained`, deshabilitado mientras `loading`). "Confirmar" ejecuta `crear()` = el cuerpo actual de `MODO CREAR` (payload snake_case, `fechaLocalISO()`, `onSuccess` tras 1500 ms).
- [ ] **Step 4: Error de duplicado.** En el `catch` de `crear()`: si `err instanceof EvaluacionApiError && err.code === "TIPO_DUPLICADO"`, guardar `{ mensaje: err.message, verHistorial: true }`; el `Alert` de error muestra el mensaje y, si `verHistorial`, un `Link` "Ver la evaluación existente" a `rutaHistorial`. Cerrar el diálogo en cualquier error.
- [ ] **Step 5: Verificar** `npm run lint && npm run build` → verde. Revisar a mano en el código que `handleClear` vuelve a `tipoId: "inicial"` y limpia `sugerencia`.
- [ ] **Step 6: Commit** `feat(evaluaciones): tipo por defecto según historial, confirmación y error de duplicado`.

### Task 4: `ModalCambiarTipo` + acción en historial y lista

**Files:**
- Create: `src/components/evaluaciones/ModalCambiarTipo.tsx`
- Modify: `src/components/evaluaciones/EvaluacionesTable.tsx:35-100`
- Modify: `src/pages/HistorialEstudiante.tsx`
- Modify: `src/components/evaluaciones/EvaluacionesList.tsx:425-470`

**Interfaces:**
- Produces: `ModalCambiarTipo({ evaluacion, open, onClose, onGuardado }: { evaluacion: EvaluacionInstancia | null; open: boolean; onClose: () => void; onGuardado: (actualizada: EvaluacionInstancia) => void })`. Muestra alumno (`estudianteNombre ?? estudiante?.apellido, nombre`) y `Sala {salaId}`, `TextField select` con las dos opciones (valor inicial = `evaluacion.tipoId`), botones "Cancelar" y "Guardar" (deshabilitado si el tipo no cambió o mientras guarda). Guardar → `cambiarTipoEvaluacion(evaluacion.id, tipo)` → `onGuardado(actualizada)` y `onClose()`; en error, `Alert severity="error"` con `err.message` y el diálogo sigue abierto.
- `EvaluacionesTable` gana `onCambiarTipo?: (evaluacion: EvaluacionInstancia) => void` y `puedeCambiarTipo?: (evaluacion: EvaluacionInstancia) => boolean` (default `() => true`). La columna "Acciones" aparece si `onDelete || onCambiarTipo`; el botón "Cambiar tipo" (`size="small" variant="outlined"`, `stopPropagation`) solo si `onCambiarTipo && puedeCambiarTipo(e)`.

- [ ] **Step 1: `ModalCambiarTipo`** según la interfaz.
- [ ] **Step 2: `EvaluacionesTable`** según la interfaz; "Eliminar" sin cambios.
- [ ] **Step 3: `HistorialEstudiante`**: leer de `padiUser` `{ id, rol }` en un estado `profile` (reemplaza `userRole`; `canDelete` se calcula desde `profile.rol`), estado `evaluacionACambiar`, pasar `onCambiarTipo={setEvaluacionACambiar}` y `puedeCambiarTipo={(e) => puedeCambiarTipo(profile, e)}`, renderizar `ModalCambiarTipo` con `onGuardado` que reemplaza el item por id en `items`.
- [ ] **Step 4: `EvaluacionesList`**: junto a "Eliminar", botón "Cambiar tipo" (mismo estilo que "Ver", `color="secondary"`, icono `SwapHorizIcon`) visible si `puedeCambiarTipo(profile, evaluacion)`; estado `evaluacionACambiar`; `ModalCambiarTipo` con `onGuardado` que reemplaza el item en `evaluaciones`.
- [ ] **Step 5: Verificar** `npm run lint && npm run build && npm run test:coverage` → todo verde, umbral cumplido. Contratos desde `backend/`: `make test-contracts` → verde.
- [ ] **Step 6: Commit** `feat(evaluaciones): cambiar el tipo desde el historial y la lista` y abrir PR a `main` con `gh pr create --repo fundacion-PADI-trabajo-profesional/frontend`, con la nota "depende del PR del backend; mergear después, y después del SQL de corrección".
