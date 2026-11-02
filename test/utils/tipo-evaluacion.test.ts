import { describe, it, expect } from "vitest";
import { ETIQUETA_TIPO, puedeCambiarTipo, tipoPorDefecto } from "../../src/utils/tipo-evaluacion";

const ev = (tipoId: string, fecha: string, salaId = 4) => ({ salaId, tipoId, createdAt: new Date(`${fecha}T00:00:00Z`) });

describe("tipoPorDefecto", () => {
  it("sin evaluaciones: inicial, con ayuda de primera evaluación", () => {
    expect(tipoPorDefecto([], 4, 2026)).toEqual({
      tipo: "inicial",
      ayuda: "Primera evaluación de sala 4 de este alumno",
      aviso: null,
    });
  });

  it("con una inicial: cierre, con la fecha de la inicial", () => {
    expect(tipoPorDefecto([ev("inicial", "2026-03-12")], 4, 2026)).toEqual({
      tipo: "cierre",
      ayuda: "Ya tiene la inicial de sala 4 (12/03/2026)",
      aviso: null,
    });
  });

  it("con inicial y cierre: cierre, con aviso", () => {
    expect(tipoPorDefecto([ev("inicial", "2026-03-12"), ev("cierre", "2026-10-20")], 4, 2026)).toEqual({
      tipo: "cierre",
      ayuda: null,
      aviso: "Ya tiene inicial y cierre de sala 4",
    });
  });

  it("dos iniciales sin cierre: cierre, con aviso de que una es probablemente el cierre (fechas ascendentes)", () => {
    const r = tipoPorDefecto([ev("inicial", "2026-10-20"), ev("inicial", "2026-03-12")], 4, 2026);
    expect(r.tipo).toBe("cierre");
    expect(r.ayuda).toBeNull();
    expect(r.aviso).toBe(
      "Tiene 2 evaluaciones iniciales de sala 4 (12/03/2026, 20/10/2026): una de ellas es probablemente el cierre. " +
        "Cambiale el tipo desde el historial en vez de crear otra."
    );
  });

  it("cierre sin inicial: inicial, con aviso (no dice 'primera evaluación')", () => {
    expect(tipoPorDefecto([ev("cierre", "2026-10-20")], 4, 2026)).toEqual({
      tipo: "inicial",
      ayuda: null,
      aviso: "Ya tiene el cierre de sala 4 (20/10/2026) y no tiene inicial",
    });
  });

  it("otra sala y otro año no cuentan", () => {
    const r = tipoPorDefecto([ev("inicial", "2026-03-12", 3), ev("inicial", "2025-03-12", 4)], 4, 2026);
    expect(r).toEqual({ tipo: "inicial", ayuda: "Primera evaluación de sala 4 de este alumno", aviso: null });
  });

  it("etiquetas del selector", () => {
    expect(ETIQUETA_TIPO).toEqual({ inicial: "Evaluacion Inicial", cierre: "Evaluacion de Cierre" });
  });
});

describe("puedeCambiarTipo", () => {
  it("docente: solo sus propias evaluaciones", () => {
    expect(puedeCambiarTipo({ id: "d1", rol: "docente" }, { profesorId: "d1" })).toBe(true);
    expect(puedeCambiarTipo({ id: "d1", rol: "docente" }, { profesorId: "d2" })).toBe(false);
  });

  it("director, encargado y equipo PADI: siempre (el backend verifica el alcance)", () => {
    for (const rol of ["director", "encargado_zona", "equipo_padi"]) {
      expect(puedeCambiarTipo({ id: "x", rol }, { profesorId: "otro" })).toBe(true);
    }
  });

  it("sin perfil o sin rol: nunca", () => {
    expect(puedeCambiarTipo(null, { profesorId: "d1" })).toBe(false);
    expect(puedeCambiarTipo({ id: "d1" }, { profesorId: "d1" })).toBe(false);
  });
});
