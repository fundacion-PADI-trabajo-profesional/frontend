import { describe, it, expect } from "vitest";
import { agruparPautas, estadoPauta, circuloPauta, siguientePautaPendiente, alternarRespuesta, pautaRecienCompletada } from "../../src/utils/pautas";
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

describe("pautaRecienCompletada", () => {
  const intrusos = pauta(SALA4_CL, 6);

  it("true solo cuando la pauta pasa de incompleta a completa", () => {
    expect(pautaRecienCompletada(intrusos, { cl6a: 1, cl6b: 0 }, { cl6a: 1, cl6b: 0, cl6c: 1 })).toBe(true);
  });

  it("false al quitar una respuesta de una pauta completa", () => {
    expect(pautaRecienCompletada(intrusos, { cl6a: 1, cl6b: 0, cl6c: 1 }, { cl6a: 1, cl6b: 0, cl6c: null })).toBe(false);
  });

  it("false al corregir una pauta que ya estaba completa", () => {
    expect(pautaRecienCompletada(intrusos, { cl6a: 1, cl6b: 0, cl6c: 1 }, { cl6a: 0, cl6b: 0, cl6c: 1 })).toBe(false);
  });

  it("false si sigue incompleta", () => {
    expect(pautaRecienCompletada(intrusos, {}, { cl6a: 1 })).toBe(false);
  });
});
