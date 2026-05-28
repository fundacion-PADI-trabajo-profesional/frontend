import { Box, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import type { CoberturaResponse } from "../../api/estadisticas";

interface Props {
  data: CoberturaResponse;
}

export default function CoberturaZonas({ data }: Props) {
  const maxEvals = Math.max(...data.zonas.map((z) => z.evaluaciones), 1);

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Actividad de evaluaciones por zona en el período <strong>{data.periodo}</strong>.
        Total:{" "}
        <strong>{data.total_evaluaciones}</strong> evaluaciones ·{" "}
        <strong>{data.total_estudiantes_evaluados}</strong> estudiantes únicos evaluados.
      </Typography>
      <Stack spacing={1.5}>
        {data.zonas.map((zona) => {
          const barValue = (zona.evaluaciones / maxEvals) * 100;
          return (
            <Paper key={zona.zona_id} variant="outlined" sx={{ p: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2" fontWeight={600}>
                  {zona.zona_nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {zona.evaluaciones} eval. · {zona.estudiantes_evaluados} est.
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={barValue}
                color={zona.evaluaciones === 0 ? "error" : zona.evaluaciones < 5 ? "warning" : "success"}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Paper>
          );
        })}
      </Stack>
    </>
  );
}
