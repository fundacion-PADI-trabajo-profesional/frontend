import { describe, it, expect, vi, beforeEach } from "vitest";
import { setUserInStorage, mockFetchResponse } from "../setup";

vi.mock("../../api/auth", () => ({
  getAuthHeaders: () => ({ Authorization: "Bearer fake" }),
}));

import {
  getHeatmapZonas,
  getHeatmapEscuelas,
  getHeatmapAulas,
  getEstudiantesEnRiesgoZona,
  getEstudiantesEnRiesgoEscuela,
  getEvolucionPadi,
  getEvolucionZona,
  getEvolucionEscuela,
  getAreasCriticasPadi,
  getAreasCriticasZona,
  getAreasCriticasEscuela,
  getAprobacionPreguntas,
  getDistribucionPuntajes,
} from "../../api/estadisticas";

const API = "http://localhost:3000";

const mockHeatmap = {
  periodo: 2025,
  tipo: "inicial",
  areas: [{ id: "A1", nombre: "Área 1", orden: 1 }],
  filas: [
    {
      id: "z-1",
      nombre: "Zona Norte",
      valores: { A1: { porcentaje: 0.8, evaluaciones: 5 } },
    },
  ],
  total_evaluaciones: 5,
};

beforeEach(() => {
  setUserInStorage({ rol: "equipo_padi" });
  vi.clearAllMocks();
});

// ─── getHeatmapZonas ──────────────────────────────────────────────────────────
describe("getHeatmapZonas", () => {
  it("llama a GET /estadisticas/padi/heatmap-zonas con periodo y tipo", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: mockHeatmap })
    );

    const result = await getHeatmapZonas({ periodo: 2025, tipo: "inicial" });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/estadisticas/padi/heatmap-zonas`);
    expect(url).toContain("periodo=2025");
    expect(url).toContain("tipo=inicial");
    expect(result.filas[0].nombre).toBe("Zona Norte");
    expect(result.total_evaluaciones).toBe(5);
  });

  it("lanza error con el message del servidor", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "No autorizado" }, false, 403)
    );
    await expect(getHeatmapZonas({ periodo: 2025, tipo: "inicial" })).rejects.toThrow(
      "No autorizado"
    );
  });

  it("prioriza error.description sobre message", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse(
        { success: false, message: "Error", error: { description: "Sin zona" } },
        false,
        403
      )
    );
    await expect(getHeatmapZonas({ periodo: 2025, tipo: "inicial" })).rejects.toThrow(
      "Sin zona"
    );
  });

  it("usa mensaje por defecto cuando no hay message ni description", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false }, false, 500)
    );
    await expect(getHeatmapZonas({ periodo: 2025, tipo: "inicial" })).rejects.toThrow(
      "Error al cargar estadísticas"
    );
  });

  it("pasa tipo=final correctamente en la URL", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: { ...mockHeatmap, tipo: "final" } })
    );

    await getHeatmapZonas({ periodo: 2024, tipo: "final" });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain("tipo=final");
    expect(url).toContain("periodo=2024");
  });
});

// ─── getHeatmapEscuelas ───────────────────────────────────────────────────────
describe("getHeatmapEscuelas", () => {
  it("llama a GET /estadisticas/zona/heatmap-escuelas con periodo y tipo", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: mockHeatmap })
    );

    await getHeatmapEscuelas({ periodo: 2025, tipo: "final" });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/estadisticas/zona/heatmap-escuelas`);
    expect(url).toContain("tipo=final");
  });

  it("lanza error si falla con description", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse(
        { success: false, error: { description: "Encargado sin zona" } },
        false,
        403
      )
    );
    await expect(
      getHeatmapEscuelas({ periodo: 2025, tipo: "inicial" })
    ).rejects.toThrow("Encargado sin zona");
  });

  it("usa mensaje por defecto cuando no hay message ni description", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false }, false, 500)
    );
    await expect(
      getHeatmapEscuelas({ periodo: 2025, tipo: "inicial" })
    ).rejects.toThrow("Error al cargar estadísticas");
  });
});

// ─── getHeatmapAulas ──────────────────────────────────────────────────────────
describe("getHeatmapAulas", () => {
  it("llama a GET /estadisticas/escuela/heatmap-aulas con periodo y tipo", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: mockHeatmap })
    );

    await getHeatmapAulas({ periodo: 2025, tipo: "inicial" });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/estadisticas/escuela/heatmap-aulas`);
    expect(url).toContain("periodo=2025");
    expect(url).toContain("tipo=inicial");
  });

  it("lanza error si falla con message", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse(
        { success: false, message: "Director sin escuela" },
        false,
        403
      )
    );
    await expect(
      getHeatmapAulas({ periodo: 2025, tipo: "inicial" })
    ).rejects.toThrow("Director sin escuela");
  });

  it("usa mensaje por defecto cuando no hay message ni description", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false }, false, 500)
    );
    await expect(
      getHeatmapAulas({ periodo: 2025, tipo: "inicial" })
    ).rejects.toThrow("Error al cargar estadísticas");
  });
});

const mockRiesgo = {
  periodo: 2025,
  umbral: 0.5,
  total: 1,
  estudiantes: [
    {
      estudiante_id: "est-1",
      nombre: "Juan",
      primer_apellido: "García",
      escuela_nombre: "Escuela Norte",
      zona_nombre: "Zona Norte",
      total_areas_en_riesgo: 2,
      areas_en_riesgo: [
        { area_id: "A1", area_nombre: "Área 1", porcentaje: 0.3, evaluaciones: 1 },
        { area_id: "A2", area_nombre: "Área 2", porcentaje: 0.4, evaluaciones: 1 },
      ],
    },
  ],
};

// ─── getEstudiantesEnRiesgoZona ───────────────────────────────────────────────
describe("getEstudiantesEnRiesgoZona", () => {
  it("llama a GET /estadisticas/zona/estudiantes-en-riesgo con periodo y umbral", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: mockRiesgo })
    );

    const result = await getEstudiantesEnRiesgoZona({ periodo: 2025, umbral: 0.5 });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/estadisticas/zona/estudiantes-en-riesgo`);
    expect(url).toContain("periodo=2025");
    expect(url).toContain("umbral=0.5");
    expect(result.estudiantes[0].nombre).toBe("Juan");
    expect(result.total).toBe(1);
  });

  it("lanza error si el servidor falla", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "Sin zona" }, false, 403)
    );
    await expect(
      getEstudiantesEnRiesgoZona({ periodo: 2025, umbral: 0.5 })
    ).rejects.toThrow("Sin zona");
  });

  it("usa mensaje por defecto cuando no hay message ni description", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false }, false, 500)
    );
    await expect(
      getEstudiantesEnRiesgoZona({ periodo: 2025, umbral: 0.5 })
    ).rejects.toThrow("Error al cargar estudiantes en riesgo");
  });

  it("prioriza error.description sobre message", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse(
        { success: false, message: "Error", error: { description: "Sin encargado" } },
        false,
        403
      )
    );
    await expect(
      getEstudiantesEnRiesgoZona({ periodo: 2025, umbral: 0.5 })
    ).rejects.toThrow("Sin encargado");
  });
});

// ─── getEstudiantesEnRiesgoEscuela ────────────────────────────────────────────
describe("getEstudiantesEnRiesgoEscuela", () => {
  it("llama a GET /estadisticas/escuela/estudiantes-en-riesgo con periodo y umbral", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: { ...mockRiesgo, umbral: 0.7 } })
    );

    await getEstudiantesEnRiesgoEscuela({ periodo: 2025, umbral: 0.7 });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/estadisticas/escuela/estudiantes-en-riesgo`);
    expect(url).toContain("umbral=0.7");
  });

  it("lanza error si falla", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "Sin escuela" }, false, 403)
    );
    await expect(
      getEstudiantesEnRiesgoEscuela({ periodo: 2025, umbral: 0.5 })
    ).rejects.toThrow("Sin escuela");
  });

  it("usa mensaje por defecto cuando no hay message ni description", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false }, false, 500)
    );
    await expect(
      getEstudiantesEnRiesgoEscuela({ periodo: 2025, umbral: 0.5 })
    ).rejects.toThrow("Error al cargar estudiantes en riesgo");
  });
});

const mockEvolucion = {
  periodo: 2025,
  areas: [
    {
      area_id: "A1",
      area_nombre: "Área 1",
      area_orden: 1,
      pct_inicial: 0.6,
      pct_final: 0.75,
      delta: 0.15,
      evaluaciones_inicial: 10,
      evaluaciones_final: 8,
    },
  ],
};

const mockAreasCriticas = {
  periodo: 2025,
  tipo: "inicial",
  areas: [
    { area_id: "A2", area_nombre: "Área 2", area_orden: 2, porcentaje_promedio: 0.3, evaluaciones: 5 },
    { area_id: "A1", area_nombre: "Área 1", area_orden: 1, porcentaje_promedio: 0.6, evaluaciones: 10 },
  ],
};

// ─── getEvolucionPadi ─────────────────────────────────────────────────────────
describe("getEvolucionPadi", () => {
  it("llama a GET /estadisticas/padi/evolucion con periodo", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: mockEvolucion })
    );

    const result = await getEvolucionPadi({ periodo: 2025 });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/estadisticas/padi/evolucion`);
    expect(url).toContain("periodo=2025");
    expect(result.areas[0].delta).toBe(0.15);
  });

  it("lanza error con message del servidor", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "Sin datos" }, false, 400)
    );
    await expect(getEvolucionPadi({ periodo: 2025 })).rejects.toThrow("Sin datos");
  });

  it("usa mensaje por defecto cuando no hay message ni description", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false }, false, 500)
    );
    await expect(getEvolucionPadi({ periodo: 2025 })).rejects.toThrow(
      "Error al cargar evolución"
    );
  });
});

// ─── getEvolucionZona ─────────────────────────────────────────────────────────
describe("getEvolucionZona", () => {
  it("llama a GET /estadisticas/zona/evolucion con periodo", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: mockEvolucion })
    );

    await getEvolucionZona({ periodo: 2025 });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/estadisticas/zona/evolucion`);
    expect(url).toContain("periodo=2025");
  });

  it("lanza error si falla", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "Sin zona" }, false, 403)
    );
    await expect(getEvolucionZona({ periodo: 2025 })).rejects.toThrow("Sin zona");
  });
});

// ─── getEvolucionEscuela ──────────────────────────────────────────────────────
describe("getEvolucionEscuela", () => {
  it("llama a GET /estadisticas/escuela/evolucion con periodo", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: mockEvolucion })
    );

    await getEvolucionEscuela({ periodo: 2025 });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/estadisticas/escuela/evolucion`);
  });

  it("prioriza error.description sobre message", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse(
        { success: false, message: "Error", error: { description: "Sin escuela" } },
        false,
        403
      )
    );
    await expect(getEvolucionEscuela({ periodo: 2025 })).rejects.toThrow("Sin escuela");
  });
});

// ─── getAreasCriticasPadi ─────────────────────────────────────────────────────
describe("getAreasCriticasPadi", () => {
  it("llama a GET /estadisticas/padi/areas-criticas con periodo y tipo", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: mockAreasCriticas })
    );

    const result = await getAreasCriticasPadi({ periodo: 2025, tipo: "inicial" });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/estadisticas/padi/areas-criticas`);
    expect(url).toContain("periodo=2025");
    expect(url).toContain("tipo=inicial");
    expect(result.areas[0].area_nombre).toBe("Área 2");
  });

  it("lanza error si falla", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "Sin datos" }, false, 400)
    );
    await expect(getAreasCriticasPadi({ periodo: 2025, tipo: "final" })).rejects.toThrow(
      "Sin datos"
    );
  });

  it("usa mensaje por defecto cuando no hay message ni description", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false }, false, 500)
    );
    await expect(
      getAreasCriticasPadi({ periodo: 2025, tipo: "inicial" })
    ).rejects.toThrow("Error al cargar áreas críticas");
  });
});

// ─── getAreasCriticasZona ─────────────────────────────────────────────────────
describe("getAreasCriticasZona", () => {
  it("llama a GET /estadisticas/zona/areas-criticas con periodo y tipo", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: mockAreasCriticas })
    );

    await getAreasCriticasZona({ periodo: 2025, tipo: "final" });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/estadisticas/zona/areas-criticas`);
    expect(url).toContain("tipo=final");
  });

  it("lanza error con description", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse(
        { success: false, error: { description: "Encargado sin zona" } },
        false,
        403
      )
    );
    await expect(
      getAreasCriticasZona({ periodo: 2025, tipo: "inicial" })
    ).rejects.toThrow("Encargado sin zona");
  });
});

// ─── getAreasCriticasEscuela ──────────────────────────────────────────────────
describe("getAreasCriticasEscuela", () => {
  it("llama a GET /estadisticas/escuela/areas-criticas con periodo y tipo", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: mockAreasCriticas })
    );

    await getAreasCriticasEscuela({ periodo: 2025, tipo: "inicial" });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/estadisticas/escuela/areas-criticas`);
  });

  it("lanza error si falla", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "Sin escuela" }, false, 403)
    );
    await expect(
      getAreasCriticasEscuela({ periodo: 2025, tipo: "final" })
    ).rejects.toThrow("Sin escuela");
  });
});

const mockItemsError = {
  periodo: 2025,
  aula_id: "aula-1",
  area_id: null,
  items: [
    { pregunta_id: "P1", consigna: "¿Qué color es el cielo?", area_id: "A1", total: 2, correctos: 0, tasa_aprobacion: 0.0 },
    { pregunta_id: "P2", consigna: "¿Cuánto es 2+2?", area_id: "A1", total: 1, correctos: 1, tasa_aprobacion: 1.0 },
  ],
};

const mockDistribucion = {
  periodo: 2025,
  aula_id: "aula-1",
  total_estudiantes: 3,
  rangos: [
    { rango: "0–20%", min: 0, max: 0.2, cantidad: 1 },
    { rango: "21–40%", min: 0.21, max: 0.4, cantidad: 1 },
    { rango: "41–60%", min: 0.41, max: 0.6, cantidad: 0 },
    { rango: "61–80%", min: 0.61, max: 0.8, cantidad: 0 },
    { rango: "81–100%", min: 0.81, max: 1, cantidad: 1 },
  ],
};

// ─── getAprobacionPreguntas ───────────────────────────────────────────────────
describe("getAprobacionPreguntas", () => {
  it("llama a GET /estadisticas/docente/aprobacion-preguntas con periodo y aula_id", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: mockItemsError })
    );

    const result = await getAprobacionPreguntas({ periodo: 2025, aula_id: "aula-1" });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/estadisticas/docente/aprobacion-preguntas`);
    expect(url).toContain("periodo=2025");
    expect(url).toContain("aula_id=aula-1");
    expect(result.items[0].tasa_aprobacion).toBe(0.0);
  });

  it("incluye area_id opcional en la URL si se pasa", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: mockItemsError })
    );

    await getAprobacionPreguntas({ periodo: 2025, aula_id: "aula-1", area_id: "A1" });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain("area_id=A1");
  });

  it("lanza error con message del servidor", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "Sin acceso" }, false, 403)
    );
    await expect(getAprobacionPreguntas({ periodo: 2025, aula_id: "aula-1" })).rejects.toThrow("Sin acceso");
  });

  it("usa mensaje por defecto cuando no hay message ni description", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false }, false, 500)
    );
    await expect(
      getAprobacionPreguntas({ periodo: 2025, aula_id: "aula-1" })
    ).rejects.toThrow("Error al cargar aprobación por pregunta");
  });
});

// ─── getDistribucionPuntajes ──────────────────────────────────────────────────
describe("getDistribucionPuntajes", () => {
  it("llama a GET /estadisticas/docente/distribucion-puntajes con periodo y aula_id", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: mockDistribucion })
    );

    const result = await getDistribucionPuntajes({ periodo: 2025, aula_id: "aula-1" });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/estadisticas/docente/distribucion-puntajes`);
    expect(url).toContain("aula_id=aula-1");
    expect(result.total_estudiantes).toBe(3);
    expect(result.rangos).toHaveLength(5);
  });

  it("lanza error si falla", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "Sin aula" }, false, 403)
    );
    await expect(
      getDistribucionPuntajes({ periodo: 2025, aula_id: "aula-1" })
    ).rejects.toThrow("Sin aula");
  });

  it("usa mensaje por defecto cuando no hay message ni description", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false }, false, 500)
    );
    await expect(
      getDistribucionPuntajes({ periodo: 2025, aula_id: "aula-1" })
    ).rejects.toThrow("Error al cargar distribución de puntajes");
  });
});
