# Pautas con desglose en el wizard de evaluación

Estado: borrador para revisión · Fecha: 2026-10-13
Maqueta aprobada: `PADI/maquetas/pautas-desglose.html` (fuera del repo, en la raíz del workspace)

## 1. Objetivo

Que una pauta con varias partes (por ejemplo "Intrusos", tres partes) se evalúe como **una sola
unidad**: sus partes se ven juntas, se responden en la misma pantalla y el seguimiento habla de
pautas, no de preguntas sueltas. Hoy el wizard muestra una pregunta por pantalla numerada de corrido
y los círculos del seguimiento cuentan preguntas, por lo que una pauta de tres partes se vive como
tres preguntas distintas.

## 2. Alcance

Incluye, de la lista de correcciones de la Fundación:

- **Punto 7**, el rediseño: una pantalla por pauta, partes listadas, seguimiento por pauta.
- **Punto 1**: quitar una respuesta es volver a tocar la opción marcada. Desaparece "Quitar respuesta".
- **Punto 2**: en el seguimiento, el ícono dice qué se respondió y el color si aprueba (cruz verde
  para un "No" que aprueba en socioemocional).
- **Punto 3**: en la revisión, el botón "Corregir respuestas" queda fijo al scrollear.
- **Punto 8**: al cerrar la corrección se puede volver a la ficha de la evaluación o a la revisión
  del área.

Queda fuera, a la espera de la Fundación:

- Punto 4 (sonido inicial en cinco partes, una por vocal): la pantalla ya lo soporta, porque una
  pauta de cinco partes se muestra como cualquier otra con desglose y "mitad o más" da 3 de 5. Lo
  que falta es cargar las cinco preguntas por sala en `preguntas`, con las palabras del cuadernillo
  del evaluador, y desactivar la pregunta única actual. Es un cambio de datos, sin código. A decidir
  con la Fundación: las evaluaciones ya cargadas respondieron la pregunta única; al desactivarla
  quedan con esa pauta sin responder, así que o se vuelve a tomar o el cambio rige desde el próximo
  período.
  Decidido: el cambio de datos se aplica **después** de desplegar este rediseño, para que las cinco
  vocales aparezcan como una pauta y no como cinco pantallas. No hacen falta las palabras del
  cuadernillo para crearlas: la consigna de cada parte nombra la vocal; el texto se actualiza cuando
  la Fundación las pase.
- Puntos 5 y 6 (intercambiar posiciones de pautas en sala 4 y 5): cambio de datos, área a confirmar.
- La regla de aprobación de las pautas de cuatro partes: hoy aprueban con 2 de 4 (mitad o más). Si
  la Fundación espera 3 de 4, es un cambio de regla en el backend, separado de este trabajo.
- El backend no cambia en ningún punto de esta especificación.

## 3. Modelo: pauta y partes

- Una **pauta** es el conjunto de preguntas activas de un área que comparten `numero`. Es la misma
  agrupación que ya usan el backend para calcular el puntaje y la pantalla de revisión. Si una
  pregunta no tiene `numero`, forma una pauta por sí sola (misma regla que el backend).
- Las pautas se ordenan por `numero`; las **partes** de una pauta conservan el orden en que las
  devuelve el backend. Se etiquetan "N.i": 6.1, 6.2, 6.3.
- Una pauta **simple** tiene una sola parte. Una pauta **con desglose** tiene dos o más.
- Estado de una pauta a partir de las respuestas (1 = Sí, 0 = No, nulo = sin responder):
  - **sin responder**: ninguna parte respondida;
  - **a medias**: alguna parte respondida, no todas;
  - **completa aprobada**: todas respondidas y las correctas son al menos la mitad, redondeando
    hacia arriba (3 partes → 2; 4 → 2; 5 → 3);
  - **completa no aprobada**: todas respondidas y no se llega.
  - Una parte es correcta según `respuestaSumaPunto` (`src/utils/respuestas.ts`): Sí en preguntas
    normales, No en invertidas.
- Un área está **terminada** cuando todas sus pautas están completas.

## 4. Pantallas

### 4.1 Wizard en web (ancho ≥ 600 px)

Como la maqueta: barra superior con cerrar, nombre del área y "Pauta N de T"; a la izquierda un
panel fijo con el seguimiento; a la derecha la tarjeta de la pauta.

Tarjeta de la pauta:

- Cabecera: "PAUTA N" en versalitas, título de la pauta y, solo con desglose, el chip "Se aprueba
  con X de Y" y una barra con "A de Y partes respondidas". La barra es ámbar mientras falta alguna,
  verde si quedó aprobada, roja si quedó no aprobada.
- Pauta simple: igual que hoy. Consigna grande, criterio de aprobación, nota y materiales si los
  hay, imagen si la hay, y los dos botones grandes No / Sí. El botón marcado queda relleno (rojo o
  verde según su propio criterio de color, ver 4.3). Debajo: "Para quitar la respuesta, tocá de
  nuevo la opción marcada."
- Pauta con desglose: una fila por parte con la etiqueta "N.i", la consigna, "Aprueba si: criterio"
  y, a la derecha, dos botones chicos No / Sí de 44 px de alto como mínimo. Las partes sin responder
  llevan borde azul suave; las respondidas, borde gris. Si una parte tiene imagen, materiales o
  nota, se muestran dentro de su fila, debajo de la consigna. Debajo de la lista: "Cada parte se
  guarda al tocarla. Para quitar una respuesta, tocá de nuevo la opción marcada."
- Pie: a la izquierda "Anterior" (texto, deshabilitado en la primera pauta); a la derecha el botón
  de avance: "Siguiente pauta" relleno en verde si la pauta está completa, "Saltar pauta" sin relleno
  si falta algo, "Finalizar área" en la última pauta.

Panel de seguimiento (izquierda): "Pautas completas C / T", los círculos de todas las pautas (4.3),
la leyenda de cuatro colores y la casilla "Avanzar sola al completar la pauta".

Pantallas de intro y de cierre: se mantienen como hoy. La intro conserva los materiales del área;
en el cierre, si quedaron pautas sin completar, se indica cuántas y se ofrece volver a la primera
pendiente.

### 4.2 Wizard en celular (ancho < 600 px)

Mismo contenido, otra disposición:

- Barra superior con cerrar, nombre del área y "N / T".
- Debajo, la fila de círculos con scroll horizontal; el círculo de la pauta actual se centra solo.
- La tarjeta ocupa el resto y tiene scroll propio. En una pauta con desglose cada parte es una
  tarjeta apilada: etiqueta y consigna arriba, criterio debajo, y los botones No / Sí a lo ancho en
  dos columnas, de 46 px de alto como mínimo.
- Pie fijo con "Anterior" y el botón de avance, los dos a lo ancho.
- La casilla de avance automático no entra porque no hay panel: va en la pantalla de intro, en las
  dos disposiciones; en web además queda en el panel, como en la maqueta.

### 4.3 Seguimiento: qué dice cada círculo

Un círculo por pauta, en el orden de las pautas. Tocarlo salta a esa pauta. El anillo azul marca la
pauta actual.

| Estado de la pauta | Contenido | Color |
|---|---|---|
| Sin responder | número de la pauta | gris |
| A medias | "respondidas/total", por ejemplo "1/3" | ámbar |
| Simple, completa | ✓ si respondió Sí, ✗ si respondió No | verde si esa respuesta aprueba, rojo si no |
| Con desglose, completa | ✓ si la pauta aprobó, ✗ si no | verde si aprobó, rojo si no |

La fila de una pauta simple socioemocional respondida "No" muestra entonces una ✗ verde, que es el
punto 2. Los cuatro estados se distinguen también por el contenido, no solo por el color.

Los mismos colores rigen los botones de respuesta: verde es "esta respuesta suma punto", rojo "no
suma", sea Sí o No (regla ya vigente desde el PR #21).

### 4.4 Revisión del área

- La barra superior, con el título y el botón "Corregir respuestas", queda fija arriba al scrollear
  (punto 3).
- Cada grupo muestra el chip "Se aprueba con X de Y" cuando tiene más de una parte, con el mismo
  texto que el wizard.
- El cálculo del estado de cada grupo pasa a usar la función compartida de `src/utils/pautas.ts`
  (ver 6) en lugar de su copia local, para que wizard y revisión no puedan discrepar.

### 4.5 Ida y vuelta entre corrección y revisión (punto 8)

- Si el wizard se abrió desde la revisión de un área, al cerrarlo (con la X o con "Finalizar área")
  se ofrece una elección de dos botones: **"Volver a la revisión de {área}"** y **"Ir a la ficha de
  la evaluación"**. La primera reabre la revisión ya actualizada; la segunda vuelve a la ficha como
  hoy.
- Si el wizard se abrió directamente desde la ficha, al cerrarlo se vuelve a la ficha, como hoy, sin
  preguntar.
- La ficha se recarga en los dos casos, como hoy.

## 5. Comportamiento

- **Responder una parte** guarda de inmediato con `enviarRespuestas(evaluacionId, areaId, [{ id,
  answer }])`, igual que hoy. La interfaz se actualiza antes de la respuesta del servidor; si falla,
  se restaura el valor anterior y se muestra el error ya existente de "Fallo al guardar".
- **Quitar** una respuesta es tocar de nuevo la opción marcada: envía `answer: null`. El backend ya lo
  acepta y recalcula el área como incompleta.
- **Avance automático**: con la casilla activa, al completar la pauta actual se pasa a la siguiente
  pauta después de 650 ms, el tiempo de ver el círculo cambiar. Si era la última y quedan pautas
  pendientes, se va a la primera pendiente; si no quedan, se muestra el cierre. La casilla viene
  activa, se guarda en `localStorage` como preferencia del dispositivo y se lee con `try/catch`.
- **Navegación manual**: "Anterior", el botón de avance y los círculos funcionan siempre, esté o no
  completa la pauta. "Saltar pauta" y "Siguiente pauta" pasan a la pauta siguiente en orden, sin
  guardar nada; la pauta salteada queda marcada como sin responder o a medias en el seguimiento.
- **Pauta actual al abrir**: la primera pauta no completa; si todas están completas, la primera, en
  modo corrección, como hoy.
- **Estudiante dado de baja**: no cambia; el wizard no se abre.

## 6. Código

Nuevo módulo puro, cubierto por el umbral de cobertura:

- `src/utils/pautas.ts`
  - `agruparPautas(preguntas)`: `PreguntaBase[]` → `Pauta[]` (`numero`, `titulo`, `partes`), ordenadas.
  - `estadoPauta(pauta, respuestas)`: `{ total, respondidas, correctas, necesarias, completa, aprobada, estado }`
    con `estado` en `"sin_responder" | "a_medias" | "aprobada" | "no_aprobada"`.
  - `circuloPauta(pauta, respuestas)`: `{ contenido: "numero" | "fraccion" | "check" | "cruz", texto, color }` según 4.3.
  - `siguientePautaPendiente(pautas, respuestas, desde)`: índice de la próxima pauta no completa, o `null`.

Componentes, en `src/components/evaluaciones/wizard/` para sacar el archivo de 650 líneas:

- `EvaluacionWizard.tsx` (existente): estado, carga, guardado, navegación por pauta. Usa los de abajo.
- `PautaCard.tsx`: cabecera, cuerpo simple o con desglose, pie. Recibe la pauta, las respuestas y
  callbacks; sin efectos propios, para poder renderizarlo estático en tests.
- `ParteFila.tsx`: una parte con sus botones; variante web y celular por prop.
- `SeguimientoPautas.tsx`: panel web y fila celular, a partir de `circuloPauta`.
- `EvaluacionRevision.tsx`: barra fija, chip por grupo, `estadoPauta` compartido.
- `EvaluacionDetalle.tsx`: elección de destino al cerrar el wizard abierto desde la revisión.

Sin cambios en `src/api/evaluaciones.ts` ni en el backend.

## 7. Casos borde

- Área con una sola pauta: el seguimiento muestra un círculo; "Anterior" deshabilitado; el botón de
  avance dice "Finalizar área".
- Pauta con partes de `puntaje_invertido` mixto: cada parte se evalúa con su propia inversión; hoy
  no existe en los datos, pero la regla lo cubre.
- Respuestas previas de preguntas inactivas: el backend no las devuelve; se ignoran.
- Dos partes con imagen en la misma pauta: cada imagen va en su fila, con alto máximo de 220 px.
- Pérdida de conexión al tocar: se restaura el valor y el aviso de error ya existente queda visible
  hasta el próximo guardado exitoso.
- Teclado: todos los controles son `button` reales; los círculos llevan `aria-label` con el estado.

## 8. Pruebas

- Unitarias, `test/utils/pautas.test.ts`: agrupación con los datos reales de sala 4 Comunicación y
  Lenguaje (ocho pautas, Intrusos con tres partes, dos de cuatro partes); estados con 3, 4 y 5
  partes; círculo para simple Sí/No normal e invertida; siguiente pendiente con y sin pendientes.
- Render estático de `PautaCard` y `SeguimientoPautas` en `test/components/`, al estilo de
  `presentational.test.ts`: pauta simple muestra dos botones grandes; con desglose muestra una fila
  por parte y el chip; el círculo de una socioemocional respondida No tiene cruz y color verde.
- `test/api/evaluaciones.test.ts` ya cubre `answer: null`.
- Manual, antes del merge, en web y en un celular: sala 3 Sensoriomotora (Copiado de figuras, tres
  partes con imagen), sala 4 Comunicación y Lenguaje (Intrusos y las dos de cuatro partes), sala 5
  Comunicación y Lenguaje (Absurdo verbal, cinco partes), socioemocional de cualquier sala (cruz
  verde), y el ida y vuelta revisión ↔ corrección.

## 9. Criterios de aceptación

1. En Intrusos de sala 4 se ven las tres partes en una pantalla, se responden ahí y el círculo pasa
   de "6" a "1/3", "2/3" y a ✓ o ✗ al completar.
2. Tocar de nuevo una opción marcada la quita, en pautas simples y con desglose, y el área vuelve a
   quedar incompleta.
3. Una socioemocional respondida "No" muestra ✗ verde en el seguimiento y el botón No relleno en verde.
4. En la revisión, "Corregir respuestas" sigue visible con la lista scrolleada hasta el final.
5. Al cerrar una corrección abierta desde la revisión se puede elegir volver a esa revisión o a la
   ficha; la revisión reabierta muestra las respuestas nuevas.
6. Suite de tests en verde, cobertura de `src/utils` por encima del umbral, lint sin errores nuevos.
