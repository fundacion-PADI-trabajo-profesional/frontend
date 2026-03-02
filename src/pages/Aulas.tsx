import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  CircularProgress,
  Alert,
  Button,
  TextField,
  MenuItem,
  Stack,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Aula,
  getAulas,
  createAula,
  updateAula,
  deleteAula,
  getAulaDocentes,
  asignarDocenteAula,
  desasignarDocenteAula,
  AulaDocente,
  getAulaEstudiantes,
  asignarEstudianteAula,
  desasignarEstudianteAula
} from "../api/aulas";
import { getEstudiantes, getSalas, Sala, Estudiante } from "../api/estudiantes";
import { getDocentes, Docente } from "../api/docentes";
import { permissions } from "../utils/permissions";

type Mode = "list" | "create" | "edit";

export default function AulasPage() {
  const [currentRole, setCurrentRole] = useState("");
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [selectedAulaForDocentes, setSelectedAulaForDocentes] = useState<Aula | null>(null);
  const [aulaDocentes, setAulaDocentes] = useState<AulaDocente[]>([]);
  const [selectedDocenteId, setSelectedDocenteId] = useState<string>("");
  const [selectedAulaForEstudiantes, setSelectedAulaForEstudiantes] = useState<Aula | null>(null);
  const [aulaEstudiantes, setAulaEstudiantes] = useState<Estudiante[]>([]);
  const [loadingAulaEstudiantes, setLoadingAulaEstudiantes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<Aula | null>(null);
  const [todosLosEstudiantes, setTodosLosEstudiantes] = useState<Estudiante[]>([]);
  const [selectedEstudianteId, setSelectedEstudianteId] = useState("");

  const [salaId, setSalaId] = useState<number | "">("");
  const [comision, setComision] = useState("");
  const [turno, setTurno] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialAulaId = searchParams.get("aulaId");
  const [pendingAulaId, setPendingAulaId] = useState<string | null>(initialAulaId);

  useEffect(() => {
    if (pendingAulaId && aulas.length > 0 && !loading && !selectedAulaForEstudiantes) {
      const aula = aulas.find((a) => a.id === pendingAulaId);
      if (aula) {
        openEstudiantesView(aula);
      }
      setPendingAulaId(null);
    }
  }, [pendingAulaId, aulas, loading]);

  useEffect(() => {
    const stored = localStorage.getItem("padiUser");
    if (!stored) {
      setCurrentRole("");
      return;
    }
    try {
      const user = JSON.parse(stored);
      setCurrentRole(user?.rol || "");
    } catch {
      setCurrentRole("");
    }
  }, []);

  useEffect(() => {
    if (currentRole && !["director", "encargado_zona", "equipo_padi"].includes(currentRole)) {
      navigate("/home");
    }
  }, [currentRole, navigate]);

  useEffect(() => {
    if (!currentRole || currentRole !== "director") return;
    const loadInitial = async () => {
      setLoading(true);
      setError(null);
      try {
        const [aulasData, salasData, docentesData] = await Promise.all([
          getAulas(),
          getSalas(),
          getDocentes(),
        ]);
        setAulas(aulasData);
        setSalas(salasData);
        setDocentes(docentesData);
      } catch (e: any) {
        setError(e.message || "Error al cargar aulas");
      } finally {
        setLoading(false);
      }
    };
    if (mode === "list") {
      loadInitial();
    }
  }, [mode, currentRole]);

  const resetForm = () => {
    setSalaId("");
    setComision("");
    setTurno("");
    setEditing(null);
  };

  const handleStartCreate = () => {
    resetForm();
    setMode("create");
  };

  const handleStartEdit = (aula: Aula) => {
    setEditing(aula);
    setSalaId(aula.sala_id);
    setComision(aula.comision);
    setTurno(aula.turno);
    setMode("edit");
  };

  const handleCancel = () => {
    resetForm();
    setMode("list");
  };

  const handleSubmit = async () => {
    try {
      if (!salaId || !comision || !turno) {
        setError("Todos los campos son obligatorios.");
        return;
      }
      setError(null);
      if (mode === "create") {
        await createAula({
          sala_id: Number(salaId),
          comision: comision.trim(),
          turno: turno.trim(),
        });
      } else if (mode === "edit" && editing) {
        await updateAula(editing.id, {
          sala_id: Number(salaId),
          comision: comision.trim(),
          turno: turno.trim(),
        });
      }
      setMode("list");
    } catch (e: any) {
      setError(e.message || "Error al guardar el aula");
    }
  };

  const handleDelete = async (aula: Aula) => {
    const ok = window.confirm(
      `¿Seguro que querés eliminar el aula "${aula.comision}" (${aula.turno})?`,
    );
    if (!ok) return;

    try {
      await deleteAula(aula.id);
      setMode("list");
    } catch (e: any) {
      setError(e.message || "Error al eliminar el aula");
    }
  };

  const openDocentesDialog = async (aula: Aula) => {
    try {
      const data = await getAulaDocentes(aula.id);
      setSelectedAulaForDocentes(aula);
      setAulaDocentes(data);
      setSelectedDocenteId("");
    } catch (e: any) {
      setError(e.message || "Error al cargar docentes del aula");
    }
  };

  const closeDocentesDialog = () => {
    setSelectedAulaForDocentes(null);
    setAulaDocentes([]);
    setSelectedDocenteId("");
  };

  const docentesDisponiblesParaAula = docentes.filter(
    (d) => !aulaDocentes.some((ad) => ad.profesor_id === d.id),
  );

  const handleAsignarDocente = async () => {
    if (!selectedAulaForDocentes || !selectedDocenteId) return;
    try {
      await asignarDocenteAula(selectedAulaForDocentes.id, selectedDocenteId);
      const data = await getAulaDocentes(selectedAulaForDocentes.id);
      setAulaDocentes(data);
      setSelectedDocenteId("");
    } catch (e: any) {
      setError(e.message || "Error al asignar docente al aula");
    }
  };

  const handleDesasignarDocente = async (profesorId: string) => {
    if (!selectedAulaForDocentes) return;
    const ok = window.confirm("¿Quitar a este docente del aula?");
    if (!ok) return;
    try {
      await desasignarDocenteAula(selectedAulaForDocentes.id, profesorId);
      const data = await getAulaDocentes(selectedAulaForDocentes.id);
      setAulaDocentes(data);
    } catch (e: any) {
      setError(e.message || "Error al desasignar docente del aula");
    }
  };

  const openEstudiantesView = async (aula: Aula) => {
    try {
      setLoadingAulaEstudiantes(true);
      setError(null);
      const [estudiantes, todos] = await Promise.all([
        getAulaEstudiantes(aula.id),
        getEstudiantes(),
      ]);
      setSelectedAulaForEstudiantes(aula);
      setAulaEstudiantes(estudiantes);
      setTodosLosEstudiantes(todos);
      setSelectedEstudianteId("");
    } catch (e: any) {
      setError(e.message || "Error al cargar estudiantes del aula");
    } finally {
      setLoadingAulaEstudiantes(false);
    }
  };

  const closeEstudiantesView = () => {
    setSelectedAulaForEstudiantes(null);
    setAulaEstudiantes([]);
  };


  const handleDesasignarEstudiante = async (estudianteId: string) => {
    if (!selectedAulaForEstudiantes) return;
    try {
      await desasignarEstudianteAula(selectedAulaForEstudiantes.id, estudianteId);
      const updated = await getAulaEstudiantes(selectedAulaForEstudiantes.id);
      setAulaEstudiantes(updated);
    } catch (err) {
      alert("Error al quitar estudiante");
    }
  };

  const handleAsignarEstudiante = async () => {
    if (!selectedAulaForEstudiantes || !selectedEstudianteId) return;
    try {
      await asignarEstudianteAula(selectedAulaForEstudiantes.id, selectedEstudianteId);
      const updated = await getAulaEstudiantes(selectedAulaForEstudiantes.id);
      setAulaEstudiantes(updated);
      setSelectedEstudianteId("");
    } catch (err) {
      alert("Error al asignar estudiante");
    }
  };

  const estudiantesDisponiblesParaAula = todosLosEstudiantes.filter(
    (e) => !aulaEstudiantes.some((ae) => ae.id === e.id)
  );

  const renderSalaLabel = (aula: Aula) => {
    const sala = aula.sala ?? salas.find((s) => s.id === aula.sala_id);
    if (sala) {
      if (sala.nombre) return sala.nombre;
      if (sala.grado) return `Sala ${sala.grado}`;
    }
    return `Sala ${aula.sala_id}`;
  };

  const renderForm = () => (
    <Box sx={{ mt: 4, maxWidth: 500 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        {mode === "create" ? "Crear nueva aula" : "Editar aula"}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        select
        fullWidth
        label="Sala / Grado"
        value={salaId}
        onChange={(e) => setSalaId(Number(e.target.value))}
        sx={{ mb: 2 }}
      >
        {salas.map((s) => (
          <MenuItem key={s.id} value={s.id}>
            {s.nombre} {s.grado ? `(${s.grado})` : ""}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        label="Comisión"
        value={comision}
        onChange={(e) => setComision(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Turno"
        placeholder="mañana / tarde"
        value={turno}
        onChange={(e) => setTurno(e.target.value)}
        sx={{ mb: 3 }}
      />

      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            bgcolor: '#000',
            color: '#fff',
            py: 1.5,
            px: 4,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { bgcolor: '#333' }
          }}
        >
          Guardar
        </Button>
        <Button
          variant="outlined"
          onClick={handleCancel}
          sx={{
            borderColor: '#000',
            color: '#000',
            py: 1.5,
            px: 4,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
          }}
        >
          Cancelar
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
      <Box sx={{ bgcolor: "#f5f5f5", py: 4, borderBottom: "1px solid #e0e0e0" }}>
        <Container maxWidth="lg">
          {/* Fila superior: Navegación */}
          <Box sx={{ mb: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/home")}
              disableRipple
              sx={{
                color: "#5c7cfa",
                textTransform: "none",
                fontSize: '1rem',
                fontWeight: 500,
                pl: 0,
                "&:hover": { bgcolor: "transparent", textDecoration: "underline" }
              }}
            >
              Volver a inicio
            </Button>
          </Box>

          {/* Fila principal: Título a la izquierda, botón a la derecha */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {/* Bloque de Título y Subtítulo */}
            <Box>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 700, color: "#1a1a1a", mb: 1 }}>
                Aulas
              </Typography>
              <Typography variant="body1" sx={{ color: "#666" }}>
                Gestión de aulas (grado, comisión y turno) de tu escuela.
              </Typography>
            </Box>

            {/* Botón de Acción */}
            {mode === "list" && !selectedAulaForEstudiantes && permissions.createAula(currentRole) && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleStartCreate}
                sx={{
                  bgcolor: "#5fb878",
                  color: "white",
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  "&:hover": {
                    bgcolor: "#000",
                    transform: "translateY(-1px)",
                    boxShadow: "0 6px 8px rgba(0,0,0,0.15)"
                  },
                  transition: "all 0.2s ease"
                }}
              >
                Nueva aula
              </Button>
            )}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {mode === "list" && (
          <>
            {loading || pendingAulaId || (loadingAulaEstudiantes && !selectedAulaForEstudiantes) ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : selectedAulaForEstudiantes ? (
              <Box>
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={closeEstudiantesView}
                  sx={{ mb: 2, textTransform: "none" }}
                >
                  Volver a aulas
                </Button>

                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {renderSalaLabel(selectedAulaForEstudiantes)} - {selectedAulaForEstudiantes.comision} (
                  {selectedAulaForEstudiantes.turno})
                </Typography>
                <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
                  Tocá en un alumno para ver su historial de evaluaciones.
                </Typography>

                {/* Agregar estudiante */}
                <Box sx={{ display: "flex", gap: 1, mb: 3, maxWidth: 500 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Agregar estudiante al aula"
                    value={selectedEstudianteId}
                    onChange={(e) => setSelectedEstudianteId(e.target.value)}
                  >
                    {estudiantesDisponiblesParaAula.map((e) => (
                      <MenuItem key={e.id} value={e.id}>
                        {e.personas?.primer_apellido}, {e.personas?.nombre}
                      </MenuItem>
                    ))}
                    {estudiantesDisponiblesParaAula.length === 0 && (
                      <MenuItem disabled>No hay más estudiantes disponibles</MenuItem>
                    )}
                  </TextField>
                  <Button
                    variant="contained"
                    sx={{
                      textTransform: "none",
                      bgcolor: "#5fb878",
                      color: "#fff",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      "&:hover": { bgcolor: "#4a9960" },
                    }}
                    disabled={!selectedEstudianteId}
                    onClick={handleAsignarEstudiante}
                  >
                    Agregar
                  </Button>
                </Box>

                {loadingAulaEstudiantes ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : aulaEstudiantes.length === 0 ? (
                  <Alert severity="info">
                    Esta aula todavía no tiene alumnos asignados.
                  </Alert>
                ) : (
                  <Paper elevation={0} sx={{ border: "1px solid #eee", borderRadius: 3 }}>
                    <List>
                      {aulaEstudiantes.map((est, index) => (
                        <ListItem
                          key={est.id}
                          divider={index < aulaEstudiantes.length - 1}
                          secondaryAction={
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                sx={{ textTransform: "none" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const aulaLabel = `${renderSalaLabel(selectedAulaForEstudiantes!)} - ${selectedAulaForEstudiantes!.comision} (${selectedAulaForEstudiantes!.turno})`;
                                  navigate(`/evaluaciones?estudianteId=${est.id}&nombre=${encodeURIComponent(`${est.personas?.nombre ?? ""} ${est.personas?.primer_apellido ?? ""}`)}&salaId=${selectedAulaForEstudiantes!.sala_id}&aulaId=${selectedAulaForEstudiantes!.id}&aulaLabel=${encodeURIComponent(aulaLabel)}&escuelaNombre=${encodeURIComponent("Mi escuela")}&backTo=${encodeURIComponent(`/aulas?aulaId=${selectedAulaForEstudiantes!.id}`)}&backLabel=${encodeURIComponent("Volver al aula")}`);
                                }}
                              >
                                Evaluar
                              </Button>
                              <Button
                                size="small"
                                sx={{ textTransform: "none" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nombre = `${est.personas?.nombre ?? ""} ${est.personas?.primer_apellido ?? ""}`.trim();
                                  const params = new URLSearchParams({
                                    estudianteId: est.id,
                                    nombre,
                                    backTo: `/aulas?aulaId=${selectedAulaForEstudiantes!.id}`,
                                    backLabel: "Volver al aula",
                                  });
                                  navigate(`/historial-estudiante?${params.toString()}`);
                                }}
                              >
                                Historial
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                sx={{
                                  textTransform: "none",
                                  borderColor: "#d32f2f",
                                  color: "#d32f2f",
                                  "&:hover": {
                                    bgcolor: "rgba(211, 47, 47, 0.04)",
                                    borderColor: "#d32f2f",
                                  },
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDesasignarEstudiante(est.id);
                                }}
                              >
                                Quitar
                              </Button>
                            </Stack>
                          }
                          sx={{ cursor: "pointer" }}
                          onClick={() => {
                            const nombre = `${est.personas?.nombre ?? ""} ${est.personas?.primer_apellido ?? ""}`.trim();
                            const params = new URLSearchParams({
                              estudianteId: est.id,
                              nombre,
                              backTo: `/aulas?aulaId=${selectedAulaForEstudiantes!.id}`,
                              backLabel: "Volver al aula",
                            });
                            navigate(`/historial-estudiante?${params.toString()}`);
                          }}
                        >
                          <ListItemText
                            primary={`${est.personas?.primer_apellido ?? ""}, ${est.personas?.nombre ?? ""}`}
                            secondary={`DNI: ${est.personas?.dni ?? "-"}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Box>
            ) : aulas.length === 0 ? (
              <Typography sx={{ color: "#666" }}>No hay aulas registradas.</Typography>
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <Table>
                  <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                    <TableRow>
                      <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Sala</TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Comisión</TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Turno</TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {aulas.map((a) => (
                      <TableRow
                        key={a.id}
                        hover
                        onClick={() => openEstudiantesView(a)}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 }, cursor: "pointer" }}
                      >
                        <TableCell align="center" sx={{ fontWeight: 500 }}>{renderSalaLabel(a)}</TableCell>
                        <TableCell align="center">{a.comision}</TableCell>
                        <TableCell align="center">{a.turno}</TableCell>
                        <TableCell align="center">
                          <Stack direction="row" justifyContent="center" spacing={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{
                                textTransform: "none",
                                borderColor: '#1976d2',
                                color: '#1976d2',
                                '&:hover': {
                                  bgcolor: 'rgba(25, 118, 210, 0.04)',
                                  borderColor: '#1976d2'
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(a);
                              }}
                            >
                              Editar
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{
                                textTransform: "none",
                                borderColor: '#2e7d32',
                                color: '#2e7d32',
                                '&:hover': {
                                  bgcolor: 'rgba(46, 125, 50, 0.04)',
                                  borderColor: '#2e7d32'
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openDocentesDialog(a);
                              }}
                            >
                              Docentes
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{
                                textTransform: "none",
                                borderColor: '#d32f2f',
                                color: '#d32f2f',
                                '&:hover': {
                                  bgcolor: 'rgba(211, 47, 47, 0.04)',
                                  borderColor: '#d32f2f'
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(a);
                              }}
                            >
                              Eliminar
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {mode !== "list" && renderForm()}
      </Container>

      {/* Diálogo simple de gestión de docentes por aula */}
      {selectedAulaForDocentes && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1300,
          }}
        >
          <Box
            sx={{
              bgcolor: "#fff",
              p: 3,
              borderRadius: 2,
              minWidth: 400,
              maxWidth: 500,
            }}
          >
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              Docentes del aula
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: "#666" }}>
              {renderSalaLabel(selectedAulaForDocentes)} - {selectedAulaForDocentes.comision} (
              {selectedAulaForDocentes.turno})
            </Typography>

            <Box sx={{ mb: 2, maxHeight: 200, overflowY: "auto" }}>
              {aulaDocentes.length === 0 ? (
                <Typography variant="body2" sx={{ color: "#777" }}>
                  No hay docentes asignados a esta aula.
                </Typography>
              ) : (
                aulaDocentes.map((ad) => (
                  <Box
                    key={ad.profesor_id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      py: 0.5,
                    }}
                  >
                    <Typography variant="body2">
                      {ad.profesor.personas?.nombre || "Sin nombre"}{" "}
                      {ad.profesor.personas?.primer_apellido || ""}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{
                        textTransform: "none",
                        borderColor: '#d32f2f',
                        color: '#d32f2f',
                        '&:hover': {
                          bgcolor: 'rgba(211, 47, 47, 0.04)',
                          borderColor: '#d32f2f'
                        }
                      }}
                      onClick={() => handleDesasignarDocente(ad.profesor_id)}
                    >
                      Quitar
                    </Button>
                  </Box>
                ))
              )}
            </Box>

            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Agregar docente"
                value={selectedDocenteId}
                onChange={(e) => setSelectedDocenteId(e.target.value)}
              >
                {docentesDisponiblesParaAula.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.apellido}, {d.nombre}
                  </MenuItem>
                ))}
                {docentesDisponiblesParaAula.length === 0 && (
                  <MenuItem disabled>No hay más docentes disponibles</MenuItem>
                )}
              </TextField>
              <Button
                variant="contained"
                sx={{
                  textTransform: "none",
                  bgcolor: '#000',
                  color: '#fff',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#333' }
                }}
                disabled={!selectedDocenteId}
                onClick={handleAsignarDocente}
              >
                Asignar
              </Button>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                sx={{
                  textTransform: "none",
                  borderColor: '#000',
                  color: '#000',
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                }}
                onClick={closeDocentesDialog}
              >
                Cerrar
              </Button>
            </Box>
          </Box>
        </Box>
      )}

    </Box>
  );
}


