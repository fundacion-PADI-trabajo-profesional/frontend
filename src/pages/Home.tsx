"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Container,
  Typography,
  Button,
  Grid2 as Grid,
  CircularProgress, // Importado para el estado de carga
} from "@mui/material"
import LogoutIcon from "@mui/icons-material/Logout"
import PersonIcon from "@mui/icons-material/Person"
import styles from "frontend/src/App.css"
import { supabase } from "../api/auth"
import Perfil from "./Perfil" // Importa el componente Perfil

interface HomeProps {
  onLogout: () => void
}

export default function Home({ onLogout }: HomeProps) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null) // Estado para la tabla 'usuarios'
  const [loadingUser, setLoadingUser] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  // Función para cargar AMBOS, auth user y datos de 'usuarios'
  const loadUserData = async (authUser: any) => {
    if (!authUser) {
      setUser(null)
      setProfile(null)
      setLoadingUser(false)
      return
    }

    setUser(authUser) // Guarda el usuario de auth (email, rol)
    setLoadingUser(true)

    // Ahora busca en la tabla 'usuarios'
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("usuarios") // Nombre de tu tabla
        .select("*")
        .eq("email", authUser.email) // Asumo que usas email para linkear
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching profile:", profileError.message)
      }

      setProfile(profileData) // Guarda el perfil (nombre, apellido, rol)
    } catch (e: any) {
      console.error(e.message)
    }
    setLoadingUser(false)
  }

  useEffect(() => {
    // 1. Obtener el usuario actual al cargar
    const fetchInitialUser = async () => {
      const { data } = await supabase.auth.getUser()
      await loadUserData(data?.user)
    }

    fetchInitialUser()

    // 2. Escuchar cambios de autenticación (login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await loadUserData(session?.user)
      }
    )

    // 3. Limpiar el listener
    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const handleOpenModal = () => setModalOpen(true)
  const handleCloseModal = () => setModalOpen(false)

  // Esta función refrescará todo
  const handleProfileUpdate = async () => {
    setLoadingUser(true)
    await supabase.auth.refreshSession()
    const { data } = await supabase.auth.getUser()
    await loadUserData(data?.user) // Recarga user Y profile
  }

  // --- NUEVA FUNCIÓN ---
  // Renderiza el contenido principal según el rol del usuario
  const renderRoleContent = () => {
    // 1. Mostrar spinner mientras carga el perfil
    if (loadingUser) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 10 }}>
          <CircularProgress />
        </Box>
      )
    }

    // 2. Manejar error si no se encuentra el perfil
    if (!profile) {
      return (
        <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
          <Typography variant="h5" color="error">
            Error de Perfil
          </Typography>
          <Typography>
            No pudimos cargar la información de tu perfil. Por favor, contacta a
            un administrador.
          </Typography>
        </Container>
      )
    }

    // 3. Renderizar vistas según el rol
    const role = profile.rol

    switch (role) {
      case "docente":
        // El 'docente' ve la página principal estándar
        return (
          <>
            {/* --- Sección de 3 Columnas --- */}
            <Container maxWidth="lg" sx={{ py: 8 }}>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ textAlign: "center" }}>
                    <Box sx={{ fontSize: "4rem", color: "#5c7cfa", mb: 2 }}>
                      📚
                    </Box>
                    <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                      Formación a Docentes
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "#666", lineHeight: 1.7 }}
                    >
                      Capacitamos a maestros y profesionales de la escuela para
                      implementar el programa y asegurar su sostenibilidad a
                      largo plazo.
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ textAlign: "center" }}>
                    <Box sx={{ fontSize: "4rem", color: "#5c7cfa", mb: 2 }}>
                      🧒
                    </Box>
                    <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                      Evaluación y Detección
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "#666", lineHeight: 1.7 }}
                    >
                      Evaluamos a alumnos de salas de 3, 4 y 5 años con la
                      Prueba PADI para detectar a tiempo riesgos en el
                      desarrollo.
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ textAlign: "center" }}>
                    <Box sx={{ fontSize: "4rem", color: "#5c7cfa", mb: 2 }}>
                      👨‍👩‍👧‍👦
                    </Box>
                    <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                      Talleres a Familias
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "#666", lineHeight: 1.7 }}
                    >
                      Incluimos una instancia de taller para las familias sobre
                      crianza, gestión de emociones y herramientas de
                      estimulación.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              {/* --- BOTÓN --- */}
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
                    "&:hover": {
                      bgcolor: "#333",
                    },
                  }}
                >
                  Conocer el Programa
                </Button>
              </Box>
            </Container>

            {/* --- Sección 'Nuestra Misión' --- */}
            <Box sx={{ bgcolor: "#f5f5f5", py: 8 }}>
              <Container maxWidth="lg">
                <Grid container spacing={6} alignItems="center">
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box
                      component="img"
                      src="/assets/images/1366_2000.jpg"
                      alt="Creative learning"
                      sx={{
                        width: "100%",
                        height: "auto",
                        display: "block",
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h3" component="h2" sx={{ mb: 3 }}>
                      Nuestra Misión
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: "#666",
                        lineHeight: 1.8,
                        fontSize: "1.1rem",
                      }}
                    >
                      Que todos los niños y niñas de Nivel Inicial de nuestro
                      país puedan desarrollar todas sus habilidades para
                      acceder a la Escuela Primaria y alcanzar los objetivos de
                      aprendizaje que impactarán en toda su escolaridad.
                    </Typography>
                  </Grid>
                </Grid>
              </Container>
            </Box>
          </>
        )

      case "director":
        // El 'director' ve un panel de bienvenida diferente
        return (
          <Container maxWidth="lg" sx={{ py: 8 }}>
            <Typography variant="h4" component="h2" sx={{ mb: 3 }}>
              Panel del Director
            </Typography>
            <Typography variant="body1">
              Bienvenido, Director. Desde aquí puede gestionar los programas, ver
              estadísticas de evaluación y administrar los talleres asignados a
              los docentes.
            </Typography>
            {/* Aquí podrías agregar componentes específicos para el Director */}
          </Container>
        )

      case "administrador":
        // El 'administrador' ve otro panel
        return (
          <Container maxWidth="lg" sx={{ py: 8 }}>
            <Typography variant="h4" component="h2" sx={{ mb: 3 }}>
              Panel de Administración
            </Typography>
            <Typography variant="body1">
              Bienvenido, Administrador. Desde aquí puede gestionar los usuarios
              del sistema, asignar roles y configurar los parámetros de la
              aplicación.
            </Typography>
            {/* Aquí podrías agregar componentes de gestión de usuarios, etc. */}
          </Container>
        )

      default:
        // Manejo de un rol no reconocido
        return (
          <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
            <Typography variant="h5" color="error">
              Rol no reconocido
            </Typography>
            <Typography>
              Tu cuenta tiene un rol ({role}) que no es válido. Contacta a un
              administrador.
            </Typography>
          </Container>
        )
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
      {/* --- SECCIÓN HERO (Visible para todos) --- */}
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
        <Container
          maxWidth="md"
          sx={{ position: "relative", zIndex: 1, textAlign: "center" }}
        >
          <Typography
            variant="h2"
            component="h1"
            sx={{
              textTransform: "uppercase",
              textShadow: "2px 2px 5px rgba(0, 0, 0, 0.5)",
              color: "white",
              mb: 3,
              fontSize: { xs: "2.5rem", md: "3.5rem" },
              lineHeight: 1.3,
            }}
          >
            FUNDACIÓN PADI
          </Typography>
          <Typography
            variant="h6"
            sx={{
              textShadow: "2px 2px 5px rgba(0, 0, 0, 0.5)",
              color: "white",
              mb: 4,
              fontWeight: 400,
            }}
          >
            Somos una fundación que se dedica a mejorar las oportunidades
            educativas de niños y niñas de nivel inicial.
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
              "&:hover": {
                bgcolor: "#c0ca33",
              },
            }}
          >
            Ver los programas
          </Button>
        </Container>

        {/* --- BOTONES DE USUARIO (Visible para todos) --- */}
        <Box
          sx={{
            position: "absolute",
            top: 20,
            right: 20,
            zIndex: 2,
            display: "flex",
            gap: 1.5,
          }}
        >
          <Button
            onClick={handleOpenModal}
            startIcon={<PersonIcon />}
            disabled={loadingUser || !user}
            sx={{
              color: "white",
              bgcolor: "rgba(0,0,0,0.3)",
              "&:hover": {
                bgcolor: "rgba(0,0,0,0.5)",
              },
            }}
          >
            Mi Perfil
          </Button>
          <Button
            onClick={onLogout}
            startIcon={<LogoutIcon />}
            sx={{
              color: "white",
              bgcolor: "rgba(0,0,0,0.3)",
              "&:hover": {
                bgcolor: "rgba(0,0,0,0.5)",
              },
            }}
          >
            Cerrar Sesión
          </Button>
        </Box>
      </Box>

      {/* --- CONTENIDO CONDICIONAL POR ROL --- */}
      {/* Ya no está el contenido estático aquí, 
          ahora se llama a la función */}
      {renderRoleContent()}

      {/* --- RENDERIZAR EL MODAL (Visible para todos) --- */}
      {!loadingUser && user && (
        <Perfil // <-- Nombre del componente
          open={modalOpen}
          onClose={handleCloseModal}
          user={user}
          profile={profile} // Pasa el perfil de la tabla 'usuarios'
          onUpdateSuccess={handleProfileUpdate}
        />
      )}
    </Box>
  )
}