import { Box, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import type { ItemsErrorResponse } from "../api/estadisticas";

interface Props {
  data: ItemsErrorResponse;
}

export default function ItemsError({ data }: Props) {
  if (data.items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center", fontStyle: "italic" }}>
        Sin respuestas registradas para este período.
      </Typography>
    );
  }

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Ítems ordenados de mayor a menor tasa de error en el período{" "}
        <strong>{data.periodo}</strong>.
        {data.area_id && " Filtrado por área seleccionada."}
      </Typography>
      <Stack spacing={1.5}>
        {data.items.map((item, idx) => {
          const pct = Math.round(item.tasa_error * 100);
          const label = item.consigna
            ? item.consigna.length > 80
              ? `${item.consigna.slice(0, 80)}…`
              : item.consigna
            : item.pregunta_id;
          return (
            <Paper key={item.pregunta_id} variant="outlined" sx={{ p: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2" fontWeight={600} sx={{ maxWidth: "75%" }}>
                  #{idx + 1} {label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {pct}% error · {item.incorrectos}/{item.total}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={pct}
                color={pct >= 60 ? "error" : pct >= 30 ? "warning" : "success"}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Paper>
          );
        })}
      </Stack>
    </>
  );
}
