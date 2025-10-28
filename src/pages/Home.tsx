"use client"

import { Box, Container, Typography, Button, Grid2 as Grid } from "@mui/material"
import LogoutIcon from "@mui/icons-material/Logout"
import styles from 'frontend/src/App.css';
import { supabase } from "../api/auth"
const user = supabase.auth.getUser()
interface HomeProps {
  onLogout: () => void
}

export default function Home({ onLogout }: HomeProps) {
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
            backgroundColor: "rgba(0, 0, 0, 0.6)", // El overlay
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{                   // Peso bold
              textTransform: "uppercase",           // Mayúsculas
              textShadow: "2px 2px 5px rgba(0, 0, 0, 0.5)", // ¡La sombra!
              
              // Tus estilos anteriores
              color: "white",
              mb: 3,
              fontSize: { xs: "2.5rem", md: "3.5rem" },
              lineHeight: 1.3,
            }}
          >
            FUNDACIÓN PADI
          </Typography>onLogin

          {/* --- SUBTÍTULO MODIFICADO --- */}
          <Typography
            variant="h6"
            sx={{
              // Cambios aquí
              textShadow: "2px 2px 5px rgba(0, 0, 0, 0.5)", // ¡La sombra!

              // Tus estilos anteriores
              color: "white",
              mb: 4,
              fontWeight: 400, // Peso regular (está bien)
            }}
          >
            Somos una fundación que se dedica a mejorar las
            oportunidades educativas de niños y niñas de nivel inicial.
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

        <Button
          onClick={onLogout}
          startIcon={<LogoutIcon />}
          sx={{
            position: "absolute",
            top: 20,
            right: 20,
            zIndex: 2,
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

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={6}>
          {/* --- COLUMNA 1: FORMACIÓN A DOCENTES --- */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  fontSize: "4rem",
                  color: "#5c7cfa",
                  mb: 2,
                }}
              >
                📚
              </Box>
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  mb: 2,
                }}
              >
                Formación a Docentes
              </Typography>
              <Typography variant="body1" sx={{ color: "#666", lineHeight: 1.7 }}>
                Capacitamos a maestros y profesionales de la escuela para
                implementar el programa y asegurar su sostenibilidad a largo
                plazo.
              </Typography>
            </Box>
          </Grid>

          {/* --- COLUMNA 2: EVALUACIÓN Y DETECCIÓN --- */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  fontSize: "4rem",
                  color: "#5c7cfa",
                  mb: 2,
                }}
              >
                🧒
              </Box>
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  mb: 2,
                }}
              >
                Evaluación y Detección
              </Typography>
              <Typography variant="body1" sx={{ color: "#666", lineHeight: 1.7 }}>
                Evaluamos a alumnos de salas de 3, 4 y 5 años con la Prueba PADI
                para detectar a tiempo riesgos en el desarrollo.
              </Typography>
            </Box>
          </Grid>

          {/* --- COLUMNA 3: TALLERES A FAMILIAS --- */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  fontSize: "4rem",
                  color: "#5c7cfa",
                  mb: 2,
                }}
              >
                👨‍👩‍👧‍👦
              </Box>
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  mb: 2,
                }}
              >
                Talleres a Familias
              </Typography>
              <Typography variant="body1" sx={{ color: "#666", lineHeight: 1.7 }}>
                Incluimos una instancia de taller para las familias sobre
                crianza, gestión de emociones y herramientas de estimulación.
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* --- BOTÓN MODIFICADO --- */}
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

      <Box sx={{ bgcolor: "#f5f5f5", py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            {/* --- IMAGEN (SIN CAMBIOS) --- */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                component="img"
                src="/assets/images/1366_2000.jpg"
                alt="Creative learning"
                sx={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  // Si le habías puesto el filtro de oscuridad, iría aquí:
                  // filter: "brightness(60%)" 
                }}
              />
            </Grid>
            
            {/* --- TEXTO (MODIFICADO) --- */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="h3"
                component="h2"
                sx={{
                  mb: 3,
                }}
              >
                Nuestra Misión
              </Typography>
              <Typography variant="body1" sx={{ color: "#666", lineHeight: 1.8, fontSize: "1.1rem" }}>
                Que todos los niños y niñas de Nivel Inicial de nuestro país
                puedan desarrollar todas sus habilidades para acceder a la
                Escuela Primaria y alcanzar los objetivos de aprendizaje que
                impactarán en toda su escolaridad.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  )
}
