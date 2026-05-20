import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import GraficoAprobacionPreguntas from "../components/GraficoAprobacionPreguntas";
import GraficoDistribucion from "../components/GraficoDistribucion";
import ProgresionEstudiante from "../components/ProgresionEstudiante";
import { getAprobacionPreguntas, getDistribucionPuntajes, getProgresionEstudianteDocente } from "../api/estadisticas";
import { getDocenteAulasConEstudiantes, getAulasPorEscuela, getAulaEstudiantes, type DocenteAulaConEstudiantes, type Aula } from "../api/aulas";
import { getEscuelas, type Escuela } from "../api/escuelas";
import type { Estudiante } from "../api/estudiantes";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

function getUserRol(): string {
  try {
    const stored = localStorage.getItem("padiUser");
    return stored ? JSON.parse(stored).rol : "";
  } catch {
    return "";
  }
}

export default function EstadisticasDocente() {
  const navigate = useNavigate();
  const rol = getUserRol();
  const esDocente = rol === "docente";

  const [tab, setTab] = useState(0);
  const [periodo, setPeriodo] = useState(CURRENT_YEAR);
  const [aulaId, setAulaId] = useState<string>("");
  const [estudianteId, setEstudianteId] = useState<string>("");

  // Estado para docente
  const [aulasDocente, setAulasDocente] = useState<DocenteAulaConEstudiantes[]>([]);
  const [aulasLoading, setAulasLoading] = useState(true);

  // Estado para roles superiores
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [escuelasLoading, setEscuelasLoading] = useState(!esDocente);
  const [escuelaId, setEscuelaId] = useState<string>("");
  const [aulasEscuela, setAulasEscuela] = useState<Aula[]>([]);
  const [aulasEscuelaLoading, setAulasEscuelaLoading] = useState(false);
  const [estudiantesAula, setEstudiantesAula] = useState<Estudiante[]>([]);

  // Carga inicial según rol
  useEffect(() => {
    if (esDocente) {
      getDocenteAulasConEstudiantes()
        .then((data) => {
          setAulasDocente(data);
          if (data.length > 0) setAulaId(data[0].id);
        })
        .finally(() => setAulasLoading(false));
    } else {
      getEscuelas()
        .then((data) => {
          setEscuelas(data);
          if (data.length > 0) setEscuelaId(data[0].id);
        })
        .finally(() => setEscuelasLoading(false));
    }
  }, [esDocente]);

  // Cuando cambia la escuela, carga las aulas de esa escuela
  useEffect(() => {
    if (!esDocente && escuelaId) {
      setAulaId("");
      setEstudianteId("");
      setAulasEscuelaLoading(true);
      getAulasPorEscuela(escuelaId)
        .then((data) => {
          setAulasEscuela(data);
          if (data.length > 0) setAulaId(data[0].id);
        })
        .finally(() => setAulasEscuelaLoading(false));
    }
  }, [esDocente, escuelaId]);

  // Cuando cambia el aula (para roles superiores), carga estudiantes
  useEffect(() => {
    if (!esDocente && aulaId && tab === 2) {
      getAulaEstudiantes(aulaId).then(setEstudiantesAula).catch(() => {});
    }
  }, [esDocente, aulaId, tab]);

  const aulaActual = esDocente ? aulasDocente.find((a) => a.id === aulaId) : null;
  const estudiantesDeAula: Estudiante[] = esDocente
    ? ((aulaActual?.estudiantes ?? []) as Estudiante[])
    : estudiantesAula;

  const aprobacionQuery = useQuery({
    queryKey: ["estadisticas-docente-aprobacion", periodo, aulaId],
    queryFn: () => getAprobacionPreguntas({ periodo, aula_id: aulaId }),
    enabled: tab === 0 && !!aulaId,
  });

  const distribucionQuery = useQuery({
    queryKey: ["estadisticas-docente-dist", periodo, aulaId],
    queryFn: () => getDistribucionPuntajes({ periodo, aula_id: aulaId }),
    enabled: tab === 1 && !!aulaId,
  });

  const progresionQuery = useQuery({
    queryKey: ["progresion-docente", estudianteId, aulaId],
    queryFn: () => getProgresionEstudianteDocente({
      estudiante_id: estudianteId,
      aula_id: esDocente ? undefined : aulaId,
    }),
    enabled: tab === 2 && !!aulaId && !!estudianteId,
  });

  function aulaLabel(aula: DocenteAulaConEstudiantes | Aula) {
    const sala = aula.sala?.nombre ?? `Sala ${aula.sala_id}`;
    return `${sala} — ${aula.comision} (${aula.turno})`;
  }

  const loading = esDocente ? aulasLoading : escuelasLoading;
  const aulas = esDocente ? aulasDocente : aulasEscuela;
  const sinAulas = !loading && !aulasEscuelaLoading && aulas.length === 0;

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Estadísticas de Aula"
        subtitle={esDocente ? "Análisis de rendimiento y errores frecuentes en tu aula" : "Análisis de rendimiento de un aula específica"}
        backTo="/home"
      />

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Período</InputLabel>
          <Select value={periodo} label="Período" onChange={(e) => setPeriodo(Number(e.target.value))}>
            {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>

        {!esDocente && (
          <FormControl size="small" sx={{ minWidth: 240 }} disabled={escuelasLoading || escuelas.length === 0}>
            <InputLabel>Escuela</InputLabel>
            <Select
              value={escuelaId}
              label="Escuela"
              onChange={(e) => setEscuelaId(String(e.target.value))}
            >
              {escuelas.map((e) => <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>)}
            </Select>
          </FormControl>
        )}

        <FormControl
          size="small"
          sx={{ minWidth: 220 }}
          disabled={loading || aulasEscuelaLoading || aulas.length === 0}
        >
          <InputLabel>Aula</InputLabel>
          <Select value={aulaId} label="Aula" onChange={(e) => { setAulaId(String(e.target.value)); setEstudianteId(""); }}>
            {aulas.map((a) => <MenuItem key={a.id} value={a.id}>{aulaLabel(a)}</MenuItem>)}
          </Select>
        </FormControl>

        {tab === 2 && estudiantesDeAula.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Estudiante</InputLabel>
            <Select value={estudianteId} label="Estudiante" onChange={(e) => setEstudianteId(String(e.target.value))}>
              {estudiantesDeAula.map((est) => (
                <MenuItem key={est.id} value={est.id}>
                  {est.personas?.nombre ?? ""} {est.personas?.primer_apellido ?? ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {!esDocente && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate("/estadisticas/escuela")}
            sx={{ ml: "auto" }}
          >
            ← Estadísticas de escuela
          </Button>
        )}
      </Box>

      {loading && <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>}
      {sinAulas && (
        <Alert severity="info">
          {esDocente ? "No tenés aulas asignadas para este período." : "No hay aulas en esta escuela."}
        </Alert>
      )}

      {!loading && aulas.length > 0 && (
        <>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); setEstudianteId(""); }} sx={{ mb: 3 }}>
            <Tab label="Aprobación por Pregunta" />
            <Tab label="Distribución de Puntajes" />
            <Tab label="Progresión" />
          </Tabs>

          {tab === 0 && (
            <>
              {aprobacionQuery.isLoading && <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>}
              {aprobacionQuery.error && <Alert severity="error">{(aprobacionQuery.error as Error).message}</Alert>}
              {aprobacionQuery.data && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <GraficoAprobacionPreguntas data={aprobacionQuery.data} />
                </Paper>
              )}
            </>
          )}

          {tab === 1 && (
            <>
              {distribucionQuery.isLoading && <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>}
              {distribucionQuery.error && <Alert severity="error">{(distribucionQuery.error as Error).message}</Alert>}
              {distribucionQuery.data && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <GraficoDistribucion data={distribucionQuery.data} />
                </Paper>
              )}
            </>
          )}

          {tab === 2 && (
            <>
              {!estudianteId && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                  Seleccioná un estudiante del selector de arriba para ver su progresión.
                </Typography>
              )}
              {progresionQuery.isLoading && <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>}
              {progresionQuery.error && <Alert severity="error">{(progresionQuery.error as Error).message}</Alert>}
              {progresionQuery.data && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <ProgresionEstudiante data={progresionQuery.data} />
                </Paper>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
}
