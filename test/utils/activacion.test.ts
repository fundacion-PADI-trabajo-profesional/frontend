import { describe, it, expect } from "vitest";
import { leerHashActivacion } from "../../src/utils/activacion";

describe("leerHashActivacion", () => {
  it("con tokens: utilizable", () => {
    const r = leerHashActivacion("#access_token=aaa&refresh_token=rrr&type=invite");
    expect(r).toEqual({ access: "aaa", refresh: "rrr", utilizable: true, motivo: null });
  });

  it("link vencido: Supabase vuelve con error_code=otp_expired", () => {
    const r = leerHashActivacion("#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired");
    expect(r.utilizable).toBe(false);
    expect(r.motivo).toBe("vencido");
  });

  it("otro error: inválido; sin hash: sin_link; con un solo token: inválido por faltar el otro", () => {
    expect(leerHashActivacion("#error=access_denied&error_code=otp_disabled").motivo).toBe("invalido");
    expect(leerHashActivacion("").motivo).toBe("sin_link");
    expect(leerHashActivacion("#access_token=aaa")).toMatchObject({ utilizable: false, motivo: "sin_link" });
  });
});
