import type { Aula } from "../api/aulas";

export function filtrarAulasParaEstudiante(
  aulas: Aula[],
  escuelaId: string,
  salaId: string,
): Aula[] {
  return aulas.filter(
    (a) =>
      a.escuela_id === escuelaId &&
      (!salaId || String(a.sala_id) === salaId),
  );
}

export function filtrarAulasDisponibles(
  todasLasAulas: Aula[],
  docente: { escuelas?: { id: string }[]; aulas?: { id: string }[] },
): Aula[] {
  const escuelaIds = new Set((docente.escuelas || []).map((e) => e.id));
  const asignadasIds = new Set((docente.aulas || []).map((a) => a.id));
  return todasLasAulas.filter(
    (a) => escuelaIds.has(a.escuela_id) && !asignadasIds.has(a.id),
  );
}
