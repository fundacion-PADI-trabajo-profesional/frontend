import { describe, it, expect, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { setUserInStorage } from "../setup";

// App monta su propio BrowserRouter (no hay window en Node): lo reemplazamos por un MemoryRouter
// apuntando a la ruta bajo prueba. `<Navigate>` navega en un efecto, que el render estático no corre,
// así que una redirección se ve como HTML vacío y una página permitida como su marcador.
const ruta = vi.hoisted(() => ({ actual: "/" }));
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
    return {
        ...actual,
        BrowserRouter: ({ children }: { children: ReactNode }) =>
            createElement(actual.MemoryRouter, { initialEntries: [ruta.actual] }, children),
    };
});
// Las páginas reales usan react-query; acá solo importa a cuál deja pasar el router.
// (`vi.mock` se eleva al tope del archivo: la factory va en `vi.hoisted` e importa React por su cuenta.)
const pagina = vi.hoisted(() => async () => {
    const { createElement } = await import("react");
    return { default: () => createElement("div", null, "PAGINA-ESTADISTICAS") };
});
vi.mock("../../src/pages/estadisticas/EstadisticasPadi", pagina);
vi.mock("../../src/pages/estadisticas/EstadisticasZona", pagina);
vi.mock("../../src/pages/estadisticas/EstadisticasEscuela", pagina);
vi.mock("../../src/pages/estadisticas/EstadisticasDocente", pagina);

import App from "../../src/App";

function render(rol: string, path: string): string {
    setUserInStorage({ rol, escuela_id: "e-1" });
    ruta.actual = path;
    return renderToStaticMarkup(createElement(App));
}

// Temporal: la sección de estadísticas está en revisión y solo la ve el equipo PADI.
describe("rutas /estadisticas/*", () => {
    it.each(["/estadisticas/padi", "/estadisticas/escuela", "/estadisticas/docente"])(
        "equipo_padi entra a %s",
        (path) => {
            expect(render("equipo_padi", path)).toContain("PAGINA-ESTADISTICAS");
        }
    );

    it.each([
        ["docente", "/estadisticas/docente"],
        ["director", "/estadisticas/escuela"],
        ["director", "/estadisticas/docente"],
        ["encargado_zona", "/estadisticas/zona"],
        ["encargado_zona", "/estadisticas/escuela"],
        ["encargado_zona", "/estadisticas/docente"],
    ])("%s es redirigido fuera de %s", (rol, path) => {
        expect(render(rol, path)).not.toContain("PAGINA-ESTADISTICAS");
    });
});
