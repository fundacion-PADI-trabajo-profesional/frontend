import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";
import { Box, Typography } from "@mui/material";
import type { DistribucionResponse } from "../../api/estadisticas";

const COLORES_RANGO = ["#F44336", "#FF7043", "#FF9800", "#8BC34A", "#4CAF50"];

interface Props {
  data: DistribucionResponse;
}

export default function GraficoDistribucion({ data }: Props) {
  const chartData = data.rangos.map((r, i) => ({
    rango: r.rango,
    estudiantes: r.cantidad,
    color: COLORES_RANGO[i],
  }));

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {data.total_estudiantes} estudiante{data.total_estudiantes !== 1 ? "s" : ""} — distribución por nivel de rendimiento promedio
      </Typography>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="rango" tick={{ fontSize: 13 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(v) => [`${v} estudiante${v !== 1 ? "s" : ""}`, "Cantidad"]}
          />
          <Bar dataKey="estudiantes" radius={[6, 6, 0, 0]} maxBarSize={80}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
            <LabelList
              dataKey="estudiantes"
              position="top"
              style={{ fontSize: 15, fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
