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

describe("SeguimientoPautas en celular", () => {
  it("la fila de círculos queda fija arriba al scrollear la tarjeta", () => {
    const html = renderToStaticMarkup(createElement(SeguimientoPautas, {
      pautas: agruparPautas(SALA4_CL), respuestas: {}, actual: 0, onIr: vi.fn(), variante: "fila",
    }));
    expect(html).toContain("position:sticky");
  });
});
