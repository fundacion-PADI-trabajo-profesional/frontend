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
import DeleteIcon from "@mui/icons-material/Delete"
import VisibilityIcon from "@mui/icons-material/Visibility"
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { getEvaluacionesInstancias, eliminarEvaluacionInstancia, getEvaluacionesInstanciasByProfesor, type EvaluacionInstancia } from "../../api/evaluaciones"
import { permissions } from "../../utils/permissions"
import { TextField, MenuItem, Grid } from "@mui/material"
import SinEscuelaAsignada from "../common/SinEscuelaAsignada"

const TOTAL_AREAS_EVALUACION = 4;
const ESTADO_NO_INICIADA = "N"
const ESTADO_APROBADA = "A"
const ESTADO_DESAPROBADA = "D"
const ESTADO_EN_PROGRESO = "E"

export default function EvaluacionesList({
  onEditar,
  docenteId
}: {
  onEditar: (evaluacion: EvaluacionInstancia) => void
  docenteId?: string
}) {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionInstancia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noEscuela, setNoEscuela] = useState(false)
  const [profile, setProfile] = useState<{ id?: string; rol?: string; escuela_id?: string } | null>(null)

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [evaluacionToDelete, setEvaluacionToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [filtros, setFiltros] = useState({
    busqueda: "", // Para DNI o Nombre
    escuela: "todas",
    sala: "todas",
    comision: "todas",
    tipo: "todos",
    estado: "todos"
  });

  useEffect(() => {
    // Obtener información del usuario
    const userStr = localStorage.getItem("padiUser");
    if (userStr) {
      try {
        setProfile(JSON.parse(userStr));
      } catch {
        setProfile(null);
      }
    }
  }, []);

  useEffect(() => {
    if (profile) {
      loadEvaluaciones()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, docenteId])

  const loadEvaluaciones = async () => {
    setLoading(true);
    setError(null);
    try {
      const userStr = localStorage.getItem("padiUser");
      const user = userStr ? JSON.parse(userStr) : null;

      if (!docenteId && user?.rol === "director" && !user?.escuela_id) {
        setNoEscuela(true);
        return;
      }

      let data: EvaluacionInstancia[] = [];

      // Si nos pasan un docenteId por prop, buscamos las de ese docente
      if (docenteId) {
        data = await getEvaluacionesInstanciasByProfesor(docenteId, { limit: 50 });
      } else {
        data = await getEvaluacionesInstancias({
          escuela_id: user?.escuela_id,
          rol: user?.rol,
          profesorId: user?.rol === "docente" ? user?.id : undefined,
        });
      }

      setEvaluaciones(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar las evaluaciones");
    } finally {
      setLoading(false);
    }
  };

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
      const userInfo = {
        userId: profile?.id,
        userRole: profile?.rol
      };
      await eliminarEvaluacionInstancia(evaluacionToDelete, userInfo)
      // Actualizamos la lista localmente
      setEvaluaciones(evaluaciones.filter((e) => e.id !== evaluacionToDelete))
      setOpenDeleteDialog(false);
      setEvaluacionToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al eliminar la evaluación")
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
      case ESTADO_NO_INICIADA:
        return {
          bgcolor: "#FEF3C7",
          color: "#D97706"
        }
      case ESTADO_EN_PROGRESO:
        return {
          bgcolor: "#DBEAFE",
          color: "#2563EB"
        }
      case ESTADO_APROBADA:
        return {
          bgcolor: "#D1FAE5",
          color: "#059669"
        }
      case ESTADO_DESAPROBADA:
        return {
          bgcolor: "#FEE2E2",
          color: "#EF4444"
        }
      default:
        return {}
    }
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case ESTADO_NO_INICIADA:
        return "No iniciada"
      case ESTADO_EN_PROGRESO:
        return "En Progreso"
      case ESTADO_APROBADA:
        return "Aprobada"
      case ESTADO_DESAPROBADA:
        return "Desaprobada"
      default:
        return estado
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "inicial":
        return "Evaluación Inicial"
      case "cierre":
        return "Evaluacion de Cierre"
      default:
        return tipo
    }
  }

  const evaluacionesFiltradas = evaluaciones.filter((ev) => {
    const cumpleBusqueda =
      ev.estudianteNombre?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      ev.estudiante?.dni?.includes(filtros.busqueda);

    const cumpleSala = filtros.sala === "todas" || ev.salaNombre === filtros.sala;
    const cumpleComision = filtros.comision === "todas" || ev.aulaLabel === filtros.comision;
    const cumpleTipo = filtros.tipo === "todos" || ev.tipoId === filtros.tipo;
    const cumpleEstado = filtros.estado === "todos" || ev.estadoId === filtros.estado;
    const cumpleEscuela = filtros.escuela === "todas" || ev.escuelaNombre === filtros.escuela;

    return cumpleBusqueda && cumpleSala && cumpleComision && cumpleTipo && cumpleEstado && cumpleEscuela;
  });

  // Ahora agrupamos las FILTRADAS
  const evaluacionesAgrupadas = evaluacionesFiltradas.reduce((acc: Record<string, Record<string, Record<string, EvaluacionInstancia[]>>>, curr) => {
    const escuela = curr.escuelaNombre || "Sin Escuela";
    const sala = curr.salaNombre || `Sala de ${curr.salaId}`;
    const aula = curr.aulaLabel || "Sin Comisión";

    if (!acc[escuela]) acc[escuela] = {};
    if (!acc[escuela][sala]) acc[escuela][sala] = {};
    if (!acc[escuela][sala][aula]) acc[escuela][sala][aula] = [];

    acc[escuela][sala][aula].push(curr);
    return acc;
  }, {});


  if (noEscuela) {
    return <SinEscuelaAsignada />;
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

  const salasUnicas = Array.from(new Set(evaluaciones.map(ev => ev.salaNombre).filter(Boolean)));
  const comisionesUnicas = Array.from(new Set(evaluaciones.map(ev => ev.aulaLabel).filter(Boolean)));
  const escuelasUnicas = Array.from(new Set(evaluaciones.map(ev => ev.escuelaNombre).filter(Boolean))) as string[];

  return (
    <>
      {/* Filtros evaluaciones */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: '12px' }} elevation={1}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#555' }}>Filtros de búsqueda</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Buscar por Nombre o DNI"
              variant="outlined"
              size="small"
              value={filtros.busqueda}
              onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Escuela"
              size="small"
              value={filtros.escuela}
              onChange={(e) => setFiltros({ ...filtros, escuela: e.target.value })}
            >
              <MenuItem value="todas">Todas las escuelas</MenuItem>
              {escuelasUnicas.map(escuela => (
                <MenuItem key={escuela} value={escuela}>{escuela}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              label="Sala"
              size="small"
              value={filtros.sala}
              onChange={(e) => setFiltros({ ...filtros, sala: e.target.value })}
            >
              <MenuItem value="todas">Todas las salas</MenuItem>
              {salasUnicas.map(sala => (
                <MenuItem key={sala} value={sala}>{sala}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Filtro por Comisión */}
          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              label="Comisión"
              size="small"
              value={filtros.comision}
              onChange={(e) => setFiltros({ ...filtros, comision: e.target.value })}
            >
              <MenuItem value="todas">Todas</MenuItem>
              {comisionesUnicas.map(com => (
                <MenuItem key={com} value={com}>{com}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              select
              fullWidth
              label="Instancia de Evaluación"
              size="small"
              value={filtros.tipo}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="inicial">Inicial</MenuItem>
              <MenuItem value="cierre">Cierre</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              select
              fullWidth
              label="Estado"
              size="small"
              value={filtros.estado}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
            >
              <MenuItem value="todos">Todos los estados</MenuItem>
              <MenuItem value={ESTADO_APROBADA}>Aprobada</MenuItem>
              <MenuItem value={ESTADO_DESAPROBADA}>Desaprobada</MenuItem>
              <MenuItem value={ESTADO_EN_PROGRESO}>En Progreso</MenuItem>
              <MenuItem value={ESTADO_NO_INICIADA}>No Iniciada</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="text"
              onClick={() => setFiltros({ busqueda: "", sala: "todas", comision: "todas", tipo: "todos", estado: "todos", escuela: "todas" })}
            >
              Limpiar Filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>
      {Object.keys(evaluacionesAgrupadas).map((escuela) => (
        <Box key={escuela} sx={{ mb: 6 }}>
          {/* Título de la Escuela */}
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 800, color: "#333", borderBottom: "2px solid #A3BE54", pb: 1 }}>
            Escuela: {escuela}
          </Typography>

          {Object.keys(evaluacionesAgrupadas[escuela]).map((sala) => (
            <Box key={sala} sx={{ mb: 4, ml: 2 }}>
              {/* Separador de Sala */}
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: "#555", fontWeight: 600 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#A3BE54', mr: 1 }} />
                {sala}
              </Typography>

              {Object.keys(evaluacionesAgrupadas[escuela][sala]).map((aula) => (
                <Box key={aula} sx={{ mb: 3, ml: 3 }}>
                  {/* Separador de Comisión/Aula */}
                  <Typography variant="subtitle1" sx={{ mb: 1, fontStyle: 'italic', color: "#777" }}>
                    Comisión: {aula}
                  </Typography>

                  <TableContainer component={Paper} elevation={2}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: "#f9f9f9" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>DNI</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Estudiante</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Tipo</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Estado</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Áreas aprobadas</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {evaluacionesAgrupadas[escuela][sala][aula].map((evaluacion) => (
                          <TableRow
                            key={evaluacion.id}
                            hover
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                          >
                            <TableCell sx={{ fontWeight: 500, color: "#666" }}>
                              {evaluacion.estudiante?.dni}
                            </TableCell>

                            <TableCell>{evaluacion.estudianteNombre}</TableCell>
                            <TableCell align="center">{getTipoLabel(evaluacion.tipoId)}</TableCell>
                            <TableCell align="center">
                              <Chip
                                label={getEstadoLabel(evaluacion.estadoId)}
                                sx={{ fontWeight: 600, ...getEstadoColor(evaluacion.estadoId) }}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              {(() => {
                                const aprobadas = evaluacion.areas?.filter((a) => a.estadoId === ESTADO_APROBADA).length ?? 0;
                                return evaluacion.estadoId === ESTADO_NO_INICIADA ? "-" : `${aprobadas}/${TOTAL_AREAS_EVALUACION}`;
                              })()}
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>

                                {/* Botón Ver (Ojo) */}
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  startIcon={<VisibilityIcon />}
                                  onClick={() => onEditar(evaluacion)}
                                  sx={{
                                    textTransform: "none",
                                    fontWeight: 600,
                                    borderRadius: '8px',
                                  }}
                                >
                                  Ver
                                </Button>

                                {/* Botón Eliminar (Tachito) */}
                                {permissions.deleteEvaluacion(profile?.rol ?? "") && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={(e) => handleClickDelete(e, evaluacion.id)}
                                    sx={{
                                      textTransform: "none",
                                      fontWeight: 600,
                                      borderRadius: '8px',
                                      '&:hover': { bgcolor: '#fff5f5' }
                                    }}
                                  >
                                    Eliminar
                                  </Button>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))}
            </Box>
          ))}
        </Box >
      ))
      }
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