"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Box, Container, Typography, Button, Tabs, Tab } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useNavigate, useSearchParams } from "react-router-dom"
import EvaluacionesList from "../components/EvaluacionesList"
import EvaluacionForm from "../components/EvaluacionForm"
import type { EvaluacionInstancia } from "../api/evaluaciones"; // <--- IMPORTA EL TIPO

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
    if (evaluarAhora) {
      setPrefillEstudianteId(evaluarAhora)
      setTabValue(1)
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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
      {/* Header */}
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

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="evaluaciones tabs">
            <Tab label="Mis Evaluaciones" id="evaluacion-tab-0" />
            <Tab label="Nueva Evaluación" id="evaluacion-tab-1" />
          </Tabs>
        </Box>

        {/* Evaluaciones List Tab */}
        <TabPanel value={tabValue} index={0}>
          <EvaluacionesList 
            key={refreshKey} // <-- Clave para forzar refresh
            onEditar={handleEditar} // <-- Prop para iniciar edición
          />
        </TabPanel>

        {/* New Evaluacion Form Tab */}
        <TabPanel value={tabValue} index={1}>
          <EvaluacionForm
            onSuccess={handleSuccess} // <-- Prop de éxito actualizada
            evaluacionAEditar={evaluacionAEditar} // <-- Pasa la evaluación a editar
            profile={profile}
            prefillEstudianteId={prefillEstudianteId || undefined}
          />
        </TabPanel>
      </Container>
    </Box>
  )
}
