import { describe, it, expect } from "vitest";
import { ETIQUETA_TIPO, puedeCambiarTipo, tipoPorDefecto } from "../../src/utils/tipo-evaluacion";

const ev = (tipoId: string, fecha: string, salaId = 4, id?: string) => ({ id, salaId, tipoId, createdAt: new Date(`${fecha}T00:00:00Z`) });

describe("tipoPorDefecto", () => {
  // mes 1-12 del día de carga. Hasta julio la época es de iniciales; de agosto en adelante, de cierres.
  const MARZO = 3;
  const NOVIEMBRE = 11;

  it("sin evaluaciones, antes de agosto: inicial", () => {
    expect(tipoPorDefecto([], 4, 2026, MARZO)).toEqual({
      tipo: "inicial",
      ayuda: "Primera evaluación de sala 4 de este alumno",
      aviso: null,
      existenteId: null,
    });
  });

  it("sin evaluaciones, de agosto en adelante: cierre (aunque no tenga inicial)", () => {
    expect(tipoPorDefecto([], 4, 2026, NOVIEMBRE)).toEqual({
      tipo: "cierre",
      ayuda: "Primera evaluación de sala 4 de este alumno. De agosto en adelante se carga como cierre",
      aviso: null,
      existenteId: null,
    });
    expect(tipoPorDefecto([], 4, 2026, 8).tipo).toBe("cierre");
    expect(tipoPorDefecto([], 4, 2026, 7).tipo).toBe("inicial");
  });

  it("época de cierre, con una inicial: cierre, con la fecha de la inicial", () => {
    expect(tipoPorDefecto([ev("inicial", "2026-03-12")], 4, 2026, NOVIEMBRE)).toEqual({
      tipo: "cierre",
      ayuda: "Ya tiene la inicial de sala 4 (12/03/2026)",
      aviso: null,
      existenteId: null,
    });
  });

  it("época de cierre, ya tiene cierre (con o sin inicial): no se crea otra, se continúa esa", () => {
    const esperado = {
      tipo: "cierre",
      ayuda: null,
      aviso: "Este alumno ya tiene la evaluación de cierre de sala 4 (20/10/2026). Continuá esa en vez de crear otra.",
      existenteId: "c1",
    };
    expect(tipoPorDefecto([ev("inicial", "2026-03-12", 4, "i1"), ev("cierre", "2026-10-20", 4, "c1")], 4, 2026, NOVIEMBRE)).toEqual(esperado);
    expect(tipoPorDefecto([ev("cierre", "2026-10-20", 4, "c1")], 4, 2026, NOVIEMBRE)).toEqual(esperado);
  });

  it("época de iniciales, ya tiene inicial: no se crea otra, se continúa esa", () => {
    expect(tipoPorDefecto([ev("inicial", "2026-03-12", 4, "i1")], 4, 2026, MARZO)).toEqual({
      tipo: "inicial",
      ayuda: null,
      aviso: "Este alumno ya tiene la evaluación inicial de sala 4 (12/03/2026). Continuá esa en vez de crear otra.",
      existenteId: "i1",
    });
  });

  it("época de cierre, dos iniciales sin cierre: cierre, con aviso de que una es probablemente el cierre (fechas ascendentes)", () => {
    const r = tipoPorDefecto([ev("inicial", "2026-10-20"), ev("inicial", "2026-03-12")], 4, 2026, NOVIEMBRE);
    expect(r.tipo).toBe("cierre");
    expect(r.ayuda).toBeNull();
    expect(r.existenteId).toBeNull();
    expect(r.aviso).toBe(
      "Tiene 2 evaluaciones iniciales de sala 4 (12/03/2026, 20/10/2026): una de ellas es probablemente el cierre. " +
        "Cambiale el tipo desde el historial en vez de crear otra."
    );
  });

  it("época de iniciales, cierre sin inicial: inicial, con aviso", () => {
    expect(tipoPorDefecto([ev("cierre", "2026-02-20")], 4, 2026, MARZO)).toEqual({
      tipo: "inicial",
      ayuda: null,
      aviso: "Ya tiene el cierre de sala 4 (20/02/2026) y no tiene inicial",
      existenteId: null,
    });
  });

  it("otra sala y otro año no cuentan", () => {
    const r = tipoPorDefecto([ev("inicial", "2026-03-12", 3), ev("inicial", "2025-03-12", 4)], 4, 2026, MARZO);
    expect(r).toEqual({ tipo: "inicial", ayuda: "Primera evaluación de sala 4 de este alumno", aviso: null, existenteId: null });
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
