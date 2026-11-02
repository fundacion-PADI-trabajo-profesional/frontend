import { useEffect, useState } from "react"
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material"
import { cambiarTipoEvaluacion, type EvaluacionInstancia } from "../../api/evaluaciones"
import { ETIQUETA_TIPO, type TipoEvaluacion } from "../../utils/tipo-evaluacion"

interface Props {
  evaluacion: EvaluacionInstancia | null
  open: boolean
  onClose: () => void
  /** Se llama con la evaluación ya actualizada por el servidor. */
  onGuardado: (actualizada: EvaluacionInstancia) => void
}

function nombreDe(evaluacion: EvaluacionInstancia): string {
  if (evaluacion.estudianteNombre) return evaluacion.estudianteNombre
  const e = evaluacion.estudiante
  if (e) return [e.apellido, e.nombre].filter(Boolean).join(", ")
  return evaluacion.estudianteId
}

/**
 * Cambia el tipo (inicial/cierre) de una evaluación ya creada. El tipo es una etiqueta:
 * no toca puntajes ni respuestas. Si el backend rechaza (p. ej. ya hay un cierre en esa sala
 * y año), el error se muestra acá y el diálogo queda abierto.
 */
export default function ModalCambiarTipo({ evaluacion, open, onClose, onGuardado }: Props) {
  const [tipo, setTipo] = useState<TipoEvaluacion>("inicial")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && evaluacion) {
      setTipo(evaluacion.tipoId === "cierre" ? "cierre" : "inicial")
      setError(null)
    }
  }, [open, evaluacion])

  const sinCambios = !evaluacion || tipo === evaluacion.tipoId

  const guardar = async () => {
    if (!evaluacion || sinCambios) return
    setGuardando(true)
    setError(null)
    try {
      const actualizada = await cambiarTipoEvaluacion(evaluacion.id, tipo)
      onGuardado(actualizada)
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cambiar el tipo de la evaluación")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => !guardando && onClose()} fullWidth maxWidth="xs">
      <DialogTitle>Cambiar tipo de evaluación</DialogTitle>
      <DialogContent>
        {evaluacion && (
          <DialogContentText sx={{ mb: 2 }}>
            {nombreDe(evaluacion)} · Sala {evaluacion.salaId}
          </DialogContentText>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          select
          fullWidth
          label="Tipo de Evaluación"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoEvaluacion)}
          disabled={guardando}
        >
          <MenuItem value="inicial">{ETIQUETA_TIPO.inicial}</MenuItem>
          <MenuItem value="cierre">{ETIQUETA_TIPO.cierre}</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={guardando} color="inherit" sx={{ textTransform: "none" }}>
          Cancelar
        </Button>
        <Button
          onClick={guardar}
          variant="contained"
          disabled={guardando || sinCambios}
          startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : null}
          sx={{ textTransform: "none" }}
        >
          {guardando ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
