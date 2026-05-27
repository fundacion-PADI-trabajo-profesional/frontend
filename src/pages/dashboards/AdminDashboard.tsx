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
                {isEncargado && (
                    <Grid item xs={12} sm={6} md={4}>
                        <DashboardCard
                            title="Evaluaciones PADI"
                            description="Gestión de evaluaciones del sistema con filtros por escuela, alumno y estado."
                            icon="📋"
                            color="#A3BE54"
                            onClick={() => navigate("/evaluaciones")}
                        />
                    </Grid>
                )}

                {isEquipoPadi && (
                    <Grid item xs={12} sm={6} md={4}>
                        <DashboardCard
                            title="Evaluaciones PADI"
                            description="Gestión de evaluaciones del sistema con filtros por escuela, alumno y estado."
                            icon="📋"
                            color="#A3BE54"
                            onClick={() => navigate("/evaluaciones")}
                        />
                    </Grid>
                )}

                <Grid item xs={12} sm={6} md={4}>
                    <DashboardCard
                        title="Estudiantes"
                        description="Alta, edición y consulta de la base de datos de estudiantes."
                        icon="🎒"
                        color="#2196F3"
                        onClick={() => navigate("/estudiantes")}
                    />
                </Grid>

                {isEquipoPadi && (
                    <Grid item xs={12} sm={6} md={4}>
                        <DashboardCard
                            title="Panel de control"
                            description="Gestión centralizada de zonas y encargados, con acceso directo a escuelas, aulas y evaluaciones."
                            icon="🧭"
                            color="#4CAF50"
                            onClick={() => navigate("/panel-control")}
                        />
                    </Grid>
                )}

                {isEquipoPadi && (
                    <Grid item xs={12} sm={6} md={4}>
                        <DashboardCard
                            title="Escuelas"
                            description="Alta y edición de instituciones educativas, con gestión de aulas y asignación de directivos y docentes."
                            icon="🏫"
                            color="#FF9800"
                            onClick={() => navigate("/escuelas")}
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
                        description="Alta de docentes en escuelas y aulas."
                        icon="👩‍🏫"
                        color="#E91E63"
                        onClick={() => navigate("/docentes")}
                    />
                </Grid>

                {isEquipoPadi && (
                    <Grid item xs={12} sm={6} md={4}>
                        <DashboardCard
                            title="Usuarios"
                            description="Gestión de usuarios del sistema PADI"
                            icon="👥"
                            color="#7B1FA2"
                            onClick={() => navigate("/usuarios")}
                        />
                    </Grid>
                )}

                {isEquipoPadi && (
                    <Grid item xs={12} sm={6} md={4}>
                        <DashboardCard
                            title="Estadísticas"
                            description="Análisis de rendimiento estudiantil por zona, área crítica, cobertura y nivel socioeconómico."
                            icon="📊"
                            color="#A3BE54"
                            onClick={() => navigate("/estadisticas/padi")}
                        />
                    </Grid>
                )}

                {isEncargado && (
                    <Grid item xs={12} sm={6} md={4}>
                        <DashboardCard
                            title="Estadísticas"
                            description="Análisis de rendimiento estudiantil por zona, área crítica, cobertura y nivel socioeconómico."
                            icon="📊"
                            color="#A3BE54"
                            onClick={() => navigate("/estadisticas/zona")}
                        />
                    </Grid>
                )}
            </Grid>
        </Box>
    );
}