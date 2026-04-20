//import { useState, useEffect } from "react";
//import {
//    Box,
//    Button,
//    Container,
//    CircularProgress,
//    Alert,
//    Dialog,
//    DialogActions,
//    DialogContent,
//    DialogTitle,
//    MenuItem,
//    Paper,
//    Table,
//    TableBody,
//    TableCell,
//    TableContainer,
//    TableHead,
//    TableRow,
//    TextField,
//    Typography,
//} from "@mui/material";
//import { useNavigate, useSearchParams } from "react-router-dom";
//import PageHeader from "../components/PageHeader"; // ACÁ IMPORTAMOS TU COMPONENTE
//import EscuelaForm from "../components/EscuelaForm";
//import { getEscuelas, type Escuela } from "../api/escuelas";
//import { getAulas, type Aula } from "../api/aulas";
//import { getDirectivos, type Directivo, asignarEscuelaADirectivo } from "../api/directivos";
//import { getZonas, type Zona } from "../api/zonas";
//
//export default function EscuelasPage() {
//    const navigate = useNavigate();
//    const [searchParams] = useSearchParams();
//    const zonaIdParam = searchParams.get("zonaId");
//
//    // Estados de datos
//    const [escuelas, setEscuelas] = useState<Escuela[]>([]);
//    const [aulas, setAulas] = useState<Aula[]>([]);
//    const [directivos, setDirectivos] = useState<Directivo[]>([]);
//    const [zonas, setZonas] = useState<Zona[]>([]);
//    
//    // Estados de la página
//    const [loading, setLoading] = useState(true);
//    const [error, setError] = useState<string | null>(null);
//
//    // Estados para modales
//    const [directorDialogOpen, setDirectorDialogOpen] = useState(false);
//    const [directorEscuelaTarget, setDirectorEscuelaTarget] = useState<Escuela | null>(null);
//    const [directorId, setDirectorId] = useState("");
//    const [savingDirector, setSavingDirector] = useState(false);
//    const [escuelaDialogOpen, setEscuelaDialogOpen] = useState(false);
//
//    const loadData = async () => {
//        setLoading(true);
//        setError(null);
//        try {
//            const [escuelasData, aulasData, directivosData, zonasData] = await Promise.all([
//                getEscuelas(),
//                getAulas(),
//                getDirectivos(),
//                getZonas()
//            ]);
//            setEscuelas(escuelasData);
//            setAulas(aulasData);
//            setDirectivos(directivosData);
//            setZonas(zonasData);
//        } catch (e: any) {
//            setError(e.message || "Error al cargar los datos");
//        } finally {
//            setLoading(false);
//        }
//    };
//
//    useEffect(() => {
//        loadData();
//    }, []);
//
//    // Filtros visuales
//    const selectedZona = zonas.find(z => z.id === zonaIdParam) || null;
//    const escuelasVisibles = zonaIdParam 
//        ? escuelas.filter(esc => esc.zona?.id === zonaIdParam)
//        : escuelas;
//
//    const escuelaDirectorName = (escuela: Escuela) => {
//        if (!escuela.directivos?.length) return "Sin director asignado";
//        const d = escuela.directivos[0];
//        return `${d.nombre} ${d.apellido}`;
//    };
//
//    const openDirectorDialog = (escuela: Escuela) => {
//        setDirectorEscuelaTarget(escuela);
//        const assigned = directivos.find((d) => d.escuela?.id === escuela.id);
//        setDirectorId(assigned?.id || "");
//        setDirectorDialogOpen(true);
//    };
//
//    const handleAssignDirector = async () => {
//        if (!directorEscuelaTarget || !directorId) return;
//        setSavingDirector(true);
//        setError(null);
//        try {
//            await asignarEscuelaADirectivo(directorId, directorEscuelaTarget.id);
//            setDirectorDialogOpen(false);
//            setDirectorEscuelaTarget(null);
//            setDirectorId("");
//            await loadData();
//        } catch (e: any) {
//            setError(e.message || "Error al asignar director");
//        } finally {
//            setSavingDirector(false);
//        }
//    };
//
//    const getAulasCount = (escuelaId: string) => {
//        return aulas.filter((a) => a.escuela_id === escuelaId).length;
//    };
//
//    return (
//        <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
//    
//            <PageHeader 
//                title="Gestión de Escuelas"
//                subtitle={selectedZona ? `Mostrando escuelas de: ${selectedZona.nombre}` : "Administración de instituciones educativas."}
//                onBack={zonaIdParam ? () => navigate("/zonas") : undefined}
//                backTo="/home"
//                backLabel={zonaIdParam ? "Volver a zonas" : "Volver a inicio"}
//                onAdd={() => setEscuelaDialogOpen(true)}
//                addLabel="Nueva escuela"
//            />
//
//            <Container maxWidth="lg" sx={{ py: 4 }}>
//                {loading ? (
//                    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
//                        <CircularProgress />
//                    </Box>
//                ) : error ? (
//                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
//                ) : (
//                    <>
//                        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
//                            <Table>
//                                <TableHead sx={{ bgcolor: "#f8f9fa" }}>
//                                    <TableRow>
//                                        <TableCell sx={{ fontWeight: "bold" }}>Escuela</TableCell>
//                                        <TableCell sx={{ fontWeight: "bold" }}>Director</TableCell>
//                                        <TableCell sx={{ fontWeight: "bold" }} align="center">Aulas</TableCell>
//                                        <TableCell sx={{ fontWeight: "bold" }} align="center">Acciones</TableCell>
//                                    </TableRow>
//                                </TableHead>
//                                <TableBody>
//                                    {escuelasVisibles.length === 0 ? (
//                                        <TableRow>
//                                            <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
//                                                No hay escuelas para mostrar{zonaIdParam ? " en esta zona" : ""}.
//                                            </TableCell>
//                                        </TableRow>
//                                    ) : (
//                                        escuelasVisibles.map((escuela) => (
//                                            <TableRow key={escuela.id} hover>
//                                                <TableCell>{escuela.nombre}</TableCell>
//                                                <TableCell>{escuelaDirectorName(escuela)}</TableCell>
//                                                <TableCell align="center">{getAulasCount(escuela.id)}</TableCell>
//                                                <TableCell align="center">
//                                                    <Button
//                                                        size="small"
//                                                        sx={{ textTransform: "none", mr: 1 }}
//                                                        onClick={() => openDirectorDialog(escuela)}
//                                                    >
//                                                        Asignar director
//                                                    </Button>
//                                                    <Button
//                                                        size="small"
//                                                        variant="outlined"
//                                                        sx={{ textTransform: "none" }}
//                                                        onClick={() => navigate(`/aulas?escuelaId=${escuela.id}`)}
//                                                    >
//                                                        Ver aulas
//                                                    </Button>
//                                                </TableCell>
//                                            </TableRow>
//                                        ))
//                                    )}
//                                </TableBody>
//                            </Table>
//                        </TableContainer>
//
//                        {/* Modal para Asignar Director */}
//                        <Dialog open={directorDialogOpen} onClose={() => setDirectorDialogOpen(false)} fullWidth maxWidth="sm">
//                            <DialogTitle sx={{ fontWeight: "bold" }}>Asignar director a escuela</DialogTitle>
//                            <DialogContent>
//                                <Typography sx={{ mb: 2 }}>
//                                    Escuela: <strong>{directorEscuelaTarget?.nombre}</strong>
//                                </Typography>
//                                <TextField
//                                    select
//                                    fullWidth
//                                    label="Director"
//                                    value={directorId}
//                                    onChange={(e) => setDirectorId(e.target.value)}
//                                >
//                                    {directivos.map((d) => (
//                                        <MenuItem key={d.id} value={d.id}>
//                                            {d.apellido}, {d.nombre}
//                                        </MenuItem>
//                                    ))}
//                                    {directivos.length === 0 && (
//                                        <MenuItem disabled>No hay directivos disponibles</MenuItem>
//                                    )}
//                                </TextField>
//                            </DialogContent>
//                            <DialogActions sx={{ p: 2 }}>
//                                <Button onClick={() => setDirectorDialogOpen(false)} color="inherit">Cancelar</Button>
//                                <Button
//                                    variant="contained"
//                                    onClick={handleAssignDirector}
//                                    disabled={!directorId || savingDirector}
//                                    sx={{ textTransform: "none", fontWeight: "bold" }}
//                                >
//                                    Guardar
//                                </Button>
//                            </DialogActions>
//                        </Dialog>
//
//                        {/* Modal para Nueva Escuela */}
//                        <Dialog open={escuelaDialogOpen} onClose={() => setEscuelaDialogOpen(false)} fullWidth maxWidth="md">
//                            <DialogTitle sx={{ fontWeight: "bold" }}>Nueva Escuela</DialogTitle>
//                            <DialogContent>
//                                <EscuelaForm 
//                                    onCancel={() => setEscuelaDialogOpen(false)} 
//                                    onSuccess={() => {
//                                        setEscuelaDialogOpen(false);
//                                        loadData(); 
//                                    }} 
//                                />
//                            </DialogContent>
//                        </Dialog>
//                    </>
//                )}
//            </Container>
//        </Box>
//    );
//}

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
                subtitle="Administración general de instituciones."
                backTo="/home"
            />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <EscuelasView 
                    zonaIdParam={zonaId}
                    isEquipoPadi={isEquipoPadi}
                    onVolver={() => navigate(-1)} 
                    onVerAulas={(escuela) => navigate(`/aulas?escuelaId=${escuela.id}`)}
                />
            </Container>
        </Box>
    );
}