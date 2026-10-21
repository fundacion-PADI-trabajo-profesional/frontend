# Sonido inicial real, consigna compartida y fecha del día

Fecha: 2026-10-16. Origen: Ceci (Fundación PADI) reportó que las partes de
Sonido inicial cargadas el 14/10 (una por vocal) no son las del cuadernillo, y
que la fecha de la evaluación se veía como "30/9/2026, 9:00 p.m.".

## Decisiones (confirmadas con Ceci y Nish)

1. **Sonido inicial son 5 estímulos, aprueba con 3 de 5**, igual que el
   template `TEMPLATE Listado de preguntas mayo 2026.xlsx`.
   Sala 4: oso, avión, estrella, uva, auto (ejemplos: elefante, abeja).
   Sala 5: estrella, auto, flor, sapo, moto (ejemplos: elefante, martillo).
   En sala 5 no vale la sílaba (MO en vez de MMM).
2. **La consigna larga va una sola vez**, no repetida por parte: se guarda en
   `detalle` de las 5 partes (idéntica) y la pantalla la muestra en la cabecera.
   Cada parte queda corta: `consigna = "Diga: ooooso"`, `aprueba_con = "Responde O"`.
3. **La fecha de la evaluación es siempre el día en que se carga.** Sin
   selector. Se muestra solo la fecha, sin hora.
4. **Los mínimos de aprobación por pauta del template son los que valen**
   (Intrusos sala 5: 3 de 3; Copiado/Responde/Nombra: 3 de 4; Absurdo: 4 de 5)
   y se recalcula lo ya evaluado. Esto es un cambio aparte (backend + datos),
   ver "Pendiente".

## Hallazgo nuevo: sala 3 Comunicación y Lenguaje

En prod las tres preguntas "Comunicación de Necesidades", "Uso de Lenguaje" y
"Uso de frases completas" comparten `numero = 1`, así que la app las trata como
UNA pauta de 3 partes (aprueba con 2 de 3) y el área tiene 4 pautas con regla
3 de 4. En el template son tres pautas separadas (1, 2, 3), el área tiene 6
pautas y aprueba con 5 de 6. Hay que renumerar (1..6), cambiar
`reglas_aprobacion` (sala 3, CL) a 5/6 y recalcular. Entra en el cambio 4.

Todo lo demás (estructura de pautas por sala/área y reglas de área) coincide
entre prod y el template.

## Cambio A: frontend (este branch, `feat/sonido-inicial-y-fecha`)

- `src/utils/pautas.ts`: `textosCompartidos(pauta)` devuelve `detalle` y
  `materiales` cuando TODAS las partes (2 o más) tienen el mismo valor no vacío.
- `PautaCard`: si hay `detalle` compartido, bloque "Consigna" en la cabecera.
  Para que el texto largo no tape las partes (pedido de Nish: "que no se vea
  con demasiado texto"), `consignaEnPartes` separa el primer párrafo (lo que
  se le dice al chico, siempre visible, en negrita) del resto, que va plegado
  en un `<details>` nativo con el resumen "Cómo presentarla (ejemplos)".
  Nativo porque PautaCard no tiene estado propio y así funciona también en
  `renderToStaticMarkup`. Si hay `materiales` compartido, una sola línea
  "Materiales". `ParteFila` recibe `mostrarDetalle` / `mostrarMateriales`
  para no repetirlos.
- Convención de datos que esto impone: en `detalle`, el primer párrafo es la
  frase para el chico y los párrafos siguientes (separados por línea en
  blanco) son las instrucciones para el evaluador.
- Preview real (render SSR del componente con emotion + captura headless):
  `maquetas/preview-sonido-inicial.html` (fuera de git). Se regenera con el
  script del scratchpad `preview-pauta.tsx` copiado a la raíz del frontend y
  `npx tsx --tsconfig tsconfig.app.json`; necesita `npm i --no-save @emotion/server`.
- `src/utils/fechas.ts`: `fechaLocalISO()` → `YYYY-MM-DD` local;
  `formatearFecha(d)` → `dd/mm/aaaa` y `formatearFechaLarga(d)` →
  "16 de octubre de 2026", ambas leídas en **UTC** porque la evaluación se
  guarda a la medianoche UTC del día cargado (así las viejas, guardadas como
  "2026-10-01", se ven como 1/10/2026 y no como 30/9 a la noche).
- `EvaluacionForm`: se saca el campo "Mes y Año"; el payload manda
  `fecha_creacion: fechaLocalISO()`. El backend hace `new Date("2026-10-16")`
  → `2026-10-16T00:00:00Z`.
- `EvaluacionesTable` y `EvaluacionDetalle`: muestran la fecha con las
  funciones nuevas.

## Cambio B: datos de Sonido inicial (SQL en prod, lo corre Nish)

Script: `backend/scripts/sql/2026-10-16-sonido-inicial.sql`. Una sola
sentencia con CTEs: desactiva las 10 partes por vocal, crea 10 partes nuevas
(orden 1..5) con la consigna compartida en `detalle`, y copia las 71
respuestas de la pregunta original (inactiva) a las partes nuevas. Devuelve
`10, 10, 355`.

Orden: primero mergear el frontend (si no, la consigna se ve como "Nota:"
repetida 5 veces), después correr el SQL.

Las evaluaciones que respondieron las partes por vocal (tomadas entre el
14/10 y el cambio) quedan con Sonido inicial sin responder: esos chicos
repiten esa pauta. Query para contarlas (no sirve filtrar por
`fecha_creacion`: por el bug del mes, todas las de octubre dicen 01/10):

```sql
select e.sala_id, count(distinct e.id)
from evaluaciones_estudiante e
join evaluaciones_estudiante_area ea on ea.evaluacion_estudiante_id = e.id
join evaluaciones_estudiante_area_preguntas r on r.evaluaciones_area_id = ea.id
join preguntas p on p.id = r.pregunta_id
where p.titulo = 'Sonido Inicial' and p.consigna like '%de la palabra con%' and r.respuesta is not null
  and not exists (
    select 1 from evaluaciones_estudiante_area_preguntas o
    join preguntas po on po.id = o.pregunta_id
    where o.evaluaciones_area_id = ea.id and po.titulo = 'Sonido Inicial'
      and po.consigna like '%de palabras que empiezan%' and o.respuesta is not null)
group by 1;
```

## Cambio 4 (mínimo por pauta): hecho aparte

Spec y scripts en el backend: `backend/docs/specs/2026-10-16-minimo-aprobacion-por-pauta.md`
y `backend/scripts/sql/`. En este repo solo cambia `PreguntaBase.minimo_aprobacion` y
`estadoPauta` (branch `feat/minimo-aprobacion-pauta`). ADR 0018.
