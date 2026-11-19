import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import InsigniasContexto, { LeyendaInsignias } from "../../src/components/estudiantes/InsigniasContexto";

const html = (contexto: { en_tratamiento: boolean | null; tiene_cud: boolean | null } | null | undefined) =>
    renderToStaticMarkup(createElement(InsigniasContexto, { contexto }));

describe("InsigniasContexto", () => {
    it("sin dato o con 'no' no dibuja nada", () => {
        expect(html(undefined)).toBe("");
        expect(html({ en_tratamiento: false, tiene_cud: false })).toBe("");
        expect(html({ en_tratamiento: null, tiene_cud: null })).toBe("");
    });

    it("dibuja C para CUD y T para tratamiento, con su nombre accesible", () => {
        const ambos = html({ en_tratamiento: true, tiene_cud: true });
        expect(ambos).toContain('aria-label="Tiene CUD"');
        expect(ambos).toContain('aria-label="En tratamiento"');
        expect(ambos.indexOf("Tiene CUD")).toBeLessThan(ambos.indexOf("En tratamiento"));

        const soloTratamiento = html({ en_tratamiento: true, tiene_cud: null });
        expect(soloTratamiento).toContain('aria-label="En tratamiento"');
        expect(soloTratamiento).not.toContain("CUD");
    });

    it("la leyenda explica las dos letras", () => {
        const leyenda = renderToStaticMarkup(createElement(LeyendaInsignias));
        expect(leyenda).toContain("Tiene CUD");
        expect(leyenda).toContain("En tratamiento");
    });
});
