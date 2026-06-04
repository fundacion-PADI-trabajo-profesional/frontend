import { describe, it, expect, vi, beforeEach } from "vitest";
import { setUserInStorage, mockFetchResponse } from "../setup";

const apiMock = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock("../../src/api/auth", () => ({
  api: apiMock,
  getAuthHeaders: () => ({ Authorization: "Bearer fake" }),
}));

import {
  getEstudiantes,
  createEstudiante,
  updateEstudiante,
  deleteEstudiante,
  getGeneros,
  getSalas,
  asignarEstudianteAula,
  desasignarEstudianteAula,
  bulkCreateEstudiantes,
  getEscuelas,
} from "../../src/api/estudiantes";

const USER = { id: "u-1", rol: "equipo_padi" };
const API = "http://localhost:3000";

beforeEach(() => {
  setUserInStorage(USER);
  vi.clearAllMocks();
});

// ─── getEstudiantes ──────────────────────────────────────────────────────────
describe("getEstudiantes", () => {
  it("llama a GET /estudiantes con rol del usuario", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: [{ id: "s-1" }] })
    );

    const result = await getEstudiantes();

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/estudiantes`);
    expect(url).toContain(`rol=${USER.rol}`);
    expect(result[0].id).toBe("s-1");
  });

  it("incluye escuela_id en query cuando el usuario es director", async () => {
    setUserInStorage({ id: "dir-1", rol: "director", escuela_id: "esc-1" });
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: [] })
    );

    await getEstudiantes();

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain("escuela_id=esc-1");
  });

  it("lanza error cuando la respuesta indica fallo", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "No autorizado" }, false, 403)
    );

    await expect(getEstudiantes()).rejects.toThrow("No autorizado");
  });
});

// ─── createEstudiante ────────────────────────────────────────────────────────
describe("createEstudiante", () => {
  it("llama a POST /estudiantes con usuario_id y rol del usuario", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: { id: "s-1" } })
    );

    const formData = {
      dni: "11111111",
      nombre: "Ana",
      apellido: "Lopez",
      fecha_nacimiento: "2018-01-01",
      genero_id: "F",
      sala_id: 1,
      escuela_id: "esc-1",
    };

    await createEstudiante(formData);

    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    expect(body.usuario_id).toBe(USER.id);
    expect(body.rol).toBe(USER.rol);
    expect(body.dni).toBe("11111111");
  });

  it("lanza error si el servidor responde con error", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse(
        { success: false, message: "DNI duplicado" },
        false,
        400
      )
    );

    await expect(
      createEstudiante({
        dni: "x", nombre: "x", apellido: "x",
        fecha_nacimiento: "2018-01-01", genero_id: "F", sala_id: 1, escuela_id: "e-1",
      })
    ).rejects.toThrow("DNI duplicado");
  });
});

// ─── updateEstudiante ────────────────────────────────────────────────────────
describe("updateEstudiante", () => {
  it("llama a PUT /estudiantes/:id", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: { id: "s-1" } })
    );

    await updateEstudiante("s-1", { nombre: "Nuevo" });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/estudiantes/s-1`);

    const options = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(options.method).toBe("PUT");
  });

  it("lanza error cuando la actualización falla", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "No encontrado" }, false, 404)
    );

    await expect(updateEstudiante("s-1", {})).rejects.toThrow("No encontrado");
  });
});

// ─── getGeneros ──────────────────────────────────────────────────────────────
describe("getGeneros", () => {
  it("llama a GET /generos", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: [{ id: "M", descripcion: "Masculino" }] })
    );

    const result = await getGeneros();

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/generos`);
    expect(result[0].id).toBe("M");
  });
});

// ─── getSalas ────────────────────────────────────────────────────────────────
describe("getSalas", () => {
  it("llama a GET /salas", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: [{ id: 1, nombre: "Sala 1", grado: 1 }] })
    );

    const result = await getSalas();

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/salas`);
    expect(result[0].id).toBe(1);
  });
});

// ─── asignarEstudianteAula ─────────────────────────────────────────────────��─
describe("asignarEstudianteAula", () => {
  it("llama a POST /estudiantes/:id/asignar-aula con aulaId", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({}, true, 200));

    await asignarEstudianteAula("s-1", "a-1");

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/estudiantes/s-1/asignar-aula`);

    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    expect(body.aulaId).toBe("a-1");
  });

  it("lanza error si el servidor falla", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ message: "Aula no encontrada" }, false, 404)
    );

    await expect(asignarEstudianteAula("s-1", "a-x")).rejects.toThrow(
      "Aula no encontrada"
    );
  });
});

// ─── desasignarEstudianteAula ────────────────────────────────────────────────
describe("desasignarEstudianteAula", () => {
  it("llama a POST /estudiantes/:id/desasignar-aula", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({}, true, 200));

    await desasignarEstudianteAula("s-1");

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/estudiantes/s-1/desasignar-aula`);
  });
});

// ─── getEscuelas (estudiantes api) ───────────────────────────────────────────
describe("getEscuelas (estudiantes api)", () => {
  it("llama a GET /escuelas y devuelve lista", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: true, data: [{ id: 1, nombre: "Escuela A" }] })
    );

    const result = await getEscuelas();

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/escuelas`);
    expect(result[0].nombre).toBe("Escuela A");
  });

  it("lanza error cuando falla", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false, message: "No autorizado" }, false, 403)
    );

    await expect(getEscuelas()).rejects.toThrow("No autorizado");
  });

  it("usa 'Error desconocido' cuando no hay message ni description", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ success: false }, false, 500)
    );

    await expect(getEscuelas()).rejects.toThrow("Error desconocido");
  });
});

// ─── asignarEstudianteAula con userInfo explícito ────────────────────────────
describe("asignarEstudianteAula con userInfo explícito", () => {
  it("usa userId y userRole de userInfo en lugar del storage", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({}, true, 200));

    await asignarEstudianteAula("s-1", "a-1", { userId: "u-ext", userRole: "director" });

    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    expect(body.aulaId).toBe("a-1");
    expect(body.userId).toBe("u-ext");
    expect(body.userRole).toBe("director");
  });
});

// ─── desasignarEstudianteAula con userInfo explícito ─────────────────────────
describe("desasignarEstudianteAula con userInfo explícito", () => {
  it("usa userId y userRole de userInfo", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({}, true, 200));

    await desasignarEstudianteAula("s-1", { userId: "u-ext", userRole: "director" });

    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    expect(body.userId).toBe("u-ext");
    expect(body.userRole).toBe("director");
  });
});


// ─── bulkCreateEstudiantes ───────────────────────────────────────────────────
describe("bulkCreateEstudiantes", () => {
  it("llama a POST /estudiantes/bulk con usuario_id y rol", async () => {
    apiMock.post.mockResolvedValue({ data: { success: true, created: 2 } });

    await bulkCreateEstudiantes({ estudiantes: [{ dni: "1" }, { dni: "2" }] });

    expect(apiMock.post).toHaveBeenCalledWith(
      "/estudiantes/bulk",
      expect.objectContaining({ usuario_id: USER.id, rol: USER.rol })
    );
  });

  it("incluye escuela_id del usuario en el payload", async () => {
    setUserInStorage({ id: "u-1", rol: "director", escuela_id: "esc-42" });
    apiMock.post.mockResolvedValue({ data: { success: true } });

    await bulkCreateEstudiantes({ estudiantes: [{ dni: "1" }] });

    expect(apiMock.post).toHaveBeenCalledWith(
      "/estudiantes/bulk",
      expect.objectContaining({ escuela_id: "esc-42" }),
    );
  });

  it("propaga el error cuando api.post lanza", async () => {
    apiMock.post.mockRejectedValue(new Error("Servidor caído"));

    await expect(
      bulkCreateEstudiantes({ estudiantes: [{ dni: "1" }] })
    ).rejects.toThrow("Servidor caído");
  });
});

// ─── deleteEstudiante ────────────────────────────────────────────────────────
describe("deleteEstudiante", () => {
  it("llama a DELETE /estudiantes/:id", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({}, true, 200));

    await deleteEstudiante("s-1");

    const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`${API}/estudiantes/s-1`);
    expect(options.method).toBe("DELETE");
  });

  it("lanza el mensaje del servidor cuando la respuesta no es ok", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ message: "Estudiante no encontrado" }, false, 404)
    );

    await expect(deleteEstudiante("s-x")).rejects.toThrow("Estudiante no encontrado");
  });

  it("lanza error genérico cuando el body no tiene message", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({}, false, 500));

    await expect(deleteEstudiante("s-x")).rejects.toThrow("Error al eliminar estudiante");
  });
});
