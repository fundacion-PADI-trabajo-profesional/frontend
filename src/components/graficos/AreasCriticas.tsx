import {
  Box,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { AreasCriticasResponse } from "../../api/estadisticas";

interface Props {
  data: AreasCriticasResponse;
}

function barColor(pct: number | null): "error" | "warning" | "success" {
  if (pct == null || pct < 0.4) return "error";
  if (pct < 0.7) return "warning";
  return "success";
}

export default function AreasCriticas({ data }: Props) {
  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Áreas ordenadas de peor a mejor rendimiento para la evaluación{" "}
        <strong>{data.tipo}</strong> del período <strong>{data.periodo}</strong>.
        Las áreas sin datos aparecen al final.
      </Typography>
      <Stack spacing={1.5}>
        {data.areas.map((area, idx) => {
          const pct = area.porcentaje_promedio;
          const pctDisplay = pct == null ? "Sin datos" : `${Math.round(pct * 100)}%`;
          const progress = pct == null ? 0 : pct * 100;
          return (
            <Paper key={area.area_id} variant="outlined" sx={{ p: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2" fontWeight={600}>
                  #{idx + 1} {area.area_nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {pctDisplay}
                  {area.evaluaciones > 0 && ` · ${area.evaluaciones} eval.`}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                color={barColor(pct)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Paper>
          );
        })}
      </Stack>
    </>
  );
}
