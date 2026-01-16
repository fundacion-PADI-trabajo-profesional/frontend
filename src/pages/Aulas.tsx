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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
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
} from "../api/aulas";
import { getSalas, Sala } from "../api/estudiantes";
import { getDocentes, Docente } from "../api/docentes";

type Mode = "list" | "create" | "edit";

export default function AulasPage() {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [selectedAulaForDocentes, setSelectedAulaForDocentes] = useState<Aula | null>(null);
  const [aulaDocentes, setAulaDocentes] = useState<AulaDocente[]>([]);
  const [selectedDocenteId, setSelectedDocenteId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<Aula | null>(null);

  const [salaId, setSalaId] = useState<number | "">("");
  const [comision, setComision] = useState("");
  const [turno, setTurno] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
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
  }, [mode]);

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

  const renderSalaLabel = (aula: Aula) => {
    if (aula.sala?.nombre || aula.sala?.grado) {
      return `${aula.sala.nombre ?? ""} ${aula.sala.grado ?? ""}`.trim();
    }
    const found = salas.find((s) => s.id === aula.sala_id);
    if (found) {
      return `${found.nombre ?? ""} ${found.grado ?? ""}`.trim();
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
            {mode === "list" && (
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
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : aulas.length === 0 ? (
              <Typography sx={{ color: "#666" }}>No hay aulas registradas.</Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Sala</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Comisión</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Turno</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {aulas.map((a) => (
                      <TableRow key={a.id} hover>
                        <TableCell>{renderSalaLabel(a)}</TableCell>
                        <TableCell>{a.comision}</TableCell>
                        <TableCell>{a.turno}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{
                              textTransform: "none",
                              mr: 1,
                              borderColor: '#1976d2',
                              color: '#1976d2',
                              '&:hover': {
                                bgcolor: 'rgba(25, 118, 210, 0.04)',
                                borderColor: '#1976d2'
                              }
                            }}
                            onClick={() => handleStartEdit(a)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{
                              textTransform: "none",
                              mr: 1,
                              borderColor: '#2e7d32',
                              color: '#2e7d32',
                              '&:hover': {
                                bgcolor: 'rgba(46, 125, 50, 0.04)',
                                borderColor: '#2e7d32'
                              }
                            }}
                            onClick={() => openDocentesDialog(a)}
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
                            onClick={() => handleDelete(a)}
                          >
                            Eliminar
                          </Button>
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


