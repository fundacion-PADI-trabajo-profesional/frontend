import { describe, it, expect, vi, beforeEach } from "vitest";
import { setUserInStorage } from "../setup";

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../../api/auth", () => ({
  api: apiMock,
  getAuthHeaders: () => ({ Authorization: "Bearer fake" }),
}));

import {
  getEscuelas,
  createEscuela,
  updateEscuela,
  deleteEscuela,
  asignarDirectivo,
  desasignarDirectivo,
  getDirectivosDisponibles,
} from "../../api/escuelas";

const USER = { id: "u-1", rol: "equipo_padi" };

beforeEach(() => {
  setUserInStorage(USER);
  vi.clearAllMocks();
});

// ─── getEscuelas ─────────────────────────────────────────────────────────────
describe("getEscuelas", () => {
  it("llama a GET /escuelas con usuario_id y rol", async () => {
    apiMock.get.mockResolvedValue({ data: { data: [{ id: "e-1", nombre: "Escuela A" }] } });

    const result = await getEscuelas();

    expect(apiMock.get).toHaveBeenCalledWith(
      `/escuelas?usuario_id=${USER.id}&rol=${USER.rol}`
    );
    expect(result[0].id).toBe("e-1");
  });

  it("devuelve array vacío cuando data no existe", async () => {
    apiMock.get.mockResolvedValue({ data: {} });
    expect(await getEscuelas()).toEqual([]);
  });
});

// ─── createEscuela ───────────────────────────────────────────────────────────
describe("createEscuela", () => {
  it("llama a POST /escuelas con usuario_id, rol y datos de la escuela", async () => {
    apiMock.post.mockResolvedValue({ data: { data: { id: "e-1" } } });

    const dto = { nombre: "Escuela B", zona_id: "z-1" };
    await createEscuela(dto);

    expect(apiMock.post).toHaveBeenCalledWith(
      "/escuelas",
      expect.objectContaining({ nombre: "Escuela B", zona_id: "z-1", usuario_id: USER.id, rol: USER.rol })
    );
  });
});

// ─── updateEscuela ───────────────────────────────────────────────────────────
describe("updateEscuela", () => {
  it("llama a PUT /escuelas/:id con usuario_id y rol", async () => {
    apiMock.put.mockResolvedValue({ data: { data: { id: "e-1" } } });

    await updateEscuela("e-1", { nombre: "Nuevo nombre", zona_id: "z-1" });

    expect(apiMock.put).toHaveBeenCalledWith(
      "/escuelas/e-1",
      expect.objectContaining({ nombre: "Nuevo nombre", usuario_id: USER.id, rol: USER.rol })
    );
  });
});

// ─── deleteEscuela ───────────────────────────────────────────────────────────
describe("deleteEscuela", () => {
  it("llama a DELETE /escuelas/:id con rol y usuario_id en query", async () => {
    apiMock.delete.mockResolvedValue({ data: {} });

    await deleteEscuela("e-1");

    const url = apiMock.delete.mock.calls[0][0] as string;
    expect(url).toContain("/escuelas/e-1");
    expect(url).toContain(`rol=${USER.rol}`);
    expect(url).toContain(`usuario_id=${USER.id}`);
  });
});

// ─── asignarDirectivo ────────────────────────────────────────────────────────
describe("asignarDirectivo", () => {
  it("llama a POST /escuelas/asignar-directivo con escuelaId y usuarioId", async () => {
    apiMock.post.mockResolvedValue({ data: {} });

    await asignarDirectivo("e-1", "dir-1");

    expect(apiMock.post).toHaveBeenCalledWith(
      "/escuelas/asignar-directivo",
      { escuelaId: "e-1", usuarioId: "dir-1" }
    );
  });
});

// ─── desasignarDirectivo ─────────────────────────────────────────────────────
describe("desasignarDirectivo", () => {
  it("llama a POST /escuelas/desasignar-directivo con usuarioId", async () => {
    apiMock.post.mockResolvedValue({ data: {} });

    await desasignarDirectivo("dir-1");

    expect(apiMock.post).toHaveBeenCalledWith(
      "/escuelas/desasignar-directivo",
      { usuarioId: "dir-1" }
    );
  });
});

// ─── getDirectivosDisponibles ────────────────────────────────────────────────
describe("getDirectivosDisponibles", () => {
  it("llama a GET /directivos/disponibles", async () => {
    apiMock.get.mockResolvedValue({ data: { data: [{ id: "dir-1" }] } });

    const result = await getDirectivosDisponibles();

    expect(apiMock.get).toHaveBeenCalledWith("/directivos/disponibles");
    expect(result[0].id).toBe("dir-1");
  });
});
