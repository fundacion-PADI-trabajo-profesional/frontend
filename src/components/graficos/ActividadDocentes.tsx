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
import type { ActividadResponse } from "../../api/estadisticas";

interface Props {
  data: ActividadResponse;
}

export default function ActividadDocentes({ data }: Props) {
  if (data.docentes.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center", fontStyle: "italic" }}>
        Sin evaluaciones registradas para este período.
      </Typography>
    );
  }

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Evaluaciones registradas por docente en el período <strong>{data.periodo}</strong>.
        Ordenado de mayor a menor actividad.
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.100" }}>
              <TableCell>#</TableCell>
              <TableCell><strong>Docente</strong></TableCell>
              <TableCell align="right"><strong>Evaluaciones registradas</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.docentes.map((d, idx) => (
              <TableRow key={d.profesor_id} hover sx={d.total_evaluaciones === 0 ? { bgcolor: "error.50" } : {}}>
                <TableCell sx={{ color: "text.secondary" }}>{idx + 1}</TableCell>
                <TableCell>{d.nombre} {d.primer_apellido}</TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: d.total_evaluaciones === 0 ? "error.main" : "inherit" }}
                >
                  {d.total_evaluaciones}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
