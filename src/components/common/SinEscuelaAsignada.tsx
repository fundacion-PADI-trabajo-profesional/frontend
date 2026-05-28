import { Box, Paper, Typography } from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";

export default function SinEscuelaAsignada() {
    return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <Paper elevation={0} sx={{ p: 5, borderRadius: 3, maxWidth: 480, textAlign: "center", border: "1px solid #e8e8e8" }}>
                <SchoolIcon sx={{ fontSize: 52, color: "#A3BE54", mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    Sin escuela asignada
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                    Todavía no tenés una escuela asignada. Comunicate con el equipo PADI o el encargado de zona para poder comenzar.
                </Typography>
            </Paper>
        </Box>
    );
}
