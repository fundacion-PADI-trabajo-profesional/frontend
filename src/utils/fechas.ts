/**
 * Fechas de evaluación.
 *
 * La fecha de una evaluación es el día en que se carga: el formulario manda
 * `YYYY-MM-DD` (día local) y el backend lo guarda como la medianoche UTC de
 * ese día. Por eso se muestra siempre leída en UTC: leída en hora argentina
 * (UTC-3) se vería el día anterior a las 21:00.
 */

export function fechaLocalISO(fecha: Date = new Date()): string {
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** "16/10/2026" */
export function formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}

/** "16 de octubre de 2026" */
export function formatearFechaLarga(fecha: Date): string {
    return fecha.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
