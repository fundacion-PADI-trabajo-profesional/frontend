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
import type { AprobacionPreguntasResponse } from "../api/estadisticas";

interface Props {
  data: AprobacionPreguntasResponse;
}

function barColor(tasa: number): string {
  if (tasa >= 0.7) return "#4CAF50";
  if (tasa >= 0.4) return "#FF9800";
  return "#F44336";
}

function truncar(texto: string | null, max = 50): string {
  if (!texto) return "Sin consigna";
  return texto.length > max ? texto.slice(0, max) + "…" : texto;
}

export default function GraficoAprobacionPreguntas({ data }: Props) {
  const top = data.items.slice(0, 15);

  const chartData = top.map((item) => ({
    consigna: truncar(item.consigna),
    aprobacion: Math.round(item.tasa_aprobacion * 100),
    total: item.total,
    correctos: item.correctos,
  }));

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Preguntas ordenadas por menor aprobación · Verde ≥70% · Naranja ≥40% · Rojo &lt;40%
        {data.items.length > 15 && ` · Mostrando las 15 peores de ${data.items.length}`}
      </Typography>
      <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 52)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 70, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 12 }}
          />
          <YAxis type="category" dataKey="consigna" width={200} tick={{ fontSize: 11 }} />
          <ReferenceLine x={40} stroke="#FF9800" strokeDasharray="4 4" />
          <ReferenceLine x={70} stroke="#4CAF50" strokeDasharray="4 4" />
          <Tooltip
            formatter={(value, _, props) => [
              `${value}% (${props.payload.correctos}/${props.payload.total} respuestas)`,
              "Aprobación",
            ]}
          />
          <Bar dataKey="aprobacion" radius={[0, 4, 4, 0]} maxBarSize={32}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={barColor(entry.aprobacion / 100)} />
            ))}
            <LabelList
              dataKey="aprobacion"
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
