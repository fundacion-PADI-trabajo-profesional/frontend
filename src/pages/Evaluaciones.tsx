"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Box, Container, Typography, Button, Tabs, Tab } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useNavigate, useSearchParams } from "react-router-dom"
import EvaluacionesList from "../components/EvaluacionesList"
import EvaluacionForm from "../components/EvaluacionForm"
import type { EvaluacionInstancia } from "../api/evaluaciones"; // <--- IMPORTA EL TIPO
import EvaluacionDetalle from "../components/EvaluacionDetalle"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`evaluacion-tabpanel-${index}`}
      aria-labelledby={`evaluacion-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 4 }}>{children}</Box>}
    </div>
  )
}

export default function Evaluaciones() {
  const [tabValue, setTabValue] = useState(0)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any | null>(null)
  const [evaluacionAEditar, setEvaluacionAEditar] = useState<EvaluacionInstancia | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Para refrescar la lista
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [prefillEstudianteId, setPrefillEstudianteId] = useState<string | null>(null)
  // Estado para controlar qué evaluación se está VIENDO en detalle
  const [evaluacionSeleccionadaId, setEvaluacionSeleccionadaId] = useState<string | null>(null);


  useEffect(() => {
    // Load profile from localStorage
    const storedProfile = localStorage.getItem("padiProfile")
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile))
    } else {
      navigate("/home")
    }
  }, [navigate])

  // Si venimos desde Estudiantes con ?evaluarAhora=<id>, abrir pestaña "Nueva Evaluación" y prellenar
  useEffect(() => {
    const evaluarAhora = searchParams.get("evaluarAhora")
    const crear = searchParams.get("crear") // <--- LEER EL NUEVO PARÁMETRO

    if (evaluarAhora) {
      setPrefillEstudianteId(evaluarAhora)
      setTabValue(1) // Cambia a pestaña "Nueva Evaluación"
    } else if (crear === "true") {
      setPrefillEstudianteId(null) // Nos aseguramos de limpiar cualquier ID previo
      setTabValue(1) // Cambia a pestaña "Nueva Evaluación"
    }
  }, [searchParams])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
    // Si el usuario cambia de pestaña manualmente, limpiamos el estado de edición
    if (newValue === 0) {
      setEvaluacionAEditar(null);
    }
  }

  const handleEditar = (evaluacion: EvaluacionInstancia) => {
    // Si la evaluación es 'No iniciada' ('N') o 'En Progreso' ('E'),
    // el objetivo del "Editar" es ir a la pantalla de detalle/continuar.
    // Como no tenemos el componente de detalle, por ahora simulamos la edición
    // redirigiendo al formulario (como estaba) o lanzando una acción.

    // --- NUEVO FLUJO ---
    // En un proyecto real, aquí navegarías a: navigate(`/evaluaciones/${evaluacion.id}/detalle`)

    // MANTENEMOS EL COMPORTAMIENTO ACTUAL POR EL MOMENTO (volver a la pestaña 1),
    // pero con la lógica de edición. La implementación de la vista de detalle
    // (`EvaluacionDetalle.tsx`) sería el siguiente paso.
    setEvaluacionAEditar(evaluacion); // Guarda la evaluación a editar
    setTabValue(1); // Cambia a la pestaña del formulario
  };

  // --- NUEVA FUNCIÓN ---
  // Esta se la pasamos al formulario
  const handleSuccess = () => {
    setTabValue(0); // Vuelve a la lista
    setEvaluacionAEditar(null); // Limpia el estado de edición
    setRefreshKey(prevKey => prevKey + 1); // Cambia la 'key' para forzar refresh de la lista
  };

  // Only docentes should access this page
  if (profile && profile.rol !== "docente") {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h5" color="error">
          Acceso denegado
        </Typography>
        <Typography>Solo los docentes pueden acceder a las evaluaciones.</Typography>
        <Button onClick={() => navigate("/home")} sx={{ mt: 3, color: "#A3BE54" }}>
          Volver a inicio
        </Button>
      </Container>
    )
  }

  const handleVerEvaluacion = (evaluacion: EvaluacionInstancia) => {
    // Guardamos el ID de la evaluación seleccionada
    setEvaluacionSeleccionadaId(evaluacion.id);
    // Ocultamos tabs para centrar la vista en el detalle (opcional, o podemos dejar el tab activo)
  };

  const handleVolverALista = () => {
    setEvaluacionSeleccionadaId(null);
    setRefreshKey(prev => prev + 1); // Refrescar por si hubo cambios de estado
  };

  const handleSuccessForm = () => {
    setTabValue(0);
    setEvaluacionAEditar(null);
    setRefreshKey(prev => prev + 1);
  };

  if (profile && profile.rol !== "docente") {
    // ... (Código de acceso denegado igual) ...
    return null; // Abreviado para ejemplo
  }

  // Si hay una evaluación seleccionada, mostramos SU DETALLE ocupando todo el área de contenido
  if (evaluacionSeleccionadaId) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
        {/* Header simple para el detalle */}
        <Box sx={{ bgcolor: "#f5f5f5", py: 2, borderBottom: "1px solid #e0e0e0" }}>
          <Container maxWidth="lg">
            <Typography variant="body2" color="text.secondary">Evaluaciones / Detalle del Alumno</Typography>
          </Container>
        </Box>

        <Container maxWidth="sm" sx={{ py: 4 }}>
          <EvaluacionDetalle
            evaluacionId={evaluacionSeleccionadaId}
            onBack={handleVolverALista}
          />
        </Container>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
      {/* Header Principal */}
      <Box sx={{ bgcolor: "#f5f5f5", py: 4, borderBottom: "1px solid #e0e0e0" }}>
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/home")}
              sx={{ color: "#5c7cfa", textTransform: "none" }}
            >
              Volver a inicio
            </Button>
          </Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Evaluaciones PADI
          </Typography>
          <Typography variant="body1" sx={{ color: "#666" }}>
            Gestiona las evaluaciones y carga los resultados de tus alumnos
          </Typography>
        </Container>
      </Box>

      {/* Contenido Tabs */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="evaluaciones tabs">
            <Tab label="Mis Evaluaciones" id="evaluacion-tab-0" />
            <Tab label="Nueva Evaluación" id="evaluacion-tab-1" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <EvaluacionesList
            key={refreshKey}
            onEditar={handleVerEvaluacion} // <--- Ahora pasamos la función que abre el detalle
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <EvaluacionForm
            onSuccess={handleSuccessForm}
            evaluacionAEditar={null} // Por ahora solo creación en esta pestaña
            profile={profile}
            prefillEstudianteId={prefillEstudianteId || undefined}
          />
        </TabPanel>
      </Container>
    </Box>
  )
}
