"use client"

import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  Box, Container, Typography, Button, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, CircularProgress, Alert, Chip
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { getEvaluacionesInstanciasByEstudiante, type EvaluacionInstancia } from "../api/evaluaciones"

function getEstadoColor(estado: string) {
  switch (estado) {
    case "N": return "warning"
    case "C": return "success"
    case "R": return "error"
    default: return "default"
  }
}
function getEstadoLabel(estado: string) {
  switch (estado) {
    case "N": return "No iniciada"
    case "C": return "Completada"
    case "R": return "Revisada"
    default: return estado
  }
}
function getTipoLabel(tipo: string) {
  switch (tipo) {
    case "diagnostico": return "Diagnóstico"
    case "seguimiento": return "Seguimiento"
    case "cierre": return "Cierre"
    default: return tipo
  }
}

export default function HistorialEstudiante() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
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
      <Box sx={{ bgcolor: "#f5f5f5", py: 4, borderBottom: "1px solid #e0e0e0" }}>
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/estudiantes")} sx={{ color: "#5c7cfa", textTransform: "none" }}>
              Volver a estudiantes
            </Button>
          </Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            {estudianteNombre ? `Historial de ${estudianteNombre}` : "Historial del estudiante"}
          </Typography>
          <Typography variant="body1" sx={{ color: "#666" }}>
            Listado de evaluaciones realizadas
          </Typography>
        </Container>
      </Box>

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
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Sala</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Puntaje</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((e) => (
                    <TableRow key={e.id} hover>
                      <TableCell>{getTipoLabel(e.tipoId)}</TableCell>
                      <TableCell>
                        <Chip
                          label={getEstadoLabel(e.estadoId)}
                          color={getEstadoColor(e.estadoId)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{e.salaId}</TableCell>
                      <TableCell align="right">{e.puntaje ?? "-"}</TableCell>
                      <TableCell>{e.createdAt.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        )}
      </Container>
    </Box>
  )
}


