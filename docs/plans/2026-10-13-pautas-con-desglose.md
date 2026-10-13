# Pautas con desglose — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El wizard de evaluación muestra una pantalla por pauta, con todas sus partes respondibles en la misma vista, y el seguimiento cuenta pautas; además: quitar respuesta al volver a tocar, cruz verde en invertidas, barra fija en la revisión, y elección de destino al cerrar una corrección.

**Architecture:** Un módulo puro `src/utils/pautas.ts` agrupa preguntas por `numero` y calcula el estado de cada pauta y el contenido de su círculo; el wizard se parte en componentes de presentación sin efectos (`PautaCard`, `ParteFila`, `SeguimientoPautas`) que reciben pauta, respuestas y callbacks, y `EvaluacionWizard` conserva estado, carga, guardado y navegación. La revisión reutiliza las mismas funciones puras. Backend sin cambios.

**Tech Stack:** React 19 + TypeScript, MUI, Vitest (entorno node, tests de componentes con `renderToStaticMarkup`), `fetch` mockeado en `test/setup.ts`.

**Spec:** `docs/specs/2026-10-13-pautas-con-desglose.md`

## Global Constraints

- Backend y `src/api/evaluaciones.ts` no cambian; se usa `enviarRespuestas(evaluacionId, areaId, [{ id, answer }])` con `answer` en `0 | 1 | null`.
- Regla de aprobación de una pauta: correctas ≥ `Math.ceil(total / 2)`. Una parte es correcta según `respuestaSumaPunto` de `src/utils/respuestas.ts`.
- Colores: verde = la respuesta suma punto, rojo = no suma; paletas de `paletaBotonRespuesta` (`src/utils/respuestas.ts`). Círculos: gris sin responder, ámbar a medias, verde/rojo completa.
- Botones de respuesta con alto mínimo 44 px (46 px en celular); todos los controles son `button` reales con `aria-label`.
- Punto de quiebre web/celular: `sm` de MUI (600 px).
- Avance automático: 650 ms después de completar la pauta; preferencia en `localStorage` clave `padi.wizard.avanzarSola`, leída y escrita con `try/catch`, por defecto activa.
- Textos en español rioplatense, como el resto de la app. Identificadores en español (`pauta`, `parte`, `respuestas`).
- Cobertura: `src/utils/**` entra en el umbral del 70 %; los componentes no, pero se testean con render estático.
- Commits en la rama `feat/pautas-con-desglose`, mensajes en español con prefijo convencional.

## Review Focus

1. Pregunta sin `numero` (backend la agrupa como `Q:<id>`): debe formar una pauta propia y no romper el orden. Test en Task 1.
2. Respuestas previas de preguntas que ya no están en la lista (inactivas): deben ignorarse al contar. Test en Task 1.
3. Pauta simple invertida respondida "No": círculo con cruz y color verde, botón No relleno en verde. Tests en Task 1 y Task 2.
4. Tocar dos veces rápido o durante el guardado: los botones quedan deshabilitados mientras `guardando`, así no se envían dos pedidos. Test en Task 3.
5. Fallo de red al guardar: se restaura la respuesta anterior y queda el aviso. No se puede testear en node sin DOM; se verifica a mano en Task 8 cortando la red.

---

### Task 1: Módulo puro `src/utils/pautas.ts`

**Files:**
- Create: `src/utils/pautas.ts`
- Create: `test/fixtures/preguntas.ts`
- Test: `test/utils/pautas.test.ts`

**Interfaces:**
- Consumes: `PreguntaBase` de `src/api/evaluaciones.ts`; `respuestaSumaPunto(respuesta, invertida)` de `src/utils/respuestas.ts`.
- Produces:
  - `type Respuestas = Record<string, number | null | undefined>`
  - `interface Pauta { clave: string; numero: number | null; titulo: string; partes: PreguntaBase[] }`
  - `type EstadoPauta = "sin_responder" | "a_medias" | "aprobada" | "no_aprobada"`
  - `interface ResumenPauta { total; respondidas; correctas; necesarias; completa; aprobada; estado }`
  - `agruparPautas(preguntas: PreguntaBase[]): Pauta[]`
  - `estadoPauta(pauta: Pauta, respuestas: Respuestas): ResumenPauta`
  - `type ColorCirculo = "gris" | "ambar" | "verde" | "rojo"`
  - `interface Circulo { contenido: "numero" | "fraccion" | "check" | "cruz"; texto: string; color: ColorCirculo; descripcion: string }`
  - `circuloPauta(pauta: Pauta, respuestas: Respuestas, posicion: number): Circulo`
  - `siguientePautaPendiente(pautas: Pauta[], respuestas: Respuestas, desde: number): number | null`
  - `alternarRespuesta(actual: number | null | undefined, tocada: 0 | 1): 0 | 1 | null`

- [ ] **Step 1: Escribir el fixture con datos reales de sala 4**

`test/fixtures/preguntas.ts`:

```ts
import type { PreguntaBase } from "../../src/api/evaluaciones";

const base = (id: string, numero: number, titulo: string, consigna: string, extra: Partial<PreguntaBase> = {}): PreguntaBase => ({
  id, numero, titulo, consigna, aprueba_con: "criterio " + id, ...extra,
});

/** Sala 4, Comunicación y Lenguaje: ocho pautas, Intrusos con tres partes, dos de cuatro partes. */
export const SALA4_CL: PreguntaBase[] = [
  base("cl1", 1, "Usa el lenguaje para satisfacer sus necesidades", "¿Se apoya en el lenguaje oral para pedir ayuda?"),
  base("cl2", 2, "Usa el lenguaje para compartir algo que vio o vivió", "¿Puede contar experiencias vividas?"),
  base("cl3", 3, "Articulación", "¿Habla de manera clara, logrando la correcta producción de los sonidos del habla?"),
  base("cl4", 4, "Frases completas", "¿Elabora frases completas de 5 o 6 palabras?"),
  base("cl5", 5, "Sonido Inicial", "¿Reconoce el sonido inicial de palabras que empiezan con vocal?"),
  base("cl6a", 6, "Intrusos", "¿Reconoce cuál NO es un Animal (Silla) e identifica la categoría Animales?"),
  base("cl6b", 6, "Intrusos", "¿Reconoce cuál NO es Comida (Pelota) e identifica la categoría Comida?"),
  base("cl6c", 6, "Intrusos", "¿Reconoce cuál NO es Ropa (Pato) e identifica la categoría Ropa?"),
  base("cl7a", 7, "Responde a preguntas lógicamente", "¿Puede explicar qué debe hacer cuando tiene sueño?"),
  base("cl7b", 7, "Responde a preguntas lógicamente", "¿Puede explicar qué debe hacer cuando tiene las manos sucias?"),
  base("cl7c", 7, "Responde a preguntas lógicamente", "¿Puede explicar qué debe hacer cuando tiene frío?"),
  base("cl7d", 7, "Responde a preguntas lógicamente", "¿Puede explicar qué debe hacer cuando tiene hambre?"),
  base("cl8a", 8, "Nombra objetos de la vida diaria según su uso", "¿Puede nombrar una cuchara y decir para qué sirve?"),
  base("cl8b", 8, "Nombra objetos de la vida diaria según su uso", "¿Puede nombrar una pelota y decir para qué sirve?"),
  base("cl8c", 8, "Nombra objetos de la vida diaria según su uso", "¿Puede nombrar una taza y decir para qué sirve?"),
  base("cl8d", 8, "Nombra objetos de la vida diaria según su uso", "¿Puede nombrar una silla y decir para qué sirve?"),
];

/** Socioemocional: pauta simple invertida (aprueba con NO). */
export const SE_RECEPTIVIDAD: PreguntaBase = base("se1", 1, "Receptividad",
  "¿Con frecuencia evita el contacto visual, no responde al nombre o no contesta cuando se le habla?", { puntaje_invertido: true });

/** Absurdo verbal, sala 5: cinco partes. */
export const CL5_ABSURDO: PreguntaBase[] = ["helado", "zapatillas", "tijera", "auto", "vacas"].map((t, i) =>
  base("ab" + i, 6, "Absurdo verbal", "Responde correctamente: " + t));

export const pauta = (preguntas: PreguntaBase[], numero: number) => {
  const partes = preguntas.filter((p) => p.numero === numero);
  return { clave: String(numero), numero, titulo: partes[0].titulo ?? "", partes };
};
```

- [ ] **Step 2: Escribir los tests que fallan**

`test/utils/pautas.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { agruparPautas, estadoPauta, circuloPauta, siguientePautaPendiente, alternarRespuesta } from "../../src/utils/pautas";
import { SALA4_CL, SE_RECEPTIVIDAD, CL5_ABSURDO, pauta } from "../fixtures/preguntas";

describe("agruparPautas", () => {
  it("agrupa por numero conservando el orden del backend", () => {
    const pautas = agruparPautas(SALA4_CL);
    expect(pautas.map((p) => p.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(pautas[5].titulo).toBe("Intrusos");
    expect(pautas[5].partes.map((p) => p.id)).toEqual(["cl6a", "cl6b", "cl6c"]);
    expect(pautas[6].partes).toHaveLength(4);
  });

  it("una pregunta sin numero forma su propia pauta al final", () => {
    const suelta = { ...SALA4_CL[0], id: "x", numero: undefined as unknown as number };
    const pautas = agruparPautas([suelta, ...SALA4_CL.slice(0, 2)]);
    expect(pautas.map((p) => p.clave)).toEqual(["1", "2", "Q:x"]);
    expect(pautas[2].partes).toHaveLength(1);
  });

  it("usa la consigna como título si la pregunta no tiene titulo", () => {
    const sinTitulo = { ...SALA4_CL[0], titulo: undefined };
    expect(agruparPautas([sinTitulo])[0].titulo).toBe(sinTitulo.consigna);
  });
});

describe("estadoPauta", () => {
  const intrusos = pauta(SALA4_CL, 6);
  const logicas = pauta(SALA4_CL, 7);
  const absurdo = { clave: "6", numero: 6, titulo: "Absurdo verbal", partes: CL5_ABSURDO };

  it("sin respuestas: sin_responder", () => {
    expect(estadoPauta(intrusos, {}).estado).toBe("sin_responder");
  });

  it("con alguna parte respondida: a_medias, y cuenta respondidas", () => {
    const r = estadoPauta(intrusos, { cl6a: 1 });
    expect(r.estado).toBe("a_medias");
    expect(r.respondidas).toBe(1);
    expect(r.completa).toBe(false);
  });

  it("3 partes: aprueba con 2, no con 1", () => {
    expect(estadoPauta(intrusos, { cl6a: 1, cl6b: 0, cl6c: 1 })).toMatchObject({ necesarias: 2, correctas: 2, aprobada: true, estado: "aprobada" });
    expect(estadoPauta(intrusos, { cl6a: 1, cl6b: 0, cl6c: 0 })).toMatchObject({ aprobada: false, estado: "no_aprobada" });
  });

  it("4 partes: aprueba con 2 (mitad), 5 partes: con 3", () => {
    expect(estadoPauta(logicas, { cl7a: 1, cl7b: 1, cl7c: 0, cl7d: 0 })).toMatchObject({ necesarias: 2, aprobada: true });
    expect(estadoPauta(absurdo, { ab0: 1, ab1: 1, ab2: 1, ab3: 0, ab4: 0 })).toMatchObject({ necesarias: 3, aprobada: true });
    expect(estadoPauta(absurdo, { ab0: 1, ab1: 1, ab2: 0, ab3: 0, ab4: 0 })).toMatchObject({ aprobada: false });
  });

  it("invertida: el No es la respuesta correcta", () => {
    const se = { clave: "1", numero: 1, titulo: "Receptividad", partes: [SE_RECEPTIVIDAD] };
    expect(estadoPauta(se, { se1: 0 })).toMatchObject({ correctas: 1, aprobada: true });
    expect(estadoPauta(se, { se1: 1 })).toMatchObject({ correctas: 0, aprobada: false });
  });

  it("ignora respuestas de preguntas que no están en la pauta", () => {
    expect(estadoPauta(intrusos, { inactiva: 1, cl6a: 1 }).respondidas).toBe(1);
  });
});

describe("circuloPauta", () => {
  const intrusos = pauta(SALA4_CL, 6);
  const simple = pauta(SALA4_CL, 3);
  const se = { clave: "1", numero: 1, titulo: "Receptividad", partes: [SE_RECEPTIVIDAD] };

  it("sin responder muestra el número en gris", () => {
    expect(circuloPauta(intrusos, {}, 6)).toMatchObject({ contenido: "numero", texto: "6", color: "gris" });
  });

  it("a medias muestra la fracción en ámbar", () => {
    expect(circuloPauta(intrusos, { cl6a: 1 }, 6)).toMatchObject({ contenido: "fraccion", texto: "1/3", color: "ambar" });
  });

  it("con partes completa: check verde si aprobó, cruz roja si no", () => {
    expect(circuloPauta(intrusos, { cl6a: 1, cl6b: 1, cl6c: 0 }, 6)).toMatchObject({ contenido: "check", color: "verde" });
    expect(circuloPauta(intrusos, { cl6a: 0, cl6b: 0, cl6c: 1 }, 6)).toMatchObject({ contenido: "cruz", color: "rojo" });
  });

  it("simple: el ícono dice la respuesta y el color si aprueba", () => {
    expect(circuloPauta(simple, { cl3: 1 }, 3)).toMatchObject({ contenido: "check", color: "verde" });
    expect(circuloPauta(simple, { cl3: 0 }, 3)).toMatchObject({ contenido: "cruz", color: "rojo" });
  });

  it("simple invertida respondida No: cruz verde; respondida Sí: check rojo", () => {
    expect(circuloPauta(se, { se1: 0 }, 1)).toMatchObject({ contenido: "cruz", color: "verde" });
    expect(circuloPauta(se, { se1: 1 }, 1)).toMatchObject({ contenido: "check", color: "rojo" });
  });

  it("sin numero usa la posición", () => {
    const sinNumero = { ...simple, numero: null };
    expect(circuloPauta(sinNumero, {}, 9).texto).toBe("9");
  });
});

describe("siguientePautaPendiente", () => {
  const pautas = agruparPautas(SALA4_CL);
  const completas = Object.fromEntries(SALA4_CL.map((p) => [p.id, 1]));

  it("devuelve la siguiente incompleta después de la posición, dando la vuelta", () => {
    const resp = { ...completas, cl2: null };
    expect(siguientePautaPendiente(pautas, resp, 7)).toBe(1);
    expect(siguientePautaPendiente(pautas, resp, 0)).toBe(1);
  });

  it("desde -1 encuentra la primera incompleta", () => {
    expect(siguientePautaPendiente(pautas, {}, -1)).toBe(0);
    expect(siguientePautaPendiente(pautas, { ...completas, cl6b: null }, -1)).toBe(5);
  });

  it("null cuando todas están completas", () => {
    expect(siguientePautaPendiente(pautas, completas, 3)).toBeNull();
  });
});

describe("alternarRespuesta", () => {
  it("tocar la opción marcada la quita; tocar la otra la cambia", () => {
    expect(alternarRespuesta(1, 1)).toBeNull();
    expect(alternarRespuesta(0, 0)).toBeNull();
    expect(alternarRespuesta(1, 0)).toBe(0);
    expect(alternarRespuesta(null, 1)).toBe(1);
    expect(alternarRespuesta(undefined, 0)).toBe(0);
  });
});
```

- [ ] **Step 3: Correr y ver que falla**

Run: `npx vitest run test/utils/pautas.test.ts`
Expected: FAIL, `Cannot find module '../../src/utils/pautas'`.

- [ ] **Step 4: Implementar el módulo**

`src/utils/pautas.ts`:

```ts
/**
 * Pautas del wizard de evaluación.
 *
 * Una pauta es el conjunto de preguntas activas de un área que comparten
 * `numero`; es la misma agrupación con la que el backend calcula el puntaje
 * del área. Una pauta con una sola parte es "simple"; con dos o más tiene
 * "desglose" y aprueba cuando las partes correctas llegan a la mitad,
 * redondeando hacia arriba (3 → 2, 4 → 2, 5 → 3).
 */
import type { PreguntaBase } from "../api/evaluaciones";
import { respuestaSumaPunto } from "./respuestas";

/** Respuestas por id de pregunta: 1 = Sí, 0 = No, null o ausente = sin responder. */
export type Respuestas = Record<string, number | null | undefined>;

export interface Pauta {
    /** Clave estable del grupo: el `numero`, o "Q:<id>" si la pregunta no tiene número. */
    clave: string;
    numero: number | null;
    titulo: string;
    partes: PreguntaBase[];
}

export type EstadoPauta = "sin_responder" | "a_medias" | "aprobada" | "no_aprobada";

export interface ResumenPauta {
    total: number;
    respondidas: number;
    correctas: number;
    necesarias: number;
    completa: boolean;
    aprobada: boolean;
    estado: EstadoPauta;
}

/** Agrupa las preguntas por `numero` conservando el orden en que llegan (el backend ya ordena por numero). */
export function agruparPautas(preguntas: PreguntaBase[]): Pauta[] {
    const mapa = new Map<string, Pauta>();
    for (const p of preguntas) {
        const clave = p.numero !== null && p.numero !== undefined ? String(p.numero) : `Q:${p.id}`;
        const existente = mapa.get(clave);
        if (existente) {
            existente.partes.push(p);
        } else {
            mapa.set(clave, { clave, numero: p.numero ?? null, titulo: p.titulo || p.consigna, partes: [p] });
        }
    }
    const pautas = Array.from(mapa.values());
    // Las sin número van al final; entre las numeradas se respeta el número.
    return pautas.sort((a, b) => {
        if (a.numero === null && b.numero === null) return 0;
        if (a.numero === null) return 1;
        if (b.numero === null) return -1;
        return a.numero - b.numero;
    });
}

export function estadoPauta(pauta: Pauta, respuestas: Respuestas): ResumenPauta {
    const total = pauta.partes.length;
    let respondidas = 0;
    let correctas = 0;
    for (const parte of pauta.partes) {
        const r = respuestas[parte.id];
        if (r === 0 || r === 1) {
            respondidas++;
            if (respuestaSumaPunto(r, parte.puntaje_invertido)) correctas++;
        }
    }
    const necesarias = Math.ceil(total / 2);
    const completa = total > 0 && respondidas === total;
    const aprobada = completa && correctas >= necesarias;
    const estado: EstadoPauta = !completa
        ? (respondidas === 0 ? "sin_responder" : "a_medias")
        : (aprobada ? "aprobada" : "no_aprobada");
    return { total, respondidas, correctas, necesarias, completa, aprobada, estado };
}

export type ColorCirculo = "gris" | "ambar" | "verde" | "rojo";

export interface Circulo {
    contenido: "numero" | "fraccion" | "check" | "cruz";
    texto: string;
    color: ColorCirculo;
    /** Para el aria-label: "sin responder", "1 de 3 partes", "respondió No", "aprobada"... */
    descripcion: string;
}

/**
 * Qué muestra el círculo de una pauta en el seguimiento.
 * En una pauta simple el ícono dice qué se respondió (✓ Sí, ✗ No) y el color si
 * esa respuesta aprueba; en una con partes, el ícono dice si la pauta aprobó.
 */
export function circuloPauta(pauta: Pauta, respuestas: Respuestas, posicion: number): Circulo {
    const r = estadoPauta(pauta, respuestas);
    const numero = String(pauta.numero ?? posicion);
    if (r.estado === "sin_responder") {
        return { contenido: "numero", texto: numero, color: "gris", descripcion: "sin responder" };
    }
    if (r.estado === "a_medias") {
        return { contenido: "fraccion", texto: `${r.respondidas}/${r.total}`, color: "ambar", descripcion: `${r.respondidas} de ${r.total} partes` };
    }
    const color: ColorCirculo = r.aprobada ? "verde" : "rojo";
    if (r.total === 1) {
        const respondioSi = respuestas[pauta.partes[0].id] === 1;
        return { contenido: respondioSi ? "check" : "cruz", texto: numero, color, descripcion: respondioSi ? "respondió Sí" : "respondió No" };
    }
    return { contenido: r.aprobada ? "check" : "cruz", texto: numero, color, descripcion: r.aprobada ? "aprobada" : "no aprobada" };
}

/**
 * Índice de la próxima pauta incompleta después de `desde`, dando la vuelta al
 * final; `desde = -1` busca desde el principio. `null` si todas están completas.
 */
export function siguientePautaPendiente(pautas: Pauta[], respuestas: Respuestas, desde: number): number | null {
    const n = pautas.length;
    for (let paso = 1; paso <= n; paso++) {
        const i = (((desde + paso) % n) + n) % n;
        if (!estadoPauta(pautas[i], respuestas).completa) return i;
    }
    return null;
}

/** Tocar la opción ya marcada la quita; tocar la otra la cambia. */
export function alternarRespuesta(actual: number | null | undefined, tocada: 0 | 1): 0 | 1 | null {
    return actual === tocada ? null : tocada;
}
```

- [ ] **Step 5: Correr y ver verde**

Run: `npx vitest run test/utils/pautas.test.ts`
Expected: PASS, 19 tests.

- [ ] **Step 6: Commit**

```bash
git add src/utils/pautas.ts test/utils/pautas.test.ts test/fixtures/preguntas.ts
git commit -m "feat(evaluaciones): módulo puro de pautas (agrupar, estado, círculo, navegación)"
```

---

### Task 2: `SeguimientoPautas` (panel web y fila celular)

**Files:**
- Create: `src/components/evaluaciones/wizard/SeguimientoPautas.tsx`
- Test: `test/components/seguimiento-pautas.test.ts`

**Interfaces:**
- Consumes: `Pauta`, `Respuestas`, `circuloPauta`, `estadoPauta`, `ColorCirculo` de `src/utils/pautas.ts`.
- Produces: `export default function SeguimientoPautas(props: { pautas: Pauta[]; respuestas: Respuestas; actual: number; onIr: (indice: number) => void; variante: "panel" | "fila" })`. Cada círculo es un `<button>` con `data-contenido`, `data-color`, `data-actual="si|no"` y `aria-label`.

- [ ] **Step 1: Test que falla**

`test/components/seguimiento-pautas.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SeguimientoPautas from "../../src/components/evaluaciones/wizard/SeguimientoPautas";
import { agruparPautas } from "../../src/utils/pautas";
import { SALA4_CL, SE_RECEPTIVIDAD } from "../fixtures/preguntas";

const botones = (html: string) => html.match(/<button[^>]*data-contenido[^>]*>/g) ?? [];

describe("SeguimientoPautas", () => {
  const pautas = agruparPautas(SALA4_CL);

  it("panel: un círculo por pauta, con contenido y color, y el contador de completas", () => {
    const html = renderToStaticMarkup(createElement(SeguimientoPautas, {
      pautas, respuestas: { cl1: 1, cl3: 0, cl6a: 1 }, actual: 5, onIr: vi.fn(), variante: "panel",
    }));
    const b = botones(html);
    expect(b).toHaveLength(8);
    expect(b[0]).toContain('data-contenido="check"');
    expect(b[0]).toContain('data-color="verde"');
    expect(b[2]).toContain('data-contenido="cruz"');
    expect(b[2]).toContain('data-color="rojo"');
    expect(b[5]).toContain('data-contenido="fraccion"');
    expect(b[5]).toContain('data-actual="si"');
    expect(html).toContain("1/3");
    expect(html).toContain("2 / 8");
  });

  it("fila: también un círculo por pauta y aria-label con el estado", () => {
    const html = renderToStaticMarkup(createElement(SeguimientoPautas, {
      pautas, respuestas: {}, actual: 0, onIr: vi.fn(), variante: "fila",
    }));
    expect(botones(html)).toHaveLength(8);
    expect(html).toContain('aria-label="Pauta 6, Intrusos: sin responder"');
  });

  it("socioemocional respondida No: cruz verde", () => {
    const se = agruparPautas([SE_RECEPTIVIDAD]);
    const html = renderToStaticMarkup(createElement(SeguimientoPautas, {
      pautas: se, respuestas: { se1: 0 }, actual: 0, onIr: vi.fn(), variante: "panel",
    }));
    const b = botones(html)[0];
    expect(b).toContain('data-contenido="cruz"');
    expect(b).toContain('data-color="verde"');
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npx vitest run test/components/seguimiento-pautas.test.ts`
Expected: FAIL, módulo no encontrado.

- [ ] **Step 3: Implementar el componente**

`src/components/evaluaciones/wizard/SeguimientoPautas.tsx`:

```tsx
import { useEffect, useRef } from "react";
import { Box, Paper, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { circuloPauta, estadoPauta, type ColorCirculo, type Pauta, type Respuestas } from "../../../utils/pautas";

const COLORES: Record<ColorCirculo, { bg: string; fg: string; borde: string }> = {
    gris: { bg: "#f3f4f6", fg: "#4b5563", borde: "transparent" },
    ambar: { bg: "#fef3c7", fg: "#b45309", borde: "#f59e0b" },
    verde: { bg: "#dcfce7", fg: "#15803d", borde: "transparent" },
    rojo: { bg: "#fee2e2", fg: "#b91c1c", borde: "transparent" },
};

const LEYENDA: { color: ColorCirculo; texto: string }[] = [
    { color: "verde", texto: "Aprobada" },
    { color: "rojo", texto: "No aprobada" },
    { color: "ambar", texto: "A medias" },
    { color: "gris", texto: "Sin responder" },
];

interface Props {
    pautas: Pauta[];
    respuestas: Respuestas;
    actual: number;
    onIr: (indice: number) => void;
    variante: "panel" | "fila";
}

function Circulo({ pauta, indice, respuestas, esActual, onIr, tamano }: {
    pauta: Pauta; indice: number; respuestas: Respuestas; esActual: boolean; onIr: (i: number) => void; tamano: number;
}) {
    const c = circuloPauta(pauta, respuestas, indice + 1);
    const col = COLORES[c.color];
    return (
        <Box
            component="button"
            type="button"
            onClick={() => onIr(indice)}
            aria-label={`Pauta ${pauta.numero ?? indice + 1}, ${pauta.titulo}: ${c.descripcion}`}
            aria-current={esActual ? "step" : undefined}
            data-contenido={c.contenido}
            data-color={c.color}
            data-actual={esActual ? "si" : "no"}
            sx={{
                width: tamano, height: tamano, borderRadius: "50%", flexShrink: 0, p: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: c.contenido === "fraccion" ? "0.7rem" : "0.78rem", fontWeight: 700, fontFamily: "inherit",
                cursor: "pointer", bgcolor: col.bg, color: col.fg,
                border: `2px solid ${col.borde}`,
                boxShadow: esActual ? "0 0 0 2.5px #5c7cfa" : "none",
                transition: "transform .15s",
                "&:hover": { transform: "scale(1.06)" },
            }}
        >
            {c.contenido === "check" ? <CheckIcon sx={{ fontSize: 16 }} /> : c.contenido === "cruz" ? <CloseIcon sx={{ fontSize: 16 }} /> : c.texto}
        </Box>
    );
}

/** Seguimiento del área: un círculo por pauta. `panel` es la columna fija de la web; `fila` es la tira con scroll del celular. */
export default function SeguimientoPautas({ pautas, respuestas, actual, onIr, variante }: Props) {
    const completas = pautas.filter((p) => estadoPauta(p, respuestas).completa).length;
    const filaRef = useRef<HTMLDivElement | null>(null);

    // En el celular, el círculo actual se centra solo (no corre en render estático).
    useEffect(() => {
        if (variante !== "fila") return;
        const el = filaRef.current?.querySelector<HTMLElement>('[data-actual="si"]');
        el?.scrollIntoView?.({ behavior: "smooth", block: "nearest", inline: "center" });
    }, [actual, variante]);

    if (variante === "fila") {
        return (
            <Box ref={filaRef} sx={{ display: { xs: "flex", sm: "none" }, gap: 1, overflowX: "auto", pb: 1, mb: 1.5, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
                {pautas.map((p, i) => <Circulo key={p.clave} pauta={p} indice={i} respuestas={respuestas} esActual={i === actual} onIr={onIr} tamano={32} />)}
            </Box>
        );
    }

    return (
        <Paper elevation={2} sx={{ width: 196, flexShrink: 0, p: 1.75, borderRadius: 3, alignSelf: "flex-start", position: "sticky", top: 16, display: { xs: "none", sm: "block" } }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: "block", color: "#374151" }}>Pautas completas</Typography>
            <Typography variant="body2" sx={{ display: "block", mb: 1.5, color: "#4b5563", fontWeight: 700 }}>{completas} / {pautas.length}</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
                {pautas.map((p, i) => <Circulo key={p.clave} pauta={p} indice={i} respuestas={respuestas} esActual={i === actual} onIr={onIr} tamano={34} />)}
            </Box>
            <Box sx={{ borderTop: "1px solid #f3f4f6", pt: 1.25, display: "flex", flexDirection: "column", gap: 0.5 }}>
                {LEYENDA.map((l) => (
                    <Box key={l.color} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: COLORES[l.color].bg, border: `1.5px solid ${COLORES[l.color].fg}` }} />
                        <Typography variant="caption" color="text.secondary">{l.texto}</Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
}
```

- [ ] **Step 4: Correr y ver verde**

Run: `npx vitest run test/components/seguimiento-pautas.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/evaluaciones/wizard/SeguimientoPautas.tsx test/components/seguimiento-pautas.test.ts
git commit -m "feat(evaluaciones): seguimiento por pauta (panel web y fila celular)"
```

---

### Task 3: `ParteFila` y `PautaCard`

**Files:**
- Create: `src/components/evaluaciones/wizard/ParteFila.tsx`
- Create: `src/components/evaluaciones/wizard/PautaCard.tsx`
- Test: `test/components/pauta-card.test.ts`

**Interfaces:**
- Consumes: `Pauta`, `Respuestas`, `estadoPauta`, `alternarRespuesta` (Task 1); `paletaBotonRespuesta` de `src/utils/respuestas.ts`; `PreguntaBase`.
- Produces:
  - `ParteFila(props: { parte: PreguntaBase; etiqueta: string; respuesta: number | null | undefined; guardando: boolean; onResponder: (preguntaId: string, valor: 0 | 1 | null) => void })`
  - `PautaCard(props: { pauta: Pauta; indice: number; total: number; respuestas: Respuestas; guardando: boolean; onResponder; onAnterior: () => void; onSiguiente: () => void })`
  - Botones de respuesta con `data-valor="0|1"`, `data-marcada="si|no"`, `aria-pressed`. Botón de avance con `data-avance="siguiente|saltar|finalizar"`.

- [ ] **Step 1: Test que falla**

`test/components/pauta-card.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PautaCard from "../../src/components/evaluaciones/wizard/PautaCard";
import { agruparPautas } from "../../src/utils/pautas";
import { SALA4_CL, SE_RECEPTIVIDAD } from "../fixtures/preguntas";

const render = (props: Partial<Parameters<typeof PautaCard>[0]> & { pauta: Parameters<typeof PautaCard>[0]["pauta"] }) =>
  renderToStaticMarkup(createElement(PautaCard, {
    indice: 0, total: 8, respuestas: {}, guardando: false,
    onResponder: vi.fn(), onAnterior: vi.fn(), onSiguiente: vi.fn(), ...props,
  }));

const botonesRespuesta = (html: string) => html.match(/<button[^>]*data-valor[^>]*>/g) ?? [];

describe("PautaCard", () => {
  const pautas = agruparPautas(SALA4_CL);

  it("pauta simple: dos botones grandes, sin chip de aprobación", () => {
    const html = render({ pauta: pautas[2], indice: 2 });
    expect(botonesRespuesta(html)).toHaveLength(2);
    expect(html).not.toContain("Se aprueba con");
    expect(html).toContain("Articulación");
    expect(html).toContain("Pauta 3");
  });

  it("pauta con desglose: una fila por parte, chip y progreso", () => {
    const html = render({ pauta: pautas[5], indice: 5, respuestas: { cl6a: 1 } });
    expect(botonesRespuesta(html)).toHaveLength(6);
    expect(html).toContain("Se aprueba con 2 de 3");
    expect(html).toContain("1 de 3 partes respondidas");
    expect(html).toContain("6.1");
    expect(html).toContain("6.3");
  });

  it("marca la opción respondida y la señala como tocable para quitar", () => {
    const html = render({ pauta: pautas[5], indice: 5, respuestas: { cl6a: 1 } });
    const b = botonesRespuesta(html);
    expect(b[1]).toContain('data-valor="1"');
    expect(b[1]).toContain('data-marcada="si"');
    expect(b[1]).toContain('aria-pressed="true"');
    expect(b[0]).toContain('data-marcada="no"');
  });

  it("invertida simple: muestra el aviso de que aprueba con No", () => {
    const html = render({ pauta: agruparPautas([SE_RECEPTIVIDAD])[0], total: 1 });
    expect(html).toContain("Aprueba si responde NO");
  });

  it("botón de avance: saltar si falta, siguiente si completa, finalizar en la última", () => {
    expect(render({ pauta: pautas[5], indice: 5 })).toContain('data-avance="saltar"');
    expect(render({ pauta: pautas[5], indice: 5, respuestas: { cl6a: 1, cl6b: 0, cl6c: 1 } })).toContain('data-avance="siguiente"');
    expect(render({ pauta: pautas[7], indice: 7 })).toContain('data-avance="finalizar"');
  });

  it("anterior deshabilitado en la primera pauta; todo deshabilitado mientras guarda", () => {
    const primera = render({ pauta: pautas[0], indice: 0 });
    const anterior = primera.match(/<button[^>]*data-anterior[^>]*>/)?.[0] ?? "";
    expect(anterior).toContain("disabled");
    const guardando = render({ pauta: pautas[5], indice: 5, guardando: true });
    expect(botonesRespuesta(guardando).every((b) => b.includes("disabled"))).toBe(true);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npx vitest run test/components/pauta-card.test.ts`
Expected: FAIL, módulo no encontrado.

- [ ] **Step 3: Implementar `ParteFila`**

`src/components/evaluaciones/wizard/ParteFila.tsx`:

```tsx
import { Box, Button, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import BuildIcon from "@mui/icons-material/Build";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import type { PreguntaBase } from "../../../api/evaluaciones";
import { paletaBotonRespuesta } from "../../../utils/respuestas";
import { alternarRespuesta } from "../../../utils/pautas";

interface Props {
    parte: PreguntaBase;
    /** "6.1", "6.2"… */
    etiqueta: string;
    respuesta: number | null | undefined;
    guardando: boolean;
    onResponder: (preguntaId: string, valor: 0 | 1 | null) => void;
}

/** Una parte de una pauta con desglose: consigna, criterio y sus botones Sí/No. Volver a tocar la opción marcada la quita. */
export default function ParteFila({ parte, etiqueta, respuesta, guardando, onResponder }: Props) {
    const respondida = respuesta === 0 || respuesta === 1;

    const boton = (valor: 0 | 1, texto: string, Icono: typeof CheckIcon) => {
        const paleta = paletaBotonRespuesta(valor, parte.puntaje_invertido);
        const marcada = respuesta === valor;
        return (
            <Button
                variant="outlined"
                disabled={guardando}
                onClick={() => onResponder(parte.id, alternarRespuesta(respuesta, valor))}
                aria-label={`${texto}, parte ${etiqueta}${marcada ? " (marcada, tocar para quitar)" : ""}`}
                aria-pressed={marcada}
                data-valor={valor}
                data-marcada={marcada ? "si" : "no"}
                sx={{
                    minWidth: 72, minHeight: { xs: 46, sm: 44 }, px: 1.75, borderRadius: 2.5, gap: 0.5,
                    textTransform: "none", fontWeight: 700, fontSize: "0.95rem",
                    flex: { xs: 1, sm: "none" },
                    ...(marcada
                        ? { bgcolor: paleta.color, borderColor: paleta.color, color: "#fff", "&:hover": { bgcolor: paleta.color, borderColor: paleta.color } }
                        : { borderColor: "#d1d5db", color: "#374151", "&:hover": { bgcolor: paleta.hoverBg, borderColor: paleta.color } }),
                }}
            >
                <Icono sx={{ fontSize: 18 }} /> {texto}
            </Button>
        );
    };

    return (
        <Box sx={{
            display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "stretch", sm: "center" }, gap: 1.5,
            p: 2, borderRadius: 3, border: "1.5px solid", borderColor: respondida ? "#e5e7eb" : "#c7d2fe", bgcolor: respondida ? "#fff" : "#fafbff",
        }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: "#eef2ff", color: "#3730a3", fontWeight: 700, fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {etiqueta}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, lineHeight: 1.4, color: "#111827" }}>{parte.consigna}</Typography>
                    {parte.aprueba_con && (
                        <Typography variant="body2" sx={{ color: "#4b5563", mt: 0.5 }}>Aprueba si: {parte.aprueba_con}</Typography>
                    )}
                    {parte.puntaje_invertido && (
                        <Typography variant="caption" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mt: 0.75, px: 1, py: 0.25, borderRadius: 1.5, bgcolor: "#FEF2F2", color: "#991B1B", fontWeight: 700 }}>
                            <WarningAmberIcon sx={{ fontSize: 14 }} /> Aprueba si responde NO
                        </Typography>
                    )}
                    {parte.detalle && (
                        <Typography variant="body2" sx={{ mt: 0.75, color: "#006064", bgcolor: "#e0f7fa", px: 1, py: 0.5, borderRadius: 1 }}>Nota: {parte.detalle}</Typography>
                    )}
                    {parte.materiales && parte.materiales !== "-" && (
                        <Typography variant="body2" sx={{ mt: 0.75, color: "#d97706", display: "flex", alignItems: "center", gap: 0.5 }}>
                            <BuildIcon sx={{ fontSize: 14 }} /> Materiales: {parte.materiales}
                        </Typography>
                    )}
                    {parte.signed_url && (
                        <Box sx={{ mt: 1 }}>
                            <img src={parte.signed_url} alt="Material de la parte" style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8, objectFit: "contain" }} />
                        </Box>
                    )}
                </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                {boton(0, "No", CloseIcon)}
                {boton(1, "Sí", CheckIcon)}
            </Box>
        </Box>
    );
}
```

- [ ] **Step 4: Implementar `PautaCard`**

`src/components/evaluaciones/wizard/PautaCard.tsx`:

```tsx
import { Box, Button, Card, CardContent, Chip, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import BuildIcon from "@mui/icons-material/Build";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { paletaBotonRespuesta } from "../../../utils/respuestas";
import { alternarRespuesta, estadoPauta, type Pauta, type Respuestas } from "../../../utils/pautas";
import ParteFila from "./ParteFila";

interface Props {
    pauta: Pauta;
    /** Posición de la pauta en el área, desde 0. */
    indice: number;
    total: number;
    respuestas: Respuestas;
    guardando: boolean;
    onResponder: (preguntaId: string, valor: 0 | 1 | null) => void;
    onAnterior: () => void;
    onSiguiente: () => void;
}

const AYUDA_QUITAR = "Para quitar una respuesta, tocá de nuevo la opción marcada.";

/** La pantalla de una pauta: cabecera, cuerpo simple o con desglose, y pie de navegación. Sin estado propio. */
export default function PautaCard({ pauta, indice, total, respuestas, guardando, onResponder, onAnterior, onSiguiente }: Props) {
    const r = estadoPauta(pauta, respuestas);
    const esSimple = r.total === 1;
    const esUltima = indice === total - 1;
    const numero = pauta.numero ?? indice + 1;
    const avance = esUltima ? "finalizar" : r.completa ? "siguiente" : "saltar";
    const textoAvance = { finalizar: "Finalizar área", siguiente: "Siguiente pauta", saltar: "Saltar pauta" }[avance];
    const colorBarra = r.completa ? (r.aprobada ? "#16a34a" : "#dc2626") : "#f59e0b";

    const simple = pauta.partes[0];
    const respuestaSimple = respuestas[simple.id];
    const paletaNo = paletaBotonRespuesta(0, simple.puntaje_invertido);
    const paletaSi = paletaBotonRespuesta(1, simple.puntaje_invertido);

    const botonGrande = (valor: 0 | 1, texto: string, Icono: typeof CheckIcon, paleta: { color: string; borderColor: string; hoverBg: string }) => {
        const marcada = respuestaSimple === valor;
        return (
            <Button
                fullWidth
                variant="outlined"
                size="large"
                disabled={guardando}
                onClick={() => onResponder(simple.id, alternarRespuesta(respuestaSimple, valor))}
                aria-pressed={marcada}
                data-valor={valor}
                data-marcada={marcada ? "si" : "no"}
                sx={{
                    py: 2, minHeight: 92, borderRadius: 3.5, display: "flex", flexDirection: "column", textTransform: "none", fontWeight: 700, fontSize: "1.05rem",
                    ...(marcada
                        ? { bgcolor: paleta.color, borderColor: paleta.color, color: "#fff", "&:hover": { bgcolor: paleta.color, borderColor: paleta.color } }
                        : { borderColor: paleta.borderColor, color: paleta.color, "&:hover": { bgcolor: paleta.hoverBg, borderColor: paleta.color } }),
                }}
            >
                <Icono sx={{ fontSize: 30, mb: 0.5 }} />
                {texto}
            </Button>
        );
    };

    return (
        <Card sx={{ borderRadius: 4, display: "flex", flexDirection: "column", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <CardContent sx={{ p: { xs: 2, sm: 3.5 }, pb: 0 }}>
                <Typography variant="caption" sx={{ letterSpacing: ".06em", textTransform: "uppercase", color: "#4b5563", fontWeight: 700 }}>
                    Pauta {numero}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mt: 0.5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827" }}>{pauta.titulo}</Typography>
                    {!esSimple && (
                        <Chip size="small" label={`Se aprueba con ${r.necesarias} de ${r.total}`} sx={{ fontWeight: 700, color: "#1e40af", bgcolor: "#dbeafe", border: "1.5px solid #93c5fd" }} />
                    )}
                </Box>
                {!esSimple && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mt: 1.5 }}>
                        <Box sx={{ flex: 1, height: 6, bgcolor: "#e5e7eb", borderRadius: 999, overflow: "hidden" }}>
                            <Box sx={{ height: "100%", width: `${Math.round((r.respondidas / r.total) * 100)}%`, bgcolor: colorBarra, borderRadius: 999, transition: "width .2s" }} />
                        </Box>
                        <Typography variant="body2" sx={{ color: "#4b5563", fontWeight: 600, whiteSpace: "nowrap" }}>
                            {r.respondidas} de {r.total} partes respondidas
                        </Typography>
                    </Box>
                )}
            </CardContent>

            {esSimple ? (
                <CardContent sx={{ p: { xs: 2, sm: 3.5 }, display: "flex", flexDirection: "column", gap: 2 }}>
                    {simple.puntaje_invertido && (
                        <Typography sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, alignSelf: "flex-start", px: 2, py: 0.75, borderRadius: 2, fontSize: "0.875rem", fontWeight: 700, bgcolor: "#FEF2F2", color: "#991B1B", border: "1.5px solid #FECACA" }}>
                            <WarningAmberIcon sx={{ fontSize: "1rem" }} /> Aprueba si responde NO
                        </Typography>
                    )}
                    <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.4, color: "#111827" }}>
                        {simple.consigna || simple.titulo || "¿Cumple con el criterio?"}
                    </Typography>
                    {simple.signed_url && (
                        <Box sx={{ textAlign: "center" }}>
                            <img src={simple.signed_url} alt="Material de la pregunta" style={{ maxWidth: "100%", maxHeight: 280, borderRadius: 8, objectFit: "contain" }} />
                        </Box>
                    )}
                    {simple.aprueba_con && (
                        <Box sx={{ p: 1.5, bgcolor: "#f0fdf4", borderRadius: 2, border: "1px solid #bbf7d0" }}>
                            <Typography sx={{ fontWeight: 600, color: "#166534", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 0.5 }}>
                                <CheckIcon sx={{ fontSize: "1rem" }} /> Criterio de aprobación: {simple.aprueba_con}
                            </Typography>
                        </Box>
                    )}
                    {simple.detalle && (
                        <Typography variant="body2" sx={{ bgcolor: "#e0f7fa", color: "#006064", p: 1.5, borderRadius: 2 }}>Nota: {simple.detalle}</Typography>
                    )}
                    {simple.materiales && simple.materiales !== "-" && (
                        <Typography variant="body2" sx={{ bgcolor: "#fffbeb", color: "#d97706", p: 1, borderRadius: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
                            <BuildIcon sx={{ fontSize: "1rem" }} /> Materiales: {simple.materiales}
                        </Typography>
                    )}
                    <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                        {botonGrande(0, "No", HighlightOffIcon, paletaNo)}
                        {botonGrande(1, "Sí", CheckCircleOutlineIcon, paletaSi)}
                    </Box>
                    <Typography variant="caption" sx={{ color: "#6b7280", textAlign: "center" }}>{AYUDA_QUITAR}</Typography>
                </CardContent>
            ) : (
                <CardContent sx={{ p: { xs: 1.5, sm: 3.5 }, pt: { xs: 2, sm: 2.5 }, display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {pauta.partes.map((parte, i) => (
                        <ParteFila key={parte.id} parte={parte} etiqueta={`${numero}.${i + 1}`} respuesta={respuestas[parte.id]} guardando={guardando} onResponder={onResponder} />
                    ))}
                    <Typography variant="caption" sx={{ color: "#6b7280", textAlign: "center" }}>Cada parte se guarda al tocarla. {AYUDA_QUITAR}</Typography>
                </CardContent>
            )}

            <Box sx={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5,
                px: { xs: 1.5, sm: 3.5 }, py: 2, borderTop: "1px solid #f3f4f6", mt: "auto",
                position: { xs: "sticky", sm: "static" }, bottom: 0, bgcolor: "#fff", borderRadius: "0 0 16px 16px",
            }}>
                <Button
                    variant="text"
                    onClick={onAnterior}
                    disabled={indice === 0 || guardando}
                    data-anterior="si"
                    startIcon={<ChevronLeftIcon />}
                    sx={{ textTransform: "none", fontWeight: 700, color: "#374151", minHeight: 44, flex: { xs: 1, sm: "none" } }}
                >
                    Anterior
                </Button>
                <Button
                    variant={avance === "saltar" ? "outlined" : "contained"}
                    onClick={onSiguiente}
                    disabled={guardando}
                    data-avance={avance}
                    endIcon={<ChevronRightIcon />}
                    sx={{
                        textTransform: "none", fontWeight: 700, minHeight: 44, borderRadius: 2.5, flex: { xs: 1, sm: "none" },
                        ...(avance === "saltar"
                            ? { borderColor: "#d1d5db", color: "#374151" }
                            : { bgcolor: "#65944F", "&:hover": { bgcolor: "#558040" } }),
                    }}
                >
                    {textoAvance}
                </Button>
            </Box>
        </Card>
    );
}
```

- [ ] **Step 5: Correr y ver verde**

Run: `npx vitest run test/components/pauta-card.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/evaluaciones/wizard/ParteFila.tsx src/components/evaluaciones/wizard/PautaCard.tsx test/components/pauta-card.test.ts
git commit -m "feat(evaluaciones): tarjeta de pauta con partes y botones que se quitan al volver a tocar"
```

---

### Task 4: `EvaluacionWizard` navega por pautas

**Files:**
- Modify: `src/components/evaluaciones/EvaluacionWizard.tsx` (reescritura completa; hoy 658 líneas)

**Interfaces:**
- Consumes: `agruparPautas`, `estadoPauta`, `siguientePautaPendiente`, `Respuestas` (Task 1); `SeguimientoPautas` (Task 2); `PautaCard` (Task 3); `getPreguntasArea`, `enviarRespuestas`, `PreguntaBase` de `src/api/evaluaciones.ts`.
- Produces: misma firma pública que hoy: `EvaluacionWizard({ open, onClose, evaluacionId, areaId, areaNombre })`. `EvaluacionDetalle` no cambia por esta tarea.

- [ ] **Step 1: Reemplazar el archivo completo**

`src/components/evaluaciones/EvaluacionWizard.tsx`:

```tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Card, Checkbox, CircularProgress, Dialog, FormControlLabel, IconButton, Slide, Typography } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AssignmentIcon from "@mui/icons-material/Assignment";

import { enviarRespuestas, getPreguntasArea, type PreguntaBase } from "../../api/evaluaciones";
import { agruparPautas, estadoPauta, siguientePautaPendiente, type Respuestas } from "../../utils/pautas";
import SeguimientoPautas from "./wizard/SeguimientoPautas";
import PautaCard from "./wizard/PautaCard";

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children: React.ReactElement },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

interface Props {
    open: boolean;
    onClose: () => void;
    evaluacionId: string;
    areaId: string;
    areaNombre: string;
}

type WizardStep = "INTRO" | "QUESTIONS" | "FINISH";

const CLAVE_AVANZAR_SOLA = "padi.wizard.avanzarSola";
const DEMORA_AVANCE_MS = 650;

function leerAvanzarSola(): boolean {
    try { return localStorage.getItem(CLAVE_AVANZAR_SOLA) !== "no"; } catch { return true; }
}
function guardarAvanzarSola(valor: boolean) {
    try { localStorage.setItem(CLAVE_AVANZAR_SOLA, valor ? "si" : "no"); } catch { /* sin almacenamiento disponible */ }
}

/** Wizard de evaluación de un área: una pantalla por pauta. */
export default function EvaluacionWizard({ open, onClose, evaluacionId, areaId, areaNombre }: Props) {
    const [step, setStep] = useState<WizardStep>("INTRO");
    const [loading, setLoading] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [preguntas, setPreguntas] = useState<PreguntaBase[]>([]);
    const [respuestas, setRespuestas] = useState<Respuestas>({});
    const [pautaIdx, setPautaIdx] = useState(0);
    const [avanzarSola, setAvanzarSola] = useState<boolean>(leerAvanzarSola);
    const [todasCompletasAlAbrir, setTodasCompletasAlAbrir] = useState(false);

    const pautaIdxRef = useRef(0);
    const avanceRef = useRef<number | null>(null);
    pautaIdxRef.current = pautaIdx;

    const pautas = useMemo(() => agruparPautas(preguntas), [preguntas]);

    const materialesNecesarios = Array.from(new Set(
        preguntas.map((p) => p.materiales).filter((m): m is string => !!m && m.trim() !== "" && m.trim() !== "-"),
    ));

    useEffect(() => {
        if (!(open && evaluacionId && areaId)) return;
        setStep("INTRO");
        setSaveError(null);
        setLoading(true);
        getPreguntasArea(evaluacionId, areaId)
            .then((data) => {
                const lista = data.preguntas || [];
                const mapa: Respuestas = {};
                (data.respuestas || []).forEach((r) => { mapa[r.pregunta_id] = r.respuesta; });
                setPreguntas(lista);
                setRespuestas(mapa);
                const primeraPendiente = siguientePautaPendiente(agruparPautas(lista), mapa, -1);
                setPautaIdx(primeraPendiente ?? 0);
                setTodasCompletasAlAbrir(primeraPendiente === null && lista.length > 0);
            })
            .catch((err) => console.error("Error cargando preguntas:", err))
            .finally(() => setLoading(false));
    }, [open, evaluacionId, areaId]);

    // Cancela un avance programado si el diálogo se cierra o se desmonta.
    useEffect(() => () => { if (avanceRef.current !== null) window.clearTimeout(avanceRef.current); }, []);

    const irDespuesDe = (desde: number, resp: Respuestas) => {
        if (desde < pautas.length - 1) { setPautaIdx(desde + 1); return; }
        const pendiente = siguientePautaPendiente(pautas, resp, desde);
        if (pendiente === null) setStep("FINISH"); else setPautaIdx(pendiente);
    };

    const programarAvance = (desde: number, resp: Respuestas) => {
        if (avanceRef.current !== null) window.clearTimeout(avanceRef.current);
        avanceRef.current = window.setTimeout(() => {
            avanceRef.current = null;
            if (pautaIdxRef.current !== desde) return; // la docente ya se movió
            irDespuesDe(desde, resp);
        }, DEMORA_AVANCE_MS);
    };

    const responder = async (preguntaId: string, valor: 0 | 1 | null) => {
        const anterior = respuestas[preguntaId] ?? null;
        const nuevas: Respuestas = { ...respuestas, [preguntaId]: valor };
        const desde = pautaIdx;
        setRespuestas(nuevas);
        setGuardando(true);
        setSaveError(null);
        try {
            await enviarRespuestas(evaluacionId, areaId, [{ id: preguntaId, answer: valor }]);
            if (avanzarSola && estadoPauta(pautas[desde], nuevas).completa) programarAvance(desde, nuevas);
        } catch (e) {
            console.error("Error al guardar la respuesta:", e);
            setRespuestas((prev) => ({ ...prev, [preguntaId]: anterior }));
            setSaveError("Fallo al guardar la respuesta. Revisá tu conexión.");
        } finally {
            setGuardando(false);
        }
    };

    const cambiarAvanzarSola = (valor: boolean) => { setAvanzarSola(valor); guardarAvanzarSola(valor); };
    const irA = (i: number) => { if (avanceRef.current !== null) { window.clearTimeout(avanceRef.current); avanceRef.current = null; } setPautaIdx(i); };
    const siguiente = () => { if (pautaIdx < pautas.length - 1) irA(pautaIdx + 1); else setStep("FINISH"); };
    const anterior = () => irA(Math.max(0, pautaIdx - 1));

    if (!open) return null;

    const pautaActual = pautas[pautaIdx];
    const pendientes = pautas.filter((p) => !estadoPauta(p, respuestas).completa).length;
    const introButtonLabel = todasCompletasAlAbrir ? "Revisar / Corregir respuestas" : pendientes < pautas.length ? "Continuar evaluación" : "Comenzar evaluación";

    const casillaAvanzarSola = (
        <FormControlLabel
            control={<Checkbox checked={avanzarSola} onChange={(e) => cambiarAvanzarSola(e.target.checked)} sx={{ color: "#65944F", "&.Mui-checked": { color: "#65944F" } }} />}
            label={<Typography variant="body2">Avanzar sola al completar la pauta</Typography>}
        />
    );

    return (
        <Dialog fullScreen open={open} onClose={onClose} TransitionComponent={Transition}>
            <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid #eee", flexShrink: 0 }}>
                <IconButton edge="start" color="inherit" onClick={onClose} aria-label="Cerrar evaluación" disabled={guardando}>
                    <CloseIcon />
                </IconButton>
                <Typography sx={{ ml: 1, flex: 1, fontWeight: 700 }} variant="h6" noWrap>{areaNombre}</Typography>
                {step === "QUESTIONS" && pautas.length > 0 && (
                    <Typography variant="body2" sx={{ color: "#4b5563", fontWeight: 600, whiteSpace: "nowrap" }}>
                        Pauta {pautaActual?.numero ?? pautaIdx + 1} de {pautas.length}
                    </Typography>
                )}
            </Box>

            {saveError && (
                <Alert severity="error" onClose={() => setSaveError(null)} sx={{ mx: 2, mt: 1 }}>{saveError}</Alert>
            )}

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>
            ) : (
                <Box sx={{ flex: 1, bgcolor: "#f5f5f5", p: { xs: 1.5, sm: 2 }, overflow: "auto" }}>

                    {step === "INTRO" && (
                        <Card sx={{ maxWidth: 600, mx: "auto", mt: 4, borderRadius: 4, p: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: "#111827" }}>
                                {todasCompletasAlAbrir ? "Revisar respuestas" : "Antes de comenzar"}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                {todasCompletasAlAbrir
                                    ? <>El área <strong>{areaNombre}</strong> ya fue completada. Podés revisar y corregir las respuestas.</>
                                    : <>Vas a evaluar el área: <strong>{areaNombre}</strong>. Asegurate de estar en un ambiente tranquilo con el niño/a.</>}
                            </Typography>
                            {!todasCompletasAlAbrir && (
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                    Cada pantalla es una pauta. Las que tienen varias partes se responden todas en la misma pantalla. Podés saltear pautas y volver con los círculos del seguimiento.
                                </Typography>
                            )}
                            {materialesNecesarios.length > 0 && (
                                <Box sx={{ mb: 3, p: 2, bgcolor: "#eef2ff", borderRadius: 2, borderLeft: "4px solid #5c7cfa" }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#373a40", mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
                                        <AssignmentIcon sx={{ fontSize: "1rem" }} /> Materiales necesarios para esta sala y área:
                                    </Typography>
                                    <ul style={{ margin: 0, paddingLeft: 20, color: "#495057" }}>
                                        {materialesNecesarios.map((m) => <li key={m}><Typography variant="body2">{m}</Typography></li>)}
                                    </ul>
                                </Box>
                            )}
                            <Box sx={{ mb: 2 }}>{casillaAvanzarSola}</Box>
                            <Button fullWidth variant="contained" size="large" onClick={() => setStep("QUESTIONS")} disabled={pautas.length === 0}
                                sx={{ bgcolor: "#111827", py: 1.5, borderRadius: 2, textTransform: "none", fontSize: "1.1rem" }}>
                                {introButtonLabel}
                            </Button>
                        </Card>
                    )}

                    {step === "QUESTIONS" && pautaActual && (
                        <Box sx={{ display: "flex", gap: 3, maxWidth: 1040, mx: "auto", alignItems: "flex-start" }}>
                            <Box sx={{ display: { xs: "none", sm: "block" } }}>
                                <SeguimientoPautas variante="panel" pautas={pautas} respuestas={respuestas} actual={pautaIdx} onIr={irA} />
                                <Box sx={{ mt: 1.5, px: 0.5 }}>{casillaAvanzarSola}</Box>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <SeguimientoPautas variante="fila" pautas={pautas} respuestas={respuestas} actual={pautaIdx} onIr={irA} />
                                <PautaCard
                                    pauta={pautaActual}
                                    indice={pautaIdx}
                                    total={pautas.length}
                                    respuestas={respuestas}
                                    guardando={guardando}
                                    onResponder={responder}
                                    onAnterior={anterior}
                                    onSiguiente={siguiente}
                                />
                                {guardando && (
                                    <Typography variant="caption" sx={{ display: "block", mt: 1, textAlign: "center", color: "#5c7cfa" }}>
                                        Guardando... <CircularProgress size={10} color="inherit" />
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    )}

                    {step === "FINISH" && (
                        <Card sx={{ maxWidth: 600, mx: "auto", mt: 8, borderRadius: 4, textAlign: "center", p: 4 }}>
                            <CheckCircleOutlineIcon sx={{ fontSize: 60, color: pendientes === 0 ? "#22c55e" : "#f59e0b", mb: 2 }} />
                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                                {pendientes === 0 ? "¡Área completada!" : "Área sin terminar"}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                                {pendientes === 0
                                    ? <>Todas las pautas de <strong>{areaNombre}</strong> quedaron respondidas.</>
                                    : <>Quedan <strong>{pendientes}</strong> pauta{pendientes !== 1 ? "s" : ""} sin completar en <strong>{areaNombre}</strong>. Podés terminar ahora o seguir más tarde.</>}
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                {pendientes > 0 && (
                                    <Button variant="outlined" size="large" onClick={() => { const i = siguientePautaPendiente(pautas, respuestas, -1); if (i !== null) { irA(i); setStep("QUESTIONS"); } }}
                                        sx={{ textTransform: "none", borderRadius: 2, borderColor: "#65944F", color: "#65944F" }}>
                                        Ir a la primera pendiente
                                    </Button>
                                )}
                                <Button variant="contained" size="large" onClick={onClose} sx={{ bgcolor: "#111827", borderRadius: 2, textTransform: "none" }}>
                                    Cerrar
                                </Button>
                            </Box>
                        </Card>
                    )}
                </Box>
            )}
        </Dialog>
    );
}
```

- [ ] **Step 2: Compilar, lint y suite completa**

Run: `npm run build && npm run lint && npm run test:run`
Expected: build ✓, lint 0 errores (los warnings previos de `coverage/` y `EstudiantesAulaView` siguen), tests todos en verde. Si `tsc` marca que `respuestaSumaPunto`/`paletaBotonRespuesta` quedaron sin usar en el wizard, es correcto: ahora las usan `PautaCard` y `ParteFila`.

- [ ] **Step 3: Commit**

```bash
git add src/components/evaluaciones/EvaluacionWizard.tsx
git commit -m "feat(evaluaciones): wizard con una pantalla por pauta y seguimiento por pauta"
```

---

### Task 5: Revisión: barra fija y estado de pauta compartido

**Files:**
- Modify: `src/components/evaluaciones/EvaluacionRevision.tsx:47-91` (agrupación y stats) y `:101-124` (barra superior) y `:139-186` (cabecera de grupo)

**Interfaces:**
- Consumes: `agruparPautas`, `estadoPauta`, `Respuestas`, `Pauta` (Task 1).
- Produces: nada nuevo; misma firma pública.

- [ ] **Step 1: Reemplazar la agrupación y las estadísticas**

Borrar `getGroupTitleFromQuestions`, el `useMemo` de `grouped` y `getGroupStats`; poner en su lugar:

```tsx
import { agruparPautas, estadoPauta, type Respuestas } from "../../utils/pautas";

// ...dentro del componente, después de los useState:
const pautas = useMemo(() => agruparPautas(data?.preguntas ?? []), [data]);
const respuestasMapa = useMemo<Respuestas>(() => {
    const mapa: Respuestas = {};
    (data?.respuestas ?? []).forEach((r) => { mapa[r.pregunta_id] = r.respuesta; });
    return mapa;
}, [data]);
```

Y reemplazar el cálculo de aciertos:

```tsx
const aciertosCalculados = pautas.reduce((acc, p) => acc + (estadoPauta(p, respuestasMapa).aprobada ? 1 : 0), 0);
const totalGrupos = pautas.length || total;
```

- [ ] **Step 2: Barra superior fija**

En el `Box` de la barra (el que contiene el `IconButton` de cerrar y el botón "Corregir respuestas") agregar:

```tsx
sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 2, bgcolor: '#fff' }}
```

- [ ] **Step 3: Cabecera de cada grupo con el estado compartido**

Reemplazar el `grouped.map(([groupNumber, preguntasDelGrupo]) => { const stats = getGroupStats(preguntasDelGrupo); ...` por:

```tsx
{pautas.map((pauta) => {
    const r = estadoPauta(pauta, respuestasMapa);
    const preguntasDelGrupo = pauta.partes;
    return (
        <Paper key={pauta.clave} elevation={1} sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#F7F9FC", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <Box>
                    <Typography sx={{ fontWeight: 800 }}>{pauta.titulo}</Typography>
                    {r.total > 1 && (
                        <Typography variant="body2" color="text.secondary">Se aprueba con {r.necesarias} de {r.total}</Typography>
                    )}
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={`${r.correctas}/${r.total}`} sx={{ bgcolor: "#EEF2FF", color: "#4A78C2", fontWeight: 700 }} />
                    <Chip size="small"
                        label={!r.completa ? "Incompleta" : r.aprobada ? "Pauta aprobada" : "Pauta no aprobada"}
                        sx={{ fontWeight: 700, ...(!r.completa ? { bgcolor: "#FFF7E6", color: "#B26A00" } : r.aprobada ? { bgcolor: "#ECF7F0", color: "#4F8A5B" } : { bgcolor: "#FDEFF0", color: "#C05A63" }) }} />
                </Stack>
            </Box>
            {/* la <List> de preguntasDelGrupo queda igual que hoy */}
```

El cierre del `map` cambia de `})}` sobre `grouped` a `})}` sobre `pautas`; el contenido de la `<List>` no se toca.

- [ ] **Step 4: Compilar, lint y suite**

Run: `npm run build && npm run lint && npm run test:run`
Expected: todo en verde. `test/components/presentational.test.ts` no cubre la revisión, así que no cambia.

- [ ] **Step 5: Commit**

```bash
git add src/components/evaluaciones/EvaluacionRevision.tsx
git commit -m "feat(evaluaciones): revisión con barra fija y estado de pauta compartido con el wizard"
```

---

### Task 6: Elegir a dónde volver al cerrar una corrección (punto 8)

**Files:**
- Modify: `src/components/evaluaciones/EvaluacionDetalle.tsx:92-146` (estados y handlers) y `:356-368` (cierre del wizard) y el final del JSX (diálogo nuevo)

**Interfaces:**
- Consumes: nada nuevo.
- Produces: nada nuevo.

- [ ] **Step 1: Estados y origen del wizard**

Después de `const [revisionData, setRevisionData] = useState<...>(null);`:

```tsx
// Desde dónde se abrió el wizard: define a dónde se vuelve al cerrarlo
const [wizardOrigen, setWizardOrigen] = useState<"ficha" | "revision">("ficha");
// Elección de destino pendiente después de corregir desde la revisión
const [postCorreccion, setPostCorreccion] = useState<{ areaId: string; nombre: string } | null>(null);
```

`loadEvaluationData` devuelve lo cargado:

```tsx
const loadEvaluationData = async (): Promise<EvaluacionInstancia | null> => {
    try {
        setLoading(true)
        const res = await getEvaluacionInstanciaById(evaluacionId)
        setData(res)
        return res
    } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error al cargar la evaluación")
        return null
    } finally {
        setLoading(false)
    }
}
```

En `handleAreaClick`, justo antes de `setSelectedArea({ id: areaId, nombre: areaNombre });` agregar `setWizardOrigen("ficha");`. En `handleCorrectFromRevision`, antes de `setSelectedArea(...)` agregar `setWizardOrigen("revision");`.

Nuevo helper, debajo de `handleCorrectFromRevision`:

```tsx
// Reabre la revisión de un área con los datos ya recargados
const abrirRevisionDeArea = (fresco: EvaluacionInstancia | null, areaId: string) => {
    const area = fresco?.areas?.find((a) => a.id === areaId);
    if (!area) return;
    setRevisionData({ id: area.id, nombre: area.nombre, score: area.aciertosIndividuales || 0, total: area.totalPreguntas || 0, statusId: area.estadoId });
    setRevisionOpen(true);
}
```

- [ ] **Step 2: Cierre del wizard con elección**

Reemplazar el `onClose` del `<EvaluacionWizard>`:

```tsx
onClose={async () => {
    setWizardOpen(false);
    const areaCerrada = selectedArea;
    setSelectedArea(null);
    const fresco = await loadEvaluationData();
    if (wizardOrigen === "revision" && areaCerrada && fresco) {
        setPostCorreccion({ areaId: areaCerrada.id, nombre: areaCerrada.nombre });
    }
}}
```

- [ ] **Step 3: Diálogo de elección**

Agregar `Dialog, DialogTitle, DialogContent, DialogActions` al import de `@mui/material` y, después del bloque `{revisionData && (<EvaluacionRevision ... />)}`:

```tsx
<Dialog open={!!postCorreccion} onClose={() => setPostCorreccion(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
    <DialogTitle sx={{ fontWeight: 700 }}>¿A dónde querés volver?</DialogTitle>
    <DialogContent>
        <Typography variant="body2" color="text.secondary">Las correcciones ya quedaron guardadas.</Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: "wrap" }}>
        <Button onClick={() => setPostCorreccion(null)} sx={{ textTransform: "none", color: "#666" }}>
            Ir a la ficha de la evaluación
        </Button>
        <Button
            variant="contained"
            onClick={() => { const destino = postCorreccion; setPostCorreccion(null); if (destino) abrirRevisionDeArea(data, destino.areaId); }}
            sx={{ bgcolor: "#5c7cfa", textTransform: "none", borderRadius: 2 }}
        >
            Volver a la revisión de {postCorreccion?.nombre}
        </Button>
    </DialogActions>
</Dialog>
```

`data` ya está actualizado cuando el diálogo se muestra, porque `setPostCorreccion` corre después del `await loadEvaluationData()`.

- [ ] **Step 4: Compilar, lint y suite**

Run: `npm run build && npm run lint && npm run test:run`
Expected: todo en verde.

- [ ] **Step 5: Commit**

```bash
git add src/components/evaluaciones/EvaluacionDetalle.tsx
git commit -m "feat(evaluaciones): al cerrar una corrección, elegir volver a la revisión o a la ficha"
```

---

### Task 7: Documentación de componentes y flujos

**Files:**
- Modify: `docs/documentacion-componentes-y-flujos.md` (agregar una sección; leer el índice del archivo para ubicarla junto a lo de evaluaciones)

- [ ] **Step 1: Agregar la sección**

```markdown
### Wizard de evaluación por pautas (`src/components/evaluaciones/wizard/`)

Desde octubre de 2026 el wizard muestra **una pantalla por pauta**. Una pauta es el grupo de
preguntas que comparten `numero` (`agruparPautas`, `src/utils/pautas.ts`); si tiene varias partes
se responden todas en la misma pantalla y aprueba con la mitad o más de partes correctas
(`estadoPauta`). Componentes:

- `PautaCard`: cabecera, cuerpo (simple o con desglose) y pie de navegación. Sin estado.
- `ParteFila`: una parte con sus botones Sí/No. Volver a tocar la opción marcada la quita.
- `SeguimientoPautas`: un círculo por pauta (`circuloPauta`): número si no se tocó, "1/3" en ámbar
  a medias, ✓ o ✗ al completar. En pautas simples el ícono dice la respuesta y el color si aprueba.
- `EvaluacionWizard`: estado, carga, guardado inmediato por parte y avance automático al completar
  la pauta (preferencia `padi.wizard.avanzarSola` en localStorage).

Al cerrar una corrección abierta desde la revisión, `EvaluacionDetalle` ofrece volver a esa revisión
o a la ficha. Especificación: `docs/specs/2026-10-13-pautas-con-desglose.md`.
```

- [ ] **Step 2: Commit**

```bash
git add docs/documentacion-componentes-y-flujos.md
git commit -m "docs(evaluaciones): wizard por pautas en la documentación de componentes"
```

---

### Task 8: Verificación final y PR

**Files:** ninguno nuevo.

- [ ] **Step 1: Cobertura y contratos**

Run: `npm run test:coverage` (umbral 70 % en `src/utils`) y, desde `../backend`, `make test-contracts`.
Expected: ambos en verde; `pautas.ts` con cobertura de ramas alta.

- [ ] **Step 2: Prueba manual (quien tenga la app corriendo)**

Con el backend en Docker o el emulador y `npm run dev`, en una ventana ancha y en el modo celular del navegador:

1. Sala 4, Comunicación y Lenguaje: Intrusos muestra tres partes; responder 6.1 cambia el círculo a "1/3"; completar con dos Sí lo pone ✓ verde y, con la casilla activa, pasa sola a la pauta 7.
2. Volver a tocar una opción marcada la quita y el círculo vuelve a "2/3".
3. Socioemocional de cualquier sala: responder "No" deja el botón No en verde y el círculo con ✗ verde.
4. Sala 3, Sensoriomotora, Copiado de figuras: las tres partes muestran su imagen.
5. Sala 5, Comunicación y Lenguaje, Absurdo verbal: "Se aprueba con 3 de 5".
6. Con la red cortada (DevTools › Offline), tocar una respuesta: vuelve al valor anterior y aparece el aviso.
7. Revisión: scrollear hasta el final; "Corregir respuestas" sigue visible. Corregir y cerrar: aparece la elección; "Volver a la revisión" muestra las respuestas nuevas.
8. Celular: la fila de círculos centra la pauta actual; el pie con Anterior / Siguiente queda visible al scrollear la tarjeta.

- [ ] **Step 3: Push y PR**

```bash
git push -u origin feat/pautas-con-desglose
gh pr create --base main --title "feat(evaluaciones): una pantalla por pauta en el wizard" --body-file <cuerpo con: qué cambia (puntos 7, 1, 2, 3, 8), qué queda para después (datos del punto 4, 5 y 6), tests, y la nota de prueba manual>
```
