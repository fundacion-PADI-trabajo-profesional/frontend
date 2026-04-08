// src/pages/CambiarContrasenaTemporal.tsx
import { useState, useEffect, type FormEvent } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  LinearProgress,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LockResetIcon from "@mui/icons-material/LockReset";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useNavigate } from "react-router-dom";
import { updatePasswordUser } from "../api/auth";

/**
 * Página de activación de cuenta para usuarios invitados por el Equipo PADI.
 * El usuario llega aquí desde el link del email de invitación de Supabase.
 * Supabase incluye access_token y refresh_token en el hash de la URL.
 * Reutiliza el mismo endpoint /auth/update-password que el reset de contraseña.
 */
export default function CambiarContrasenaTemporal() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tokens, setTokens] = useState({ access: "", refresh: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Leer tokens del hash de la URL al cargar (Supabase los manda así en el link de invitación)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.replace("#", "?"));
      setTokens({
        access: params.get("access_token") || "",
        refresh: params.get("refresh_token") || "",
      });
    }
  }, []);

  const inputSx = {
    mb: 2,
    bgcolor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 2,
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      "& fieldset": { borderColor: "transparent" },
      "&:hover fieldset": { borderColor: "#5fb878" },
      "&.Mui-focused fieldset": { borderColor: "#5fb878" },
    },
  };

  // Indicador de fuerza de contraseña
  const getPasswordStrength = (pwd: string): number => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getPasswordStrength(newPassword);
  const strengthColor = ["#e53e3e", "#dd6b20", "#d69e2e", "#38a169", "#2f855a"][strength];
  const strengthLabel = ["Muy débil", "Débil", "Regular", "Fuerte", "Muy fuerte"][strength];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!tokens.access || !tokens.refresh) {
      setError("El link de activación es inválido o ya expiró. Pedile al Equipo PADI que te reenvíe la invitación.");
      return;
    }

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);

    try {
      await updatePasswordUser(tokens.access, tokens.refresh, newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setError(err.message || "No se pudo activar la cuenta. Intentá de nuevo o pedí una nueva invitación.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Fondo */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/assets/images/chicos-mascaras.jpeg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: -1,
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.25)",
          },
        }}
      />

      {/* Card */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 480,
          mx: 2,
          p: { xs: 4, sm: 5 },
          borderRadius: 4,
          bgcolor: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(25px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.4)",
        }}
      >
        {/* Ícono y título */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: "#e8f5e9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <LockResetIcon sx={{ fontSize: 36, color: "#65944F" }} />
          </Box>
          <Typography variant="h5" fontWeight={700} color="#333">
            Activar cuenta
          </Typography>
          <Typography variant="body2" color="#666" mt={1}>
            ¡Bienvenido/a al Sistema PADI! Elegí una contraseña para activar tu cuenta.
          </Typography>
        </Box>

        {success ? (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 56, color: "#65944F", mb: 2 }} />
            <Typography variant="h6" color="#333" fontWeight={600}>
              ¡Cuenta activada!
            </Typography>
            <Typography variant="body2" color="#555" mt={1}>
              Serás redirigido al inicio de sesión en unos segundos...
            </Typography>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              placeholder="Nueva contraseña"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              sx={inputSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: "#555" }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Indicador de fuerza */}
            {newPassword.length > 0 && (
              <Box sx={{ mb: 2, px: 0.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={(strength / 4) * 100}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: "#e0e0e0",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: strengthColor,
                      borderRadius: 3,
                    },
                  }}
                />
                <Typography variant="caption" sx={{ color: strengthColor, fontWeight: 600 }}>
                  {strengthLabel}
                </Typography>
                <Typography variant="caption" color="#999" ml={1}>
                  · Mínimo 6 caracteres
                </Typography>
              </Box>
            )}

            <TextField
              fullWidth
              placeholder="Confirmar contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={inputSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: "#555" }} />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading}
              sx={{
                mt: 1,
                py: 1.5,
                bgcolor: "#65944F",
                color: "white",
                fontWeight: 600,
                fontSize: "1rem",
                borderRadius: 30,
                textTransform: "none",
                boxShadow: "0 4px 14px rgba(101,148,79,0.39)",
                "&:hover": {
                  bgcolor: "#558040",
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 20px rgba(101,148,79,0.29)",
                },
                transition: "0.3s",
              }}
            >
              {isLoading ? "Activando cuenta..." : "Activar cuenta"}
            </Button>
          </form>
        )}
      </Box>
    </Box>
  );
}
