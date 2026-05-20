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
  ReferenceLine,
} from "recharts";
import { Box, Typography } from "@mui/material";
import type { AreasCriticasResponse } from "../api/estadisticas";

interface Props {
  data: AreasCriticasResponse;
}

function barColor(pct: number): string {
  if (pct >= 70) return "#4CAF50";
  if (pct >= 40) return "#FF9800";
  return "#F44336";
}

export default function GraficoAreasCriticas({ data }: Props) {
  const chartData = [...data.areas]
    .sort((a, b) => {
      if (a.porcentaje_promedio === null) return 1;
      if (b.porcentaje_promedio === null) return -1;
      return a.porcentaje_promedio - b.porcentaje_promedio;
    })
    .map((a) => ({
      area: a.area_nombre,
      pct: a.porcentaje_promedio != null ? Math.round(a.porcentaje_promedio * 100) : 0,
      evaluaciones: a.evaluaciones,
    }));

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Rendimiento promedio por área — de peor a mejor. Rojo: crítico · Naranja: atención · Verde: bien.
      </Typography>
      <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 52)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 80, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="area"
            width={140}
            tick={{ fontSize: 13 }}
          />
          <ReferenceLine x={40} stroke="#FF9800" strokeDasharray="4 4" />
          <ReferenceLine x={70} stroke="#4CAF50" strokeDasharray="4 4" />
          <Tooltip
            formatter={(value, _, props) => [
              `${value}% (${props.payload.evaluaciones} eval.)`,
              "Rendimiento",
            ]}
          />
          <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={32}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={barColor(entry.pct)} />
            ))}
            <LabelList
              dataKey="pct"
              position="right"
              formatter={(v: number) => `${v}%`}
              style={{ fontSize: 13, fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
