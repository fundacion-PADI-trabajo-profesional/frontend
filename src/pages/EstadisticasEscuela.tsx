import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
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
  TextField,
  Typography,  // usado en tab 6 (progresión)
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import GraficoRendimientoZonas from "../components/GraficoRendimientoZonas";
import GraficoEvolucion from "../components/GraficoEvolucion";
import GraficoAreasCriticas from "../components/GraficoAreasCriticas";
import EstudiantesRiesgo from "../components/EstudiantesRiesgo";
import GraficoActividadDocentes from "../components/GraficoActividadDocentes";
import GraficoComparativa from "../components/GraficoComparativa";
import ProgresionEstudiante from "../components/ProgresionEstudiante";
import {
  getHeatmapAulas,
  getEstudiantesEnRiesgoEscuela,
  getEvolucionEscuela,
  getAreasCriticasEscuela,
  getActividadDocentesEscuela,
  getComparativaEscuela,
  getProgresionEstudianteEscuela,
} from "../api/estadisticas";
import { getEstudiantes, type Estudiante } from "../api/estudiantes";
import { getEscuelas, type Escuela } from "../api/escuelas";
import SinEscuelaAsignada from "../components/SinEscuelaAsignada";

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

function getUserEscuelaId(): string | null {
  try {
    const stored = localStorage.getItem("padiUser");
    return stored ? JSON.parse(stored).escuela_id ?? null : null;
  } catch {
    return null;
  }
}

export default function EstadisticasEscuela() {
  const navigate = useNavigate();
  const rol = getUserRol();
  const esRolSuperior = rol === "encargado_zona" || rol === "equipo_padi";

  const [tab, setTab] = useState(0);
  const [periodo, setPeriodo] = useState(CURRENT_YEAR);
  const [tipo, setTipo] = useState("inicial");
  const [umbral, setUmbral] = useState(0.5);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [estudianteId, setEstudianteId] = useState<string | null>(null);

  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [escuelasLoading, setEscuelasLoading] = useState(esRolSuperior);
  const [escuelaId, setEscuelaId] = useState<string>("");

  useEffect(() => {
    if (esRolSuperior) {
      getEscuelas()
        .then((data) => {
          setEscuelas(data);
          if (data.length > 0) setEscuelaId(data[0].id);
        })
        .finally(() => setEscuelasLoading(false));
    }
  }, [esRolSuperior]);

  const escuelaParam = esRolSuperior ? escuelaId || undefined : undefined;
  const escuelaReady = !esRolSuperior || !!escuelaId;

  useEffect(() => {
    if (tab === 6 && escuelaReady) {
      getEstudiantes().then(setEstudiantes).catch(() => {});
    }
  }, [tab, escuelaReady]);

  const heatmapQuery = useQuery({
    queryKey: ["estadisticas-escuela-heatmap", periodo, tipo, escuelaParam],
    queryFn: () => getHeatmapAulas({ periodo, tipo, escuela_id: escuelaParam }),
    enabled: tab === 0 && escuelaReady,
  });
  const evolucionQuery = useQuery({
    queryKey: ["estadisticas-escuela-evolucion", periodo, escuelaParam],
    queryFn: () => getEvolucionEscuela({ periodo, escuela_id: escuelaParam }),
    enabled: tab === 1 && escuelaReady,
  });
  const criticasQuery = useQuery({
    queryKey: ["estadisticas-escuela-criticas", periodo, tipo, escuelaParam],
    queryFn: () => getAreasCriticasEscuela({ periodo, tipo, escuela_id: escuelaParam }),
    enabled: tab === 2 && escuelaReady,
  });
  const riesgoQuery = useQuery({
    queryKey: ["riesgo-escuela", periodo, umbral, escuelaParam],
    queryFn: () => getEstudiantesEnRiesgoEscuela({ periodo, umbral, escuela_id: escuelaParam }),
    enabled: tab === 3 && escuelaReady,
  });
  const actividadQuery = useQuery({
    queryKey: ["actividad-escuela", periodo, escuelaParam],
    queryFn: () => getActividadDocentesEscuela({ periodo, escuela_id: escuelaParam }),
    enabled: tab === 4 && escuelaReady,
  });
  const comparativaQuery = useQuery({
    queryKey: ["comparativa-escuela", periodo, tipo, escuelaParam],
    queryFn: () => getComparativaEscuela({ periodo, tipo, escuela_id: escuelaParam }),
    enabled: tab === 5 && escuelaReady,
  });
  const progresionQuery = useQuery({
    queryKey: ["progresion-escuela", estudianteId, escuelaParam],
    queryFn: () => getProgresionEstudianteEscuela({ estudiante_id: estudianteId!, escuela_id: escuelaParam }),
    enabled: tab === 6 && !!estudianteId && escuelaReady,
  });

  const showTipo = tab === 0 || tab === 2 || tab === 5;

  if (esRolSuperior && escuelasLoading) {
    return <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Estadísticas por Aula"
        subtitle="Rendimiento por área de las aulas de una escuela"
        backTo="/home"
      />

      {rol === "director" && !getUserEscuelaId() ? (
        <SinEscuelaAsignada />
      ) : (
        <>
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Período</InputLabel>
          <Select value={periodo} label="Período" onChange={(e) => setPeriodo(Number(e.target.value))}>
            {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>

        {esRolSuperior && (
          <FormControl size="small" sx={{ minWidth: 240 }} disabled={escuelas.length === 0}>
            <InputLabel>Escuela</InputLabel>
            <Select
              value={escuelaId}
              label="Escuela"
              onChange={(e) => { setEscuelaId(String(e.target.value)); setEstudianteId(null); }}
            >
              {escuelas.map((e) => <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>)}
            </Select>
          </FormControl>
        )}

        {showTipo && (
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Tipo</InputLabel>
            <Select value={tipo} label="Tipo" onChange={(e) => setTipo(String(e.target.value))}>
              <MenuItem value="inicial">Inicial</MenuItem>
              <MenuItem value="final">Final</MenuItem>
            </Select>
          </FormControl>
        )}

        <Button
          size="small"
          variant="outlined"
          onClick={() => navigate("/estadisticas/docente")}
          sx={{ ml: "auto" }}
        >
          Ver estadísticas de aula →
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }} variant="scrollable" scrollButtons="auto">
        <Tab label="Rendimiento" />
        <Tab label="Evolución" />
        <Tab label="Áreas Críticas" />
        <Tab label="En Riesgo" />
        <Tab label="Docentes" />
        <Tab label="Comparativa" />
        <Tab label="Progresión" />
      </Tabs>

      {tab === 0 && (
        <>
          {heatmapQuery.isLoading && <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>}
          {heatmapQuery.error && <Alert severity="error">{(heatmapQuery.error as Error).message}</Alert>}
          {heatmapQuery.data && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <GraficoRendimientoZonas data={heatmapQuery.data} />
            </Paper>
          )}
        </>
      )}

      {tab === 1 && (
        <>
          {evolucionQuery.isLoading && <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>}
          {evolucionQuery.error && <Alert severity="error">{(evolucionQuery.error as Error).message}</Alert>}
          {evolucionQuery.data && <Paper variant="outlined" sx={{ p: 2 }}><GraficoEvolucion data={evolucionQuery.data} /></Paper>}
        </>
      )}

      {tab === 2 && (
        <>
          {criticasQuery.isLoading && <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>}
          {criticasQuery.error && <Alert severity="error">{(criticasQuery.error as Error).message}</Alert>}
          {criticasQuery.data && <Paper variant="outlined" sx={{ p: 2 }}><GraficoAreasCriticas data={criticasQuery.data} /></Paper>}
        </>
      )}

      {tab === 3 && (
        <>
          {riesgoQuery.isLoading && <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}><CircularProgress size={24} /></Box>}
          {riesgoQuery.error && <Alert severity="error">{(riesgoQuery.error as Error).message}</Alert>}
          {riesgoQuery.data && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <EstudiantesRiesgo data={riesgoQuery.data} umbral={umbral} onUmbralChange={setUmbral} mostrarZona={false} />
            </Paper>
          )}
        </>
      )}

      {tab === 4 && (
        <>
          {actividadQuery.isLoading && <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>}
          {actividadQuery.error && <Alert severity="error">{(actividadQuery.error as Error).message}</Alert>}
          {actividadQuery.data && <Paper variant="outlined" sx={{ p: 2 }}><GraficoActividadDocentes data={actividadQuery.data} /></Paper>}
        </>
      )}

      {tab === 5 && (
        <>
          {comparativaQuery.isLoading && <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>}
          {comparativaQuery.error && <Alert severity="error">{(comparativaQuery.error as Error).message}</Alert>}
          {comparativaQuery.data && <Paper variant="outlined" sx={{ p: 2 }}><GraficoComparativa data={comparativaQuery.data} /></Paper>}
        </>
      )}

      {tab === 6 && (
        <Box>
          <Autocomplete
            options={estudiantes}
            getOptionLabel={(e) =>
              `${e.personas?.nombre ?? ""} ${e.personas?.primer_apellido ?? ""}`
            }
            onChange={(_, val) => setEstudianteId(val?.id ?? null)}
            renderInput={(params) => (
              <TextField {...params} label="Buscar estudiante" size="small" sx={{ maxWidth: 360, mb: 3 }} />
            )}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            noOptionsText="Sin resultados"
          />
          {!estudianteId && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
              Seleccioná un estudiante para ver su progresión.
            </Typography>
          )}
          {progresionQuery.isLoading && <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>}
          {progresionQuery.error && <Alert severity="error">{(progresionQuery.error as Error).message}</Alert>}
          {progresionQuery.data && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <ProgresionEstudiante data={progresionQuery.data} />
            </Paper>
          )}
        </Box>
      )}
        </>
      )}
    </Box>
  );
}
