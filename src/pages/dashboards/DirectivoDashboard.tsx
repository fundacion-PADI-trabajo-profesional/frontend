import { Grid, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DashboardCard from "../../components/DashboardCard";

export default function DirectivoDashboard() {
    const navigate = useNavigate();

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: "#2c3e50" }}>
                Panel Directivo 🏫
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: "#666" }}>
                Gestión de tu institución educativa.
            </Typography>

            <Grid container spacing={3}>
                {/* NUEVO: Gestión de Comisiones */}
                <Grid item xs={12} sm={6} md={4}>
                    <DashboardCard
                        title="Comisiones"
                        description="Crear salas/grados y asignar docentes."
                        icon="📂"
                        color="#9C27B0" // Violeta
                        onClick={() => navigate("/comisiones")}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <DashboardCard
                        title="Gestionar Docentes"
                        description="Habilitar y administrar equipo docente."
                        icon="👩‍🏫"
                        color="#E91E63"
                        onClick={() => navigate("/docentes")}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <DashboardCard
                        title="Gestionar Alumnos"
                        description="Administración de estudiantes de la escuela."
                        icon="🎒"
                        color="#2196F3"
                        onClick={() => navigate("/estudiantes")}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}