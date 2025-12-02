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
import { useNavigate } from "react-router-dom";
import { Aula, getAulas, createAula, updateAula, deleteAula } from "../api/aulas";
import { getSalas, Sala } from "../api/estudiantes";

type Mode = "list" | "create" | "edit";

export default function AulasPage() {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
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
        const [aulasData, salasData] = await Promise.all([getAulas(), getSalas()]);
        setAulas(aulasData);
        setSalas(salasData);
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
        <Button variant="contained" onClick={handleSubmit} sx={{ textTransform: "none" }}>
          Guardar
        </Button>
        <Button variant="outlined" onClick={handleCancel} sx={{ textTransform: "none" }}>
          Cancelar
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
      <Box sx={{ bgcolor: "#f5f5f5", py: 4, borderBottom: "1px solid #e0e0e0" }}>
        <Container maxWidth="lg">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/home")}
            sx={{ color: "#5c7cfa", textTransform: "none", mb: 2 }}
          >
            Volver a inicio
          </Button>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
            Aulas
          </Typography>
          <Typography variant="body1" sx={{ color: "#666" }}>
            Gestión de aulas (grado, comisión y turno) de tu escuela.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {mode === "list" && (
          <>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Button
                variant="contained"
                onClick={handleStartCreate}
                sx={{ textTransform: "none" }}
              >
                Nueva aula
              </Button>
            </Box>

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
                            sx={{ textTransform: "none", mr: 1 }}
                            onClick={() => handleStartEdit(a)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            sx={{ textTransform: "none" }}
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
    </Box>
  );
}


