/**
 * Lectura del link de activación de cuenta.
 *
 * Supabase vuelve al frontend con los datos en el hash de la URL: si el link
 * está vigente trae `access_token` y `refresh_token`; si venció o ya se usó trae
 * `error=access_denied` y `error_code=otp_expired` (u otro código). Los links
 * duran lo que diga "Email OTP expiration" del proyecto (tope 24 horas).
 */

export type MotivoLinkInutilizable = "vencido" | "invalido" | "sin_link";

export interface EstadoLinkActivacion {
    access: string;
    refresh: string;
    /** Hay tokens: se puede fijar la contraseña. */
    utilizable: boolean;
    motivo: MotivoLinkInutilizable | null;
}

export function leerHashActivacion(hash: string): EstadoLinkActivacion {
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const access = params.get("access_token") ?? "";
    const refresh = params.get("refresh_token") ?? "";
    if (access && refresh) return { access, refresh, utilizable: true, motivo: null };
    const motivo: MotivoLinkInutilizable = params.get("error_code") === "otp_expired"
        ? "vencido"
        : params.get("error") || params.get("error_code") ? "invalido" : "sin_link";
    return { access, refresh, utilizable: false, motivo };
}
