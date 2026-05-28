import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { ComparativaResponse } from "../../api/estadisticas";

interface Props {
  data: ComparativaResponse;
}

function pctCell(v: number | null) {
  if (v == null) return "—";
  const n = Math.round(v * 100);
  return `${n}%`;
}

function cellColor(v: number | null): string | undefined {
  if (v == null) return undefined;
  if (v < 0.4) return "#ffebee";
  if (v < 0.7) return "#fff8e1";
  return "#e8f5e9";
}

export default function ComparativaEscuela({ data }: Props) {
  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Rendimiento por área en evaluación <strong>{data.tipo}</strong> del período{" "}
        <strong>{data.periodo}</strong>. Comparativa entre tu escuela, la zona y el promedio nacional.
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.100" }}>
              <TableCell><strong>Área</strong></TableCell>
              <TableCell align="center"><strong>Mi escuela</strong></TableCell>
              <TableCell align="center"><strong>Zona</strong></TableCell>
              <TableCell align="center"><strong>Nacional</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.areas.map((a) => (
              <TableRow key={a.area_id} hover>
                <TableCell>{a.area_nombre}</TableCell>
                <TableCell align="center" sx={{ bgcolor: cellColor(a.pct_escuela), fontWeight: 600 }}>
                  {pctCell(a.pct_escuela)}
                </TableCell>
                <TableCell align="center" sx={{ bgcolor: cellColor(a.pct_zona) }}>
                  {pctCell(a.pct_zona)}
                </TableCell>
                <TableCell align="center" sx={{ bgcolor: cellColor(a.pct_nacional) }}>
                  {pctCell(a.pct_nacional)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
