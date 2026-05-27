import { useNavigate, useSearchParams } from "react-router-dom";
import { Container, Box } from "@mui/material";
import EscuelasView from "../components/EscuelasView";
import PageHeader from "../components/PageHeader";

export default function EscuelasPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const zonaId = searchParams.get("zonaId");

    // Obtenemos el rol
    const stored = localStorage.getItem("padiUser");
    const isEquipoPadi = stored ? JSON.parse(stored).rol === "equipo_padi" : false;

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
            <PageHeader
                title="Gestión de Escuelas"
                subtitle="Alta y Administración de Instituciones."
                backTo="/home"
            />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <EscuelasView
                    zonaIdParam={zonaId}
                    isEquipoPadi={isEquipoPadi}
                    onVolver={() => navigate(-1)}
                    onVerAulas={(escuela) => navigate(`/aulas?escuelaId=${escuela.id}&escuelaNombre=${escuela.nombre}`)}
                    showBack={false}
                    showTitle={!!zonaId}
                />
            </Container>
        </Box>
    );
}