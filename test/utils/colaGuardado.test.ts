import { describe, it, expect, vi } from "vitest";
import { crearColaGuardado } from "../../src/utils/colaGuardado";

/** Promesa controlada desde el test para simular un pedido en vuelo. */
function diferido() {
  let resolver!: () => void;
  let rechazar!: (e: unknown) => void;
  const promesa = new Promise<void>((res, rej) => { resolver = res; rechazar = rej; });
  return { promesa, resolver, rechazar };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("crearColaGuardado", () => {
  it("envía un ítem encolado con su id y valor", async () => {
    const enviar = vi.fn().mockResolvedValue(undefined);
    const cola = crearColaGuardado({ enviar });
    cola.encolar("q1", 1, null);
    await cola.vaciar();
    expect(enviar).toHaveBeenCalledTimes(1);
    expect(enviar).toHaveBeenCalledWith([{ id: "q1", answer: 1 }]);
  });

  it("dos toques a la misma parte antes de salir: un solo envío con el último valor", async () => {
    const d = diferido();
    const enviar = vi.fn().mockImplementationOnce(() => d.promesa).mockResolvedValue(undefined);
    const cola = crearColaGuardado({ enviar });
    cola.encolar("q0", 1, null);          // sale ya y queda en vuelo
    cola.encolar("q1", 1, null);          // espera
    cola.encolar("q1", null, null);       // pisa al anterior: se manda solo null
    d.resolver();
    await cola.vaciar();
    expect(enviar).toHaveBeenCalledTimes(2);
    expect(enviar.mock.calls[1][0]).toEqual([{ id: "q1", answer: null }]);
  });

  it("mientras hay un pedido en vuelo, los nuevos esperan y salen juntos", async () => {
    const d = diferido();
    const enviar = vi.fn().mockImplementationOnce(() => d.promesa).mockResolvedValue(undefined);
    const cola = crearColaGuardado({ enviar });
    cola.encolar("q0", 1, null);
    cola.encolar("q1", 0, null);
    cola.encolar("q2", 1, null);
    await tick();
    expect(enviar).toHaveBeenCalledTimes(1);
    d.resolver();
    await cola.vaciar();
    expect(enviar).toHaveBeenCalledTimes(2);
    expect(enviar.mock.calls[1][0]).toEqual([{ id: "q1", answer: 0 }, { id: "q2", answer: 1 }]);
  });

  it("si un envío falla, avisa con los ítems y su valor anterior, y sigue con el resto", async () => {
    const enviar = vi.fn().mockRejectedValueOnce(new Error("sin red")).mockResolvedValue(undefined);
    const onError = vi.fn();
    const cola = crearColaGuardado({ enviar, onError });
    cola.encolar("q1", 1, 0);
    await cola.vaciar();
    cola.encolar("q2", 0, null);
    await cola.vaciar();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toEqual([{ id: "q1", answer: 1, anterior: 0 }]);
    expect(enviar).toHaveBeenCalledTimes(2);
  });

  it("conserva el valor anterior original aunque la parte se toque varias veces antes de salir", async () => {
    const d = diferido();
    const enviar = vi.fn().mockImplementationOnce(() => d.promesa).mockRejectedValue(new Error("sin red"));
    const onError = vi.fn();
    const cola = crearColaGuardado({ enviar, onError });
    cola.encolar("q0", 1, null);
    cola.encolar("q1", 1, 0);   // el valor que había en la base era 0
    cola.encolar("q1", null, 1); // segundo toque: "anterior" desde la pantalla ya es 1, pero el original sigue siendo 0
    d.resolver();
    await cola.vaciar();
    expect(onError.mock.calls[0][0]).toEqual([{ id: "q1", answer: null, anterior: 0 }]);
  });

  it("informa cuántos guardados quedan pendientes", async () => {
    const d = diferido();
    const enviar = vi.fn().mockImplementationOnce(() => d.promesa).mockResolvedValue(undefined);
    const onCambio = vi.fn();
    const cola = crearColaGuardado({ enviar, onCambio });
    cola.encolar("q0", 1, null);
    cola.encolar("q1", 1, null);
    await tick();
    expect(cola.pendientes()).toBe(2);
    d.resolver();
    await cola.vaciar();
    expect(cola.pendientes()).toBe(0);
    expect(onCambio).toHaveBeenLastCalledWith(0);
  });
});
