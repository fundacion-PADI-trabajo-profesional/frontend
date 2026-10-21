import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PautaCard from "../../src/components/evaluaciones/wizard/PautaCard";
import { agruparPautas } from "../../src/utils/pautas";
import { SALA4_CL, SE_RECEPTIVIDAD, CL4_SONIDO_INICIAL } from "../fixtures/preguntas";

const render = (props: Partial<Parameters<typeof PautaCard>[0]> & { pauta: Parameters<typeof PautaCard>[0]["pauta"] }) =>
  renderToStaticMarkup(createElement(PautaCard, {
    indice: 0, total: 8, respuestas: {},
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

  it("anterior deshabilitado en la primera pauta; los botones de respuesta nunca se bloquean", () => {
    const primera = render({ pauta: pautas[0], indice: 0 });
    const anterior = primera.match(/<button[^>]*data-anterior[^>]*>/)?.[0] ?? "";
    expect(anterior).toContain("disabled");
    expect(botonesRespuesta(render({ pauta: pautas[5], indice: 5 })).some((b) => b.includes("disabled"))).toBe(false);
  });
});

describe("PautaCard en celular", () => {
  it("la tarjeta no recorta su contenido, así el pie sticky se apoya en el scroll de la pantalla", () => {
    const html = render({ pauta: agruparPautas(SALA4_CL)[5], indice: 5 });
    // El Card de MUI trae overflow:hidden por defecto, que anula position:sticky del pie en celular.
    expect(html).toContain("overflow:visible");
  });
});

describe("PautaCard con consigna compartida", () => {
  const sonidoInicial = agruparPautas(CL4_SONIDO_INICIAL)[0];
  const veces = (html: string, texto: string) => html.split(texto).length - 1;

  it("muestra la consigna y los materiales una sola vez, en la cabecera, y no en cada parte", () => {
    const html = render({ pauta: sonidoInicial, indice: 4, total: 8 });
    expect(veces(html, "Presente al niño las imágenes")).toBe(1);
    expect(veces(html, "Cuadernillo de Estímulos")).toBe(1);
    expect(html).toContain("Consigna");
    // la frase para el chico queda a la vista; el resto va plegado en un <details>
    expect(html.indexOf("Te voy a mostrar unos dibujos")).toBeLessThan(html.indexOf("<details"));
    expect(html.indexOf("<details")).toBeLessThan(html.indexOf("Presente al niño las imágenes"));
    expect(html).toContain("Cómo presentarla");
    expect(html).not.toContain("Nota:");
    expect(html).toContain("Diga: ooooso");
    expect(html).toContain("Responde O");
    expect(html).toContain("Se aprueba con 3 de 5");
    expect(botonesRespuesta(html)).toHaveLength(10);
  });

  it("si las partes tienen detalles distintos, cada una conserva su nota", () => {
    const partes = CL4_SONIDO_INICIAL.map((p, i) => ({ ...p, detalle: "nota " + i }));
    const html = render({ pauta: { ...sonidoInicial, partes }, indice: 4, total: 8 });
    expect(veces(html, "Nota:")).toBe(5);
    expect(html).not.toContain(">Consigna<");
  });
});
