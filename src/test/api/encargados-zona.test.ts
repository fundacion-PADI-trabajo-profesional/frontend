import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockFetchResponse } from "../setup";

vi.mock("../../api/auth", () => ({
  getAuthHeaders: () => ({ Authorization: "Bearer fake" }),
}));

import {
  getEncargados,
  createEncargado,
  updateEncargado,
  getCurrentEncargado,
  deleteEncargado,
} from "../../api/encargados-zona";

const API = "http://localhost:3000";

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── getEncargados ────────────────────────────────────────────────────────────
describe("getEncargados", () => {
  it("llama a GET /encargados y devuelve lista", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({
        success: true,
        data: [{ id: "enc-1", nombre: "Maria", apellido: "Lopez", email: "m@test.com" }],
      })
    );

    const result = await getEncargados();

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/encargados`);
    expect(result[0].id).toBe("enc-1");
  });

  it("lanza error cuando la respuesta indica fallo", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "No autorizado" }, false, 403)
    );

    await expect(getEncargados()).rejects.toThrow("No autorizado");
  });

  it("usa mensaje por defecto cuando no hay message", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false }, false, 500)
    );
    await expect(getEncargados()).rejects.toThrow("Error al obtener encargados");
  });
});

// ─── createEncargado ──────────────────────────────────────────────────────────
describe("createEncargado", () => {
  it("llama a POST /encargados con los datos del encargado", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({
        success: true,
        data: { id: "enc-2", nombre: "Carlos", apellido: "Gomez", email: "c@test.com" },
      })
    );

    const dto = {
      nombre: "Carlos",
      apellido: "Gomez",
      email: "c@test.com",
      zona: "z-1",
    };

    const result = await createEncargado(dto);

    expect(fetch).toHaveBeenCalledWith(
      `${API}/encargados`,
      expect.objectContaining({ method: "POST" })
    );

    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    expect(body.nombre).toBe("Carlos");
    expect(body.zona).toBe("z-1");
    expect(result.id).toBe("enc-2");
  });

  it("lanza error si la creación falla", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "Email ya registrado" }, false, 409)
    );

    await expect(
      createEncargado({ nombre: "x", apellido: "x", email: "x@x.com", zona: "z-1" })
    ).rejects.toThrow("Email ya registrado");
  });

  it("usa mensaje por defecto cuando no hay message", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ success: false }, false, 500));
    await expect(
      createEncargado({ nombre: "x", apellido: "x", email: "x@x.com", zona: "z-1" })
    ).rejects.toThrow("Error al crear encargado");
  });
});

// ─── updateEncargado ──────────────────────────────────────────────────────────
describe("updateEncargado", () => {
  it("llama a PUT /encargados/:id con los datos actualizados", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: { id: "enc-1", nombre: "Nuevo" } })
    );

    await updateEncargado("enc-1", {
      nombre: "Nuevo",
      apellido: "Lopez",
      email: "nuevo@test.com",
      zona_id: "z-2",
    });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/encargados/enc-1`);

    const options = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(options.method).toBe("PUT");

    const body = JSON.parse(options.body as string);
    expect(body.nombre).toBe("Nuevo");
    expect(body.zona_id).toBe("z-2");
  });

  it("lanza error si la actualización falla", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse(
        { success: false, message: "No encontrado" },
        false,
        404
      )
    );

    await expect(
      updateEncargado("enc-x", { nombre: "x", apellido: "x", email: "x@x.com", zona_id: "z-1" })
    ).rejects.toThrow("No encontrado");
  });
});

// ─── getCurrentEncargado ──────────────────────────────────────────────────────
describe("getCurrentEncargado", () => {
  it("llama a GET /encargados/me?usuario_id=:id", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: { id: "enc-1", nombre: "Maria" } })
    );

    const result = await getCurrentEncargado("u-1");

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/encargados/me`);
    expect(url).toContain("usuario_id=u-1");
    expect(result.id).toBe("enc-1");
  });

  it("lanza error si no se encuentra el encargado", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "Encargado no encontrado" }, false, 404)
    );

    await expect(getCurrentEncargado("u-x")).rejects.toThrow(
      "Encargado no encontrado"
    );
  });
});

// ─── deleteEncargado ──────────────────────────────────────────────────────────
describe("deleteEncargado", () => {
  it("llama a DELETE /encargados/:id", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: {} })
    );

    await deleteEncargado("enc-1");

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/encargados/enc-1`);

    const options = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(options.method).toBe("DELETE");
  });

  it("lanza error si la eliminación falla", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse(
        { success: false, message: "No se puede eliminar" },
        false,
        400
      )
    );

    await expect(deleteEncargado("enc-1")).rejects.toThrow("No se puede eliminar");
  });

  it("usa mensaje por defecto cuando no hay message", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ success: false }, false, 500));
    await expect(deleteEncargado("enc-1")).rejects.toThrow("Error al eliminar encargado");
  });
});
