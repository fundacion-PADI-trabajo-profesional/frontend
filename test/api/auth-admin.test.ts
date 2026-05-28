import { describe, it, expect, vi, beforeEach } from "vitest";
import { setUserInStorage, mockFetchResponse } from "../setup";

import {
  adminListUsers,
  adminCreateUser,
  adminCreateUsersBulk,
  adminDeleteUser,
  adminResendInvite,
  adminUpdateUserRol,
} from "../../src/api/auth";

const ADMIN = { id: "admin-1", rol: "equipo_padi" };

beforeEach(() => {
  setUserInStorage(ADMIN);
  vi.clearAllMocks();
});

// ─── adminListUsers ──────────────────────────────────────────────────────────
describe("adminListUsers", () => {
  it("llama a GET /admin/users y devuelve la lista", async () => {
    const lista = [{ id: "u-1", email: "a@a.com", rol: "docente" }];
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse(lista));

    const result = await adminListUsers();

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain("/admin/users");
    expect(result).toEqual(lista);
  });

  it("propaga el error cuando la API falla", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ message: "No autorizado" }, false, 403)
    );

    await expect(adminListUsers()).rejects.toThrow("No autorizado");
  });
});

// ─── adminCreateUser ─────────────────────────────────────────────────────────
describe("adminCreateUser", () => {
  const payload = { nombre: "Ana", apellido: "Lopez", email: "ana@test.com", rol: "docente" };

  it("llama a POST /admin/users con los datos del formulario", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ id: "u-new" }));

    await adminCreateUser(payload);

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(url).toContain("/admin/users");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(payload);
  });

  it("propaga el error cuando el email ya existe", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ message: "El email ya está registrado" }, false, 409)
    );

    await expect(adminCreateUser(payload)).rejects.toThrow("El email ya está registrado");
  });
});

// ─── adminCreateUsersBulk ─────────────────────────────────────────────────────
describe("adminCreateUsersBulk", () => {
  const users = [
    { nombre: "Ana", apellido: "Lopez", email: "ana@test.com", rol: "docente" },
    { nombre: "Juan", apellido: "Perez", email: "juan@test.com", rol: "director" },
  ];

  it("llama a POST /admin/users/bulk con el array de usuarios", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ creados: users, errores: [] })
    );

    await adminCreateUsersBulk(users);

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(url).toContain("/admin/users/bulk");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ users });
  });

  it("devuelve el resumen de creados y errores", async () => {
    const resumen = { creados: [users[0]], errores: [{ email: users[1].email, error: "Duplicado" }] };
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse(resumen));

    const result = await adminCreateUsersBulk(users);

    expect(result).toEqual(resumen);
  });

  it("propaga el error cuando el servidor falla", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ message: "Error interno" }, false, 500)
    );

    await expect(adminCreateUsersBulk(users)).rejects.toThrow("Error interno");
  });
});

// ─── adminDeleteUser ──────────────────────────────────────────────────────────
describe("adminDeleteUser", () => {
  it("llama a DELETE /admin/users/:id", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ message: "Eliminado" }));

    await adminDeleteUser("u-1");

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(url).toContain("/admin/users/u-1");
    expect(init.method).toBe("DELETE");
  });

  it("propaga el error cuando el usuario no existe", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ message: "Usuario no encontrado" }, false, 404)
    );

    await expect(adminDeleteUser("u-x")).rejects.toThrow("Usuario no encontrado");
  });

  it("propaga el error al intentar eliminar la propia cuenta", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ message: "No podés eliminar tu propia cuenta." }, false, 400)
    );

    await expect(adminDeleteUser(ADMIN.id)).rejects.toThrow("No podés eliminar tu propia cuenta.");
  });
});

// ─── adminResendInvite ────────────────────────────────────────────────────────
describe("adminResendInvite", () => {
  it("llama a POST /admin/users/:id/resend-invite", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ message: "Invitación reenviada" }));

    await adminResendInvite("u-1");

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(url).toContain("/admin/users/u-1/resend-invite");
    expect(init.method).toBe("POST");
  });

  it("propaga el error cuando el usuario no está en estado pendiente", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ message: "El usuario ya activó su cuenta" }, false, 400)
    );

    await expect(adminResendInvite("u-1")).rejects.toThrow("El usuario ya activó su cuenta");
  });
});

// ─── adminUpdateUserRol ───────────────────────────────────────────────────────
describe("adminUpdateUserRol", () => {
  it("llama a PATCH /admin/users/:id/rol con el nuevo rol", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ id: "u-1", rol: "director" }));

    await adminUpdateUserRol("u-1", "director");

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(url).toContain("/admin/users/u-1/rol");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ rol: "director" });
  });

  it("devuelve el id y el nuevo rol confirmado por el servidor", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ id: "u-1", rol: "encargado_zona" }));

    const result = await adminUpdateUserRol("u-1", "encargado_zona");

    expect(result.id).toBe("u-1");
    expect(result.rol).toBe("encargado_zona");
  });

  it("propaga el error cuando se intenta cambiar el propio rol", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ message: "No podés cambiar tu propio rol." }, false, 400)
    );

    await expect(adminUpdateUserRol(ADMIN.id, "docente")).rejects.toThrow("No podés cambiar tu propio rol.");
  });

  it("propaga el error cuando el rol enviado es inválido", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ message: "Rol inválido." }, false, 400)
    );

    await expect(adminUpdateUserRol("u-1", "superadmin")).rejects.toThrow("Rol inválido.");
  });

  it("propaga el error cuando el usuario no existe", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ message: "Usuario no encontrado." }, false, 404)
    );

    await expect(adminUpdateUserRol("u-x", "docente")).rejects.toThrow("Usuario no encontrado.");
  });
});

// ─── Seguridad: solo equipo_padi puede usar estas funciones (validación backend) ─
describe("control de acceso backend", () => {
  it("adminListUsers retorna error 403 si el token no es equipo_padi", async () => {
    setUserInStorage({ id: "dir-1", rol: "director" });
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ message: "Acceso denegado" }, false, 403)
    );

    await expect(adminListUsers()).rejects.toThrow("Acceso denegado");
  });

  it("adminUpdateUserRol retorna error 403 si el token no es equipo_padi", async () => {
    setUserInStorage({ id: "doc-1", rol: "docente" });
    vi.mocked(fetch).mockResolvedValue(
      mockFetchResponse({ message: "Acceso denegado" }, false, 403)
    );

    await expect(adminUpdateUserRol("u-1", "director")).rejects.toThrow("Acceso denegado");
  });
});
