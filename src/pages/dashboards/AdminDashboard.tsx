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
                            title="Panel de control"
                            description="Zonas, encargados y navegación en cascada hasta detalle de evaluaciones."
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
                            description="Alta y gestión de instituciones educativas y comisiones."
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

                {isEncargado && (
                    <Grid item xs={12} sm={6} md={4}>
                        <DashboardCard
                            title="Evaluaciones PADI"
                            description="Ver y gestionar todas las evaluaciones del sistema."
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
                            description="Ver y gestionar todas las evaluaciones del sistema."
                            icon="📋"
                            color="#A3BE54"
                            onClick={() => navigate("/evaluaciones")}
                        />
                    </Grid>
                )}

                {isEquipoPadi && (
                    <Grid item xs={12} sm={6} md={4}>
                        <DashboardCard
                            title="Usuarios"
                            description="Invitá nuevos usuarios al sistema de forma individual o masiva desde un Excel."
                            icon="👥"
                            color="#7B1FA2"
                            onClick={() => navigate("/usuarios")}
                        />
                    </Grid>
                )}
            </Grid>
        </Box>
    );
}