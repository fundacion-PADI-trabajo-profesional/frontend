import { useState, useEffect } from "react";
import { Box, CircularProgress, Container, Typography, AppBar, Toolbar, Button, Avatar, Chip } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import { useNavigate } from "react-router-dom";
import Perfil from "./Perfil";
import DocenteDashboard from "./dashboards/DocenteDashboard";
import DirectivoDashboard from "./dashboards/DirectivoDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";

interface HomeProps {
  onLogout: () => void;
}

export default function Home({ onLogout }: HomeProps) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

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

  // Redirección si no hay usuario
  useEffect(() => {
    if (!localStorage.getItem("padiUser")) {
      navigate("/login");
    }
  }, [navigate]);

  const handleProfileUpdate = async (updatedProfile: any) => {
    setProfile(updatedProfile);
    localStorage.setItem("padiProfile", JSON.stringify(updatedProfile));
  };

  if (loadingUser) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress sx={{ color: "#A3BE54" }} />
      </Box>
    );
  }

  if (!profile) return null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6f8" }}>
      {/* --- NAVBAR SUPERIOR (Común para todos) --- */}
      <AppBar position="static" sx={{ bgcolor: "white", color: "#333", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <Toolbar>
          {/* Logo Chico */}
          <Box
            component="img"
            src="/assets/images/logo_sin_fondo.png"
            alt="PADI"
            sx={{ height: 40, mr: 2, cursor: "pointer" }}
            onClick={() => navigate("/")} // Reset al home
          />

          <Box sx={{ flexGrow: 1 }} />

          {/* Info Usuario */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                {profile.nombre} {profile.apellido}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                <Chip
                  label={profile.rol.replace("_", " ").toUpperCase()}
                  size="small"
                  sx={{ height: 20, fontSize: "0.65rem", bgcolor: "#A3BE54", color: "white" }}
                />
                {profile.rol === "director" && profile.escuela?.nombre && (
                  <Chip
                    label={profile.escuela.nombre}
                    size="small"
                    sx={{ height: 20, fontSize: "0.65rem", bgcolor: "#1976d2", color: "white" }}
                  />
                )}
              </Box>
            </Box>

            <Avatar sx={{ bgcolor: "#e0e0e0", color: "#666" }}>
              {profile.nombre?.charAt(0) || <PersonIcon />}
            </Avatar>

            <Button
              size="small"
              startIcon={<PersonIcon />}
              onClick={() => setModalOpen(true)}
              sx={{ color: "#666", textTransform: "none" }}
            >
              Perfil
            </Button>
            <Button
              size="small"
              startIcon={<LogoutIcon />}
              onClick={onLogout}
              color="error"
              sx={{ textTransform: "none" }}
            >
              Salir
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* --- CONTENIDO SEGÚN ROL --- */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {profile.rol === "docente" && <DocenteDashboard />}

        {profile.rol === "director" && <DirectivoDashboard />}

        {/* Podés separarlos si querés, por ahora los agrupo */}
        {(profile.rol === "encargado_zona" || profile.rol === "equipo_padi") && (
          <AdminDashboard rol={profile.rol} />
        )}

        {/* Mensaje por defecto si el rol está roto */}
        {!["docente", "director", "encargado_zona", "equipo_padi"].includes(profile.rol) && (
          <Typography color="error">Rol de usuario desconocido: {profile.rol}</Typography>
        )}
      </Container>

      {/* Modal de Perfil */}
      {user && (
        <Perfil
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          user={user}
          profile={profile}
          onUpdateSuccess={handleProfileUpdate}
        />
      )}
    </Box>
  );
}