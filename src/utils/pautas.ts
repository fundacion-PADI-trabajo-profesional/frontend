/**
 * Pautas del wizard de evaluación.
 *
 * Una pauta es el conjunto de preguntas activas de un área que comparten
 * `numero`; es la misma agrupación con la que el backend calcula el puntaje
 * del área. Una pauta con una sola parte es "simple"; con dos o más tiene
 * "desglose" y aprueba cuando las partes correctas llegan al mínimo que trae
 * cada parte (`minimo_aprobacion`, el del cuadernillo) o, si no hay, a la
 * mitad redondeada hacia arriba (3 → 2, 4 → 2, 5 → 3).
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

/** El mínimo de una pauta a partir de sus partes: todas traen el mismo valor; si difieren, el más alto. */
export function minimoDePartes(minimos: (number | null | undefined)[]): number | null {
    const valores = minimos.filter((m): m is number => typeof m === "number");
    return valores.length ? Math.max(...valores) : null;
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
    const necesarias = minimoDePartes(pauta.partes.map((p) => p.minimo_aprobacion)) ?? Math.ceil(total / 2);
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

/**
 * `true` solo cuando la pauta pasa de incompleta a completa con la nueva respuesta.
 * Es la condición del avance automático: ni al quitar una respuesta ni al corregir
 * una pauta que ya estaba completa.
 */
export function pautaRecienCompletada(pauta: Pauta, antes: Respuestas, despues: Respuestas): boolean {
    return !estadoPauta(pauta, antes).completa && estadoPauta(pauta, despues).completa;
}

/** Tocar la opción ya marcada la quita; tocar la otra la cambia. */
export function alternarRespuesta(actual: number | null | undefined, tocada: 0 | 1): 0 | 1 | null {
    return actual === tocada ? null : tocada;
}

export interface TextosCompartidos {
    detalle: string | null;
    materiales: string | null;
}

/**
 * Textos iguales en todas las partes de una pauta con desglose, para mostrarlos
 * una sola vez en la cabecera en vez de repetirlos en cada parte (la consigna
 * larga de Sonido inicial, los materiales). Una pauta simple no comparte nada.
 */
export function textosCompartidos(pauta: Pauta): TextosCompartidos {
    if (pauta.partes.length < 2) return { detalle: null, materiales: null };
    const comun = (valor: (p: PreguntaBase) => string | undefined): string | null => {
        const textos = pauta.partes.map((p) => (valor(p) ?? "").trim());
        const primero = textos[0];
        if (!primero || primero === "-") return null;
        return textos.every((t) => t === primero) ? primero : null;
    };
    return { detalle: comun((p) => p.detalle), materiales: comun((p) => p.materiales) };
}

export interface ConsignaEnPartes {
    /** El primer párrafo: lo que se le dice al chico. Siempre visible. */
    principal: string;
    /** El resto (cómo presentarla, ejemplos), para mostrar plegado. `null` si no hay más. */
    resto: string | null;
}

/** Separa una consigna larga por su primera línea en blanco, para no tapar la pantalla con texto. */
export function consignaEnPartes(texto: string): ConsignaEnPartes {
    const [principal, ...resto] = texto.trim().split(/\n\s*\n/);
    const restoTexto = resto.join("\n\n").trim();
    return { principal: principal.trim(), resto: restoTexto || null };
}
