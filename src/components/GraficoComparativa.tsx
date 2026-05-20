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
import type { ComparativaResponse } from "../api/estadisticas";

interface Props {
  data: ComparativaResponse;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: "white", border: "1px solid #ddd", borderRadius: 1, p: 1.5, minWidth: 180 }}>
      <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>{label}</Typography>
      {payload.map((p: any) => (
        <Typography key={p.dataKey} variant="body2" color={p.fill}>
          {p.name}: {p.value != null ? `${p.value}%` : "Sin datos"}
        </Typography>
      ))}
    </Box>
  );
}

export default function GraficoComparativa({ data }: Props) {
  const chartData = data.areas.map((a) => ({
    area: a.area_nombre,
    "Esta escuela": a.pct_escuela != null ? Math.round(a.pct_escuela * 100) : null,
    "Zona": a.pct_zona != null ? Math.round(a.pct_zona * 100) : null,
    "Nacional": a.pct_nacional != null ? Math.round(a.pct_nacional * 100) : null,
  }));

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Comparativa de rendimiento por área frente a la zona y al promedio nacional
      </Typography>
      <ResponsiveContainer width="100%" height={400}>
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
          <ReferenceLine y={50} stroke="#999" strokeDasharray="4 4" />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" />
          <Bar dataKey="Esta escuela" fill="#1976D2" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="Zona" fill="#FF9800" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="Nacional" fill="#9E9E9E" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
