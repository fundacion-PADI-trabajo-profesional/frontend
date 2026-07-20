import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import { Box, Grid, Typography } from "@mui/material";
import type { CoberturaResponse } from "../../api/estadisticas";

const COLORES = [
  "#2196F3", "#FF5722", "#4CAF50", "#9C27B0",
  "#FF9800", "#00BCD4", "#E91E63", "#607D8B",
];

interface Props {
  data: CoberturaResponse;
}

function PieLabel({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 }: { cx?: number; cy?: number; midAngle?: number; innerRadius?: number; outerRadius?: number; percent?: number }) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={700}>
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

export default function GraficoCobertura({ data }: Props) {
  const { zonas, total_evaluaciones, total_estudiantes_evaluados } = data;

  const pieData = zonas.map((z) => ({
    name: z.zona_nombre,
    value: z.evaluaciones,
  }));

  const barData = zonas.map((z) => ({
    zona: z.zona_nombre,
    estudiantes: z.estudiantes_evaluados,
    evaluaciones: z.evaluaciones,
  }));

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 4, mb: 3 }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h4" fontWeight={700} color="primary">{total_evaluaciones}</Typography>
          <Typography variant="body2" color="text.secondary">Evaluaciones totales</Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h4" fontWeight={700} color="success.main">{total_estudiantes_evaluados}</Typography>
          <Typography variant="body2" color="text.secondary">Estudiantes evaluados</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Distribución de evaluaciones por zona
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={110}
                dataKey="value"
                labelLine={false}
                label={PieLabel}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORES[i % COLORES.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v} evaluaciones`, "Total"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Grid>

        <Grid item xs={12} md={7}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Estudiantes evaluados por zona
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 8, right: 60, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="zona" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="estudiantes" name="Estudiantes evaluados" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={COLORES[i % COLORES.length]} />
                ))}
                <LabelList
                  dataKey="estudiantes"
                  position="top"
                  style={{ fontSize: 12, fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Grid>
      </Grid>
    </Box>
  );
}
