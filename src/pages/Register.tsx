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

// export default function Register() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [nombre, setNombre] = useState("");
//   const [apellido, setApellido] = useState("");
//   const [rol, setRol] = useState("docente");
//   const [error, setError] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [success, setSuccess] = useState("");
//   const navigate = useNavigate();

//   const handleRolChange = (event: SelectChangeEvent) => setRol(event.target.value);

//   const handleRegister = async (e: FormEvent) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");
//     setIsLoading(true);

//     try {
//       await register(
//         formData.email,
//         formData.password,
//         formData.nombre,
//         formData.apellido,
//         formData.rol
//       );
//       setSuccess("¡Registro exitoso! Serás redirigido para iniciar sesión.");
//       // Redirect to login after a short delay
//       setTimeout(() => navigate("/login"), 2500);
//     } catch (err: any) {
//       setError(err.message || "Ocurrió un error durante el registro.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nombre: "",
    apellido: "",
    rol: "docente",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await register(
        formData.email,
        formData.password,
        formData.nombre,
        formData.apellido,
        formData.rol
      );
      setSuccess("¡Registro exitoso! Serás redirigido para iniciar sesión.");
      // Redirect to login after a short delay
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error durante el registro.");
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
            value={formData.nombre}
            name = "nombre"
            onChange={handleChange}
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
            value={formData.apellido}
            name = "apellido"
            onChange={handleChange}
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
            value={formData.email}
            name = "email"
            onChange={handleChange}
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
            value={formData.password}
            name = "password"
            onChange={handleChange}
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
              value={formData.rol}
              name="rol"
              label="Rol"
              onChange={handleChange}
            >
              <MenuItem value="docente">Docente</MenuItem>
              <MenuItem value="director">Director</MenuItem>
              <MenuItem value="encargado_zona">Encargado de zona</MenuItem>
              <MenuItem value="equipo_padi">Equipo PADI</MenuItem>
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
