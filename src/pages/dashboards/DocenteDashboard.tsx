import { Grid, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DashboardCard from "../../components/DashboardCard";

export default function DocenteDashboard() {
    const navigate = useNavigate();

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: "#2c3e50" }}>
                Hola, Docente 👋
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: "#666" }}>
                Panel de aula y evaluaciones.
            </Typography>

            <Grid container spacing={3}>
                {/* NUEVO: Mis Comisiones */}
                <Grid item xs={12} sm={6} md={4}>
                    <DashboardCard
                        title="Mis Comisiones"
                        description="Ver tus cursos y listados de asistencia."
                        icon="👥"
                        color="#FF9800" // Naranja
                        onClick={() => navigate("/comisiones")}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <DashboardCard
                        title="Mis Alumnos"
                        description="Buscar estudiante específico (Global)."
                        icon="🎓"
                        color="#5c7cfa"
                        onClick={() => navigate("/estudiantes")}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <DashboardCard
                        title="Tomar Evaluación"
                        description="Iniciar nueva prueba PADI."
                        icon="📝"
                        color="#A3BE54"
                        onClick={() => navigate("/evaluaciones/nueva")}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}