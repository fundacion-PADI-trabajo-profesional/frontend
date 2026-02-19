import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import { type Escuela, getEscuelas } from "../api/escuelas";
import { type Aula, getAulas, getAulaEstudiantes } from "../api/aulas";
import { type Estudiante } from "../api/estudiantes";
import { asignarEscuelaADirectivo, getDirectivos, type Directivo } from "../api/directivos";
import {
    asignarEncargadoAZona,
    createZona,
    desvincularEncargado,
    getEncargadosZonaOptions,
    getZonas,
    type EncargadoZonaOption,
    type Zona,
} from "../api/zonas";

type ViewMode = "zonas" | "escuelas" | "aulas" | "estudiantes";

export default function PanelControl() {
    const navigate = useNavigate();

    const [view, setView] = useState<ViewMode>("escuelas");
    const [zonas, setZonas] = useState<Zona[]>([]);
    const [escuelas, setEscuelas] = useState<Escuela[]>([]);
    const [aulas, setAulas] = useState<Aula[]>([]);
    const [directivos, setDirectivos] = useState<Directivo[]>([]);
    const [encargadosOptions, setEncargadosOptions] = useState<EncargadoZonaOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedZona, setSelectedZona] = useState<Zona | null>(null);
    const [selectedEscuela, setSelectedEscuela] = useState<Escuela | null>(null);
    const [selectedAula, setSelectedAula] = useState<Aula | null>(null);
    const [aulaEstudiantes, setAulaEstudiantes] = useState<Estudiante[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    const [directorDialogOpen, setDirectorDialogOpen] = useState(false);
    const [directorEscuelaTarget, setDirectorEscuelaTarget] = useState<Escuela | null>(null);
    const [directorId, setDirectorId] = useState("");
    const [savingDirector, setSavingDirector] = useState(false);

    const [zonaDialogOpen, setZonaDialogOpen] = useState(false);
    const [zonaNombre, setZonaNombre] = useState("");
    const [savingZona, setSavingZona] = useState(false);
    const [zonaError, setZonaError] = useState("");

    const [encargadoDialogOpen, setEncargadoDialogOpen] = useState(false);
    const [selectedZonaForEncargado, setSelectedZonaForEncargado] = useState<Zona | null>(null);
    const [encargadoId, setEncargadoId] = useState("");
    const [savingEncargado, setSavingEncargado] = useState(false);

    const currentRole = useMemo(() => {
        const stored = localStorage.getItem("padiUser");
        if (!stored) return "";
        try {
            const user = JSON.parse(stored);
            return user?.rol || "";
        } catch {
            return "";
        }
    }, []);

    const isEquipoPadi = currentRole === "equipo_padi";
    const isEncargadoZona = currentRole === "encargado_zona";

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (isEquipoPadi) {
                const [zonasData, escuelasData, aulasData, directivosData, encargadosData] = await Promise.all([
                    getZonas(),
                    getEscuelas(),
                    getAulas(),
                    getDirectivos(),
                    getEncargadosZonaOptions(),
                ]);
                setZonas(zonasData);
                setEscuelas(escuelasData);
                setAulas(aulasData);
                setDirectivos(directivosData);
                setEncargadosOptions(encargadosData);
                setView("zonas");
            } else {
                const [escuelasData, aulasData, directivosData] = await Promise.all([
                    getEscuelas(),
                    getAulas(),
                    getDirectivos(),
                ]);
                setEscuelas(escuelasData);
                setAulas(aulasData);
                setDirectivos(directivosData);
                setView("escuelas");
            }
        } catch (e: any) {
            setError(e.message || "Error al cargar panel de control");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isEquipoPadi && !isEncargadoZona) {
            navigate("/home");
            return;
        }
        loadData();
    }, [isEquipoPadi, isEncargadoZona, navigate]);

    const aulasByEscuela = useMemo(() => {
        const map = new Map<string, Aula[]>();
        for (const aula of aulas) {
            const list = map.get(aula.escuela_id) || [];
            list.push(aula);
            map.set(aula.escuela_id, list);
        }
        return map;
    }, [aulas]);

    const escuelasVisibles = useMemo(() => {
        if (selectedZona?.id) {
            return escuelas.filter((esc) => esc.zona?.id === selectedZona.id);
        }
        return escuelas;
    }, [escuelas, selectedZona]);

    const escuelaDirectorName = (escuela: Escuela) => {
        if (!escuela.directivos?.length) return "Sin director asignado";
        const d = escuela.directivos[0];
        return `${d.nombre} ${d.apellido}`;
    };

    const openDirectorDialog = (escuela: Escuela) => {
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
            await loadData();
        } catch (e: any) {
            setError(e.message || "Error al asignar director");
        } finally {
            setSavingDirector(false);
        }
    };

    const openZonaEscuelas = (zona: Zona) => {
        setSelectedZona(zona);
        setSelectedEscuela(null);
        setSelectedAula(null);
        setAulaEstudiantes([]);
        setView("escuelas");
    };

    const openEscuelaAulas = (escuela: Escuela) => {
        setSelectedEscuela(escuela);
        setSelectedAula(null);
        setAulaEstudiantes([]);
        setView("aulas");
    };

    const openAulaEstudiantes = async (aula: Aula) => {
        setSelectedAula(aula);
        setLoadingStudents(true);
        setError(null);
        try {
            const estudiantes = await getAulaEstudiantes(aula.id);
            setAulaEstudiantes(estudiantes);
            setView("estudiantes");
        } catch (e: any) {
            setError(e.message || "Error al cargar estudiantes del aula");
        } finally {
            setLoadingStudents(false);
        }
    };

    const openCreateZonaDialog = () => {
        setZonaNombre("");
        setZonaError("");
        setZonaDialogOpen(true);
    };

    const handleCreateZona = async () => {
        if (!zonaNombre.trim()) {
            setZonaError("El nombre es obligatorio");
            return;
        }
        setSavingZona(true);
        setError(null);
        try {
            await createZona(zonaNombre.trim());
            setZonaDialogOpen(false);
            await loadData();
        } catch (e: any) {
            setZonaError(e.message || "Error al crear zona");
        } finally {
            setSavingZona(false);
        }
    };

    const openEncargadoDialog = (zona: Zona) => {
        setSelectedZonaForEncargado(zona);
        setEncargadoId("");
        setEncargadoDialogOpen(true);
    };

    const handleAssignEncargado = async () => {
        if (!selectedZonaForEncargado || !encargadoId) return;
        setSavingEncargado(true);
        setError(null);
        try {
            await asignarEncargadoAZona(selectedZonaForEncargado.id, encargadoId);
            setEncargadoDialogOpen(false);
            setSelectedZonaForEncargado(null);
            setEncargadoId("");
            await loadData();
        } catch (e: any) {
            setError(e.message || "Error al asignar encargado");
        } finally {
            setSavingEncargado(false);
        }
    };

    const handleRemoveEncargadoFromZona = async (encargadoZonaId: string, nombre: string) => {
        if (!window.confirm(`¿Quitar a ${nombre} de esta zona?`)) {
            return;
        }
        setError(null);
        try {
            await desvincularEncargado(encargadoZonaId);
            await loadData();
        } catch (e: any) {
            setError(e.message || "Error al quitar encargado");
        }
    };

    const renderZonas = () => (
        <>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    sx={{ textTransform: "none" }}
                    onClick={openCreateZonaDialog}
                >
                    Nueva zona
                </Button>
            </Box>
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <Table>
                    <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>Zona</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Encargados</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }} align="center">Escuelas</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }} align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {zonas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                                    No hay zonas registradas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            zonas.map((zona) => {
                                const encargados = zona.encargados || [];
                                return (
                                    <TableRow key={zona.id} hover>
                                        <TableCell>{zona.nombre}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                                {encargados.length > 0 ? (
                                                    encargados.map((enc) => (
                                                        <Chip
                                                            key={enc.id}
                                                            label={`${enc.usuario.nombre} ${enc.usuario.apellido}`}
                                                            onDelete={() =>
                                                                handleRemoveEncargadoFromZona(
                                                                    enc.id,
                                                                    `${enc.usuario.nombre} ${enc.usuario.apellido}`,
                                                                )
                                                            }
                                                            deleteIcon={<CloseIcon />}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: "rgba(103, 58, 183, 0.1)",
                                                                color: "#673AB7",
                                                                fontWeight: 500,
                                                                "& .MuiChip-deleteIcon": { color: "#673AB7" },
                                                            }}
                                                        />
                                                    ))
                                                ) : (
                                                    <Typography variant="body2" sx={{ color: "#999" }}>
                                                        Sin asignar
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">{zona._count?.escuelas || 0}</TableCell>
                                        <TableCell align="center">
                                            <Button
                                                size="small"
                                                sx={{ textTransform: "none", mr: 1 }}
                                                onClick={() => openEncargadoDialog(zona)}
                                            >
                                                Asignar encargado
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                sx={{ textTransform: "none" }}
                                                onClick={() => openZonaEscuelas(zona)}
                                            >
                                                Ver escuelas
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );

    const renderEscuelas = () => (
        <>
            {isEquipoPadi && (
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => {
                        setSelectedZona(null);
                        setSelectedEscuela(null);
                        setSelectedAula(null);
                        setAulaEstudiantes([]);
                        setView("zonas");
                    }}
                    sx={{ mb: 2, textTransform: "none" }}
                >
                    Volver a zonas
                </Button>
            )}

            {selectedZona && (
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                    {selectedZona.nombre}
                </Typography>
            )}

            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <Table>
                    <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>Escuela</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Director</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }} align="center">Aulas</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }} align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {escuelasVisibles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                                    No hay escuelas para mostrar.
                                </TableCell>
                            </TableRow>
                        ) : (
                            escuelasVisibles.map((escuela) => (
                                <TableRow key={escuela.id} hover>
                                    <TableCell>{escuela.nombre}</TableCell>
                                    <TableCell>{escuelaDirectorName(escuela)}</TableCell>
                                    <TableCell align="center">{(aulasByEscuela.get(escuela.id) || []).length}</TableCell>
                                    <TableCell align="center">
                                        <Button
                                            size="small"
                                            sx={{ textTransform: "none", mr: 1 }}
                                            onClick={() => openDirectorDialog(escuela)}
                                        >
                                            Asignar director
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            sx={{ textTransform: "none" }}
                                            onClick={() => openEscuelaAulas(escuela)}
                                        >
                                            Ver aulas
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );

    const renderAulas = () => {
        const escuelaAulas = selectedEscuela ? aulasByEscuela.get(selectedEscuela.id) || [] : [];
        return (
            <>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => setView("escuelas")}
                    sx={{ mb: 2, textTransform: "none" }}
                >
                    Volver a escuelas
                </Button>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                    {selectedEscuela?.nombre}
                </Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                    <Table>
                        <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: "bold" }}>Sala</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Comisión</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Turno</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }} align="center">Acción</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {escuelaAulas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                                        Esta escuela no tiene aulas cargadas.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                escuelaAulas.map((aula) => (
                                    <TableRow key={aula.id} hover>
                                        <TableCell>{aula.sala?.nombre || `Sala ${aula.sala_id}`}</TableCell>
                                        <TableCell>{aula.comision}</TableCell>
                                        <TableCell>{aula.turno}</TableCell>
                                        <TableCell align="center">
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                sx={{ textTransform: "none" }}
                                                onClick={() => openAulaEstudiantes(aula)}
                                            >
                                                Ver estudiantes
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </>
        );
    };

    const renderEstudiantes = () => (
        <>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => setView("aulas")}
                sx={{ mb: 2, textTransform: "none" }}
            >
                Volver a aulas
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {selectedAula?.sala?.nombre || `Sala ${selectedAula?.sala_id}`} - {selectedAula?.comision} ({selectedAula?.turno})
            </Typography>
            <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
                Seleccioná un estudiante para ver su historial de evaluaciones.
            </Typography>

            {loadingStudents ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : aulaEstudiantes.length === 0 ? (
                <Alert severity="info">Esta aula no tiene estudiantes asignados.</Alert>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                    <Table>
                        <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: "bold" }}>Apellido y nombre</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>DNI</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {aulaEstudiantes.map((est) => (
                                <TableRow
                                    key={est.id}
                                    hover
                                    sx={{ cursor: "pointer" }}
                                    onClick={() => {
                                        const nombre = `${est.personas?.nombre ?? ""} ${est.personas?.primer_apellido ?? ""}`.trim();
                                        const params = new URLSearchParams({
                                            estudianteId: est.id,
                                            nombre,
                                            backTo: "/panel-control",
                                            backLabel: "Volver al panel de control",
                                        });
                                        navigate(`/historial-estudiante?${params.toString()}`);
                                    }}
                                >
                                    <TableCell>{`${est.personas?.primer_apellido ?? ""}, ${est.personas?.nombre ?? ""}`}</TableCell>
                                    <TableCell>{est.personas?.dni ?? "-"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </>
    );

    const panelSubtitle = isEquipoPadi
        ? "Gestión de zonas y encargados, con navegación en cascada: zona -> escuela -> aula -> estudiante -> evaluación."
        : "Vista de escuelas de tu zona, con acceso de solo lectura a aulas, estudiantes y evaluaciones.";

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
            <Box sx={{ bgcolor: "#f5f5f5", py: 4, borderBottom: "1px solid #e0e0e0" }}>
                <Container maxWidth="lg">
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate("/home")}
                        sx={{ color: "#5c7cfa", textTransform: "none", mb: 2 }}
                    >
                        Volver a inicio
                    </Button>
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
                        Panel de control
                    </Typography>
                    <Typography variant="body1" sx={{ color: "#666" }}>
                        {panelSubtitle}
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        {!error && view === "zonas" && renderZonas()}
                        {!error && view === "escuelas" && renderEscuelas()}
                        {!error && view === "aulas" && renderAulas()}
                        {!error && view === "estudiantes" && renderEstudiantes()}
                    </>
                )}
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

            <Dialog open={zonaDialogOpen} onClose={() => setZonaDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Nueva zona</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Nombre de la zona"
                        value={zonaNombre}
                        onChange={(e) => {
                            setZonaNombre(e.target.value);
                            setZonaError("");
                        }}
                        error={!!zonaError}
                        helperText={zonaError}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setZonaDialogOpen(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateZona}
                        disabled={savingZona}
                    >
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={encargadoDialogOpen} onClose={() => setEncargadoDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Asignar encargado a zona</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>
                        Zona: <strong>{selectedZonaForEncargado?.nombre}</strong>
                    </Typography>
                    <TextField
                        select
                        fullWidth
                        label="Encargado"
                        value={encargadoId}
                        onChange={(e) => setEncargadoId(e.target.value)}
                    >
                        {encargadosOptions.map((enc) => (
                            <MenuItem key={enc.id} value={enc.id}>
                                {enc.usuario.apellido}, {enc.usuario.nombre}
                                {enc.zona ? ` (${enc.zona.nombre})` : " (Sin asignar)"}
                            </MenuItem>
                        ))}
                        {encargadosOptions.length === 0 && (
                            <MenuItem disabled>No hay encargados disponibles</MenuItem>
                        )}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEncargadoDialogOpen(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={handleAssignEncargado}
                        disabled={!encargadoId || savingEncargado}
                    >
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

