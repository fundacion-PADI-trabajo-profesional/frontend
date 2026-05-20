import { useState } from "react";
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
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import GraficoRendimientoZonas from "../components/GraficoRendimientoZonas";
import GraficoEvolucion from "../components/GraficoEvolucion";
import GraficoAreasCriticas from "../components/GraficoAreasCriticas";
import EstudiantesRiesgo from "../components/EstudiantesRiesgo";
import GraficoActividadDocentes from "../components/GraficoActividadDocentes";
import {
  getHeatmapEscuelas,
  getEstudiantesEnRiesgoZona,
  getEvolucionZona,
  getAreasCriticasZona,
  getActividadDocentesZona,
} from "../api/estadisticas";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export default function EstadisticasZona() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [periodo, setPeriodo] = useState(CURRENT_YEAR);
  const [tipo, setTipo] = useState("inicial");
  const [umbral, setUmbral] = useState(0.5);

  const heatmapQuery = useQuery({
    queryKey: ["estadisticas-zona-heatmap", periodo, tipo],
    queryFn: () => getHeatmapEscuelas({ periodo, tipo }),
    enabled: tab === 0,
  });
  const evolucionQuery = useQuery({
    queryKey: ["estadisticas-zona-evolucion", periodo],
    queryFn: () => getEvolucionZona({ periodo }),
    enabled: tab === 1,
  });
  const criticasQuery = useQuery({
    queryKey: ["estadisticas-zona-criticas", periodo, tipo],
    queryFn: () => getAreasCriticasZona({ periodo, tipo }),
    enabled: tab === 2,
  });
  const riesgoQuery = useQuery({
    queryKey: ["riesgo-zona", periodo, umbral],
    queryFn: () => getEstudiantesEnRiesgoZona({ periodo, umbral }),
    enabled: tab === 3,
  });
  const actividadQuery = useQuery({
    queryKey: ["actividad-zona", periodo],
    queryFn: () => getActividadDocentesZona({ periodo }),
    enabled: tab === 4,
  });

  const showTipo = tab === 0 || tab === 2;

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Estadísticas por Escuela"
        subtitle="Rendimiento por área de las escuelas de tu zona"
        backTo="/home"
      />

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Período</InputLabel>
          <Select value={periodo} label="Período" onChange={(e) => setPeriodo(Number(e.target.value))}>
            {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
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
          onClick={() => navigate("/estadisticas/escuela")}
          sx={{ ml: "auto" }}
        >
          Ver estadísticas de escuela →
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Rendimiento" />
        <Tab label="Evolución" />
        <Tab label="Áreas Críticas" />
        <Tab label="En Riesgo" />
        <Tab label="Docentes" />
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
    </Box>
  );
}
