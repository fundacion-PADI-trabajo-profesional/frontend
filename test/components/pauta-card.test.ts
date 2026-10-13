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

describe("PautaCard en celular", () => {
  it("la tarjeta no recorta su contenido, así el pie sticky se apoya en el scroll de la pantalla", () => {
    const html = render({ pauta: agruparPautas(SALA4_CL)[5], indice: 5 });
    // El Card de MUI trae overflow:hidden por defecto, que anula position:sticky del pie en celular.
    expect(html).toContain("overflow:visible");
  });
});
