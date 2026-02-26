"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Box, Container, Typography, Button } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useNavigate, useSearchParams } from "react-router-dom"
import EvaluacionesList from "../components/EvaluacionesList"
import EvaluacionForm from "../components/EvaluacionForm"
import type { EvaluacionInstancia } from "../api/evaluaciones";
import EvaluacionDetalle from "../components/EvaluacionDetalle"

export default function Evaluaciones() {
  const [profile, setProfile] = useState<any | null>(null)
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [prefillEstudianteId, setPrefillEstudianteId] = useState<string | null>(null)
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

  const backTo = searchParams.get("backTo") || "/home"
  const backLabel = searchParams.get("backLabel") || "Volver a inicio"

  useEffect(() => {
    const evaluarAhora = searchParams.get("evaluarAhora")
    const estudianteId = searchParams.get("estudianteId")
    const crear = searchParams.get("crear")

    if (evaluarAhora) {
      setPrefillEstudianteId(evaluarAhora)
    } else if (estudianteId) {
      setPrefillEstudianteId(estudianteId)
    } else if (crear === "true") {
      setPrefillEstudianteId(null)
    } else {
      setPrefillEstudianteId(null)
    }
  }, [searchParams])

  if (profile && profile.rol !== "docente" && profile.rol !== "director" && profile.rol !== "encargado_zona") {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h5" color="error">
          Acceso denegado
        </Typography>
        <Typography>No tenés permisos para acceder a las evaluaciones.</Typography>
        <Button onClick={() => navigate("/home")} sx={{ mt: 3, color: "#A3BE54" }}>
          Volver a inicio
        </Button>
      </Container>
    )
  }

  const handleVerEvaluacion = (evaluacion: EvaluacionInstancia) => {
    setEvaluacionSeleccionadaId(evaluacion.id);
  };

  const handleVolverALista = () => {
    setEvaluacionSeleccionadaId(null);
    setRefreshKey(prev => prev + 1); // Refrescar por si hubo cambios de estado
  };

  const handleSuccessForm = () => {
    setPrefillEstudianteId(null);
    setRefreshKey(prev => prev + 1);
    if (backTo !== "/home") {
      navigate(backTo, { replace: true });
    } else {
      navigate("/evaluaciones", { replace: true });
    }
  };

  const showCreateView = prefillEstudianteId !== null || searchParams.get("crear") === "true";

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
              onClick={() => navigate(backTo)}
              sx={{ color: "#5c7cfa", textTransform: "none" }}
            >
              {backLabel}
            </Button>
          </Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Evaluaciones PADI
          </Typography>
          <Typography variant="body1" sx={{ color: "#666" }}>
            Gestiona las evaluaciones y carga los resultados de tus estudiantes
          </Typography>
        </Container>
      </Box>

      {/* Contenido */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {showCreateView ? (
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(backTo, { replace: true })}
                sx={{ textTransform: "none" }}
              >
                {backLabel}
              </Button>
            </Box>
            <EvaluacionForm
              onSuccess={handleSuccessForm}
              evaluacionAEditar={null}
              profile={profile}
              prefillEstudianteId={prefillEstudianteId || undefined}
            />
          </>
        ) : (
          <EvaluacionesList
            key={refreshKey}
            onEditar={handleVerEvaluacion}
          />
        )}
      </Container>
    </Box>
  )
}
