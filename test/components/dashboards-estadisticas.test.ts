import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { setUserInStorage } from "../setup";

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
    return { ...actual, useNavigate: () => vi.fn() };
});

import AdminDashboard from "../../src/pages/dashboards/AdminDashboard";
import DirectivoDashboard from "../../src/pages/dashboards/DirectivoDashboard";
import DocenteDashboard from "../../src/pages/dashboards/DocenteDashboard";

// Temporal: la sección de estadísticas está en revisión y solo la ve el equipo PADI.
describe("tarjeta Estadísticas en los dashboards", () => {
    it("equipo_padi la ve en su dashboard", () => {
        setUserInStorage({ rol: "equipo_padi" });
        const html = renderToStaticMarkup(createElement(AdminDashboard, { rol: "equipo_padi" }));
        expect(html).toContain("Estadísticas");
    });

    it("encargado_zona no la ve en su dashboard", () => {
        setUserInStorage({ rol: "encargado_zona" });
        const html = renderToStaticMarkup(createElement(AdminDashboard, { rol: "encargado_zona" }));
        expect(html).not.toContain("Estadísticas");
    });

    it("director no la ve en su dashboard", () => {
        setUserInStorage({ rol: "director", escuela_id: "e-1" });
        const html = renderToStaticMarkup(createElement(DirectivoDashboard));
        expect(html).not.toContain("Estadísticas");
    });

    it("docente no la ve en su dashboard", () => {
        setUserInStorage({ rol: "docente", escuela_id: "e-1" });
        const html = renderToStaticMarkup(createElement(DocenteDashboard));
        expect(html).not.toContain("Estadísticas");
    });
});

// "Evaluaciones" dejó de ser una sección: se evalúa entrando por Estudiantes (pedido de usuarias, 18/11/2026).
describe("tarjeta Evaluaciones en los dashboards", () => {
    it.each([
        ["equipo_padi", () => createElement(AdminDashboard, { rol: "equipo_padi" })],
        ["encargado_zona", () => createElement(AdminDashboard, { rol: "encargado_zona" })],
        ["director", () => createElement(DirectivoDashboard)],
        ["docente", () => createElement(DocenteDashboard)],
    ] as const)("%s no tiene tarjeta de Evaluaciones y conserva la de Estudiantes", (rol, crear) => {
        setUserInStorage({ rol, escuela_id: "e-1" });
        const html = renderToStaticMarkup(crear());
        expect(html).not.toMatch(/>(Mis )?Evaluaciones( PADI)?</);
        expect(html).toMatch(/>(Mis |Gestionar )?Estudiantes</);
    });
});
