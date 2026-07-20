import { Grid, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DashboardCard from "../../components/common/DashboardCard";
import { useEffect, useState } from "react";
import SchoolIcon from "@mui/icons-material/School";
import DescriptionIcon from "@mui/icons-material/Description";
import AssessmentIcon from "@mui/icons-material/Assessment";
import WavingHandIcon from "@mui/icons-material/WavingHand";

export default function DocenteDashboard() {
    const navigate = useNavigate();
    const [nombreDocente, setNombreDocente] = useState("Docente");

    useEffect(() => {
        const userRaw = localStorage.getItem("padiUser");
        const profileRaw = localStorage.getItem("padiProfile");

        const user = userRaw ? JSON.parse(userRaw) : null;
        const profile = profileRaw ? JSON.parse(profileRaw) : null;

        const nombre = profile?.nombre ?? user?.nombre ?? "Docente";

        setNombreDocente(nombre);
    }, []);

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: "#2c3e50", display: "flex", alignItems: "center", gap: 1 }}>
                Hola, {nombreDocente} <WavingHandIcon sx={{ fontSize: "2rem" }} />
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: "#666" }}>
                Panel de estudiantes y evaluaciones.
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                    <DashboardCard
                        title="Mis Estudiantes"
                        description="Listado de estudiantes asignados"
                        icon={<SchoolIcon />}
                        color="#5c7cfa"
                        onClick={() => navigate("/estudiantes")}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <DashboardCard
                        title="Mis Evaluaciones"
                        description="Ver y gestionar las evaluaciones realizadas."
                        icon={<DescriptionIcon />}
                        color="#A3BE54"
                        onClick={() => navigate("/evaluaciones")}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <DashboardCard
                        title="Estadísticas"
                        description="Ítems con mayor error y distribución de puntajes de tu aula."
                        icon={<AssessmentIcon />}
                        color="#7E57C2"
                        onClick={() => navigate("/estadisticas/docente")}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}
