// src/pages/Home.tsx
import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  CircularProgress,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import Perfil from "./Perfil";
import { useNavigate } from "react-router-dom";

interface HomeProps {
  onLogout: () => void;
}

export default function Home({ onLogout }: HomeProps) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  // Carga de datos desde localStorage como fallback (sin supabase)
  const loadUserData = async () => {
    setLoadingUser(true);
    try {
      const storedUser = localStorage.getItem("padiUser");
      const storedProfile = localStorage.getItem("padiProfile");
      setUser(storedUser ? JSON.parse(storedUser) : null);
      setProfile(storedProfile ? JSON.parse(storedProfile) : null);
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  const handleProfileUpdate = async () => {
    // recarga desde localStorage
    await loadUserData();
  };

  // Si no hay usuario autenticado, redirijo a login
  useEffect(() => {
    if (!localStorage.getItem("padiUser")) {
      navigate("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderRoleContent = () => {
    if (loadingUser) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 10 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!profile) {
      return (
        <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
          <Typography variant="h5" color="error">
            Error de Perfil
          </Typography>
          <Typography>No pudimos cargar la información de tu perfil.</Typography>
        </Container>
      );
    }

    const role = profile.rol;

    if (role === "docente") {
      return (
        <>
          <Container maxWidth="lg" sx={{ py: 8 }}>
            <Grid container spacing={6}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Box sx={{ fontSize: "4rem", color: "#5c7cfa", mb: 2 }}>📚</Box>
                  <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                    Formación a Docentes
                  </Typography>
                  <Typography variant="body1" sx={{ color: "#666", lineHeight: 1.7 }}>
                    Capacitamos a maestros y profesionales de la escuela para implementar el programa.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Box sx={{ fontSize: "4rem", color: "#5c7cfa", mb: 2 }}>🧒</Box>
                  <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                    Evaluación y Detección
                  </Typography>
                  <Typography variant="body1" sx={{ color: "#666", lineHeight: 1.7 }}>
                    Evaluamos a alumnos con la Prueba PADI para detectar riesgos.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: "center" }}>
                  <Box sx={{ fontSize: "4rem", color: "#5c7cfa", mb: 2 }}>👨‍👩‍👧‍👦</Box>
                  <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                    Talleres a Familias
                  </Typography>
                  <Typography variant="body1" sx={{ color: "#666", lineHeight: 1.7 }}>
                    Talleres para familias sobre crianza y gestión emocional.
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ textAlign: "center", mt: 6 }}>
              <Button
                variant="contained"
                size="large"
                sx={{
                  bgcolor: "#000",
                  color: "#fff",
                  px: 6,
                  py: 2,
                  fontSize: "1rem",
                  fontWeight: 600,
                  borderRadius: 3,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#333" },
                }}
              >
                Conocer el Programa
              </Button>
            </Box>
          </Container>

          <Box sx={{ bgcolor: "#f5f5f5", py: 8 }}>
            <Container maxWidth="lg">
              <Grid container spacing={6} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box
                    component="img"
                    src="/assets/images/1366_2000.jpg"
                    alt="Creative learning"
                    sx={{ width: "100%", height: "auto", display: "block" }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h3" component="h2" sx={{ mb: 3 }}>
                    Nuestra Misión
                  </Typography>
                  <Typography variant="body1" sx={{ color: "#666", lineHeight: 1.8, fontSize: "1.1rem" }}>
                    Que todos los niños y niñas de Nivel Inicial desarrollen sus habilidades para acceder a la Escuela Primaria.
                  </Typography>
                </Grid>
              </Grid>
            </Container>
          </Box>
        </>
      );
    }

    if (role === "director") {
      return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h4" component="h2" sx={{ mb: 3 }}>
            Panel del Director
          </Typography>
          <Typography variant="body1">
            Bienvenido, Director. Desde aquí puede gestionar los programas y ver estadísticas.
          </Typography>
        </Container>
      );
    }

    if (role === "administrador") {
      return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h4" component="h2" sx={{ mb: 3 }}>
            Panel de Administración
          </Typography>
          <Typography variant="body1">
            Bienvenido, Administrador. Desde aquí puede gestionar usuarios y roles.
          </Typography>
        </Container>
      );
    }

    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h5" color="error">
          Rol no reconocido
        </Typography>
        <Typography>Tu cuenta tiene un rol ({profile?.rol}) que no es válido.</Typography>
      </Container>
    );
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
      <Box
        sx={{
          position: "relative",
          height: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "url(/assets/images/1366_2000.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <Typography variant="h2" component="h1" sx={{ textTransform: "uppercase", textShadow: "2px 2px 5px rgba(0,0,0,0.5)", color: "white", mb: 3, fontSize: { xs: "2.5rem", md: "3.5rem" }, lineHeight: 1.3 }}>
            FUNDACIÓN PADI
          </Typography>
          <Typography variant="h6" sx={{ textShadow: "2px 2px 5px rgba(0,0,0,0.5)", color: "white", mb: 4, fontWeight: 400 }}>
            Somos una fundación que se dedica a mejorar las oportunidades educativas de niños y niñas de nivel inicial.
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              bgcolor: "#A3BE54",
              color: "#000",
              px: 6,
              py: 2,
              fontSize: "1rem",
              fontWeight: 600,
              borderRadius: 10,
              textTransform: "none",
              "&:hover": { bgcolor: "#c0ca33" },
            }}
          >
            Ver los programas
          </Button>
        </Container>

        <Box sx={{ position: "absolute", top: 20, right: 20, zIndex: 2, display: "flex", gap: 1.5 }}>
          <Button onClick={handleOpenModal} startIcon={<PersonIcon />} disabled={loadingUser || !user} sx={{ color: "white", bgcolor: "rgba(0,0,0,0.3)", "&:hover": { bgcolor: "rgba(0,0,0,0.5)" } }}>
            Mi Perfil
          </Button>
          <Button onClick={onLogout} startIcon={<LogoutIcon />} sx={{ color: "white", bgcolor: "rgba(0,0,0,0.3)", "&:hover": { bgcolor: "rgba(0,0,0,0.5)" } }}>
            Cerrar Sesión
          </Button>
        </Box>
      </Box>

      {renderRoleContent()}

      {!loadingUser && user && (
        <Perfil open={modalOpen} onClose={handleCloseModal} user={user} profile={profile} onUpdateSuccess={handleProfileUpdate} />
      )}
    </Box>
  );
}
