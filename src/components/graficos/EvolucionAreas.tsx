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
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import RemoveIcon from "@mui/icons-material/Remove";
import type { EvolucionResponse } from "../../api/estadisticas";

interface Props {
  data: EvolucionResponse;
}

function pct(v: number | null): string {
  return v == null ? "—" : `${Math.round(v * 100)}%`;
}

function DeltaCell({ delta }: { delta: number | null }) {
  if (delta == null) return <TableCell align="center">—</TableCell>;
  const pctVal = Math.round(delta * 100);
  if (delta > 0)
    return (
      <TableCell align="center" sx={{ color: "success.main", fontWeight: 600 }}>
        <ArrowUpwardIcon sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.3 }} />+{pctVal}%
      </TableCell>
    );
  if (delta < 0)
    return (
      <TableCell align="center" sx={{ color: "error.main", fontWeight: 600 }}>
        <ArrowDownwardIcon sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.3 }} />
        {pctVal}%
      </TableCell>
    );
  return (
    <TableCell align="center" sx={{ color: "text.secondary" }}>
      <RemoveIcon sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.3 }} />0%
    </TableCell>
  );
}

export default function EvolucionAreas({ data }: Props) {
  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Evolución del rendimiento por área entre evaluación inicial y final del período{" "}
        <strong>{data.periodo}</strong>.
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.100" }}>
              <TableCell>
                <strong>Área</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Inicial</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Final</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Δ</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Eval. inicial</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Eval. final</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.areas.map((a) => (
              <TableRow key={a.area_id} hover>
                <TableCell>{a.area_nombre}</TableCell>
                <TableCell align="center">{pct(a.pct_inicial)}</TableCell>
                <TableCell align="center">{pct(a.pct_final)}</TableCell>
                <DeltaCell delta={a.delta} />
                <TableCell align="center">{a.evaluaciones_inicial}</TableCell>
                <TableCell align="center">{a.evaluaciones_final}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
