"use client"

import type React from "react"

import { useEffect, useState } from "react"
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Typography,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material"
import SaveIcon from "@mui/icons-material/Save"
import CancelIcon from "@mui/icons-material/Cancel"
import { crearEvaluacionInstancia, actualizarEvaluacionInstancia, type EvaluacionInstancia } from "../api/evaluaciones"; // <-- IMPORTA EL TIPO Y LA NUEVA FUNCIÓN

interface EvaluacionFormProps {
  onSuccess: () => void;
  evaluacionAEditar?: EvaluacionInstancia | null;
}

export default function EvaluacionForm({ onSuccess, evaluacionAEditar }: EvaluacionFormProps) {
  const [formData, setFormData] = useState({
    estudianteId: "",
    salaId: "",
    tipoId: "diagnostico",
    estadoId: "N",
    puntaje: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (evaluacionAEditar) {
      setFormData({
        estudianteId: evaluacionAEditar.estudianteId,
        salaId: String(evaluacionAEditar.salaId), // Convertir a string para el textfield
        tipoId: evaluacionAEditar.tipoId,
        estadoId: evaluacionAEditar.estadoId,
        puntaje: String(evaluacionAEditar.puntaje ?? ""), // Convertir a string, maneja null
      });
      setSuccess(false); // Limpia mensajes de éxito
      setError(null);   // Limpia mensajes de error
    } else {
      // Si no hay nada para editar, limpia el formulario (modo "Crear")
      handleClear();
    }
  }, [evaluacionAEditar]);

  const handleClear = () => {
     setFormData({
        estudianteId: "",
        salaId: "",
        tipoId: "diagnostico",
        estadoId: "N",
        puntaje: "",
      });
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const name = e.target.name || (e.target as HTMLInputElement).name
    const value = e.target.value

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate form
      if (!formData.estudianteId || !formData.salaId) {
        throw new Error("Por favor completa todos los campos requeridos")
      }

      const payload = {
        estudianteId: formData.estudianteId,
        salaId: Number.parseInt(formData.salaId),
        tipoId: formData.tipoId as "diagnostico" | "seguimiento" | "cierre",
        estadoId: formData.estadoId as "N" | "C" | "R",
        puntaje: formData.puntaje ? Number.parseInt(formData.puntaje) : null,
      }

      if (evaluacionAEditar) {
        // --- MODO EDITAR ---
        await actualizarEvaluacionInstancia(evaluacionAEditar.id, payload);
        console.log("[v0] Evaluación actualizada:", payload);
      } else {
        // --- MODO CREAR ---
        await crearEvaluacionInstancia(payload);
        console.log("[v0] Evaluación creada:", payload);
      }

      setSuccess(true)


      // Reload list after success
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err: any) {
      setError(err.message || (evaluacionAEditar ? "Error al actualizar" : "Error al crear"));
      console.error("[v0] Error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent>
        {/* --- TÍTULO DINÁMICO --- */}
        <Typography variant="h6" component="h2" sx={{ mb: 3, fontWeight: 700 }}>
          {evaluacionAEditar ? "Editar Evaluación" : "Nueva Evaluación PADI"}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Evaluación creada exitosamente. Redirigiendo...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Estudiante ID */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ID del Estudiante"
                name="estudianteId"
                value={formData.estudianteId}
                onChange={handleChange}
                placeholder="Ej: s1, s2, s3"
                required
                disabled={loading}
              />
            </Grid>

            {/* Sala */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sala"
                name="salaId"
                type="number"
                value={formData.salaId}
                onChange={handleChange}
                placeholder="Ej: 1, 2, 3"
                inputProps={{ min: "1", step: "1" }}
                required
                disabled={loading}
              />
            </Grid>

            {/* Tipo de Evaluación */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Tipo de Evaluación"
                name="tipoId"
                value={formData.tipoId}
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="diagnostico">Diagnóstico</MenuItem>
                <MenuItem value="seguimiento">Seguimiento</MenuItem>
                <MenuItem value="cierre">Cierre</MenuItem>
              </TextField>
            </Grid>

            {/* Estado */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Estado"
                name="estadoId"
                value={formData.estadoId}
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="N">No iniciada</MenuItem>
                <MenuItem value="C">Completada</MenuItem>
                <MenuItem value="R">Revisada</MenuItem>
              </TextField>
            </Grid>

            {/* Puntaje */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Puntaje (opcional)"
                name="puntaje"
                type="number"
                value={formData.puntaje}
                onChange={handleChange}
                placeholder="Ej: 85, 90"
                inputProps={{ min: "0", max: "100", step: "1" }}
                helperText="Rango: 0-100"
                disabled={loading}
              />
            </Grid>

            {/* Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleClear} // El botón Limpiar solo limpia
                  disabled={loading}
                  sx={{ textTransform: "none" }}
                >
                  Limpiar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={loading}
                  sx={{
                    bgcolor: "#A3BE54",
                    color: "#000",
                    textTransform: "none",
                    "&:hover": { bgcolor: "#8bc34a" },
                    "&:disabled": { bgcolor: "#ccc" },
                  }}
                >
                  {loading ? "Guardando..." : (evaluacionAEditar ? "Guardar Cambios" : "Crear Evaluación")}
                </Button>
              </Box>
            </Grid>

            {/* Info */}
            <Grid item xs={12}>
              <Alert severity="info">
                Los datos de evaluación se guardarán de forma segura y centralizada. Solo tú y los administradores
                podrán acceder a esta información.
              </Alert>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}
