import { describe, it, expect } from "vitest";
import { datosRevisionDeArea } from "../../src/utils/revision";

const evaluacion = {
  areas: [
    { id: "SM", nombre: "Sensoriomotora", estadoId: "A", aciertosIndividuales: 5, totalPreguntas: 6 },
    { id: "CL", nombre: "Comunicación y Lenguaje", estadoId: "E", aciertosIndividuales: undefined, totalPreguntas: undefined },
  ],
};

describe("datosRevisionDeArea", () => {
  it("arma los datos de la revisión con los valores frescos del área", () => {
    expect(datosRevisionDeArea(evaluacion, "SM")).toEqual({ id: "SM", nombre: "Sensoriomotora", score: 5, total: 6, statusId: "A" });
  });

  it("un área sin aciertos todavía cuenta 0 de 0", () => {
    expect(datosRevisionDeArea(evaluacion, "CL")).toEqual({ id: "CL", nombre: "Comunicación y Lenguaje", score: 0, total: 0, statusId: "E" });
  });

  it("null si el área no está o no hay datos", () => {
    expect(datosRevisionDeArea(evaluacion, "SE")).toBeNull();
    expect(datosRevisionDeArea(null, "SM")).toBeNull();
    expect(datosRevisionDeArea({ areas: undefined }, "SM")).toBeNull();
  });
});
