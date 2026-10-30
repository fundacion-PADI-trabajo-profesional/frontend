import { useState, type FormEvent } from "react";
import { Alert, Box, Button, TextField, Typography, InputAdornment } from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { solicitarReenvioInvitacion } from "../../api/auth";

interface Props {
    /** Texto corto arriba del campo, para explicar qué pasa al pedirlo. */
    descripcion?: string;
}

const MENSAJE_POR_DEFECTO = "Si tu cuenta está pendiente de activación, en unos minutos te llega un correo con un link nuevo.";

/**
 * Autoservicio del link de activación: la docente escribe su correo y recibe una
 * invitación nueva sin pasar por el Equipo PADI. La respuesta es la misma exista o
 * no la cuenta, así que el texto de éxito lo pone el backend.
 */
export default function FormularioReenvioInvitacion({ descripcion }: Props) {
    const [email, setEmail] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState<string | null>(null);
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        const limpio = email.trim();
        if (!limpio) {
            setError("Escribí tu correo electrónico.");
            return;
        }
        setEnviando(true);
        try {
            const respuesta = await solicitarReenvioInvitacion(limpio);
            setEnviado(respuesta?.message || MENSAJE_POR_DEFECTO);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "No se pudo pedir el link. Intentá de nuevo en unos minutos.");
        } finally {
            setEnviando(false);
        }
    };

    if (enviado) {
        return (
            <Alert severity="success" sx={{ borderRadius: 2 }} data-reenvio="enviado">
                {enviado}
            </Alert>
        );
    }

    return (
        <Box component="form" onSubmit={handleSubmit} data-reenvio="formulario">
            {descripcion && (
                <Typography variant="body2" sx={{ color: "#555", mb: 2 }}>{descripcion}</Typography>
            )}
            {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
            )}
            <TextField
                fullWidth
                type="email"
                placeholder="Tu correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <EmailOutlinedIcon sx={{ color: "#555" }} />
                        </InputAdornment>
                    ),
                }}
            />
            <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={enviando}
                sx={{ py: 1.3, borderRadius: 2, textTransform: "none", fontWeight: 700, bgcolor: "#65944F", "&:hover": { bgcolor: "#558040" } }}
            >
                {enviando ? "Enviando…" : "Pedir un link nuevo"}
            </Button>
        </Box>
    );
}
