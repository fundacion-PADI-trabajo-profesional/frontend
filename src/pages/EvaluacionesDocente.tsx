"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Box, Container, CircularProgress, Alert, Typography } from "@mui/material"
import { getEvaluacionesInstanciasByProfesor, type EvaluacionInstancia } from "../api/evaluaciones"
import EvaluacionesTable from "../components/EvaluacionesTable"
import PageHeader from "../components/PageHeader"

export default function EvaluacionesDocente() {
  const [searchParams] = useSearchParams()
  const profesorId = searchParams.get("profesorId") || ""
  const nombre = searchParams.get("nombre") || ""

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<EvaluacionInstancia[]>([])

  useEffect(() => {
    const load = async () => {
      if (!profesorId) {
        setError("Falta profesorId")
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const data = await getEvaluacionesInstanciasByProfesor(profesorId, { limit: 50 })
        setItems(data)
      } catch (e: any) {
        setError(e.message || "Error al cargar evaluaciones")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [profesorId])

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
      <PageHeader
        backTo="/docentes"
        backLabel="Volver a docentes"
        title={nombre ? `Evaluaciones de ${nombre}` : "Evaluaciones del docente"}
      />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : items.length === 0 ? (
          <Typography sx={{ color: "#666" }}>No hay evaluaciones registradas para este docente.</Typography>
        ) : (
          <EvaluacionesTable items={items} showEstudiante />
        )}
      </Container>
    </Box>
  )
}


