import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import type { ProgresionResponse } from "../../api/estadisticas";

interface Props {
  data: ProgresionResponse;
}

function pctToColor(pct: number | null): string {
  if (pct == null) return "transparent";
  return `hsl(${Math.round(pct * 120)}, 55%, 85%)`;
}

export default function ProgresionEstudiante({ data }: Props) {
  if (data.areas.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center", fontStyle: "italic" }}>
        Sin evaluaciones registradas para este estudiante.
      </Typography>
    );
  }

  // Collect all unique evaluation events, ordered by date
  const evIds = Array.from(
    new Map(
      data.areas.flatMap((a) => a.evaluaciones.map((e) => [e.evaluacion_id, e]))
    ).values()
  ).sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Últimas {evIds.length} evaluación{evIds.length !== 1 ? "es" : ""} de{" "}
        <strong>{data.nombre} {data.primer_apellido}</strong> por área.
        Cada columna es una evaluación registrada.
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.100" }}>
              <TableCell><strong>Área</strong></TableCell>
              {evIds.map((ev) => (
                <TableCell key={ev.evaluacion_id} align="center" sx={{ minWidth: 80 }}>
                  <strong>{ev.tipo === "inicial" ? "Ini" : "Fin"}</strong>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    {ev.fecha}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.areas.map((area) => {
              const evalMap = new Map(area.evaluaciones.map((e) => [e.evaluacion_id, e]));
              return (
                <TableRow key={area.area_id} hover>
                  <TableCell>{area.area_nombre}</TableCell>
                  {evIds.map((ev) => {
                    const e = evalMap.get(ev.evaluacion_id);
                    const pct = e?.pct ?? null;
                    const label = pct != null ? `${Math.round(pct * 100)}%` : "—";
                    return (
                      <Tooltip key={ev.evaluacion_id} title={pct != null ? label : "Sin datos"}>
                        <TableCell
                          align="center"
                          sx={{ bgcolor: pctToColor(pct), fontWeight: pct != null ? 600 : 400 }}
                        >
                          {label}
                        </TableCell>
                      </Tooltip>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
