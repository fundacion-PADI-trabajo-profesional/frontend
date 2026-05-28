import { useState } from "react";
import {
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Slider,
  Typography,
} from "@mui/material";
import type { RiesgoResponse } from "../../api/estadisticas";

interface Props {
  data: RiesgoResponse;
  umbral: number;
  onUmbralChange: (value: number) => void;
  mostrarZona?: boolean;
}

export default function EstudiantesRiesgo({
  data,
  umbral,
  onUmbralChange,
  mostrarZona = false,
}: Props) {
  const [localUmbral, setLocalUmbral] = useState(umbral);

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
          Umbral: <strong>{Math.round(localUmbral * 100)}%</strong>
        </Typography>
        <Box sx={{ flexGrow: 1, maxWidth: 260 }}>
          <Slider
            value={localUmbral}
            min={0.1}
            max={0.9}
            step={0.05}
            onChange={(_, v) => setLocalUmbral(v as number)}
            onChangeCommitted={(_, v) => onUmbralChange(v as number)}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
            size="small"
            sx={{ color: "#FF9800" }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          {data.total} estudiante{data.total !== 1 ? "s" : ""} en riesgo
        </Typography>
      </Box>

      {data.estudiantes.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ py: 3, textAlign: "center", fontStyle: "italic" }}
        >
          Ningún estudiante con 2 o más áreas bajo el umbral.
        </Typography>
      ) : (
        <List disablePadding>
          {data.estudiantes.map((est, idx) => (
            <Box key={est.estudiante_id}>
              {idx > 0 && <Divider />}
              <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {est.nombre} {est.primer_apellido}
                      </Typography>
                      <Chip
                        label={`${est.total_areas_en_riesgo} área${est.total_areas_en_riesgo !== 1 ? "s" : ""}`}
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {est.escuela_nombre}
                        {mostrarZona && est.zona_nombre ? ` · ${est.zona_nombre}` : ""}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
                        {est.areas_en_riesgo.map((area) => (
                          <Chip
                            key={area.area_id}
                            label={`${area.area_nombre}: ${Math.round(area.porcentaje * 100)}%`}
                            size="small"
                            sx={{
                              bgcolor: "#ffebee",
                              color: "#c62828",
                              fontWeight: 600,
                              fontSize: "0.7rem",
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            </Box>
          ))}
        </List>
      )}
    </Box>
  );
}
