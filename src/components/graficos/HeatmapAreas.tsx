import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import type { HeatmapResponse } from "../../api/estadisticas";

function pctToColor(pct: number | null): string {
  if (pct === null) return "#eeeeee";
  // 0%=rojo (0°), 50%=amarillo (60°), 100%=verde (120°)
  const hue = Math.round(pct * 120);
  return `hsl(${hue}, 60%, 82%)`;
}

interface Props {
  data: HeatmapResponse;
  filaLabel: string;
}

export default function HeatmapAreas({ data, filaLabel }: Props) {
  if (data.areas.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
        No hay áreas de evaluación configuradas.
      </Typography>
    );
  }

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                fontWeight: 700,
                minWidth: 160,
                bgcolor: "white",
                borderBottom: "2px solid #ddd",
              }}
            >
              {filaLabel}
            </TableCell>
            {data.areas.map((area) => (
              <TableCell
                key={area.id}
                align="center"
                sx={{
                  fontWeight: 600,
                  minWidth: 90,
                  fontSize: "0.75rem",
                  bgcolor: "white",
                  borderBottom: "2px solid #ddd",
                }}
              >
                {area.nombre}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.filas.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={data.areas.length + 1}
                align="center"
                sx={{ color: "#888", py: 6, fontStyle: "italic" }}
              >
                Sin datos para el período y tipo seleccionados.
              </TableCell>
            </TableRow>
          ) : (
            data.filas.map((fila) => (
              <TableRow key={fila.id} hover>
                <TableCell sx={{ fontWeight: 500, fontSize: "0.85rem" }}>
                  {fila.nombre}
                  {fila.meta?.zona_nombre && (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ display: "block", color: "text.secondary" }}
                    >
                      {fila.meta.zona_nombre}
                    </Typography>
                  )}
                </TableCell>
                {data.areas.map((area) => {
                  const val = fila.valores[area.id];
                  const pct = val?.porcentaje ?? null;
                  return (
                    <Tooltip
                      key={area.id}
                      title={
                        pct !== null
                          ? `${Math.round(pct * 100)}% · n=${val.evaluaciones}`
                          : "Sin datos"
                      }
                      placement="top"
                    >
                      <TableCell
                        align="center"
                        sx={{
                          bgcolor: pctToColor(pct),
                          fontSize: "0.8rem",
                          fontWeight: pct !== null ? 600 : 400,
                          color: pct !== null ? "#333" : "#aaa",
                          cursor: "default",
                          transition: "filter 0.15s",
                          "&:hover": { filter: "brightness(0.92)" },
                        }}
                      >
                        {pct !== null ? `${Math.round(pct * 100)}%` : "—"}
                      </TableCell>
                    </Tooltip>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Box>
  );
}
