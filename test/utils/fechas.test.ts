import { describe, it, expect } from "vitest";
import { fechaLocalISO, formatearFecha, formatearFechaLarga } from "../../src/utils/fechas";

describe("fechaLocalISO", () => {
  it("devuelve el día local como YYYY-MM-DD, con ceros a la izquierda", () => {
    expect(fechaLocalISO(new Date(2026, 9, 16, 23, 30))).toBe("2026-10-16");
    expect(fechaLocalISO(new Date(2026, 0, 5, 0, 1))).toBe("2026-01-05");
  });

  it("sin argumento usa hoy", () => {
    expect(fechaLocalISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("formatearFecha", () => {
  it("muestra solo la fecha, leída en UTC: la medianoche UTC del día cargado no se corre un día atrás", () => {
    expect(formatearFecha(new Date("2026-10-16T00:00:00Z"))).toBe("16/10/2026");
    expect(formatearFecha(new Date("2026-10-01T00:00:00Z"))).toBe("01/10/2026");
  });

  it("versión larga para el detalle", () => {
    expect(formatearFechaLarga(new Date("2026-10-16T00:00:00Z"))).toBe("16 de octubre de 2026");
  });
});
