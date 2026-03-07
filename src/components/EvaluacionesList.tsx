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
import DeleteIcon from "@mui/icons-material/Delete"
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { getEvaluacionesInstancias, eliminarEvaluacionInstancia, type EvaluacionInstancia } from "../api/evaluaciones"
import { permissions } from "../utils/permissions"

const TOTAL_AREAS_EVALUACION = 4;
const ESTADO_NO_INICIADA = "N"
const ESTADO_APROBADA = "A"
const ESTADO_DESAPROBADA = "D"
const ESTADO_EN_PROGRESO = "E"

export default function EvaluacionesList({ onEditar }: {
  onEditar: (evaluacion: EvaluacionInstancia) => void
}) {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionInstancia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [evaluacionToDelete, setEvaluacionToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

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
  }, [profile])

  const loadEvaluaciones = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Obtener datos del usuario logueado
      const userStr = localStorage.getItem("padiUser");
      const user = userStr ? JSON.parse(userStr) : null;

      const data = await getEvaluacionesInstancias({
        escuela_id: user?.escuela_id,
        rol: user?.rol,
        profesorId: user?.rol === "docente" ? user?.id : undefined,
      });

      setEvaluaciones(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar las evaluaciones");
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

  const evaluacionesAgrupadas = evaluaciones.reduce((acc: any, curr) => {
    const escuela = curr.escuelaNombre || "Sin Escuela";
    const sala = curr.salaNombre || `Sala de ${curr.salaId}`;
    const aula = curr.aulaLabel || "Sin Comisión";

    if (!acc[escuela]) acc[escuela] = {};
    if (!acc[escuela][sala]) acc[escuela][sala] = {};
    if (!acc[escuela][sala][aula]) acc[escuela][sala][aula] = [];

    acc[escuela][sala][aula].push(curr);
    return acc;
  }, {});


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
                          <TableCell sx={{ fontWeight: 700 }}>Estudiante</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Tipo</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Estado</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Áreas aprobadas</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Acciones</TableCell> {/* <-- Esta columna debe existir */}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {evaluacionesAgrupadas[escuela][sala][aula].map((evaluacion: any) => (
                          <TableRow
                            key={evaluacion.id}
                            hover
                            onClick={() => onEditar(evaluacion)}
                            sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                          >
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
                                const aprobadas = evaluacion.areas?.filter((a: any) => a.estadoId === ESTADO_APROBADA).length ?? 0;
                                return evaluacion.estadoId === ESTADO_NO_INICIADA ? "-" : `${aprobadas}/${TOTAL_AREAS_EVALUACION}`;
                              })()}
                            </TableCell>
                            <TableCell align="center">
                              <Box
                                sx={{ display: "flex", gap: 1, justifyContent: "center" }}
                                onClick={(e) => e.stopPropagation()} // Importante: evita que al hacer clic en el botón se abra el detalle
                              >
                                {permissions.deleteEvaluacion(profile?.rol) && (
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
        </Box>
      ))}
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