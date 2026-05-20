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
import GraficoCobertura from "../components/GraficoCobertura";
import {
  getHeatmapZonas,
  getEvolucionPadi,
  getAreasCriticasPadi,
  getCoberturaPorZona,
} from "../api/estadisticas";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export default function EstadisticasPadi() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [periodo, setPeriodo] = useState(CURRENT_YEAR);
  const [tipo, setTipo] = useState("inicial");

  const heatmapQuery = useQuery({
    queryKey: ["estadisticas-padi-heatmap", periodo, tipo],
    queryFn: () => getHeatmapZonas({ periodo, tipo }),
    enabled: tab === 0,
  });

  const evolucionQuery = useQuery({
    queryKey: ["estadisticas-padi-evolucion", periodo],
    queryFn: () => getEvolucionPadi({ periodo }),
    enabled: tab === 1,
  });

  const criticasQuery = useQuery({
    queryKey: ["estadisticas-padi-criticas", periodo, tipo],
    queryFn: () => getAreasCriticasPadi({ periodo, tipo }),
    enabled: tab === 2,
  });

  const coberturaQuery = useQuery({
    queryKey: ["estadisticas-padi-cobertura", periodo],
    queryFn: () => getCoberturaPorZona({ periodo }),
    enabled: tab === 3,
  });

  const showTipo = tab === 0 || tab === 2;

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Estadísticas por Zona"
        subtitle="Rendimiento por área para todas las zonas del programa"
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

        <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
          <Button size="small" variant="outlined" onClick={() => navigate("/estadisticas/escuela")}>
            Ver por escuela →
          </Button>
          <Button size="small" variant="outlined" onClick={() => navigate("/estadisticas/docente")}>
            Ver por aula →
          </Button>
        </Box>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Rendimiento" />
        <Tab label="Evolución" />
        <Tab label="Áreas Críticas" />
        <Tab label="Cobertura" />
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
          {coberturaQuery.isLoading && <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>}
          {coberturaQuery.error && <Alert severity="error">{(coberturaQuery.error as Error).message}</Alert>}
          {coberturaQuery.data && <Paper variant="outlined" sx={{ p: 2 }}><GraficoCobertura data={coberturaQuery.data} /></Paper>}
        </>
      )}
    </Box>
  );
}
