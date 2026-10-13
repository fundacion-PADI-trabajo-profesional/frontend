/**
 * Cola de guardado de respuestas del wizard.
 *
 * La pantalla marca la respuesta al instante y la cola la manda al backend
 * por detrás, sin bloquear nada. Las reglas:
 * - Los envíos salen de a uno, en orden; mientras uno está en vuelo, los
 *   nuevos esperan y salen juntos en el siguiente pedido.
 * - Si la misma parte se toca varias veces antes de salir, se manda solo el
 *   último valor, con el valor original guardado por si hay que revertir.
 * - Si un envío falla, se avisa con los ítems y su valor anterior para que
 *   la pantalla los restaure, y la cola sigue con el resto.
 */

export interface ItemGuardado {
    id: string;
    answer: 0 | 1 | null;
}

export interface ItemFallido extends ItemGuardado {
    /** Lo que había antes del primer toque pendiente, para restaurarlo en pantalla. */
    anterior: number | null;
}

export interface ColaGuardado {
    encolar(id: string, valor: 0 | 1 | null, anterior: number | null): void;
    /** Ítems esperando más ítems en vuelo. */
    pendientes(): number;
    /** Se resuelve cuando no queda nada en vuelo ni esperando. */
    vaciar(): Promise<void>;
}

export function crearColaGuardado(opciones: {
    enviar: (items: ItemGuardado[]) => Promise<void>;
    onError?: (fallidos: ItemFallido[], error: unknown) => void;
    onCambio?: (pendientes: number) => void;
}): ColaGuardado {
    const esperando = new Map<string, { answer: 0 | 1 | null; anterior: number | null }>();
    let enVuelo: ItemFallido[] = [];
    let enviando = false;
    const esperas: (() => void)[] = [];

    const total = () => esperando.size + enVuelo.length;
    const notificar = () => opciones.onCambio?.(total());

    const procesar = async () => {
        if (enviando) return;
        enviando = true;
        while (esperando.size > 0) {
            enVuelo = Array.from(esperando, ([id, v]) => ({ id, answer: v.answer, anterior: v.anterior }));
            esperando.clear();
            notificar();
            try {
                await opciones.enviar(enVuelo.map(({ id, answer }) => ({ id, answer })));
            } catch (error) {
                opciones.onError?.(enVuelo, error);
            }
            enVuelo = [];
            notificar();
        }
        enviando = false;
        esperas.splice(0).forEach((resolver) => resolver());
    };

    return {
        encolar(id, valor, anterior) {
            const previo = esperando.get(id);
            esperando.set(id, { answer: valor, anterior: previo ? previo.anterior : anterior });
            notificar();
            void procesar();
        },
        pendientes: total,
        vaciar() {
            if (!enviando && esperando.size === 0) return Promise.resolve();
            return new Promise((resolver) => esperas.push(resolver));
        },
    };
}
