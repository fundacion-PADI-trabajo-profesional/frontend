import { lazy, Suspense, useEffect, useState } from "react";
import {
  Alert, Box, Button, CircularProgress, FormControl, InputLabel, MenuItem, Paper, Select, Typography,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "../../components/common/PageHeader";
import { getEscuelas } from "../../api/escuelas";
import { getReporteEscuela } from "../../api/reportes";
import { escuelaTieneModo, MODO_LABEL, nombreArchivo, type Modo } from "../../utils/reporteEscuela";

const Visor = lazy(() => import("../../pdf/reporteEscuela/Visor"));

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const MODOS: Modo[] = ["inicial", "cierre", "comparativo"];
const RAZON_DESHABILITADO: Record<Modo, string> = {
  inicial: "sin evaluaciones iniciales",
  cierre: "sin evaluaciones de cierre",
  comparativo: "sin datos para comparar",
};

export default function ReporteEscuela() {
  const [escuelaId, setEscuelaId] = useState("");
  const [periodo, setPeriodo] = useState(CURRENT_YEAR);
  const [modo, setModo] = useState<Modo>("inicial");
  const [salaSel, setSalaSel] = useState<number | "todas">("todas");
  const [descargando, setDescargando] = useState(false);
  const [descargaError, setDescargaError] = useState<string | null>(null);

  const escuelasQuery = useQuery({ queryKey: ["escuelas"], queryFn: getEscuelas });
  useEffect(() => {
    if (!escuelaId && escuelasQuery.data?.length) setEscuelaId(escuelasQuery.data[0].id);
  }, [escuelaId, escuelasQuery.data]);

  const reporteQuery = useQuery({
    queryKey: ["reporte-escuela", escuelaId, periodo],
    queryFn: () => getReporteEscuela({ escuela_id: escuelaId, periodo }),
    enabled: !!escuelaId,
  });
  const data = reporteQuery.data;

  // Si el modo o la sala elegidos no existen en esta escuela/año, volver a un valor válido.
  useEffect(() => {
    if (!data) return;
    if (!escuelaTieneModo(data, modo)) {
      const disponible = MODOS.find((m) => escuelaTieneModo(data, m));
      if (disponible) setModo(disponible);
    }
    if (salaSel !== "todas" && !data.salas.some((s) => s.sala_id === salaSel)) setSalaSel("todas");
  }, [data, modo, salaSel]);

  const salaId = salaSel === "todas" ? null : salaSel;
  const sinDatos = data !== undefined && data.salas.length === 0;
  const listo = !!data && !sinDatos && escuelaTieneModo(data, modo);

  async function handleDescargar() {
    if (!data) return;
    setDescargando(true);
    setDescargaError(null);
    try {
      // Import lazy: react-pdf y el documento no entran al bundle inicial
      const { generarReportePdf } = await import("../../pdf/reporteEscuela");
      const blob = await generarReportePdf(data, { modo, salaId });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombreArchivo({
        escuela: data.escuela.nombre,
        periodo,
        modo,
        sala: salaId === null ? null : data.salas.find((s) => s.sala_id === salaId)?.sala ?? null,
      });
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setDescargaError((e as Error).message);
    } finally {
      setDescargando(false);
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Reporte de escuela"
        subtitle="PDF de devolución para entregar a la escuela y a las docentes"
        backTo="/home"
      />

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
        <FormControl size="small" sx={{ minWidth: 240 }} disabled={!escuelasQuery.data?.length}>
          <InputLabel>Escuela</InputLabel>
          <Select value={escuelaId} label="Escuela" onChange={(e) => { setEscuelaId(String(e.target.value)); setSalaSel("todas"); }}>
            {(escuelasQuery.data ?? []).map((e) => <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Período</InputLabel>
          <Select value={periodo} label="Período" onChange={(e) => setPeriodo(Number(e.target.value))}>
            {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Modo</InputLabel>
          <Select value={modo} label="Modo" onChange={(e) => setModo(e.target.value as Modo)}>
            {MODOS.map((m) => {
              const habilitado = !data || escuelaTieneModo(data, m);
              return (
                <MenuItem key={m} value={m} disabled={!habilitado}>
                  {MODO_LABEL[m]}{!habilitado ? ` (${RAZON_DESHABILITADO[m]} en ${periodo})` : ""}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }} disabled={!data || sinDatos}>
          <InputLabel>Alcance</InputLabel>
          <Select value={salaSel} label="Alcance" onChange={(e) => setSalaSel(e.target.value === "todas" ? "todas" : Number(e.target.value))}>
            <MenuItem value="todas">Toda la escuela</MenuItem>
            {(data?.salas ?? []).map((s) => <MenuItem key={s.sala_id} value={s.sala_id}>{s.sala}</MenuItem>)}
          </Select>
        </FormControl>

        <Box sx={{ ml: "auto" }}>
          <Button
            variant="contained"
            startIcon={descargando ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfIcon />}
            disabled={!listo || descargando}
            onClick={handleDescargar}
          >
            Descargar PDF
          </Button>
        </Box>
      </Box>

      {descargaError && (
        <Alert severity="error" onClose={() => setDescargaError(null)} sx={{ mb: 2 }}>{descargaError}</Alert>
      )}
      {reporteQuery.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>{(reporteQuery.error as Error).message}</Alert>
      )}

      {(escuelasQuery.isLoading || reporteQuery.isLoading) && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>
      )}

      {sinDatos && (
        <Alert severity="info">Esta escuela no tiene evaluaciones terminadas en {periodo}.</Alert>
      )}

      {listo && (
        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
          <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>}>
            <Visor data={data} modo={modo} salaId={salaId} />
          </Suspense>
        </Paper>
      )}

      {!escuelasQuery.isLoading && !escuelasQuery.data?.length && (
        <Typography color="text.secondary">No hay escuelas cargadas.</Typography>
      )}
    </Box>
  );
}
