import { Grid, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DashboardCard from "../../components/DashboardCard";

interface Props {
    rol: string;
}

export default function AdminDashboard({ rol }: Props) {
    const navigate = useNavigate();
    const isEquipoPadi = rol === "equipo_padi";
    const isEncargado = rol === "encargado_zona";
    const titulo = isEquipoPadi ? "Panel Central PADI" : "Panel de Zona";

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: "#2c3e50" }}>
                {titulo} 🛠️
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: "#666" }}>
                Administración y alta de recursos.
            </Typography>

            <Grid container spacing={3}>
                {isEquipoPadi && (
                    <Grid item xs={12} sm={6} md={4}>
                        <DashboardCard
                            title="Zonas"
                            description="Crear y gestionar regiones geográficas."
                            icon="🗺️"
                            color="#4CAF50"
                            onClick={() => navigate("/zonas")}
                        />
                    </Grid>
                )}

                {isEquipoPadi && (
                    <Grid item xs={12} sm={6} md={4}>
                        <DashboardCard
                            title="Encargados de Zona"
                            description="Gestionar y habilitar responsables zonales."
                            icon="👤"
                            color="#673AB7"
                            onClick={() => navigate("/encargados-zonas")}
                        />
                    </Grid>
                )}

                {isEquipoPadi && (
                    <Grid item xs={12} sm={6} md={4}>
                        <DashboardCard
                            title="Escuelas"
                            description="Alta y gestión de instituciones educativas."
                            icon="🏫"
                            color="#FF9800"
                            onClick={() => navigate("/escuelas")}
                        />
                    </Grid>
                )}

                {isEquipoPadi && (
                    <Grid item xs={12} sm={6} md={4}>
                        <DashboardCard
                            title="Gestionar Aulas"
                            description="Crear y administrar aulas (grado, comisión, turno)."
                            icon="📂"
                            color="#9C27B0"
                            onClick={() => navigate("/aulas")}
                        />
                    </Grid>
                )}

                {isEquipoPadi && (
                    <Grid item xs={12} sm={6} md={4}>
                        <DashboardCard
                            title="Directivos"
                            description="Gestionar cuentas de directores."
                            icon="👔"
                            color="#607D8B"
                            onClick={() => navigate("/directivos")}
                        />
                    </Grid>
                )}

                {isEncargado && (
                    <Grid item xs={12} sm={6} md={4}>
                        <DashboardCard
                            title="Panel de control"
                            description="Escuelas, directores, aulas, estudiantes y evaluaciones de tu zona."
                            icon="🧭"
                            color="#FF9800"
                            onClick={() => navigate("/panel-control")}
                        />
                    </Grid>
                )}

                <Grid item xs={12} sm={6} md={4}>
                    <DashboardCard
                        title="Docentes"
                        description="Alta y asignación de docentes."
                        icon="👩‍🏫"
                        color="#E91E63"
                        onClick={() => navigate("/docentes")}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <DashboardCard
                        title="Estudiantes"
                        description="Base de datos de estudiantes."
                        icon="🎒"
                        color="#2196F3"
                        onClick={() => navigate("/estudiantes")}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}