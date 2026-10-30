import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
    return { ...actual, useNavigate: () => vi.fn(), useSearchParams: () => [new URLSearchParams(), vi.fn()] };
});

import FormularioReenvioInvitacion from "../../src/components/auth/FormularioReenvioInvitacion";
import ReenviarInvitacion from "../../src/pages/auth/ReenviarInvitacion";
import CambiarContrasenaTemporal from "../../src/pages/auth/CambiarContrasenaTemporal";
import Login from "../../src/pages/Login";

describe("autoservicio del link de activación", () => {
    it("el formulario pide el correo y ofrece pedir un link nuevo", () => {
        const html = renderToStaticMarkup(createElement(FormularioReenvioInvitacion, { descripcion: "Te llega en minutos." }));
        expect(html).toContain('type="email"');
        expect(html).toContain("Pedir un link nuevo");
        expect(html).toContain("Te llega en minutos.");
        expect(html).toContain('data-reenvio="formulario"');
    });

    it("la página pública explica el caso y trae el formulario", () => {
        const html = renderToStaticMarkup(createElement(ReenviarInvitacion));
        expect(html).toContain("Pedir un link de activación nuevo");
        expect(html).toContain("Volver al login");
        expect(html).toContain('data-reenvio="formulario"');
    });

    it("la página de activación arranca con el formulario de contraseña (el hash se lee al montar)", () => {
        const html = renderToStaticMarkup(createElement(CambiarContrasenaTemporal));
        expect(html).toContain("Nueva contraseña");
        expect(html).not.toContain('data-activacion="link-inutilizable"');
    });

    it("el login ofrece pedir el link de activación de nuevo", () => {
        const html = renderToStaticMarkup(createElement(Login));
        expect(html).toContain("¿No pudiste activar tu cuenta?");
        expect(html).toContain("¿Olvidaste tu contraseña?");
    });
});
