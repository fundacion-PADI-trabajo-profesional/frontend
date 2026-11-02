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
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Link,
} from "@mui/material"
import SaveIcon from "@mui/icons-material/Save"
import CancelIcon from "@mui/icons-material/Cancel"
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom"
import {
  crearEvaluacionInstancia,
  getEvaluacionesInstanciasByEstudiante,
  EvaluacionApiError,
} from "../../api/evaluaciones";
import { getEstudiantes, type Estudiante } from "../../api/estudiantes";
import { getDocenteAulasConEstudiantes } from "../../api/aulas";
import { etiquetaDni } from "../../utils/dni";
import { fechaLocalISO } from "../../utils/fechas";
import { ETIQUETA_TIPO, tipoPorDefecto, type SugerenciaTipo, type TipoEvaluacion } from "../../utils/tipo-evaluacion";

interface EvaluacionFormProps {
  onSuccess: (evaluacionId: string) => void;
  onCancel: () => void;
  profile: { id: string; rol: string; escuela_id?: string } | null;
  prefillEstudianteId?: string;
}

const SIN_SUGERENCIA: SugerenciaTipo = { tipo: "inicial", ayuda: null, aviso: null };

export default function EvaluacionForm({ onSuccess, profile, prefillEstudianteId }: EvaluacionFormProps) {
  const [formData, setFormData] = useState({
    estudianteId: "",
    salaId: "",
    aulaId: "",
    tipoId: "inicial" as TipoEvaluacion,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ mensaje: string; verHistorial: boolean } | null>(null)
  const [success, setSuccess] = useState(false)
  const [confirmarAbierto, setConfirmarAbierto] = useState(false)
  const [sugerencia, setSugerencia] = useState<SugerenciaTipo>(SIN_SUGERENCIA)

  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(true);
  const [selectedEstudiante, setSelectedEstudiante] = useState<Estudiante | null>(null);

  const [searchParams] = useSearchParams();
  const prefillSalaId = searchParams.get("salaId");
  const prefillAulaId = searchParams.get("aulaId");
  const navigate = useNavigate();

  useEffect(() => {
    if (prefillEstudianteId) {
      setFormData(prev => ({
        ...prev,
        estudianteId: prefillEstudianteId,
        salaId: prefillSalaId || "",
        aulaId: prefillAulaId || "",
      }));
    }
  }, [prefillEstudianteId, prefillSalaId, prefillAulaId]);

  useEffect(() => {
    if (!profile) return;

    const loadEstudiantes = async () => {
      try {
        const data = await getEstudiantes();
        setEstudiantes(data);
      } catch {
        if (profile.rol === "docente" || profile.rol === "director") {
          try {
            const aulas = await getDocenteAulasConEstudiantes();
            const dedup = new Map<string, Estudiante>();
            for (const aula of aulas) {
              for (const est of aula.estudiantes || []) {
                dedup.set(est.id, est);
              }
            }
            setEstudiantes(Array.from(dedup.values()));
          } catch {
            setError({ mensaje: "Error al cargar la lista de estudiantes.", verHistorial: false });
          }
        } else {
          setError({ mensaje: "Error al cargar la lista de estudiantes.", verHistorial: false });
        }
      } finally {
        setLoadingEstudiantes(false);
      }
    };

    loadEstudiantes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.rol]);

  useEffect(() => {
    if (prefillEstudianteId && estudiantes.length > 0) {
      const estudiante = estudiantes.find(e => e.id === prefillEstudianteId) || null;
      setSelectedEstudiante(estudiante);
      setFormData((prev) => ({
        ...prev,
        estudianteId: estudiante ? estudiante.id : "",
        salaId: estudiante ? String(estudiante.sala_id) : "",
        aulaId: prev.aulaId || prefillAulaId || "",
      }));
    }
  }, [prefillEstudianteId, estudiantes, prefillAulaId]);

  // Tipo por defecto según el historial del alumno en esa sala y este año.
  // Si cambia el alumno o la sala con una consulta en vuelo, la respuesta vieja se descarta.
  useEffect(() => {
    const salaNum = Number(formData.salaId);
    if (!formData.estudianteId || !salaNum) {
      setSugerencia(SIN_SUGERENCIA);
      return;
    }
    let cancelado = false;
    getEvaluacionesInstanciasByEstudiante(formData.estudianteId)
      .then((evs) => {
        if (cancelado) return;
        const r = tipoPorDefecto(evs, salaNum, new Date().getUTCFullYear());
        setSugerencia(r);
        setFormData((prev) => ({ ...prev, tipoId: r.tipo }));
      })
      .catch(() => {
        if (!cancelado) setSugerencia(SIN_SUGERENCIA);
      });
    return () => {
      cancelado = true;
    };
  }, [formData.estudianteId, formData.salaId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const name = e.target.name || (e.target as HTMLInputElement).name
    const value = e.target.value

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCancel = () => {
    navigate("/evaluaciones", { replace: true });
  };

  const nombreAlumno = selectedEstudiante
    ? `${selectedEstudiante.personas.primer_apellido}, ${selectedEstudiante.personas.nombre}`
    : "";
  const rutaHistorial = `/historial-estudiante?${new URLSearchParams({
    estudianteId: formData.estudianteId,
    nombre: nombreAlumno,
  }).toString()}`;

  // Paso 1: validar y pedir confirmación (el "double check" del tipo).
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!formData.estudianteId || !formData.salaId || !profile?.id) {
      setError({ mensaje: "Por favor completa todos los campos requeridos (faltan datos del estudiante, sala o profesor)", verHistorial: false });
      return;
    }
    if (!selectedEstudiante || !selectedEstudiante.personas || !selectedEstudiante.personas.dni) {
      setError({ mensaje: "El estudiante seleccionado no tiene un DNI válido.", verHistorial: false });
      return;
    }
    setConfirmarAbierto(true);
  }

  // Paso 2: crear, ya confirmado.
  const crear = async () => {
    const dni = selectedEstudiante?.personas?.dni;
    if (!dni || !profile) return;
    setLoading(true)
    try {
      const payloadBackend = {
        dni,
        profesor_id: profile.id,
        sala_id: Number.parseInt(formData.salaId),
        aula_id: formData.aulaId || undefined,
        tipo_id: formData.tipoId,
        fecha_creacion: fechaLocalISO(), // siempre el día en que se carga, sin selector
      }
      const result = await crearEvaluacionInstancia(payloadBackend, { userId: profile.id, userRole: profile.rol });
      setConfirmarAbierto(false)
      setSuccess(true)
      setTimeout(() => {
        onSuccess(result.id)
      }, 1500)
    } catch (err: unknown) {
      setConfirmarAbierto(false)
      const esDuplicado = err instanceof EvaluacionApiError && err.code === "TIPO_DUPLICADO";
      setError({
        mensaje: err instanceof Error ? err.message : "Error al crear",
        verHistorial: esDuplicado,
      });
    } finally {
      setLoading(false);
    }
  }

  const isLoading = loading || loadingEstudiantes;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="h2" sx={{ mb: 3, fontWeight: 700 }}>
          Nueva Evaluación PADI
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.mensaje}
            {error.verHistorial && (
              <>
                {" "}
                <Link component={RouterLink} to={rutaHistorial} underline="always">
                  Ver la evaluación existente
                </Link>
              </>
            )}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Evaluación creada exitosamente. Redirigiendo...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {selectedEstudiante && (
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "#fafafa" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Contexto del estudiante a evaluar
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#555" }}>
                    Aula: {selectedEstudiante.aula_asignada ? `${selectedEstudiante.aula_asignada.comision} (${selectedEstudiante.aula_asignada.turno})` : "Sin comisión asignada"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#555" }}>
                    Escuela: {selectedEstudiante.escuela?.nombre || "Sin escuela asignada"}
                  </Typography>
                </Paper>
              </Grid>
            )}

            {/* Estudiante */}
            <Grid item xs={12}>
              <Autocomplete
                id="estudiante-autocomplete"
                value={selectedEstudiante}
                options={estudiantes}
                loading={loadingEstudiantes}
                disabled={isLoading}
                getOptionLabel={(option) =>
                  `${option.personas.primer_apellido}, ${option.personas.nombre} (${etiquetaDni(option.personas.dni)})`
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_event, newValue: Estudiante | null) => {
                  setSelectedEstudiante(newValue);
                  setFormData((prev) => ({
                    ...prev,
                    estudianteId: newValue ? newValue.id : "",
                    salaId: newValue ? String(newValue.sala_id) : "",
                    aulaId: newValue?.aula_asignada?.id || newValue?.aula_id || "",
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar estudiante por nombre, DNI o ID interno"
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
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Grid container alignItems="center">
                      <Grid item xs>
                        <Typography variant="body1" >
                          {option.personas.primer_apellido}, {option.personas.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {etiquetaDni(option.personas.dni)}
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
                label="Prueba de Sala"
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

            {/* Tipo de Evaluación: arranca según el historial del alumno; se puede cambiar */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Tipo de Evaluación"
                name="tipoId"
                value={formData.tipoId}
                onChange={handleChange}
                disabled={loading}
                helperText={sugerencia.ayuda ?? undefined}
              >
                <MenuItem value="inicial">{ETIQUETA_TIPO.inicial}</MenuItem>
                <MenuItem value="cierre">{ETIQUETA_TIPO.cierre}</MenuItem>
              </TextField>
            </Grid>

            {sugerencia.aviso && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  {sugerencia.aviso}{" "}
                  <Link component={RouterLink} to={rutaHistorial} underline="always">
                    Ver historial
                  </Link>
                </Alert>
              </Grid>
            )}

            {/* Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={loading}
                  sx={{ textTransform: "none" }}
                >
                  Cancelar
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
                  {loading ? "Guardando..." : "Crear Evaluación"}
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

        {/* Confirmación del tipo antes de crear */}
        <Dialog open={confirmarAbierto} onClose={() => !loading && setConfirmarAbierto(false)}>
          <DialogTitle>Confirmar evaluación</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Vas a crear una evaluación de <b>{ETIQUETA_TIPO[formData.tipoId].toUpperCase()}</b> de sala {formData.salaId} para{" "}
              <b>{nombreAlumno}</b>.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" onClick={() => setConfirmarAbierto(false)} disabled={loading} sx={{ textTransform: "none" }}>
              Volver
            </Button>
            <Button
              variant="contained"
              onClick={crear}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} /> : undefined}
              sx={{ bgcolor: "#A3BE54", color: "#000", textTransform: "none", "&:hover": { bgcolor: "#8bc34a" } }}
            >
              Confirmar
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  )
}
