import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BarraRevision from "../../src/components/evaluaciones/BarraRevision";

describe("BarraRevision", () => {
  it("queda fija arriba al scrollear y muestra 'Corregir respuestas' cuando se puede corregir", () => {
    const html = renderToStaticMarkup(createElement(BarraRevision, {
      areaNombre: "Comunicación y Lenguaje", onClose: vi.fn(), onCorrect: vi.fn(),
    }));
    expect(html).toContain("Revisión: Comunicación y Lenguaje");
    expect(html).toContain("Corregir respuestas");
    expect(html).toContain("position:sticky");
  });

  it("sin onCorrect no ofrece corregir (alumno dado de baja)", () => {
    const html = renderToStaticMarkup(createElement(BarraRevision, {
      areaNombre: "Sensoriomotora", onClose: vi.fn(),
    }));
    expect(html).not.toContain("Corregir respuestas");
  });
});
