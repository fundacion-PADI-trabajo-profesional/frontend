// src/pages/GestionUsuariosPage.tsx
import { useEffect } from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import GestionUsuarios from "../components/GestionUsuarios";

/**
 * Página dedicada a la gestión de usuarios del sistema.
 * Solo accesible para usuarios con rol equipo_padi.
 * La protección por rol se aplica en App.tsx.
 */
export default function GestionUsuariosPage() {
  const navigate = useNavigate();

  // Doble verificación client-side: si no es equipo_padi, vuelve al home
  useEffect(() => {
    const profile = localStorage.getItem("padiProfile");
    if (!profile) { navigate("/login"); return; }
    try {
      const parsed = JSON.parse(profile);
      if (parsed.rol !== "equipo_padi") navigate("/home");
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6f8" }}>
      {/* Header */}
      <Box sx={{ bgcolor: "#f5f5f5", py: 4, borderBottom: "1px solid #e0e0e0" }}>
        <Container maxWidth="lg">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/home")}
            sx={{ color: "#5c7cfa", textTransform: "none", mb: 2 }}
          >
            Volver al inicio
          </Button>
          <Typography variant="h4" fontWeight={700} color="#2c3e50">
            Gestión de Usuarios
          </Typography>
          <Typography variant="body1" color="#666" mt={0.5}>
            Creá, invitá y administrá los usuarios del sistema.
          </Typography>
        </Container>
      </Box>

      {/* Contenido */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <GestionUsuarios />
      </Container>
    </Box>
  );
}
