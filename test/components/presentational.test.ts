import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
    return {
        ...actual,
        useNavigate: () => vi.fn(),
        useSearchParams: () => [new URLSearchParams(), vi.fn()],
    };
});

import DashboardCard from "../../src/components/common/DashboardCard";
import BotonNuevo from "../../src/components/common/BotonNuevo";
import PageHeader from "../../src/components/common/PageHeader";
import SalasView from "../../src/components/aulas/SalasView";
import EscuelasView from "../../src/components/escuelas/EscuelasView";
import AulasView from "../../src/components/aulas/AulasView";
import EvaluacionesList from "../../src/components/evaluaciones/EvaluacionesList";
import Login from "../../src/pages/Login";
import Home from "../../src/pages/Home";
import PanelControl from "../../src/pages/PanelControl";
import EstudiantesCompacto from "../../src/components/estudiantes/EstudiantesCompacto";
import type { Estudiante } from "../../src/api/estudiantes";
import ProgresionEstudiante from "../../src/components/graficos/ProgresionEstudiante";

function makeStudent(overrides: Partial<Estudiante> = {}): Estudiante {
    return {
        id: "est-1",
        persona_id: "per-1",
        genero_id: "F",
        grado: 1,
        sala_id: 1,
        fecha_creacion: "2024-01-01",
        personas: {
            fecha_nacimiento: "2018-01-01",
            nombre: "Ana",
            primer_apellido: "Lopez",
            segundo_apellido: null,
            dni: "12345678",
        },
        salas: { nombre: "Sala 1" },
        escuela: {
            escuela_id: "esc-1",
            nombre: "Escuela Uno",
            zona_nombre: "Zona Norte",
        },
        aula_asignada: null,
        evaluaciones_historial: [],
        evaluaciones_resumen: { inicial: "A", cierre: "E" },
        aula_id: null,
        ...overrides,
    };
}

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

describe("PageHeader", () => {
    it("renderiza titulo, subtitulo y acciones", () => {
        const html = renderToStaticMarkup(
            createElement(PageHeader, {
                title: "Gestión de escuelas",
                subtitle: "Revisión general del panel",
                backTo: "/home",
                backLabel: "Volver al inicio",
                onAdd: vi.fn(),
                addLabel: "Nueva escuela",
            })
        );

        expect(html).toContain("Gestión de escuelas");
        expect(html).toContain("Revisión general del panel");
        expect(html).toContain("Volver al inicio");
        expect(html).toContain("Nueva escuela");
    });
});

describe("SalasView", () => {
    it("muestra el estado de carga inicial", () => {
        const html = renderToStaticMarkup(
            createElement(SalasView, {
                escuelaId: "esc-1",
                escuelaNombre: "Escuela A",
                onVolver: vi.fn(),
                onVerAulas: vi.fn(),
            })
        );

        expect(html).toContain("progressbar");
    });
});

describe("EscuelasView", () => {
    it("muestra el estado de carga inicial", () => {
        const html = renderToStaticMarkup(
            createElement(EscuelasView, {
                zonaIdParam: null,
                isEquipoPadi: true,
                onVolver: vi.fn(),
                onVerAulas: vi.fn(),
            })
        );

        expect(html).toContain("progressbar");
    });
});

describe("AulasView", () => {
    it("muestra el estado de carga inicial", () => {
        const html = renderToStaticMarkup(
            createElement(AulasView, {
                escuelaId: "esc-1",
                salaSeleccionada: { id: 1, nombre: "Sala 1", grado: 1 },
                isEquipoPadi: true,
                onVerEstudiantes: vi.fn(),
                onVolver: vi.fn(),
            } as any)
        );

        expect(html).toContain("progressbar");
    });
});

describe("EvaluacionesList", () => {
    it("muestra el estado de carga inicial", () => {
        const html = renderToStaticMarkup(
            createElement(EvaluacionesList, {
                onEditar: vi.fn(),
            })
        );

        expect(html).toContain("progressbar");
    });
});

describe("Home", () => {
    it("muestra el estado de carga inicial", () => {
        localStorage.setItem(
            "padiUser",
            JSON.stringify({ id: "u-1", rol: "equipo_padi" })
        );
        localStorage.setItem(
            "padiProfile",
            JSON.stringify({ nombre: "Ana", apellido: "Lopez", rol: "equipo_padi" })
        );

        const html = renderToStaticMarkup(
            createElement(Home, {
                onLogout: vi.fn(),
            })
        );

        expect(html).toContain("progressbar");
    });
});

describe("PanelControl", () => {
    it("muestra el estado de carga inicial", () => {
        localStorage.setItem(
            "padiUser",
            JSON.stringify({ id: "u-1", rol: "equipo_padi" })
        );

        const html = renderToStaticMarkup(createElement(PanelControl));

        expect(html).toContain("progressbar");
    });
});

describe("EstudiantesCompacto", () => {
    it("muestra el estado vacio cuando no hay estudiantes", () => {
        const html = renderToStaticMarkup(
            createElement(EstudiantesCompacto, {
                estudiantes: [],
                onAddEstudiante: vi.fn(),
                onEditEstudiante: vi.fn(),
                onBulkAdd: vi.fn(),
                userRole: "equipo_padi",
            })
        );

        expect(html).toContain("No hay estudiantes que coincidan con los filtros.");
    });

    it("agrupa estudiantes de una sola escuela", () => {
        const html = renderToStaticMarkup(
            createElement(EstudiantesCompacto, {
                estudiantes: [
                    makeStudent(),
                    makeStudent({
                        id: "est-2",
                        persona_id: "per-2",
                        personas: {
                            fecha_nacimiento: "2018-01-02",
                            nombre: "Bruno",
                            primer_apellido: "Martinez",
                            segundo_apellido: null,
                            dni: "87654321",
                        },
                    }),
                ],
                onAddEstudiante: vi.fn(),
                onEditEstudiante: vi.fn(),
                onBulkAdd: vi.fn(),
                userRole: "equipo_padi",
            })
        );

        expect(html).toContain("Escuela Uno");
        expect(html).toContain("Zona Norte");
        expect(html).toContain("Sala 1");
        expect(html).toContain("2 estudiantes");
    });

    it("agrupa estudiantes de distintas escuelas", () => {
        const html = renderToStaticMarkup(
            createElement(EstudiantesCompacto, {
                estudiantes: [
                    makeStudent(),
                    makeStudent({
                        id: "est-3",
                        persona_id: "per-3",
                        sala_id: 2,
                        salas: { nombre: "Sala 2" },
                        escuela: {
                            escuela_id: "esc-2",
                            nombre: "Escuela Dos",
                            zona_nombre: "Zona Sur",
                        },
                        personas: {
                            fecha_nacimiento: "2018-01-03",
                            nombre: "Carla",
                            primer_apellido: "Perez",
                            segundo_apellido: null,
                            dni: "11223344",
                        },
                    }),
                ],
                onAddEstudiante: vi.fn(),
                onEditEstudiante: vi.fn(),
                onBulkAdd: vi.fn(),
                userRole: "docente",
            })
        );

        expect(html).toContain("Escuela Uno");
        expect(html).toContain("Escuela Dos");
        expect(html).toContain("Zona Sur");
    });
});

describe("Login", () => {
    it("renderiza el formulario y el acceso a recupero de contraseña", () => {
        const html = renderToStaticMarkup(
            createElement(Login, {
                onLogin: vi.fn(),
            })
        );

        expect(html).toContain("Ingresá a tu cuenta PADI");
        expect(html).toContain("¿Olvidaste tu contraseña?");
        expect(html).toContain("Email");
        expect(html).toContain("Password");
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