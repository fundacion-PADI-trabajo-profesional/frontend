import { describe, it, expect, vi } from "vitest";
import { mockFetchResponse } from "../setup";
import { solicitarReenvioInvitacion } from "../../src/api/auth";

describe("solicitarReenvioInvitacion", () => {
  it("hace POST a /auth/reenviar-invitacion con el email y devuelve el mensaje", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ message: "Si tu cuenta está pendiente..." }));
    const r = await solicitarReenvioInvitacion("docente@padi.com");
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/auth/reenviar-invitacion");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ email: "docente@padi.com" });
    expect(r.message).toContain("pendiente");
  });

  it("propaga el mensaje de error del backend (por ejemplo, demasiados intentos)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockFetchResponse({ message: "Se realizaron demasiados intentos de envío." }, false, 400));
    await expect(solicitarReenvioInvitacion("docente@padi.com")).rejects.toThrow("demasiados intentos");
  });
});
