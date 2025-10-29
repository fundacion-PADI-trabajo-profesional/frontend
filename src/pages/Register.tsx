// src/pages/Register.tsx
import { useState, type FormEvent } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { register } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [rol, setRol] = useState("docente");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleRolChange = (event: SelectChangeEvent) => setRol(event.target.value);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password || !nombre || !apellido || !rol) {
      setError("Completa todos los campos");
      return;
    }

    try {
      // la función register la tenés en ../api/auth
      const user = await register(email, password, nombre, apellido, rol);

      // Si tu register devuelve el usuario, guardamos un profile básico en localStorage
      if (user) {
        const profile = { email, nombre, apellido, rol };
        localStorage.setItem("padiProfile", JSON.stringify(profile));
        setSuccess("Cuenta creada: " + (user.email || email));
        // opcional: guardar un padiUser (mock)
        localStorage.setItem("padiUser", JSON.stringify({ email, nombre, apellido, rol }));
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setSuccess("Cuenta creada. Por favor logueate.");
        setTimeout(() => navigate("/login"), 1200);
      }

      setEmail("");
      setPassword("");
      setNombre("");
      setApellido("");
      setRol("docente");
    } catch (err: any) {
      setError("No se pudo crear la cuenta: " + (err.message || err));
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f4f4f4",
        p: 4,
      }}
    >
      <Button
        onClick={() => navigate("/login")}
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          bgcolor: "rgba(0, 0, 0, 0.8)",
          color: "white",
          width: 56,
          height: 56,
          borderRadius: 3,
          "&:hover": {
            bgcolor: "rgba(0, 0, 0, 0.9)",
          },
        }}
      >
        <ArrowBackIcon sx={{ fontSize: 32 }} />
      </Button>
      <Box
        sx={{
          maxWidth: 500,
          width: "100%",
          p: 4,
          borderRadius: 3,
          bgcolor: "white",
          boxShadow: 3,
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Crear Cuenta
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleRegister}>
          <TextField
            fullWidth
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineIcon />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            placeholder="Apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineIcon />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AlternateEmailIcon />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon />
                </InputAdornment>
              ),
            }}
          />

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="rol-label">Rol</InputLabel>
            <Select
              labelId="rol-label"
              id="rol"
              value={rol}
              label="Rol"
              onChange={handleRolChange}
            >
              <MenuItem value="docente">Docente</MenuItem>
              <MenuItem value="director">Director</MenuItem>
              <MenuItem value="administrador">Administrador</MenuItem>
            </Select>
          </FormControl>

          <Button type="submit" variant="contained" fullWidth sx={{ py: 1.5, bgcolor: "#A3BE54", color: "#1a1a1a", fontWeight: 600 }}>
            Registrarse
          </Button>
        </form>
      </Box>
    </Box>
  );
}
