import { describe, it, expect, vi, beforeEach } from "vitest";
import { setUserInStorage, mockFetchResponse } from "../setup";

vi.mock("../../src/api/auth", () => ({
  getAuthHeaders: () => ({ Authorization: "Bearer fake" }),
}));

import { getExportEvaluaciones } from "../../src/api/estadisticas";

const API = "http://localhost:3000";

const mockData = {
  periodo: 2025,
  areas: [{ id: "MOT", nombre: "Motricidad", orden: 1 }],
  reglas: [{ sala: "Sala 5", area_id: "MOT", aprueba_con: 7, puntaje_total: 10 }],
  filas: [],
};

beforeEach(() => {
  setUserInStorage({ rol: "equipo_padi" });
  vi.clearAllMocks();
});

describe("getExportEvaluaciones", () => {
  it("llama a GET /estadisticas/padi/export-evaluaciones con periodo", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: mockData })
    );

    const result = await getExportEvaluaciones({ periodo: 2025 });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/estadisticas/padi/export-evaluaciones`);
    expect(url).toContain("periodo=2025");
    expect(result.periodo).toBe(2025);
    expect(result.reglas[0].aprueba_con).toBe(7);
  });

  it("lanza error con el message del servidor", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "No autorizado" }, false, 403)
    );

    await expect(getExportEvaluaciones({ periodo: 2025 })).rejects.toThrow("No autorizado");
  });
});
