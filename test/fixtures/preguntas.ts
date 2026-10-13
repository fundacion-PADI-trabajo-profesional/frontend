import type { PreguntaBase } from "../../src/api/evaluaciones";

const base = (id: string, numero: number, titulo: string, consigna: string, extra: Partial<PreguntaBase> = {}): PreguntaBase => ({
  id, numero, titulo, consigna, aprueba_con: "criterio " + id, ...extra,
});

/** Sala 4, Comunicación y Lenguaje: ocho pautas, Intrusos con tres partes, dos de cuatro partes. */
export const SALA4_CL: PreguntaBase[] = [
  base("cl1", 1, "Usa el lenguaje para satisfacer sus necesidades", "¿Se apoya en el lenguaje oral para pedir ayuda?"),
  base("cl2", 2, "Usa el lenguaje para compartir algo que vio o vivió", "¿Puede contar experiencias vividas?"),
  base("cl3", 3, "Articulación", "¿Habla de manera clara, logrando la correcta producción de los sonidos del habla?"),
  base("cl4", 4, "Frases completas", "¿Elabora frases completas de 5 o 6 palabras?"),
  base("cl5", 5, "Sonido Inicial", "¿Reconoce el sonido inicial de palabras que empiezan con vocal?"),
  base("cl6a", 6, "Intrusos", "¿Reconoce cuál NO es un Animal (Silla) e identifica la categoría Animales?"),
  base("cl6b", 6, "Intrusos", "¿Reconoce cuál NO es Comida (Pelota) e identifica la categoría Comida?"),
  base("cl6c", 6, "Intrusos", "¿Reconoce cuál NO es Ropa (Pato) e identifica la categoría Ropa?"),
  base("cl7a", 7, "Responde a preguntas lógicamente", "¿Puede explicar qué debe hacer cuando tiene sueño?"),
  base("cl7b", 7, "Responde a preguntas lógicamente", "¿Puede explicar qué debe hacer cuando tiene las manos sucias?"),
  base("cl7c", 7, "Responde a preguntas lógicamente", "¿Puede explicar qué debe hacer cuando tiene frío?"),
  base("cl7d", 7, "Responde a preguntas lógicamente", "¿Puede explicar qué debe hacer cuando tiene hambre?"),
  base("cl8a", 8, "Nombra objetos de la vida diaria según su uso", "¿Puede nombrar una cuchara y decir para qué sirve?"),
  base("cl8b", 8, "Nombra objetos de la vida diaria según su uso", "¿Puede nombrar una pelota y decir para qué sirve?"),
  base("cl8c", 8, "Nombra objetos de la vida diaria según su uso", "¿Puede nombrar una taza y decir para qué sirve?"),
  base("cl8d", 8, "Nombra objetos de la vida diaria según su uso", "¿Puede nombrar una silla y decir para qué sirve?"),
];

/** Socioemocional: pauta simple invertida (aprueba con NO). */
export const SE_RECEPTIVIDAD: PreguntaBase = base("se1", 1, "Receptividad",
  "¿Con frecuencia evita el contacto visual, no responde al nombre o no contesta cuando se le habla?", { puntaje_invertido: true });

/** Absurdo verbal, sala 5: cinco partes. */
export const CL5_ABSURDO: PreguntaBase[] = ["helado", "zapatillas", "tijera", "auto", "vacas"].map((t, i) =>
  base("ab" + i, 6, "Absurdo verbal", "Responde correctamente: " + t));

export const pauta = (preguntas: PreguntaBase[], numero: number) => {
  const partes = preguntas.filter((p) => p.numero === numero);
  return { clave: String(numero), numero, titulo: partes[0].titulo ?? "", partes };
};
