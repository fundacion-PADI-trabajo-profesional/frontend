import { describe, it, expect, vi, beforeEach } from "vitest";
import { setUserInStorage, mockFetchResponse } from "../setup";

vi.mock("../../api/auth", () => ({
  getAuthHeaders: () => ({ Authorization: "Bearer fake" }),
}));

import {
  getDirectivos,
  getDirectivosDisponibles,
  asignarEscuelaADirectivo,
} from "../../api/directivos";

const USER = { id: "u-1", rol: "equipo_padi" };
const API = "http://localhost:3000";

beforeEach(() => {
  setUserInStorage(USER);
  vi.clearAllMocks();
});

// ─── getDirectivos ────────────────────────────────────────────────────────────
describe("getDirectivos", () => {
  it("llama a GET /directivos y devuelve lista", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: [{ id: "d-1", nombre: "Ana", apellido: "Lopez" }] })
    );

    const result = await getDirectivos();

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/directivos`);
    expect(result[0].id).toBe("d-1");
  });

  it("devuelve array vacío cuando data es null", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: null })
    );

    const result = await getDirectivos();
    expect(result).toEqual([]);
  });

  it("lanza error con body.error.description cuando está presente", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse(
        { success: false, error: { description: "Sin permisos" } },
        false, 403
      )
    );

    await expect(getDirectivos()).rejects.toThrow("Sin permisos");
  });

  it("lanza error con body.message como fallback", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "Error del servidor" }, false, 500)
    );

    await expect(getDirectivos()).rejects.toThrow("Error del servidor");
  });

  it("lanza el mensaje por defecto cuando no hay message ni description", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false }, false, 500)
    );

    await expect(getDirectivos()).rejects.toThrow("Error al cargar directivos");
  });
});

// ─── getDirectivosDisponibles ────────────────────────────────────────────────
describe("getDirectivosDisponibles", () => {
  it("llama a GET /directivos/disponibles y devuelve lista", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: [{ id: "d-2" }] })
    );

    const result = await getDirectivosDisponibles();

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/directivos/disponibles`);
    expect(result[0].id).toBe("d-2");
  });

  it("lanza el mensaje por defecto cuando no hay message ni description", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false }, false, 500)
    );

    await expect(getDirectivosDisponibles()).rejects.toThrow(
      "Error al cargar directivos disponibles"
    );
  });

  it("lanza error con body.message como fallback", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "No encontrado" }, false, 404)
    );

    await expect(getDirectivosDisponibles()).rejects.toThrow("No encontrado");
  });
});

// ─── asignarEscuelaADirectivo ────────────────────────────────────────────────
describe("asignarEscuelaADirectivo", () => {
  it("llama a POST /directivos/:id/asignar-escuela con escuela_id, usuario_id y rol", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: {} })
    );

    await asignarEscuelaADirectivo("dir-1", "esc-1");

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/directivos/dir-1/asignar-escuela`);

    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    expect(body.escuela_id).toBe("esc-1");
    expect(body.usuario_id).toBe(USER.id);
    expect(body.rol).toBe(USER.rol);
  });

  it("lanza error con description cuando está presente", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse(
        { success: false, error: { description: "Escuela ya asignada" } },
        false, 409
      )
    );

    await expect(asignarEscuelaADirectivo("dir-1", "esc-1")).rejects.toThrow(
      "Escuela ya asignada"
    );
  });

  it("lanza el mensaje por defecto cuando no hay message ni description", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false }, false, 500)
    );

    await expect(asignarEscuelaADirectivo("dir-1", "esc-1")).rejects.toThrow(
      "Error al asignar escuela"
    );
  });
});
