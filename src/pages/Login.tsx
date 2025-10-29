// src/pages/Login.tsx
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
import { login } from "../api/auth"; // mantiene tu implementación real de auth

interface LoginProps {
  onLogin: () => void;
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
      // 1. Call the API function that hits YOUR backend
      const user = await login(username, password);

      // 2. If successful, call the function from App.tsx to update the global state
      onLogin(user);

      // No need to navigate here, App.tsx will handle it automatically
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
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "url(/assets/images/niniosTristes.jpeg)",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(5px)",
          zIndex: -1,
        }}
      />

      <Box
        sx={{
          display: "flex",
          width: "100%",
          maxWidth: 1200,
          margin: "auto",
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <Box
          sx={{
            flex: 1,
            position: "relative",
            backgroundColor: "rgba(236, 236, 236, 0.8)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            justifyContent: "center",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.1)",
            },
          }}
        >
          <Box>
            <img
              src="/assets/images/logo_sin_fondo.png"
              alt="Logo PADI Fundación"
              style={{ width: "100%", height: "auto", maxWidth: 360 }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            bgcolor: "rgba(101, 148, 79, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 4, sm: 6 },
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 400 }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontWeight: 600,
                mb: 4,
                color: "#1a1a1a",
                textAlign: "center",
                fontSize: { xs: "2rem", sm: "2.5rem" },
              }}
            >
              Welcome !
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
                  bgcolor: "white",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "& fieldset": { borderColor: "transparent" },
                    "&:hover fieldset": { borderColor: "#5fb878" },
                    "&.Mui-focused fieldset": { borderColor: "#5fb878" },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: "#A3BE54" }} />
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
                  mb: 3,
                  bgcolor: "white",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "& fieldset": { borderColor: "transparent" },
                    "&:hover fieldset": { borderColor: "#5fb878" },
                    "&.Mui-focused fieldset": { borderColor: "#5fb878" },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: "#A3BE54" }} />
                    </InputAdornment>
                  ),
                }}
                autoComplete="current-password"
              />

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Button
                  sx={{
                    color: "#666",
                    textTransform: "none",
                    fontSize: "0.875rem",
                    "&:hover": {
                      bgcolor: "transparent",
                      color: "#A3BE54",
                    },
                  }}
                >
                  Forgot Password ?
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    py: 1.5,
                    px: 5,
                    bgcolor: "#A3BE54",
                    color: "#1a1a1a",
                    fontSize: "1rem",
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: "uppercase",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: "#8bc34a",
                      boxShadow: "0 4px 12px rgba(139, 195, 74, 0.3)",
                    },
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? "Cargando..." : "LOGIN"}
                </Button>
              </Box>
            </form>

            <Button
              onClick={() => navigate("/register")}
              variant="outlined"
              sx={{
                mt: 2,
                color: "#1a1a1a",
                borderColor: "#A3BE54",
                "&:hover": { borderColor: "#8bc34a" },
              }}
            >
              Crear cuenta nueva
            </Button>

            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 3,
                textAlign: "center",
                color: "#999",
                fontSize: "0.75rem",
              }}
            >
              Tip: Iniciá sesión con tu email y contraseña registrados
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
