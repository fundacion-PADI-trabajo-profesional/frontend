/**
 * Refresco del perfil al abrir la app.
 *
 * El rol y la escuela se guardan en localStorage al loguearse; si cambian en el servidor
 * (p. ej. Equipo PADI → docente), el navegador seguía usando la copia vieja hasta que la
 * persona cerrara sesión. `refrescarPerfil` pide el perfil actual y reemplaza la copia local.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { setUserInStorage, mockFetchResponse, clearStorage } from "../setup";
import { refrescarPerfil } from "../../src/api/auth";

const PERFIL = {
  id: "u-1",
  email: "mj@padi.com",
  nombre: "María José",
  apellido: "Funes",
  rol: "docente",
  escuela_id: null,
  escuela: { id: "esc-1", nombre: "Escuela 1" },
};

beforeEach(() => {
  clearStorage();
  // copia vieja: la persona entró cuando todavía era Equipo PADI
  setUserInStorage({ id: "u-1", rol: "equipo_padi" });
  localStorage.setItem("token", "tok");
  localStorage.setItem("padiProfile", JSON.stringify({ id: "u-1", rol: "equipo_padi" }));
  localStorage.setItem("userRole", "equipo_padi");
  vi.clearAllMocks();
});

describe("refrescarPerfil", () => {
  it("pide GET /auth/profile con el token y devuelve el perfil del servidor", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ success: true, message: "ok", data: PERFIL }));

    const perfil = await refrescarPerfil();

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/auth/profile");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    expect(perfil).toEqual(PERFIL);
  });

  it("reemplaza la copia local del perfil (padiProfile y userRole) por la del servidor", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ success: true, message: "ok", data: PERFIL }));

    await refrescarPerfil();

    expect(JSON.parse(localStorage.getItem("padiProfile")!)).toEqual(PERFIL);
    expect(localStorage.getItem("userRole")).toBe("docente");
  });

  it("si el servidor falla, no toca la copia local y propaga el error", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ message: "boom" }, false, 500));

    await expect(refrescarPerfil()).rejects.toThrow("boom");
    expect(localStorage.getItem("userRole")).toBe("equipo_padi");
  });
});
