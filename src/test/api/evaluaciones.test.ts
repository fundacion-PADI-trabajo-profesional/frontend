import { describe, it, expect, vi } from "vitest";
import { mockFetchResponse } from "../setup";

// Mock del módulo auth para que getAuthHeaders no rompa en Node
vi.mock("../../api/auth", () => ({
  getAuthHeaders: () => ({ Authorization: "Bearer fake" }),
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import {
  getEvaluacionesInstancias,
  getEvaluacionInstanciaById,
  crearEvaluacionInstancia,
  eliminarEvaluacionInstancia,
  getEvaluacionesInstanciasByEstudiante,
  getEvaluacionesInstanciasByProfesor,
  getPreguntasArea,
  enviarRespuestas,
  actualizarEvaluacionInstancia,
  getRespuestasParaRevision,
} from "../../api/evaluaciones";

const API = "http://localhost:3000";

// Objeto mínimo devuelto por el backend para una evaluación
const rawEval = {
  id: "ev-1",
  estudiante_id: "est-1",
  profesor_id: "prof-1",
  sala_id: 1,
  aula_id: null,
  tipo_id: "inicial",
  estado_id: "N",
  puntaje: null,
  fecha_creacion: "2024-01-01T00:00:00.000Z",
  estudiantes: {
    id: "est-1",
    personas: { nombre: "Ana", primer_apellido: "Lopez", dni: "11111111", fecha_nacimiento: null },
    generos: { descripcion: "Femenino" },
    salas: { nombre: "Sala 1" },
    escuela: { nombre: "Escuela A" },
  },
  evaluaciones_estudiante_area: [],
};

describe("getEvaluacionesInstancias", () => {
  it("llama a GET /evaluaciones y devuelve lista mapeada", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ data: [rawEval] })
    );

    const result = await getEvaluacionesInstancias();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${API}/evaluaciones`),
      expect.any(Object)
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("ev-1");
    expect(result[0].estudianteNombre).toBe("Lopez, Ana");
  });

  it("pasa filtros como query params", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ data: [] })
    );

    await getEvaluacionesInstancias({ escuela_id: "esc-1", profesorId: "prof-1" });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain("escuela_id=esc-1");
    expect(url).toContain("profesorId=prof-1");
  });

  it("lanza error cuando la respuesta no es ok", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({}, false, 500));

    await expect(getEvaluacionesInstancias()).rejects.toThrow(
      "Error al cargar las evaluaciones"
    );
  });
});

describe("getEvaluacionInstanciaById", () => {
  it("llama a GET /evaluaciones/:id y devuelve evaluación mapeada", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ data: rawEval })
    );

    const result = await getEvaluacionInstanciaById("ev-1");

    expect(fetch).toHaveBeenCalledWith(
      `${API}/evaluaciones/ev-1`,
      expect.any(Object)
    );
    expect(result.id).toBe("ev-1");
    expect(result.tipoId).toBe("inicial");
  });

  it("lanza error cuando no se encuentra la evaluación", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ message: "No encontrada" }, false, 404)
    );

    await expect(getEvaluacionInstanciaById("no-existe")).rejects.toThrow(
      "No encontrada"
    );
  });
});

describe("crearEvaluacionInstancia", () => {
  it("llama a POST /evaluaciones con el payload correcto", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ data: rawEval })
    );

    const payload = {
      dni: "11111111",
      profesor_id: "prof-1",
      sala_id: 2,
      tipo_id: "inicial",
      fecha_creacion: "2024-01-01",
    };

    await crearEvaluacionInstancia(payload);

    expect(fetch).toHaveBeenCalledWith(
      `${API}/evaluaciones`,
      expect.objectContaining({ method: "POST" })
    );

    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    expect(body.dni).toBe("11111111");
    expect(body.tipo_id).toBe("inicial");
  });

  it("lanza error si el servidor responde con error", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ message: "Error al crear la evaluación" }, false, 400)
    );

    await expect(
      crearEvaluacionInstancia({
        dni: "x",
        profesor_id: "p",
        sala_id: 2,
        tipo_id: "inicial",
        fecha_creacion: "2024-01-01",
      })
    ).rejects.toThrow("Error al crear la evaluación");
  });
});

describe("eliminarEvaluacionInstancia", () => {
  it("llama a DELETE /evaluaciones/:id con usuario_id y rol en query params", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({}, true, 200));

    await eliminarEvaluacionInstancia("ev-1", {
      usuario_id: "u-1",
      rol: "equipo_padi",
    });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain("usuario_id=u-1");
    expect(url).toContain("rol=equipo_padi");
    expect(url).toContain(`${API}/evaluaciones/ev-1`);

    const options = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(options.method).toBe("DELETE");
  });

  it("también acepta userId/userRole como alias", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({}, true, 200));

    await eliminarEvaluacionInstancia("ev-2", {
      userId: "u-2",
      userRole: "docente",
    });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain("usuario_id=u-2");
    expect(url).toContain("rol=docente");
  });

  it("lanza error si el servidor falla", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ message: "Forbidden" }, false, 403)
    );

    await expect(eliminarEvaluacionInstancia("ev-1")).rejects.toThrow("Forbidden");
  });
});

describe("getEvaluacionesInstanciasByEstudiante", () => {
  it("llama con estudianteId como query param", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ data: [] }));

    await getEvaluacionesInstanciasByEstudiante("est-1");

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain("estudianteId=est-1");
  });
});

describe("getEvaluacionesInstanciasByProfesor", () => {
  it("llama con profesorId como query param", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ data: [] }));

    await getEvaluacionesInstanciasByProfesor("prof-1");

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain("profesorId=prof-1");
  });
});

describe("getPreguntasArea", () => {
  it("llama a GET /evaluaciones/:id/areas/:areaId/preguntas", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ data: { preguntas: [], respuestas: [], evaluacionAreaId: "ea-1" } })
    );

    const result = await getPreguntasArea("ev-1", "area-1");

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/evaluaciones/ev-1/areas/area-1/preguntas`);
    expect(result.evaluacionAreaId).toBe("ea-1");
  });
});

describe("crearEvaluacionInstancia con userInfo", () => {
  it("incluye userId y userRole en el body cuando se pasan", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ data: rawEval })
    );

    await crearEvaluacionInstancia(
      { dni: "1", profesor_id: "p-1", sala_id: 2, tipo_id: "inicial", fecha_creacion: "2024-01-01" },
      { userId: "u-1", userRole: "director" }
    );

    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    expect(body.userId).toBe("u-1");
    expect(body.userRole).toBe("director");
  });
});

describe("getEvaluacionesInstanciasByEstudiante con opts", () => {
  it("pasa limit y offset como query params", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ data: [] }));

    await getEvaluacionesInstanciasByEstudiante("est-1", { limit: 10, offset: 5 });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain("limit=10");
    expect(url).toContain("offset=5");
  });
});

describe("getEvaluacionesInstanciasByProfesor con opts", () => {
  it("pasa limit y offset como query params", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ data: [] }));

    await getEvaluacionesInstanciasByProfesor("prof-1", { limit: 20, offset: 0 });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain("limit=20");
    expect(url).toContain("offset=0");
  });
});

describe("actualizarEvaluacionInstancia", () => {
  it("llama a PATCH /evaluaciones/:id con los datos", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ data: rawEval })
    );

    await actualizarEvaluacionInstancia("ev-1", { estadoId: "A" });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/evaluaciones/ev-1`);
    const options = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(options.method).toBe("PATCH");
  });

  it("lanza error con description cuando está presente", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ error: { description: "No permitido" } }, false, 403)
    );

    await expect(actualizarEvaluacionInstancia("ev-1", {})).rejects.toThrow("No permitido");
  });

  it("lanza el mensaje por defecto cuando no hay error ni message", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({}, false, 500)
    );

    await expect(actualizarEvaluacionInstancia("ev-1", {})).rejects.toThrow(
      "Error al actualizar la evaluación"
    );
  });
});

describe("getRespuestasParaRevision", () => {
  it("llama al mismo endpoint que getPreguntasArea", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ data: { preguntas: [], respuestas: [], evaluacionAreaId: "ea-1" } })
    );

    const result = await getRespuestasParaRevision("ev-1", "area-1");

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain(`${API}/evaluaciones/ev-1/areas/area-1/preguntas`);
    expect(result.evaluacionAreaId).toBe("ea-1");
  });

  it("lanza error si la respuesta no es ok", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({}, false, 404));

    await expect(getRespuestasParaRevision("ev-1", "area-1")).rejects.toThrow(
      "Error al cargar respuestas para revisión."
    );
  });
});

describe("mapToCamelCase — branches del mapping", () => {
  it("mapea evaluación con areas y aulas correctamente", async () => {
    const rawWithAreas = {
      ...rawEval,
      aulas: { comision: "A", turno: "Mañana" },
      evaluaciones_estudiante_area: [
        {
          area_id: "area-1",
          id: "ea-1",
          estado_id: "A",
          puntaje: 8,
          totalPreguntas: 10,
          aciertos_individuales: 8,
          areas: { nombre: "Lenguaje", descripcion: "Desc" },
          estados_evaluacion: { descripcion: "Aprobada" },
        },
      ],
    };

    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ data: rawWithAreas })
    );

    const result = await getEvaluacionInstanciaById("ev-1");

    expect(result.aulaLabel).toContain("A");
    expect(result.areas).toHaveLength(1);
    expect(result.areas![0].nombre).toBe("Lenguaje");
    expect(result.areas![0].estadoId).toBe("A");
  });

  it("usa 'No asignada' cuando el estudiante no tiene escuela", async () => {
    const rawSinEscuela = {
      ...rawEval,
      estudiantes: {
        ...rawEval.estudiantes,
        escuela: null,
      },
    };

    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ data: rawSinEscuela })
    );

    const result = await getEvaluacionInstanciaById("ev-1");
    expect(result.estudiante?.escuelaNombre).toBe("No asignada");
  });

  it("usa new Date() cuando fecha_creacion es null", async () => {
    const rawSinFecha = { ...rawEval, fecha_creacion: null };

    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ data: rawSinFecha })
    );

    const before = Date.now();
    const result = await getEvaluacionInstanciaById("ev-1");
    const after = Date.now();

    expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.createdAt.getTime()).toBeLessThanOrEqual(after);
  });
});

describe("enviarRespuestas", () => {
  it("llama a POST /evaluaciones/:id/respuestas con areaId y questions", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({}, true, 200));

    const questions = [{ id: "q-1", answer: 1 }];
    await enviarRespuestas("ev-1", "area-1", questions);

    expect(fetch).toHaveBeenCalledWith(
      `${API}/evaluaciones/ev-1/respuestas`,
      expect.objectContaining({ method: "POST" })
    );
    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string
    );
    expect(body.areaId).toBe("area-1");
    expect(body.questions).toEqual(questions);
  });

  it("lanza error con mensaje del servidor", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ error: { description: "Respuestas inválidas" } }, false, 400)
    );

    await expect(enviarRespuestas("ev-1", "area-1", [])).rejects.toThrow(
      "Respuestas inválidas"
    );
  });
});
