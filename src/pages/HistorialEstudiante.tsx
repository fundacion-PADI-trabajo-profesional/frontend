"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Box, Container, Typography, CircularProgress, Alert } from "@mui/material"
import { getEvaluacionesInstanciasByEstudiante, eliminarEvaluacionInstancia, type EvaluacionInstancia } from "../api/evaluaciones"
import EvaluacionesTable from "../components/EvaluacionesTable"
import PageHeader from "../components/PageHeader"
import EvaluacionDetalle from "../components/EvaluacionDetalle"

export default function HistorialEstudiante() {
  const [searchParams] = useSearchParams()
  const estudianteId = searchParams.get("estudianteId") || ""
  const estudianteNombre = searchParams.get("nombre") || ""
  const backTo = searchParams.get("backTo") || "/estudiantes"
  const backLabel = searchParams.get("backLabel") || "Volver a estudiantes"

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<EvaluacionInstancia[]>([])
  const [selectedEvaluacionId, setSelectedEvaluacionId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem("padiUser")
    if (stored) {
      try { setUserRole(JSON.parse(stored).rol || "") } catch { setUserRole("") }
    }
  }, [])

  const canDelete = userRole === "encargado_zona" || userRole === "equipo_padi"

  const handleDeleteEvaluacion = async (evaluacion: EvaluacionInstancia) => {
    if (!window.confirm("¿Seguro que querés eliminar esta evaluación?")) return
    try {
      const stored = localStorage.getItem("padiUser");
      const user = stored ? JSON.parse(stored) : null;
      const userInfo = {
        userId: user?.id,
        userRole: user?.rol
      };
      await eliminarEvaluacionInstancia(evaluacion.id, userInfo)
      setItems((prev) => prev.filter((e) => e.id !== evaluacion.id))
    } catch (e: any) {
      alert(e.message || "Error al eliminar la evaluación")
    }
  }

  useEffect(() => {
    if (!estudianteId) {
      setError("Falta estudianteId")
      setLoading(false)
      return
    }
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getEvaluacionesInstanciasByEstudiante(estudianteId, { limit: 50, offset: 0 })
        setItems(data)
      } catch (e: any) {
        setError(e.message || "Error al cargar el historial")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [estudianteId])

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
      {selectedEvaluacionId ? (
        <>
          <PageHeader
            backTo="#"
            backLabel="Volver al historial"
            title={estudianteNombre ? `Detalle de evaluación de ${estudianteNombre}` : "Detalle de evaluación"}
            subtitle="Resultado por área y estado actual de la evaluación"
            onBack={() => setSelectedEvaluacionId(null)}
          />
          <Container maxWidth="sm" sx={{ py: 4 }}>
            <EvaluacionDetalle
              evaluacionId={selectedEvaluacionId}
              onBack={() => setSelectedEvaluacionId(null)}
            />
          </Container>
        </>
      ) : (
        <>
          <PageHeader
            backTo={backTo}
            backLabel={backLabel}
            title={estudianteNombre ? `Historial de ${estudianteNombre}` : "Historial del estudiante"}
            subtitle="Listado de evaluaciones realizadas"
          />

          <Container maxWidth="lg" sx={{ py: 4 }}>
            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {!loading && !error && (
              items.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Typography variant="h6" sx={{ color: "#999", mb: 2 }}>
                    No hay evaluaciones registradas para este estudiante
                  </Typography>
                </Box>
              ) : (
                <EvaluacionesTable
                  items={items}
                  onRowClick={(evaluacion) => setSelectedEvaluacionId(evaluacion.id)}
                  onDelete={canDelete ? handleDeleteEvaluacion : undefined}
                />
              )
            )}
          </Container>
        </>
      )}
    </Box>
  )
}


