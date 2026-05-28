import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import { Box, Typography } from "@mui/material";
import type { HeatmapResponse } from "../../api/estadisticas";

const COLORES = [
  "#2196F3", "#FF5722", "#4CAF50", "#9C27B0",
  "#FF9800", "#00BCD4", "#E91E63", "#607D8B",
];

interface Props {
  data: HeatmapResponse;
}

function tooltipLabel(value: number | null) {
  return value != null ? `${value}%` : "Sin datos";
}

export default function GraficoRendimientoZonas({ data }: Props) {
  const { areas, filas, total_evaluaciones } = data;

  const chartData = areas.map((area) => {
    const punto: Record<string, string | number | null> = { area: area.nombre };
    for (const fila of filas) {
      const v = fila.valores[area.id];
      punto[fila.nombre] =
        v?.porcentaje != null ? Math.round(v.porcentaje * 100) : null;
    }
    return punto;
  });

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Total de evaluaciones: <strong>{total_evaluaciones}</strong>
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
          <Tooltip
            formatter={(value, name) => [tooltipLabel(value as number), name]}
          />
          <Legend verticalAlign="top" />
          {filas.map((fila, i) => (
            <Bar
              key={fila.id}
              dataKey={fila.nombre}
              fill={COLORES[i % COLORES.length]}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            >
              <LabelList
                dataKey={fila.nombre}
                position="top"
                formatter={(v: unknown) => typeof v === "number" ? `${v}%` : ""}
                style={{ fontSize: 11, fontWeight: 600 }}
              />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
