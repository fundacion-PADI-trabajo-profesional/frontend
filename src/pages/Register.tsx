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
  Select,
  MenuItem,
  IconButton,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MapIcon from "@mui/icons-material/Map";
import { register } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function Register() {
  // 1. EL ROL ARRANCA VACÍO
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nombre: "",
    apellido: "",
    rol: "",
    zona: "",
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

    // Validación simple para que no manden rol vacío
    if (!formData.rol) {
      setError("Por favor, seleccioná un rol.");
      return;
    }

    if (formData.rol === "encargado_zona" && !formData.zona) {
      setError("Por favor, indicá la zona asignada.");
      return;
    }

    setIsLoading(true);

    try {
      await register(
        formData.email,
        formData.password,
        formData.nombre,
        formData.apellido,
        formData.rol,
        formData.zona
      );
      setSuccess("¡Registro exitoso! Serás redirigido para iniciar sesión.");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error durante el registro.");
    } finally {
      setIsLoading(false);
    }
  };

  const commonInputSx = {
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
        py: 4
      }}
    >
      {/* IMAGEN DE FONDO */}
      <Box
        sx={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
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

      {/* BOTÓN VOLVER */}
      <IconButton
        onClick={() => navigate("/login")}
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          bgcolor: "rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(5px)",
          color: "white",
          border: "1px solid rgba(255,255,255,0.3)",
          "&:hover": {
            bgcolor: "rgba(255, 255, 255, 0.4)",
          },
          zIndex: 10
        }}
      >
        <ArrowBackIcon />
      </IconButton>

      <Box
        sx={{
          width: "100%",
          maxWidth: 550,
          margin: "auto",
          p: { xs: 4, sm: 5 },
          borderRadius: 4,

          bgcolor: "rgba(255, 255, 255, 0.65)",
          backdropFilter: "blur(25px)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center"
        }}
      >
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{
            color: "#333",
            fontWeight: 600,
            textShadow: "0 1px 1px rgba(255,255,255,0.8)",
            mb: 3
          }}
        >
          Crear Cuenta
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleRegister}>
          <TextField
            fullWidth
            placeholder="Nombre"
            value={formData.nombre}
            name="nombre"
            onChange={handleChange}
            sx={commonInputSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineIcon sx={{ color: "#555" }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            placeholder="Apellido"
            value={formData.apellido}
            name="apellido"
            onChange={handleChange}
            sx={commonInputSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineIcon sx={{ color: "#555" }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            placeholder="Email"
            type="email"
            value={formData.email}
            name="email"
            onChange={handleChange}
            sx={commonInputSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AlternateEmailIcon sx={{ color: "#555" }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            placeholder="Password"
            type="password"
            value={formData.password}
            name="password"
            onChange={handleChange}
            sx={commonInputSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: "#555" }} />
                </InputAdornment>
              ),
            }}
          />

          <FormControl fullWidth sx={{ mb: 3 }}>
            <Select
              displayEmpty
              id="rol"
              value={formData.rol}
              name="rol"
              onChange={handleChange}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.8)",
                borderRadius: 2,
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                color: formData.rol === "" ? "#999" : "#333",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#5fb878" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#5fb878" },
              }}
            >
              <MenuItem value="" disabled>
                Establecer Rol
              </MenuItem>

              <MenuItem value="docente">Docente</MenuItem>
              <MenuItem value="director">Director</MenuItem>
              <MenuItem value="encargado_zona">Encargado de zona</MenuItem>
              <MenuItem value="equipo_padi">Equipo PADI</MenuItem>
            </Select>
          </FormControl>

          {formData.rol === "encargado_zona" && (
            <TextField
              fullWidth
              placeholder="Zona Asignada"
              value={formData.zona}
              name="zona"
              onChange={handleChange}
              sx={commonInputSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MapIcon sx={{ color: "#555" }} />
                  </InputAdornment>
                ),
              }}
            />
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            sx={{
              py: 1.5,
              mt: 1,
              width: "100%",
              maxWidth: "200px",
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
          >
            {isLoading ? "Registrando..." : "Registrarse"}
          </Button>
        </form>
      </Box>
    </Box>
  );
}