import { useState, type FormEvent } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { user, profile, session } = await login(username, password);

      if (session && session.access_token) {
        localStorage.setItem("token", session.access_token);
      }

      if (session && session.refresh_token) {
        localStorage.setItem("refreshToken", session.refresh_token);
      }

      if (profile && profile.rol) {
        localStorage.setItem("userRole", profile.rol);
      }

      if (profile) {
        localStorage.setItem("padiProfile", JSON.stringify(profile));
      } else {
        localStorage.removeItem("padiProfile");
      }

      const combined = { ...user, ...(profile || {}) };
      onLogin(combined);
    } catch (err: any) {
      setError(err.message || "Credenciales inválidas. Por favor, intente de nuevo.");
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
        px: { xs: 2, sm: 3 },
        py: { xs: 4, md: 0 },
      }}
    >
      {/* IMAGEN DE FONDO */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "url(/assets/images/chicos-mascaras.jpeg)",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: -1,
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          }
        }}
      />

      {/* CONTENEDOR PRINCIPAL */}
      <Box
        sx={{
          display: "flex",
          width: "100%",
          maxWidth: 1000,
          margin: "auto",
          borderRadius: { xs: 3, md: 4 },
          overflow: "hidden",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
          flexDirection: "row",
        }}
      >
        {/* SECCIÓN IZQUIERDA (LOGO) — solo desktop */}
        <Box
          sx={{
            flex: 1,
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            justifyContent: "center",
            p: 4,
            bgcolor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
          }}
        >
          <img
            src="/assets/images/logo_sin_fondo.png"
            alt="Logo PADI Fundación"
            style={{
              width: "100%",
              height: "auto",
              maxWidth: 300,
              filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
            }}
          />
        </Box>

        {/* SECCIÓN FORMULARIO */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 3, sm: 5, md: 6 },
            bgcolor: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(25px)",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 400 }}>

            {/* LOGO compacto — solo mobile */}
            <Box sx={{ display: { xs: "flex", md: "none" }, justifyContent: "center", mb: 3 }}>
              <img
                src="/assets/images/logo_sin_fondo.png"
                alt="Logo PADI Fundación"
                style={{ width: 140, height: "auto" }}
              />
            </Box>

            <Typography
              variant="h5"
              sx={{
                textAlign: "center",
                mb: 4,
                color: "#333",
                fontWeight: 600,
                fontSize: { xs: "1.15rem", sm: "1.5rem" },
                textShadow: "0 1px 1px rgba(255,255,255,0.8)"
              }}
            >
              Ingresá a tu cuenta PADI
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                placeholder="Email"
                type="email"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{
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
                  "& input:-webkit-autofill": {
                    WebkitBoxShadow: "0 0 0 1000px rgba(255, 255, 255, 0.8) inset",
                    WebkitTextFillColor: "#000",
                    transition: "background-color 5000s ease-in-out 0s",
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: "#555" }} />
                    </InputAdornment>
                  ),
                }}
                autoComplete="email"
              />

              <TextField
                fullWidth
                placeholder="Password"
                type="password"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
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
                  "& input:-webkit-autofill": {
                    WebkitBoxShadow: "0 0 0 1000px rgba(255, 255, 255, 0.8) inset",
                    WebkitTextFillColor: "#000",
                    transition: "background-color 5000s ease-in-out 0s",
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: "#555" }} />
                    </InputAdornment>
                  ),
                }}
                autoComplete="current-password"
              />

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  mb: 1
                }}
              >
                <Button
                  onClick={() => navigate("/recuperar-password")}
                  sx={{
                    color: "#444",
                    textTransform: "none",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    "&:hover": {
                      bgcolor: "transparent",
                      color: "#000",
                      textDecoration: "underline"
                    },
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </Box>

              <Button
                type="submit"
                variant="contained"
                sx={{
                  py: 1.5,
                  mt: 2,
                  width: "100%",
                  maxWidth: { xs: "100%", sm: "200px" },
                  mx: "auto",
                  display: "block",
                  bgcolor: "#65944F",
                  color: "white",
                  fontSize: "1rem",
                  fontWeight: 600,
                  borderRadius: 30,
                  textTransform: "none",
                  boxShadow: "0 4px 14px 0 rgba(101, 148, 79, 0.39)",
                  transition: "0.3s",
                  "&:hover": {
                    bgcolor: "#558040",
                    transform: "translateY(-2px)",
                    boxShadow: "0 6px 20px 0 rgba(101, 148, 79, 0.29)",
                  },
                }}
                disabled={isLoading}
              >
                {isLoading ? "Cargando..." : "Iniciar Sesión"}
              </Button>
            </form>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: "#777", fontSize: "0.8rem" }}>
                Para acceder al sistema, comunicate con el Equipo PADI.
              </Typography>
            </Box>

          </Box>
        </Box>
      </Box>
    </Box>
  );
}