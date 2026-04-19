import { useState, useEffect } from "react";
import { Box, Container, Typography, Button, CircularProgress, Alert, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, InputAdornment } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import EscuelasList from "../components/EscuelasList";
import EscuelaForm from "../components/EscuelaForm";
import PageHeader from "../components/PageHeader";
import { desasignarDirectivo, getEscuelas, Escuela } from "../api/escuelas";
import EditarEscuela from "../components/EditarEscuela";
import EscuelaDetalle from "../components/EscuelaDetalle";
import { asignarEscuelaADirectivo, getDirectivos, type Directivo } from "../api/directivos";
import { BuscadorPadi } from "../components/SearchBar";

type ViewState = "list" | "form" | "success" | "edit" | "details";

export default function Escuelas() {

    const [view, setView] = useState<ViewState>("list");
    const [escuelas, setEscuelas] = useState<Escuela[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [escuelaAEditar, setEscuelaAEditar] = useState<Escuela | null>(null);
    const [escuelaDetalle, setEscuelaDetalle] = useState<Escuela | null>(null);
    const [currentRole, setCurrentRole] = useState("");
    const [directivos, setDirectivos] = useState<Directivo[]>([]);
    const [directorDialogOpen, setDirectorDialogOpen] = useState(false);
    const [directorEscuelaTarget, setDirectorEscuelaTarget] = useState<Escuela | null>(null);
    const [directorId, setDirectorId] = useState("");
    const [savingDirector, setSavingDirector] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Cargar escuelas
    useEffect(() => {
        const stored = localStorage.getItem("padiUser");
        if (!stored) return;
        try {
            const user = JSON.parse(stored);
            setCurrentRole(user?.rol || "");
        } catch {
            setCurrentRole("");
        }
    }, []);

    useEffect(() => {
        if (view === "list") {
            loadEscuelas();
            setSearchTerm("");
        }
    }, [view, refreshKey, currentRole]);

    const loadEscuelas = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getEscuelas();
            setEscuelas(data);
            if (currentRole === "equipo_padi") {
                const directivosData = await getDirectivos();
                setDirectivos(directivosData);
            }
        } catch (err: any) {
            setError(err.message || "Error al cargar las escuelas");
        } finally {
            setLoading(false);
        }
    };

    const openAssignDirectorDialog = (escuela: Escuela) => {
        setDirectorEscuelaTarget(escuela);
        const assigned = directivos.find((d) => d.escuela?.id === escuela.id);
        setDirectorId(assigned?.id || "");
        setDirectorDialogOpen(true);
    };

    const handleAssignDirector = async () => {
        if (!directorEscuelaTarget || !directorId) return;
        setSavingDirector(true);
        setError(null);
        try {
            await asignarEscuelaADirectivo(directorId, directorEscuelaTarget.id);
            setDirectorDialogOpen(false);
            setDirectorEscuelaTarget(null);
            setDirectorId("");
            await loadEscuelas();
        } catch (e: any) {
            setError(e.message || "Error al asignar director");
        } finally {
            setSavingDirector(false);
        }
    };

    const handleRemoveDirector = async (directorUserId: string) => {
        if (!window.confirm("¿Quitar director de esta escuela?")) {
            return;
        }
        setError(null);
        try {
            await desasignarDirectivo(directorUserId);
            await loadEscuelas();
        } catch (e: any) {
            setError(e.message || "Error al quitar director");
        }
    };

    const handleGoToForm = () => setView("form");

    const handleBackToList = () => {
        setView("list");
        setRefreshKey(prev => prev + 1);
    };

    const handleSuccess = () => {
        setView("success");
        setRefreshKey(prev => prev + 1);
    };

    const handleEdit = (escuela: Escuela) => {
        setEscuelaAEditar(escuela);
        setView("edit");
    };

    const handleViewDetails = (escuela: Escuela) => {
        setEscuelaDetalle(escuela);
        setView("details");
    };

    const escuelasFiltradas = escuelas.filter((escuela) =>
        escuela.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

                        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-start' }}>
                            <BuscadorPadi
                                variant="outlined"
                                placeholder="Buscar escuela por nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: '#9e9e9e' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>

                        {loading ? (
                            <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}>
                                <CircularProgress />
                            </Box>
                        ) : error ? (
                            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                        ) : (
                            <Box sx={{ mt: 3 }}>
                                {escuelasFiltradas.length > 0 ? (
                                    <EscuelasList
                                        escuelas={escuelasFiltradas}
                                        onEdit={handleEdit}
                                        onView={handleViewDetails}
                                        isEquipoPadi={currentRole === "equipo_padi"}
                                        onAssignDirector={openAssignDirectorDialog}
                                        onRemoveDirector={handleRemoveDirector}
                                    />
                                ) : (
                                    <Alert severity="info">
                                        No se encontraron escuelas que coincidan con la búsqueda.
                                    </Alert>
                                )}
                            </Box>
                        )}
                    </>
                );

            case "details":
                return (
                    <EscuelaDetalle
                        escuela={escuelaDetalle!}
                        // onBack={() => setView("list")}
                        onEdit={() => {
                            setEscuelaAEditar(escuelaDetalle);
                            setView("edit");
                        }}
                    />
                );

            case "edit":
                return (
                    <Box sx={{ mt: 2 }}>
                        <EditarEscuela
                            escuela={escuelaAEditar!}
                            onCancel={() => setView("list")}
                            onSuccess={() => {
                                setView("list");
                                loadEscuelas();
                            }}
                        />
                    </Box>
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
                            La institución ha sido agregada al sistema y ya está disponible para asignar docentes y estudiantes.
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

            <Dialog open={directorDialogOpen} onClose={() => setDirectorDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Asignar director a escuela</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>
                        Escuela: <strong>{directorEscuelaTarget?.nombre}</strong>
                    </Typography>
                    <TextField
                        select
                        fullWidth
                        label="Director"
                        value={directorId}
                        onChange={(e) => setDirectorId(e.target.value)}
                    >
                        {directivos.map((d) => (
                            <MenuItem key={d.id} value={d.id}>
                                {d.apellido}, {d.nombre}
                            </MenuItem>
                        ))}
                        {directivos.length === 0 && (
                            <MenuItem disabled>No hay directivos disponibles</MenuItem>
                        )}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDirectorDialogOpen(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={handleAssignDirector}
                        disabled={!directorId || savingDirector}
                    >
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}