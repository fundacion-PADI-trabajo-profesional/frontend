import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import DashboardCard from "../../src/components/DashboardCard";
import BotonNuevo from "../../src/components/BotonNuevo";
import ProgresionEstudiante from "../../src/components/ProgresionEstudiante";

describe("DashboardCard", () => {
    it("renderiza titulo, descripcion e icono", () => {
        const html = renderToStaticMarkup(
            createElement(DashboardCard, {
                title: "Panel de control",
                description: "Acceso a zonas y escuelas",
                icon: "📊",
                onClick: vi.fn(),
            })
        );

        expect(html).toContain("Panel de control");
        expect(html).toContain("Acceso a zonas y escuelas");
        expect(html).toContain("📊");
    });
});

describe("BotonNuevo", () => {
    it("renderiza el texto del boton", () => {
        const html = renderToStaticMarkup(
            createElement(BotonNuevo, {
                texto: "Nuevo registro",
            })
        );

        expect(html).toContain("Nuevo registro");
    });
});

describe("ProgresionEstudiante", () => {
    it("muestra un mensaje cuando no hay evaluaciones", () => {
        const html = renderToStaticMarkup(
            createElement(ProgresionEstudiante, {
                data: {
                    estudiante_id: "est-1",
                    nombre: "Ana",
                    primer_apellido: "Lopez",
                    periodo: 2025,
                    areas: [],
                },
            })
        );

        expect(html).toContain("Sin evaluaciones registradas para este estudiante.");
    });

    it("renderiza la tabla de progreso por area", () => {
        const html = renderToStaticMarkup(
            createElement(ProgresionEstudiante, {
                data: {
                    estudiante_id: "est-1",
                    nombre: "Ana",
                    primer_apellido: "Lopez",
                    periodo: 2025,
                    areas: [
                        {
                            area_id: "a1",
                            area_nombre: "Lengua",
                            area_orden: 1,
                            evaluaciones: [
                                {
                                    evaluacion_id: "ev-1",
                                    fecha: "2024-01-01",
                                    tipo: "inicial",
                                    pct: 0.8,
                                },
                            ],
                        },
                    ],
                },
            })
        );

        expect(html).toContain("Últimas 1 evaluación");
        expect(html).toContain("Ana Lopez");
        expect(html).toContain("Lengua");
        expect(html).toContain("80%");
    });
});