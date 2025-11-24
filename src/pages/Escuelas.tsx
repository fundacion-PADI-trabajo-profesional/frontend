import { useState, useEffect } from "react";
import { Box, Container, Typography, Button, CircularProgress, Alert } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useNavigate } from "react-router-dom"; // Faltaba este import

import EscuelasList from "../components/EscuelasList";
import EscuelaForm from "../components/EscuelaForm";
import PageHeader from "../components/PageHeader";
import { getEscuelas, Escuela } from "../api/escuelas";
import AsignarDocentesModal from "../components/AsignarDocentesModal";

type ViewState = "list" | "form" | "success";

export default function Escuelas() {
    // --- Estados Generales ---
    const [view, setView] = useState<ViewState>("list");
    const [escuelas, setEscuelas] = useState<Escuela[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // --- Estados para el Modal de Asignación ---
    const [modalAsignacionOpen, setModalAsignacionOpen] = useState(false);
    const [escuelaSeleccionada, setEscuelaSeleccionada] = useState<Escuela | null>(null);

    const navigate = useNavigate(); // Hook de navegación

    // Cargar escuelas
    useEffect(() => {
        if (view === "list") {
            loadEscuelas();
        }
    }, [view, refreshKey]);

    const loadEscuelas = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getEscuelas();
            setEscuelas(data);
        } catch (err: any) {
            setError(err.message || "Error al cargar las escuelas");
        } finally {
            setLoading(false);
        }
    };

    // --- Manejo del Modal de Docentes ---
    const handleOpenAsignacion = (escuela: Escuela) => {
        setEscuelaSeleccionada(escuela);
        setModalAsignacionOpen(true);
    };

    const handleCloseAsignacion = () => {
        setModalAsignacionOpen(false);
        setEscuelaSeleccionada(null);
    };

    // Se llama cuando el modal hace un cambio (agrega/quita docente) para refrescar la lista de fondo
    const handleUpdateData = () => {
        setRefreshKey(prev => prev + 1);
    };

    // --- Navegación de Vistas ---
    const handleGoToForm = () => setView("form");

    const handleBackToList = () => {
        setView("list");
        setRefreshKey(prev => prev + 1);
    };

    const handleSuccess = () => {
        setView("success");
        setRefreshKey(prev => prev + 1);
    };

    // --- Renderizado del contenido principal ---
    const renderContent = () => {
        switch (view) {
            case "list":
                return (
                    <>
                        <PageHeader
                            title="Escuelas"
                            subtitle="Administración de instituciones educativas de la zona."
                            onAdd={handleGoToForm}
                            addLabel="Nueva Escuela"
                        />

                        {loading ? (
                            <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}>
                                <CircularProgress />
                            </Box>
                        ) : error ? (
                            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                        ) : (
                            <Box sx={{ mt: 3 }}>
                                {/* Pasamos la función para abrir el modal */}
                                <EscuelasList
                                    escuelas={escuelas}
                                    onManageDocentes={handleOpenAsignacion}
                                />
                            </Box>
                        )}
                    </>
                );

            case "form":
                return (
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                        <EscuelaForm onCancel={handleBackToList} onSuccess={handleSuccess} />
                    </Box>
                );

            case "success":
                return (
                    <Box sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', p: 4, textAlign: 'center', minHeight: '50vh'
                    }}>
                        <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                            Escuela creada con éxito
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#666', mb: 4, maxWidth: 400 }}>
                            La institución ha sido agregada al sistema y ya está disponible para asignar docentes y alumnos.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={handleBackToList}
                                sx={{
                                    borderColor: '#000', color: '#000', py: 1.5, px: 4,
                                    textTransform: 'none', fontWeight: 600,
                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                                }}
                            >
                                Volver al listado
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => setView('form')}
                                sx={{
                                    bgcolor: '#000', color: '#fff', py: 1.5, px: 4,
                                    textTransform: 'none', fontWeight: 600,
                                    '&:hover': { bgcolor: '#333' }
                                }}
                            >
                                Crear otra
                            </Button>
                        </Box>
                    </Box>
                );
            default:
                return null;
        }
    };

    const showManualHeader = view !== 'list';

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: view === 'form' ? '#fff' : '#f5f5f5' }}>

            {/* Header Manual (Solo para Formulario o Success) */}
            {showManualHeader && (
                <Box sx={{ bgcolor: "#f5f5f5", py: 3, borderBottom: "1px solid #e0e0e0" }}>
                    <Container maxWidth="lg">
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={handleBackToList} // Usamos la función handleBackToList
                            sx={{ color: "#5c7cfa", textTransform: "none", fontSize: '1rem' }}
                        >
                            Volver a escuelas
                        </Button>
                    </Container>
                </Box>
            )}

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {renderContent()}
            </Container>

            <AsignarDocentesModal
                open={modalAsignacionOpen}
                onClose={handleCloseAsignacion}
                escuela={escuelaSeleccionada}
                onUpdate={handleUpdateData}
            />
        </Box>
    );
}