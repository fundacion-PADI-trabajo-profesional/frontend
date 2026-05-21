import { describe, it, expect, vi, beforeEach } from "vitest";
import { setUserInStorage, mockFetchResponse } from "../setup";

vi.mock("../../src/api/auth", () => ({
  getAuthHeaders: () => ({ Authorization: "Bearer fake" }),
}));

import {
  getDocentes,
  asignarDocenteAEscuela,
  desasignarDocenteDeEscuela,
} from "../../src/api/docentes";

const USER = { id: "u-1", rol: "equipo_padi" };
const API = "http://localhost:3000";

beforeEach(() => {
  setUserInStorage(USER);
  vi.clearAllMocks();
});

// ─── getDocentes ─────────────────────────────────────────────────────────────
describe("getDocentes", () => {
  it("llama a GET /docentes con usuario_id y rol", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: [{ id: "d-1", nombre: "Juan" }] })
    );

    const result = await getDocentes();

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/docentes`);
    expect(url).toContain(`usuario_id=${USER.id}`);
    expect(url).toContain(`rol=${USER.rol}`);
    expect(result[0].id).toBe("d-1");
  });

  it("incluye escuela_id en query cuando el usuario tiene escuela asignada", async () => {
    setUserInStorage({ id: "dir-1", rol: "director", escuela_id: "esc-1" });
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: [] })
    );

    await getDocentes();

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain("escuela_id=esc-1");
  });

  it("lanza error cuando no hay sesión activa (id vacío)", async () => {
    localStorage.removeItem("padiUser");

    await expect(getDocentes()).rejects.toThrow("Sesion invalida");
  });

  it("lanza error cuando el servidor responde con fallo", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "No autorizado" }, false, 403)
    );

    await expect(getDocentes()).rejects.toThrow("No autorizado");
  });
});

// ─── asignarDocenteAEscuela ──────────────────────────────────────────────────
describe("asignarDocenteAEscuela", () => {
  it("llama a POST /docentes/:id/asignar-escuela con escuela_id, usuario_id y rol", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: {} })
    );

    await asignarDocenteAEscuela("d-1", "esc-1");

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/docentes/d-1/asignar-escuela`);

    const options = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body as string);
    expect(body.escuela_id).toBe("esc-1");
    expect(body.usuario_id).toBe(USER.id);
    expect(body.rol).toBe(USER.rol);
  });

  it("lanza error cuando no hay sesión activa", async () => {
    localStorage.removeItem("padiUser");

    await expect(asignarDocenteAEscuela("d-1", "esc-1")).rejects.toThrow(
      "No hay sesion activa"
    );
  });

  it("lanza error si el servidor responde con fallo", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse(
        { success: false, message: "Escuela no encontrada" },
        false,
        404
      )
    );

    await expect(asignarDocenteAEscuela("d-1", "esc-x")).rejects.toThrow(
      "Escuela no encontrada"
    );
  });
});

// ─── desasignarDocenteDeEscuela ──────────────────────────────────────────────
describe("desasignarDocenteDeEscuela", () => {
  it("llama a POST /docentes/:id/desasignar-escuela con escuela_id, usuario_id y rol", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: {} })
    );

    await desasignarDocenteDeEscuela("d-1", "esc-1");

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/docentes/d-1/desasignar-escuela`);

    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    expect(body.escuela_id).toBe("esc-1");
    expect(body.usuario_id).toBe(USER.id);
    expect(body.rol).toBe(USER.rol);
  });

  it("lanza error si el servidor falla", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse(
        { success: false, message: "Error al desasignar docente del colegio" },
        false,
        500
      )
    );

    await expect(desasignarDocenteDeEscuela("d-1", "esc-1")).rejects.toThrow(
      "Error al desasignar docente del colegio"
    );
  });
});
