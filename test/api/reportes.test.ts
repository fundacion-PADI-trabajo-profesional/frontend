import { describe, it, expect, vi, beforeEach } from "vitest";
import { setUserInStorage, mockFetchResponse } from "../setup";

vi.mock("../../src/api/auth", () => ({
  getAuthHeaders: () => ({ Authorization: "Bearer fake" }),
}));

import { getReporteEscuela } from "../../src/api/reportes";

const API = "http://localhost:3000";
const ESC = "9a1de644-815e-46d1-bb8f-aa1837f8a88b";

const mockData = {
  escuela: { id: ESC, nombre: "Jardín Municipal N° 1" },
  periodo: 2025,
  generado_en: "2026-09-01T12:00:00.000Z",
  areas: [{ id: "sm", nombre: "Sensoriomotora", orden: 1 }],
  salas: [],
  resumen: { inicial: null, cierre: null, comparativo: null },
};

beforeEach(() => {
  setUserInStorage({ rol: "equipo_padi" });
  vi.clearAllMocks();
});

describe("getReporteEscuela", () => {
  it("llama a GET /reportes/escuela con escuela_id y periodo y devuelve data", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ success: true, data: mockData }));

    const result = await getReporteEscuela({ escuela_id: ESC, periodo: 2025 });

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API}/reportes/escuela?escuela_id=${ESC}&periodo=2025`);
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer fake");
    expect(result.escuela.nombre).toBe("Jardín Municipal N° 1");
    expect(result.salas).toEqual([]);
  });

  it("lanza error con la descripción o el message del servidor", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ success: false, message: "Escuela no encontrada" }, false, 404));
    await expect(getReporteEscuela({ escuela_id: ESC, periodo: 2025 })).rejects.toThrow("Escuela no encontrada");

    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ success: false, message: "x", error: { code: "E", description: "Detalle" } }, false, 500));
    await expect(getReporteEscuela({ escuela_id: ESC, periodo: 2025 })).rejects.toThrow("Detalle");
  });

  it("usa el mensaje por defecto si el servidor no manda ninguno", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ success: false }, false, 500));
    await expect(getReporteEscuela({ escuela_id: ESC, periodo: 2025 })).rejects.toThrow("Error al cargar el reporte de la escuela");
  });
});
