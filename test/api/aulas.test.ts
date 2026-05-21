import { describe, it, expect, vi, beforeEach } from "vitest";
import { setUserInStorage } from "../setup";

// vi.mock se hoistea antes de los `const`, así que usamos vi.hoisted()
const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../../src/api/auth", () => ({
  api: apiMock,
  getAuthHeaders: () => ({ Authorization: "Bearer fake" }),
}));

import {
  getAulas,
  createAula,
  updateAula,
  deleteAula,
  getAulaDocentes,
  asignarDocenteAula,
  desasignarDocenteAula,
  getDocenteAulasConEstudiantes,
  getAulaEstudiantes,
  asignarEstudianteAula,
  desasignarEstudianteAula,
  getAulasPorEscuela,
} from "../../src/api/aulas";

const USER = { id: "u-1", rol: "equipo_padi" };

beforeEach(() => {
  setUserInStorage(USER);
  vi.clearAllMocks();
});

// ─── getAulas ────────────────────────────────────────────────────────────────
describe("getAulas", () => {
  it("llama a GET /aulas con usuario_id y rol", async () => {
    apiMock.get.mockResolvedValue({ data: { data: [{ id: "a-1" }] } });

    const result = await getAulas();

    expect(apiMock.get).toHaveBeenCalledWith(
      `/aulas?usuario_id=${USER.id}&rol=${USER.rol}`
    );
    expect(result).toEqual([{ id: "a-1" }]);
  });

  it("devuelve array vacío cuando data es undefined", async () => {
    apiMock.get.mockResolvedValue({ data: {} });
    const result = await getAulas();
    expect(result).toEqual([]);
  });
});

// ─── createAula ──────────────────────────────────────────────────────────────
describe("createAula", () => {
  it("llama a POST /aulas con usuario_id y rol en el body", async () => {
    apiMock.post.mockResolvedValue({ data: { data: { id: "a-1" } } });

    const dto = { sala_id: 1, comision: "A", turno: "Mañana" };
    await createAula(dto);

    expect(apiMock.post).toHaveBeenCalledWith(
      "/aulas",
      expect.objectContaining({ ...dto, usuario_id: USER.id, rol: USER.rol })
    );
  });
});

// ─── updateAula ──────────────────────────────────────────────────────────────
describe("updateAula", () => {
  it("llama a PUT /aulas/:id con usuario_id y rol", async () => {
    apiMock.put.mockResolvedValue({ data: { data: { id: "a-1" } } });

    await updateAula("a-1", { comision: "B" });

    expect(apiMock.put).toHaveBeenCalledWith(
      "/aulas/a-1",
      expect.objectContaining({ comision: "B", usuario_id: USER.id, rol: USER.rol })
    );
  });
});

// ─── deleteAula ──────────────────────────────────────────────────────────────
describe("deleteAula", () => {
  it("llama a DELETE /aulas/:id con usuario_id y rol en query", async () => {
    apiMock.delete.mockResolvedValue({ data: {} });

    await deleteAula("a-1");

    expect(apiMock.delete).toHaveBeenCalledWith(
      `/aulas/a-1?usuario_id=${USER.id}&rol=${USER.rol}`
    );
  });
});

// ─── asignarDocenteAula ──────────────────────────────────────────────────────
describe("asignarDocenteAula", () => {
  it("llama a POST /aulas/:id/asignar-docente con profesor_id", async () => {
    apiMock.post.mockResolvedValue({ data: {} });

    await asignarDocenteAula("a-1", "prof-1");

    expect(apiMock.post).toHaveBeenCalledWith(
      "/aulas/a-1/asignar-docente",
      expect.objectContaining({ profesor_id: "prof-1", usuario_id: USER.id, rol: USER.rol })
    );
  });
});

// ─── desasignarDocenteAula ───────────────────────────────────────────────────
describe("desasignarDocenteAula", () => {
  it("llama a POST /aulas/:id/desasignar-docente con profesor_id", async () => {
    apiMock.post.mockResolvedValue({ data: {} });

    await desasignarDocenteAula("a-1", "prof-1");

    expect(apiMock.post).toHaveBeenCalledWith(
      "/aulas/a-1/desasignar-docente",
      expect.objectContaining({ profesor_id: "prof-1" })
    );
  });
});

// ─── asignarEstudianteAula ───────────────────────────────────────────────────
describe("asignarEstudianteAula", () => {
  it("llama a POST /aulas/:id/asignar-estudiante con estudiante_id, usuario_id y rol", async () => {
    apiMock.post.mockResolvedValue({ data: {} });

    await asignarEstudianteAula("a-1", "est-1");

    expect(apiMock.post).toHaveBeenCalledWith(
      "/aulas/a-1/asignar-estudiante",
      expect.objectContaining({ estudiante_id: "est-1", usuario_id: USER.id, rol: USER.rol })
    );
  });
});

// ─── desasignarEstudianteAula ────────────────────────────────────────────────
describe("desasignarEstudianteAula", () => {
  it("llama a POST /aulas/:id/desasignar-estudiante con estudiante_id", async () => {
    apiMock.post.mockResolvedValue({ data: {} });

    await desasignarEstudianteAula("a-1", "est-1");

    expect(apiMock.post).toHaveBeenCalledWith(
      "/aulas/a-1/desasignar-estudiante",
      expect.objectContaining({ estudiante_id: "est-1" })
    );
  });
});

// ─── getAulaDocentes ────────────────────────────────────────────────────────
describe("getAulaDocentes", () => {
  it("llama a GET /aulas/:id/docentes con usuario_id y rol", async () => {
    apiMock.get.mockResolvedValue({ data: { data: [{ profesor_id: "p-1" }] } });

    const result = await getAulaDocentes("a-1");

    const url = apiMock.get.mock.calls[0][0] as string;
    expect(url).toContain("/aulas/a-1/docentes");
    expect(url).toContain(`usuario_id=${USER.id}`);
    expect(url).toContain(`rol=${USER.rol}`);
    expect(result[0].profesor_id).toBe("p-1");
  });

  it("devuelve array vacío cuando data es undefined", async () => {
    apiMock.get.mockResolvedValue({ data: {} });
    expect(await getAulaDocentes("a-1")).toEqual([]);
  });
});

// ─── getDocenteAulasConEstudiantes ───────────────────────────────────────────
describe("getDocenteAulasConEstudiantes", () => {
  it("llama a GET /docentes/aulas con usuario_id y rol", async () => {
    apiMock.get.mockResolvedValue({ data: { data: [{ id: "a-1", estudiantes: [] }] } });

    const result = await getDocenteAulasConEstudiantes();

    const url = apiMock.get.mock.calls[0][0] as string;
    expect(url).toContain("/docentes/aulas");
    expect(url).toContain(`usuario_id=${USER.id}`);
    expect(result[0].id).toBe("a-1");
  });
});

// ─── getAulaEstudiantes ──────────────────────────────────────────────────────
describe("getAulaEstudiantes", () => {
  it("llama a GET /aulas/:id/estudiantes con usuario_id y rol", async () => {
    apiMock.get.mockResolvedValue({ data: { data: [{ id: "s-1" }] } });

    const result = await getAulaEstudiantes("a-1");

    const url = apiMock.get.mock.calls[0][0] as string;
    expect(url).toContain("/aulas/a-1/estudiantes");
    expect(url).toContain(`usuario_id=${USER.id}`);
    expect(result[0].id).toBe("s-1");
  });

  it("devuelve array vacío cuando no hay data", async () => {
    apiMock.get.mockResolvedValue({ data: {} });
    expect(await getAulaEstudiantes("a-1")).toEqual([]);
  });
});

// ─── getAulas sin usuario en storage ────────────────────────────────────────
describe("getAulas sin usuario en storage", () => {
  it("llama a GET /aulas con usuario_id y rol vacíos cuando no hay sesión", async () => {
    localStorage.removeItem("padiUser");
    apiMock.get.mockResolvedValue({ data: { data: [] } });

    await getAulas();

    const url = apiMock.get.mock.calls[0][0] as string;
    expect(url).toContain("usuario_id=&rol=");
  });
});

// ─── getAulasPorEscuela ──────────────────────────────────────────────────────
describe("getAulasPorEscuela", () => {
  it("llama a GET /aulas con escuela_id en query", async () => {
    apiMock.get.mockResolvedValue({ data: { data: [] } });

    await getAulasPorEscuela("esc-1");

    const url = apiMock.get.mock.calls[0][0] as string;
    expect(url).toContain("escuela_id=esc-1");
  });
});
