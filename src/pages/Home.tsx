"use client"

import { Box, Container, Typography, Button, Grid2 as Grid } from "@mui/material"
import LogoutIcon from "@mui/icons-material/Logout"

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
          // AQUÍ ESTÁ EL ARREGLO:
          backgroundImage: "url(/assets/images/1366_2000.jpg)", 
          // --------------------
          backgroundSize: "cover",
          backgroundPosition: "center",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(219, 159, 159, 0.3)", // El overlay
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontFamily: "Georgia, serif",
              fontWeight: 400,
              color: "white",
              mb: 3,
              fontSize: { xs: "2.5rem", md: "3.5rem" },
              lineHeight: 1.3,
            }}
          >
            Empieza tu aventura de aprendizaje en casa
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "white",
              mb: 4,
              fontWeight: 400,
            }}
          >
            Solo 20 €/mes y puedes cancelar en cualquier momento
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              bgcolor: "#d4e157",
              color: "#000",
              px: 6,
              py: 2,
              fontSize: "1rem",
              fontWeight: 600,
              borderRadius: 0,
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
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  fontSize: "4rem",
                  color: "#5c7cfa",
                  mb: 2,
                }}
              >
                🎒
              </Box>
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  fontFamily: "Georgia, serif",
                  fontWeight: 400,
                  mb: 2,
                }}
              >
                Motivos semanales
              </Typography>
              <Typography variant="body1" sx={{ color: "#666", lineHeight: 1.7 }}>
                Cada programa tiene un motivo semanal y actividades propias para que tu hijo espere algo nuevo cada
                semana.
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  fontSize: "4rem",
                  color: "#5c7cfa",
                  mb: 2,
                }}
              >
                ✨
              </Box>
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  fontFamily: "Georgia, serif",
                  fontWeight: 400,
                  mb: 2,
                }}
              >
                Tus propios materiales
              </Typography>
              <Typography variant="body1" sx={{ color: "#666", lineHeight: 1.7 }}>
                Podrás utilizar y reciclar los materiales que ya tienes en casa para completar las actividades
                didácticas.
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  fontSize: "4rem",
                  color: "#5c7cfa",
                  mb: 2,
                }}
              >
                🔢
              </Box>
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  fontFamily: "Georgia, serif",
                  fontWeight: 400,
                  mb: 2,
                }}
              >
                Aprendizaje por edad
              </Typography>
              <Typography variant="body1" sx={{ color: "#666", lineHeight: 1.7 }}>
                Nuestros programas están diseñados para dos grupos de edades, de modo que cada lección ofrece un nivel
                de participación adecuado.
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
              borderRadius: 0,
              textTransform: "none",
              "&:hover": {
                bgcolor: "#333",
              },
            }}
          >
            Leer más
          </Button>
        </Box>
      </Container>

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
              <Typography
                variant="h3"
                component="h2"
                sx={{
                  fontFamily: "Georgia, serif",
                  fontWeight: 400,
                  mb: 3,
                }}
              >
                Aumenta su confianza creativa
              </Typography>
              <Typography variant="body1" sx={{ color: "#666", lineHeight: 1.8, fontSize: "1.1rem" }}>
                Cada estímulo de actividad creativa es una oportunidad para que tu hijo adopte un nuevo desafío.
                Mediante el aprendizaje práctico, es más probable que se comprometa con la tarea y que aumente sus
                habilidades de resolución creativa de problemas.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  )
}
