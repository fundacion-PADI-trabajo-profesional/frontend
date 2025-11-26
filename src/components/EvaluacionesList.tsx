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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { getEvaluacionesInstancias, eliminarEvaluacionInstancia, type EvaluacionInstancia } from "../api/evaluaciones"

export default function EvaluacionesList({ onEditar }: {
  onEditar: (evaluacion: EvaluacionInstancia) => void
}) {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionInstancia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [evaluacionToDelete, setEvaluacionToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  // 1. Abrir Modal
  const handleClickDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Evita que se dispare el click de la fila (Editar)
    setEvaluacionToDelete(id);
    setOpenDeleteDialog(true);
  }

  // 2. Confirmar Borrado
  const handleConfirmDelete = async () => {
    if (!evaluacionToDelete) return;

    setDeleting(true);
    try {
      await eliminarEvaluacionInstancia(evaluacionToDelete)
      // Actualizamos la lista localmente
      setEvaluaciones(evaluaciones.filter((e) => e.id !== evaluacionToDelete))
      setOpenDeleteDialog(false);
      setEvaluacionToDelete(null);
    } catch (err: any) {
      alert(err.message || "Error al eliminar la evaluación")
    } finally {
      setDeleting(false);
    }
  }

  // 3. Cerrar Modal
  const handleCloseDialog = () => {
    setOpenDeleteDialog(false);
    setEvaluacionToDelete(null);
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
      case "Evaluacion Inicial":
        return "Evaluación Inicial"
      case "Evaluacion de Cierre":
        return "Evaluacion de Cierre"
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
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Estudiante</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Sala</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Puntaje</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {evaluaciones.map((evaluacion) => (
              <TableRow
                key={evaluacion.id}
                hover
                // AQUÍ ESTÁ LA SOLUCIÓN AL CLICK
                onClick={() => onEditar(evaluacion)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{evaluacion.estudianteNombre || evaluacion.estudianteId}</TableCell>
                <TableCell align="center">{evaluacion.salaId || evaluacion.salaId}</TableCell>
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
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={(e) => handleClickDelete(e, evaluacion.id)}
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
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="error" />
          {"¿Eliminar evaluación?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Estás a punto de eliminar esta evaluación permanentemente. Esta acción borrará todos los datos asociados y no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} disabled={deleting} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            autoFocus
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}