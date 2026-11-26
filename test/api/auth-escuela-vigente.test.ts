/**
 * "Sin escuela asignada" se confirma contra el servidor.
 *
 * Las pantallas del director (Alumnos, Evaluaciones, Docentes) mostraban "sin escuela asignada"
 * mirando sólo la copia local del perfil. Si a la directora le asignaban la escuela después de
 * haber entrado, seguía viendo el cartel hasta cerrar sesión. `usuarioConEscuelaVigente` le
 * pregunta al servidor antes de dar por cierto que no tiene escuela.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { setUserInStorage, mockFetchResponse, clearStorage } from "../setup";
import { usuarioConEscuelaVigente } from "../../src/api/auth";

const perfilServidor = (extra: Record<string, unknown>) =>
  mockFetchResponse({
    success: true,
    message: "ok",
    data: { id: "dir-1", nombre: "Ana", apellido: "Paz", rol: "director", escuela_id: null, ...extra },
  });

beforeEach(() => {
  clearStorage();
  localStorage.setItem("token", "tok");
  vi.clearAllMocks();
});

describe("usuarioConEscuelaVigente", () => {
  it("directora sin escuela en la copia local pero con escuela en el servidor: devuelve la escuela y corrige la copia", async () => {
    setUserInStorage({ id: "dir-1", rol: "director" });
    vi.mocked(fetch).mockResolvedValue(perfilServidor({ escuela_id: "esc-1" }));

    const user = await usuarioConEscuelaVigente();

    expect(user?.escuela_id).toBe("esc-1");
    expect(JSON.parse(localStorage.getItem("padiUser")!).escuela_id).toBe("esc-1");
  });

  it("directora sin escuela también en el servidor: sigue sin escuela", async () => {
    setUserInStorage({ id: "dir-1", rol: "director" });
    vi.mocked(fetch).mockResolvedValue(perfilServidor({ escuela_id: null }));

    const user = await usuarioConEscuelaVigente();

    expect(user?.rol).toBe("director");
    expect(user?.escuela_id).toBeUndefined();
  });

  it("si el servidor no responde, se queda con la copia local", async () => {
    setUserInStorage({ id: "dir-1", rol: "director" });
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ message: "boom" }, false, 500));

    const user = await usuarioConEscuelaVigente();

    expect(user?.id).toBe("dir-1");
    expect(user?.escuela_id).toBeUndefined();
  });

  it("directora con escuela en la copia local: no consulta al servidor", async () => {
    setUserInStorage({ id: "dir-1", rol: "director", escuela_id: "esc-1" });

    const user = await usuarioConEscuelaVigente();

    expect(user?.escuela_id).toBe("esc-1");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("otros roles sin escuela: no consulta al servidor", async () => {
    setUserInStorage({ id: "padi-1", rol: "equipo_padi" });

    const user = await usuarioConEscuelaVigente();

    expect(user?.rol).toBe("equipo_padi");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sin sesión guardada devuelve null", async () => {
    expect(await usuarioConEscuelaVigente()).toBeNull();
  });
});
