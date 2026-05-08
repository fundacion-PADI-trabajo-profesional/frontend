import { describe, it, expect } from "vitest";
import { filtrarAulasDisponibles } from "../../utils/docentes-aulas";
import type { Aula } from "../../api/aulas";

const makeAula = (id: string, escuela_id: string): Aula => ({
  id,
  sala_id: 1,
  escuela_id,
  comision: "A",
  turno: "Mañana",
});

// ─── filtrarAulasDisponibles ──────────────────────────────────────────────────

describe("filtrarAulasDisponibles", () => {
  it("devuelve solo las aulas del colegio asignado al docente", () => {
    const aulas = [
      makeAula("a-1", "esc-1"),
      makeAula("a-2", "esc-1"),
      makeAula("a-3", "esc-2"), // colegio distinto
    ];
    const docente = { escuelas: [{ id: "esc-1" }], aulas: [] };

    const result = filtrarAulasDisponibles(aulas, docente);

    expect(result.map((a) => a.id)).toEqual(["a-1", "a-2"]);
  });

  it("excluye las aulas que el docente ya tiene asignadas", () => {
    const aulas = [makeAula("a-1", "esc-1"), makeAula("a-2", "esc-1")];
    const docente = { escuelas: [{ id: "esc-1" }], aulas: [{ id: "a-1" }] };

    const result = filtrarAulasDisponibles(aulas, docente);

    expect(result.map((a) => a.id)).toEqual(["a-2"]);
  });

  it("incluye aulas de ambos colegios cuando el docente tiene dos asignados", () => {
    const aulas = [
      makeAula("a-1", "esc-1"),
      makeAula("a-2", "esc-2"),
      makeAula("a-3", "esc-3"), // colegio sin asignar
    ];
    const docente = {
      escuelas: [{ id: "esc-1" }, { id: "esc-2" }],
      aulas: [],
    };

    const result = filtrarAulasDisponibles(aulas, docente);

    expect(result.map((a) => a.id)).toEqual(["a-1", "a-2"]);
  });

  it("devuelve vacío cuando el docente ya tiene todas las aulas de su colegio", () => {
    const aulas = [makeAula("a-1", "esc-1"), makeAula("a-2", "esc-1")];
    const docente = {
      escuelas: [{ id: "esc-1" }],
      aulas: [{ id: "a-1" }, { id: "a-2" }],
    };

    expect(filtrarAulasDisponibles(aulas, docente)).toEqual([]);
  });

  it("devuelve vacío cuando el docente no tiene colegios asignados", () => {
    const aulas = [makeAula("a-1", "esc-1")];
    const docente = { escuelas: [], aulas: [] };

    expect(filtrarAulasDisponibles(aulas, docente)).toEqual([]);
  });

  it("tolera docente sin propiedades escuelas ni aulas", () => {
    const aulas = [makeAula("a-1", "esc-1")];

    expect(filtrarAulasDisponibles(aulas, {})).toEqual([]);
  });
});
