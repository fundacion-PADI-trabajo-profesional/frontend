import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Box, Typography, Chip, Stack } from "@mui/material";
import type { RendimientoNivelResponse } from "../api/estadisticas";

interface Props {
  data: RendimientoNivelResponse;
}

const NIVEL_CONFIG = [
  { key: "alto", label: "Nivel Socioeconómico Alto", color: "#4CAF50" },
  { key: "medio", label: "Nivel Socioeconómico Medio", color: "#2196F3" },
  { key: "bajo", label: "Nivel Socioeconómico Bajo", color: "#F44336" },
  { key: "sin_definir", label: "Sin Definir", color: "#9E9E9E" },
] as const;

function pct(v: number | null): number {
  return v != null ? Math.round(v * 100) : 0;
}

export default function GraficoNivelSocioeconomico({ data }: Props) {
  const chartData = [...data.areas]
    .sort((a, b) => a.area_orden - b.area_orden)
    .map((area) => ({
      area: area.area_nombre,
      alto: pct(area.por_nivel.alto.porcentaje),
      medio: pct(area.por_nivel.medio.porcentaje),
      bajo: pct(area.por_nivel.bajo.porcentaje),
      sin_definir: pct(area.por_nivel.sin_definir.porcentaje),
      evals_alto: area.por_nivel.alto.evaluaciones,
      evals_medio: area.por_nivel.medio.evaluaciones,
      evals_bajo: area.por_nivel.bajo.evaluaciones,
      evals_sin_definir: area.por_nivel.sin_definir.evaluaciones,
    }));

  const totalPorNivel = NIVEL_CONFIG.map(({ key, label, color }) => {
    const total = data.areas.reduce((sum, a) => sum + a.por_nivel[key].evaluaciones, 0);
    return { label, color, total };
  });

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Promedio del puntaje obtenido sobre el puntaje máximo posible, por área y nivel socioeconómico de la escuela.
        Un 80% significa que los estudiantes de esas escuelas obtuvieron en promedio el 80% del puntaje máximo en esa área.
        Evaluaciones tipo <strong>{data.tipo}</strong>, período <strong>{data.periodo}</strong>.
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
        {totalPorNivel.map(({ label, color, total }) => (
          <Chip
            key={label}
            label={`${label}: ${total} eval.`}
            size="small"
            sx={{ bgcolor: color + "22", color: color, fontWeight: 600, border: `1px solid ${color}` }}
          />
        ))}
      </Stack>

      {data.total_evaluaciones === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 6, fontStyle: "italic" }}>
          No hay evaluaciones para este período y tipo.
        </Typography>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(320, chartData.length * 60)}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 16, left: 8, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="area"
              tick={{ fontSize: 12 }}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value, name) => {
                const nivelKey = String(name);
                const config = NIVEL_CONFIG.find((n) => n.key === nivelKey);
                return [`${value}%`, config?.label ?? nivelKey];
              }}
            />
            {NIVEL_CONFIG.map(({ key, color }) => (
              <Bar key={key} dataKey={key} fill={color} radius={[3, 3, 0, 0]} maxBarSize={28} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Leyenda personalizada debajo del gráfico */}
      <Stack direction="row" spacing={3} sx={{ mt: 2, flexWrap: "wrap", justifyContent: "center", gap: 1 }}>
        {NIVEL_CONFIG.map(({ key, label, color }) => (
          <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: color, flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>{label}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
