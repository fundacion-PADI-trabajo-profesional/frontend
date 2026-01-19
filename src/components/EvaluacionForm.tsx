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
  Autocomplete,
} from "@mui/material"
import SaveIcon from "@mui/icons-material/Save"
import CancelIcon from "@mui/icons-material/Cancel"
import { crearEvaluacionInstancia, actualizarEvaluacionInstancia, type EvaluacionInstancia } from "../api/evaluaciones"; // <-- IMPORTA EL TIPO Y LA NUEVA FUNCIÓN
import { getEstudiantes, type Estudiante } from "../api/estudiantes";
import { useSearchParams } from "react-router-dom"

interface EvaluacionFormProps {
  onSuccess: () => void;
  evaluacionAEditar?: EvaluacionInstancia | null;
  profile: any | null;
  prefillEstudianteId?: string;
}

const getCurrentMonth = () => {
  const now = new Date();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
};

export default function EvaluacionForm({ onSuccess, evaluacionAEditar, profile, prefillEstudianteId }: EvaluacionFormProps) {
  const [formData, setFormData] = useState({
    estudianteId: "",
    salaId: "",
    tipoId: "inicial",
    estadoId: "N",
    fechaCreacion: getCurrentMonth(),
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(true);
  // Este estado controla el valor del Autocomplete (el objeto estudiante completo)
  const [selectedEstudiante, setSelectedEstudiante] = useState<Estudiante | null>(null);

  const [searchParams] = useSearchParams();
  const prefillSalaId = searchParams.get("salaId"); // Capturamos la sala

  useEffect(() => {
    if (prefillEstudianteId) {
      setFormData(prev => ({
        ...prev,
        estudianteId: prefillEstudianteId,
        salaId: prefillSalaId || "" // Pre-cargamos la sala si viene en la URL
      }));
    }
  }, [prefillEstudianteId, prefillSalaId]);

  useEffect(() => {
    const loadEstudiantes = async () => {
      try {
        const data = await getEstudiantes();
        setEstudiantes(data);
      } catch (err) {
        setError("Error al cargar la lista de estudiantes.");
      } finally {
        setLoadingEstudiantes(false);
      }
    };
    loadEstudiantes();
  }, []);

  useEffect(() => {
    // Solo se ejecuta si la evaluación a editar existe Y la lista de estudiantes ya se cargó
    if (evaluacionAEditar && estudiantes.length > 0) {
      // 1. Encontrar el objeto estudiante completo usando el ID
      const estudiante = estudiantes.find(e => e.id === evaluacionAEditar.estudianteId) || null;

      // 2. Setear el valor del Autocomplete
      setSelectedEstudiante(estudiante);

      // 3. Setear el resto del formulario
      setFormData({
        estudianteId: evaluacionAEditar.estudianteId,
        salaId: String(evaluacionAEditar.salaId),
        tipoId: evaluacionAEditar.tipoId,
        estadoId: evaluacionAEditar.estadoId,
        fechaCreacion: getCurrentMonth(),
      });
      setSuccess(false);
      setError(null);
    } else if (!evaluacionAEditar) {
      // Si no hay nada para editar, limpia el formulario (modo "Crear")
      handleClear();
    }
  }, [evaluacionAEditar, estudiantes]);

  // Prefill si venimos desde Estudiantes (evaluarAhora)
  useEffect(() => {
    if (!evaluacionAEditar && prefillEstudianteId && estudiantes.length > 0) {
      const estudiante = estudiantes.find(e => e.id === prefillEstudianteId) || null;
      setSelectedEstudiante(estudiante);
      setFormData((prev) => ({
        ...prev,
        estudianteId: estudiante ? estudiante.id : "",
        salaId: estudiante ? String(estudiante.sala_id) : "",
      }));
    }
  }, [prefillEstudianteId, estudiantes, evaluacionAEditar]);

  const handleClear = () => {
    setFormData({
      estudianteId: "",
      salaId: "",
      tipoId: "inicial",
      estadoId: "N",
      fechaCreacion: getCurrentMonth(),
    });
    setSelectedEstudiante(null);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const name = e.target.name || (e.target as HTMLInputElement).name
    const value = e.target.value

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleEstudianteChange = (newValue: Estudiante | null) => {
    // 1. Actualiza el valor del Autocomplete
    setSelectedEstudiante(newValue);
    // 2. Actualiza el formData con el ID, y con la Sala del estudiante seleccionado
    setFormData((prev) => ({
      ...prev,
      estudianteId: newValue ? newValue.id : "",
      // *** MODIFICACIÓN CLAVE: Autocarga la sala del estudiante al seleccionar ***
      salaId: newValue ? String(newValue.sala_id) : "", // Asumo que el campo es 'grado'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate form
      //if (!formData.estudianteId || !formData.salaId) {
      //  throw new Error("Por favor completa todos los campos requeridos")
      //}
      if (!formData.estudianteId || !formData.salaId || !profile?.id) {
        throw new Error("Por favor completa todos los campos requeridos (faltan datos del estudiante, sala o profesor)")
      }

      const payload = {
        estudianteId: formData.estudianteId,
        profesorId: profile.id,
        salaId: Number.parseInt(formData.salaId),
        tipoId: formData.tipoId as "Evaluacion Inicial" | "Evaluacion de Cierre",
        puntaje: null,
        estadoId: formData.estadoId as "N" | "C" | "R",
      }

      if (evaluacionAEditar) {
        // --- MODO EDITAR ---
        await actualizarEvaluacionInstancia(evaluacionAEditar.id, payload);
        console.log("[v0] Evaluación actualizada:", payload);
      } else {
        // --- MODO CREAR ---

        // 1. Obtener el DNI del estudiante seleccionado
        if (!selectedEstudiante || !selectedEstudiante.personas || !selectedEstudiante.personas.dni) {
          throw new Error("El estudiante seleccionado no tiene un DNI válido.");
        }

        // 2. Construir el payload EXACTAMENTE como lo pide el Backend (snake_case)
        const payloadBackend = {
          dni: selectedEstudiante.personas.dni, // Usamos DNI, no ID
          profesor_id: profile.id,              // snake_case: profesor_id
          tipo_id: formData.tipoId,             // snake_case: tipo_id
          fecha_creacion: formData.fechaCreacion,
        }

        // 3. Enviar
        await crearEvaluacionInstancia(payloadBackend);
        console.log("[v0] Evaluación creada:", payloadBackend);
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

  const isLoading = loading || loadingEstudiantes; // El formulario se bloquea si carga estudiantes O si está guardando

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
            <Grid item xs={12}>
              <Autocomplete
                id="estudiante-autocomplete"
                // El valor es el objeto estudiante completo
                value={selectedEstudiante}
                // La lista de opciones
                options={estudiantes}
                loading={loadingEstudiantes}
                disabled={isLoading}
                // Cómo mostrar el nombre en el dropdown (Ej: "Gomez, Juan (12345678)")
                getOptionLabel={(option) =>
                  `${option.personas.primer_apellido}, ${option.personas.nombre} (${option.personas.dni})`
                }
                // Para que la búsqueda funcione comparando IDs
                isOptionEqualToValue={(option, value) => option.id === value.id}
                // QUÉ HACER CUANDO SE SELECCIONA UN ALUMNO
                onChange={(event, newValue: Estudiante | null) => {
                  // 1. Actualiza el valor del Autocomplete
                  setSelectedEstudiante(newValue);
                  // 2. Actualiza el formData con el ID para el backend
                  setFormData((prev) => ({
                    ...prev,
                    estudianteId: newValue ? newValue.id : "",
                  }));
                }}
                // Cómo se ve el campo de texto
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar Estudiante por DNI o Nombre"
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingEstudiantes ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                // Cómo se ve cada opción en el dropdown (para más claridad)
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Grid container alignItems="center">
                      <Grid item xs>
                        <Typography variant="body1" >
                          {option.personas.primer_apellido}, {option.personas.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          DNI: {option.personas.dni}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
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
                placeholder="Ej: 3, 4, 5"
                inputProps={{ min: "3", step: "1" }}
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
                <MenuItem value="inicial">Evaluacion Inicial</MenuItem>
                <MenuItem value="cierre">Evaluacion de Cierre</MenuItem>
              </TextField>
            </Grid>

            {/* FECHA DE CREACIÓN --- */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mes y Año de Evaluación"
                name="fechaCreacion"
                type="month" // Input nativo de navegador para mes/año
                value={formData.fechaCreacion}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true, // Necesario para que la etiqueta no tape el valor
                }}
                required
                disabled={isLoading}
              />
            </Grid>

            {/* Estado - SE QUITA DEL FORMULARIO DE CREACIÓN */}
            {/* El estado inicial DEBE ser 'N' (No iniciada) y es definido en el backend */}
            {/* Dejamos este campo visible si estamos EDITANDO, si no, se oculta */}
            {evaluacionAEditar && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Estado"
                  name="estadoId"
                  value={formData.estadoId}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  <MenuItem value="N">No iniciada</MenuItem>
                  <MenuItem value="E">En Progreso</MenuItem>
                  <MenuItem value="C">Completada</MenuItem>
                  <MenuItem value="R">Revisada</MenuItem>
                  <MenuItem value="A">Aprobada</MenuItem>
                  <MenuItem value="D">Desaprobada</MenuItem>
                </TextField>
              </Grid>
            )}

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
