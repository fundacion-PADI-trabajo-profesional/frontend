import { describe, it, expect } from "vitest";
import { filtrarAulasDisponibles, filtrarAulasParaEstudiante } from "../../src/utils/docentes-aulas";
import type { Aula } from "../../src/api/aulas";

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

// ─── filtrarAulasParaEstudiante ───────────────────────────────────────────────

describe("filtrarAulasParaEstudiante", () => {
  it("devuelve solo las aulas del colegio seleccionado", () => {
    const aulas = [
      makeAula("a-1", "esc-1"),
      makeAula("a-2", "esc-2"),
      makeAula("a-3", "esc-1"),
    ];

    const result = filtrarAulasParaEstudiante(aulas, "esc-1", "");

    expect(result.map((a) => a.id)).toEqual(["a-1", "a-3"]);
  });

  it("filtra por colegio Y sala cuando ambos están seleccionados", () => {
    const aulas = [
      { ...makeAula("a-1", "esc-1"), sala_id: 3 },
      { ...makeAula("a-2", "esc-1"), sala_id: 4 },
      { ...makeAula("a-3", "esc-1"), sala_id: 4 },
      { ...makeAula("a-4", "esc-2"), sala_id: 4 }, // otro colegio
    ];

    const result = filtrarAulasParaEstudiante(aulas, "esc-1", "4");

    expect(result.map((a) => a.id)).toEqual(["a-2", "a-3"]);
  });

  it("no muestra aulas de otros colegios aunque tengan la misma sala", () => {
    const aulas = [
      { ...makeAula("a-1", "esc-2"), sala_id: 4 },
      { ...makeAula("a-2", "esc-3"), sala_id: 4 },
    ];

    expect(filtrarAulasParaEstudiante(aulas, "esc-1", "4")).toEqual([]);
  });

  it("sin sala seleccionada devuelve todas las aulas del colegio", () => {
    const aulas = [
      { ...makeAula("a-1", "esc-1"), sala_id: 3 },
      { ...makeAula("a-2", "esc-1"), sala_id: 4 },
      { ...makeAula("a-3", "esc-1"), sala_id: 5 },
    ];

    const result = filtrarAulasParaEstudiante(aulas, "esc-1", "");

    expect(result.map((a) => a.id)).toEqual(["a-1", "a-2", "a-3"]);
  });

  it("devuelve vacío si no hay colegio seleccionado", () => {
    const aulas = [makeAula("a-1", "esc-1")];

    expect(filtrarAulasParaEstudiante(aulas, "", "")).toEqual([]);
  });
});
