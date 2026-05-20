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
import type { ActividadResponse } from "../api/estadisticas";

interface Props {
  data: ActividadResponse;
}

export default function GraficoActividadDocentes({ data }: Props) {
  const chartData = data.docentes.map((d) => ({
    nombre: `${d.nombre} ${d.primer_apellido}`,
    evaluaciones: d.total_evaluaciones,
  }));

  const max = Math.max(...chartData.map((d) => d.evaluaciones), 1);

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {data.docentes.length} docente{data.docentes.length !== 1 ? "s" : ""} — ordenados por evaluaciones registradas
      </Typography>
      <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 52)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 70, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
          <YAxis type="category" dataKey="nombre" width={160} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => [`${v} evaluaciones`, "Total"]} />
          <Bar dataKey="evaluaciones" radius={[0, 4, 4, 0]} maxBarSize={32}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.evaluaciones === 0 ? "#F44336" : entry.evaluaciones >= max * 0.6 ? "#4CAF50" : "#2196F3"}
              />
            ))}
            <LabelList
              dataKey="evaluaciones"
              position="right"
              style={{ fontSize: 13, fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
