import { describe, it, expect, vi, beforeEach } from "vitest";
import { setUserInStorage, mockFetchResponse } from "../setup";

vi.mock("../../src/api/auth", () => ({
  getAuthHeaders: () => ({ Authorization: "Bearer fake" }),
}));

import {
  getZonas,
  createZona,
  updateZona,
  getZonaById,
  getEscuelasSinZona,
  asignarEscuela,
  desvincularEscuela,
  getEncargadosSinZona,
  asignarEncargadoAZona,
  desvincularEncargado,
} from "../../src/api/zonas";

const USER = { id: "u-1", rol: "equipo_padi" };
const API = "http://localhost:3000";

beforeEach(() => {
  setUserInStorage(USER);
  vi.clearAllMocks();
});

// ─── getZonas ────────────────────────────────────────────────────────────────
describe("getZonas", () => {
  it("llama a GET /zonas con rol y devuelve lista", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: [{ id: "z-1", nombre: "Norte" }] })
    );

    const result = await getZonas();

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/zonas`);
    expect(url).toContain(`rol=${USER.rol}`);
    expect(result[0].id).toBe("z-1");
  });

  it("lanza error si el servidor responde con error", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "No autorizado" }, false, 403)
    );

    await expect(getZonas()).rejects.toThrow("No autorizado");
  });

  it("usa 'Error al cargar zonas' cuando no hay message ni description", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ success: false }, false, 500));
    await expect(getZonas()).rejects.toThrow("Error al cargar zonas");
  });
});

// ─── createZona ──────────────────────────────────────────────────────────────
describe("createZona", () => {
  it("llama a POST /zonas con nombre, usuario_id y rol", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: { id: "z-2", nombre: "Sur" } })
    );

    await createZona("Sur");

    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    expect(body.nombre).toBe("Sur");
    expect(body.usuario_id).toBe(USER.id);
    expect(body.rol).toBe(USER.rol);
  });

  it("lanza error si la creación falla", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse(
        { success: false, error: { description: "Nombre duplicado" } },
        false, 409
      )
    );

    await expect(createZona("Sur")).rejects.toThrow("Nombre duplicado");
  });

  it("usa message como fallback cuando no hay description", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "Falló" }, false, 500)
    );
    await expect(createZona("X")).rejects.toThrow("Falló");
  });

  it("usa mensaje por defecto cuando no hay message ni description", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ success: false }, false, 500));
    await expect(createZona("X")).rejects.toThrow("Error al crear zona");
  });
});

// ─── updateZona ──────────────────────────────────────────────────────────────
describe("updateZona", () => {
  it("llama a PUT /zonas/:id con nombre, usuario_id y rol", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: { id: "z-1", nombre: "Norte 2" } })
    );

    await updateZona("z-1", "Norte 2");

    const options = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(options.method).toBe("PUT");
    const body = JSON.parse(options.body as string);
    expect(body.nombre).toBe("Norte 2");
    expect(body.usuario_id).toBe(USER.id);
  });
});

// ─── getZonaById ─────────────────────────────────────────────────────────────
describe("getZonaById", () => {
  it("llama a GET /zonas/:id con rol", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: { id: "z-1", nombre: "Norte" } })
    );

    const result = await getZonaById("z-1");

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/zonas/z-1`);
    expect(url).toContain(`rol=${USER.rol}`);
    expect(result.id).toBe("z-1");
  });
});

// ─── getEscuelasSinZona ──────────────────────────────────────────────────────
describe("getEscuelasSinZona", () => {
  it("llama a GET /escuelas-sin-zona con rol", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: [{ id: "e-1" }] })
    );

    const result = await getEscuelasSinZona();

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/escuelas-sin-zona`);
    expect(url).toContain(`rol=${USER.rol}`);
    expect(result).toHaveLength(1);
  });

  it("usa mensaje por defecto cuando no hay message ni description", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ success: false }, false, 500));
    await expect(getEscuelasSinZona()).rejects.toThrow("Error al cargar escuelas disponibles");
  });
});

// ─── asignarEscuela ──────────────────────────────────────────────────────────
describe("asignarEscuela", () => {
  it("llama a POST /zonas/:id/asignar-escuela con escuelaId, usuario_id y rol", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: {} })
    );

    await asignarEscuela("z-1", "e-1");

    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    expect(body.escuelaId).toBe("e-1");
    expect(body.usuario_id).toBe(USER.id);
    expect(body.rol).toBe(USER.rol);

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/zonas/z-1/asignar-escuela`);
  });
});

// ─── desvincularEscuela ──────────────────────────────────────────────────────
describe("desvincularEscuela", () => {
  it("llama a POST /escuelas/:id/quitar-escuela con rol", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: {} })
    );

    await desvincularEscuela("e-1");

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/escuelas/e-1/quitar-escuela`);
    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    expect(body.rol).toBe(USER.rol);
  });
});

// ─── getEncargadosSinZona ────────────────────────────────────────────────────
describe("getEncargadosSinZona", () => {
  it("llama a GET /encargados-sin-zona con rol", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: [] })
    );

    await getEncargadosSinZona();

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/encargados-sin-zona`);
    expect(url).toContain(`rol=${USER.rol}`);
  });
});

// ─── asignarEncargadoAZona ───────────────────────────────────────────────────
describe("asignarEncargadoAZona", () => {
  it("llama a POST /zonas/:id/asignar-encargado con encargadoId, usuario_id y rol", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: {} })
    );

    await asignarEncargadoAZona("z-1", "enc-1");

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/zonas/z-1/asignar-encargado`);
    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    expect(body.encargadoId).toBe("enc-1");
    expect(body.usuario_id).toBe(USER.id);
    expect(body.rol).toBe(USER.rol);
  });
});

// ─── getEncargadosZonaOptions ────────────────────────────────────────────────
describe("getEncargadosZonaOptions", () => {
  it("llama a GET /zonas/encargados con rol", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: [{ id: "enc-1" }] })
    );

    const { getEncargadosZonaOptions } = await import("../../src/api/zonas");
    const result = await getEncargadosZonaOptions();

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/zonas/encargados`);
    expect(result[0].id).toBe("enc-1");
  });
});

// ─── desvincularEncargado ────────────────────────────────────────────────────
describe("desvincularEncargado", () => {
  it("llama a POST /encargados/:id/quitar-zona con rol", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: {} })
    );

    await desvincularEncargado("enc-1");

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/encargados/enc-1/quitar-zona`);
    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    expect(body.rol).toBe(USER.rol);
  });
});
