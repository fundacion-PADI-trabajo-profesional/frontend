import { describe, it, expect } from "vitest";
import { formatDirectores } from "../../src/utils/escuelas";

describe("formatDirectores", () => {
  it("sin directores devuelve 'Sin director asignado'", () => {
    expect(formatDirectores([])).toBe("Sin director asignado");
    expect(formatDirectores(undefined)).toBe("Sin director asignado");
  });

  it("con un director devuelve su nombre completo", () => {
    expect(formatDirectores([{ nombre: "Juan", apellido: "Pérez" }])).toBe("Juan Pérez");
  });

  it("con varios directores los lista a TODOS separados por coma (regresión del bug directivos[0])", () => {
    expect(
      formatDirectores([
        { nombre: "Juan", apellido: "Pérez" },
        { nombre: "María", apellido: "López" },
        { nombre: "Ana", apellido: "Gómez" },
      ])
    ).toBe("Juan Pérez, María López, Ana Gómez");
  });
});
