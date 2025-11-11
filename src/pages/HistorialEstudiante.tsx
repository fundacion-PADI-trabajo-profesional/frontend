"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Box, Container, Typography, CircularProgress, Alert } from "@mui/material"
import { getEvaluacionesInstanciasByEstudiante, type EvaluacionInstancia } from "../api/evaluaciones"
import EvaluacionesTable from "../components/EvaluacionesTable"
import PageHeader from "../components/PageHeader"

export default function HistorialEstudiante() {
  const [searchParams] = useSearchParams()
  const estudianteId = searchParams.get("estudianteId") || ""
  const estudianteNombre = searchParams.get("nombre") || ""

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<EvaluacionInstancia[]>([])

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
      <PageHeader
        backTo="/estudiantes"
        backLabel="Volver a estudiantes"
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
            <EvaluacionesTable items={items} />
          )
        )}
      </Container>
    </Box>
  )
}


