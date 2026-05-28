import { Box, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import type { DistribucionResponse } from "../../api/estadisticas";

interface Props {
  data: DistribucionResponse;
}

function barColor(min: number): "error" | "warning" | "success" {
  if (min <= 0.2) return "error";
  if (min <= 0.4) return "warning";
  return "success";
}

export default function DistribucionPuntajes({ data }: Props) {
  const maxCantidad = Math.max(...data.rangos.map((r) => r.cantidad), 1);

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Distribución de puntaje promedio por estudiante del aula en el período{" "}
        <strong>{data.periodo}</strong>. Total: <strong>{data.total_estudiantes}</strong> estudiante
        {data.total_estudiantes !== 1 ? "s" : ""}.
      </Typography>
      <Stack spacing={1.5}>
        {data.rangos.map((rango) => {
          const pct = data.total_estudiantes > 0
            ? Math.round((rango.cantidad / data.total_estudiantes) * 100)
            : 0;
          const barValue = (rango.cantidad / maxCantidad) * 100;
          return (
            <Paper key={rango.rango} variant="outlined" sx={{ p: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2" fontWeight={600}>
                  {rango.rango}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {rango.cantidad} estudiante{rango.cantidad !== 1 ? "s" : ""} ({pct}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={barValue}
                color={barColor(rango.min)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Paper>
          );
        })}
      </Stack>
    </>
  );
}
