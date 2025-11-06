"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import { getEvaluacionesInstancias, eliminarEvaluacionInstancia, type EvaluacionInstancia } from "../api/evaluaciones"

export default function EvaluacionesList({ onEditar }: { 
  onEditar: (evaluacion: EvaluacionInstancia) => void 
}) {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionInstancia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEvaluaciones()
  }, [])

  const loadEvaluaciones = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getEvaluacionesInstancias()
      setEvaluaciones(data)
      console.log("[v0] Evaluaciones cargadas:", data)
    } catch (err: any) {
      setError(err.message || "Error al cargar las evaluaciones")
      console.error("[v0] Error loading evaluaciones:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta evaluación?")) {
      return
    }

    try {
      await eliminarEvaluacionInstancia(id)
      setEvaluaciones(evaluaciones.filter((e) => e.id !== id))
      console.log("[v0] Evaluación eliminada:", id)
    } catch (err: any) {
      alert(err.message || "Error al eliminar la evaluación")
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "N":
        return "warning"
      case "C":
        return "success"
      case "R":
        return "error"
      default:
        return "default"
    }
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case "N":
        return "No iniciada"
      case "C":
        return "Completada"
      case "R":
        return "Revisada"
      default:
        return estado
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "diagnostico":
        return "Diagnóstico"
      case "seguimiento":
        return "Seguimiento"
      case "cierre":
        return "Cierre"
      default:
        return tipo
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  if (evaluaciones.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" sx={{ color: "#999", mb: 2 }}>
          No hay evaluaciones registradas
        </Typography>
        <Typography variant="body2" sx={{ color: "#ccc" }}>
          Comienza creando una nueva evaluación
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead sx={{ bgcolor: "#f5f5f5" }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Estudiante ID</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>
              Sala
            </TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              Puntaje
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>
              Acciones
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {evaluaciones.map((evaluacion) => (
            <TableRow key={evaluacion.id} hover>
              <TableCell>{evaluacion.estudianteId}</TableCell>
              <TableCell align="center">{evaluacion.salaId}</TableCell>
              <TableCell>{getTipoLabel(evaluacion.tipoId)}</TableCell>
              <TableCell>
                <Chip
                  label={getEstadoLabel(evaluacion.estadoId)}
                  color={getEstadoColor(evaluacion.estadoId)}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell align="right">{evaluacion.puntaje ?? "-"}</TableCell>
              <TableCell align="center">
                <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                  <Button size="small" variant="outlined" startIcon={<EditIcon />} sx={{ textTransform: "none" }} onClick={() => onEditar(evaluacion)}>
                    Editar
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(evaluacion.id)}
                    sx={{ textTransform: "none" }}
                  >
                    Eliminar
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
