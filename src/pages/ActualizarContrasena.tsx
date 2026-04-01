import { useState, useEffect, type FormEvent } from "react";
import { Box, TextField, Button, Typography, Alert, InputAdornment } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { updatePasswordUser } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function ActualizarContrasena() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tokens, setTokens] = useState({ access: "", refresh: "" });
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
      setTokens({
        access: params.get("access_token") || "",
        refresh: params.get("refresh_token") || "",
      });
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!tokens.access || !tokens.refresh) {
      setError("El link de recuperación es inválido o no contiene los permisos necesarios.");
      return;
    }
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

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f4f6f8" }}>
      <Box sx={{ width: "100%", maxWidth: 450, p: 4, bgcolor: "white", borderRadius: 4, boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
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
      </Box>
    </Box>
  );
}