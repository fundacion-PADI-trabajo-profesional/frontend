import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { Box, Typography } from "@mui/material";
import type { EvolucionResponse } from "../api/estadisticas";

interface Props {
  data: EvolucionResponse;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const ini = payload.find((p: any) => p.dataKey === "Inicial");
  const fin = payload.find((p: any) => p.dataKey === "Final");
  const iniVal = ini?.value ?? null;
  const finVal = fin?.value ?? null;
  const delta = iniVal != null && finVal != null ? finVal - iniVal : null;
  return (
    <Box sx={{ bgcolor: "white", border: "1px solid #ddd", borderRadius: 1, p: 1.5, minWidth: 160 }}>
      <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>{label}</Typography>
      {iniVal != null && <Typography variant="body2" color="#2196F3">Inicial: {iniVal}%</Typography>}
      {finVal != null && <Typography variant="body2" color="#4CAF50">Final: {finVal}%</Typography>}
      {delta != null && (
        <Typography
          variant="body2"
          fontWeight={600}
          color={delta >= 0 ? "success.main" : "error.main"}
          sx={{ mt: 0.5 }}
        >
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}pp
        </Typography>
      )}
    </Box>
  );
}

export default function GraficoEvolucion({ data }: Props) {
  const chartData = data.areas.map((a) => ({
    area: a.area_nombre,
    Inicial: a.pct_inicial != null ? Math.round(a.pct_inicial * 100) : null,
    Final: a.pct_final != null ? Math.round(a.pct_final * 100) : null,
  }));

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Comparativa de rendimiento entre evaluación inicial y final por área
      </Typography>
      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="area"
            tick={{ fontSize: 12 }}
            angle={-30}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 12 }}
          />
          <ReferenceLine y={50} stroke="#999" strokeDasharray="4 4" label={{ value: "50%", position: "right", fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" />
          <Bar dataKey="Inicial" fill="#2196F3" radius={[4, 4, 0, 0]} maxBarSize={36} />
          <Bar dataKey="Final" fill="#4CAF50" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
