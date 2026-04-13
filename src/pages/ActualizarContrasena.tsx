import { useState, useEffect, type FormEvent } from "react";
import { Box, TextField, Button, Typography, Alert, InputAdornment } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import { updatePasswordUser } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function ActualizarContrasena() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tokens, setTokens] = useState({ access: "", refresh: "" });
  const [tokensReady, setTokensReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Atrapamos los tokens de la URL apenas carga la página
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      // Supabase manda los tokens después del # (ej: #access_token=123&refresh_token=456)
      const params = new URLSearchParams(hash.replace("#", "?"));
      const access = params.get("access_token") || "";
      const refresh = params.get("refresh_token") || "";

      if (!access || !refresh) {
        // CA2: enlace sin tokens → estado de error con opción de pedir uno nuevo
        setInvalidLink(true);
      } else {
        setTokens({ access, refresh });
      }
    } else {
      // CA2: llegaron a la página sin hash → enlace inválido
      setInvalidLink(true);
    }
    setTokensReady(true);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);

    try {
      await updatePasswordUser(tokens.access, tokens.refresh, password);
      setSuccess("¡Contraseña actualizada con éxito! Redirigiendo al login...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al actualizar la contraseña.");
    } finally {
      setIsLoading(false);
    }
  };

  // No renderizar hasta saber si los tokens son válidos (evita flash del form)
  if (!tokensReady) return null;

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f4f6f8" }}>
      <Box sx={{ width: "100%", maxWidth: 450, p: 4, bgcolor: "white", borderRadius: 4, boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>

        {/* CA2: enlace inválido o expirado */}
        {invalidLink ? (
          <>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <LinkOffIcon sx={{ fontSize: 56, color: "#e57373" }} />
            </Box>
            <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 700, mb: 1, color: "#333" }}>
              Enlace inválido o expirado
            </Typography>
            <Typography variant="body2" align="center" sx={{ color: "#666", mb: 3 }}>
              El enlace de recuperación que usaste no es válido o ya expiró.
              Podés solicitar uno nuevo ingresando tu correo electrónico.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate("/recuperar-password")}
              sx={{
                py: 1.5,
                bgcolor: "#65944F",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                mb: 1.5,
                "&:hover": { bgcolor: "#558040" },
              }}
            >
              Solicitar nuevo enlace
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => navigate("/login")}
              sx={{ textTransform: "none", color: "#555" }}
            >
              Volver al login
            </Button>
          </>
        ) : (
          <>
            <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 700, mb: 3, color: "#333" }}>
              Nueva Contraseña
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                type="password"
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: "#5fb878" }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: "#5fb878" }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading || success !== ""}
                sx={{
                  py: 1.5,
                  bgcolor: "#65944F",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#558040" },
                }}
              >
                {isLoading ? "Guardando..." : "Actualizar Contraseña"}
              </Button>
            </form>
          </>
        )}
      </Box>
    </Box>
  );
}