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
import { useNavigate, useSearchParams } from "react-router-dom";
import { type Escuela, getEscuelas } from "../api/escuelas";
import { type Aula, type AulaDocente, getAulas, getAulaEstudiantes, getAulaDocentes, asignarDocenteAula, desasignarDocenteAula, asignarEstudianteAula, desasignarEstudianteAula, createAula, deleteAula } from "../api/aulas";
import { type Estudiante, getEstudiantes, getSalas, type Sala } from "../api/estudiantes";
import { getDocentes, type Docente } from "../api/docentes";
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
    const [searchParams] = useSearchParams();
    const initialAulaId = searchParams.get("aulaId");
    const initialEscuelaId = searchParams.get("escuelaId");
    const initialZonaId = searchParams.get("zonaId");

    const [view, setView] = useState<ViewMode>("escuelas");
    const [pendingRestore, setPendingRestore] = useState(!!(initialAulaId || initialEscuelaId));
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
    const [todosLosEstudiantes, setTodosLosEstudiantes] = useState<Estudiante[]>([]);
    const [selectedEstudianteId, setSelectedEstudianteId] = useState("");
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

    const [docentes, setDocentes] = useState<Docente[]>([]);
    const [docenteDialogAula, setDocenteDialogAula] = useState<Aula | null>(null);
    const [aulaDocentes, setAulaDocentes] = useState<AulaDocente[]>([]);
    const [selectedDocenteIdForAula, setSelectedDocenteIdForAula] = useState("");

    const [salas, setSalas] = useState<Sala[]>([]);
    const [showAulaForm, setShowAulaForm] = useState(false);
    const [newAulaSalaId, setNewAulaSalaId] = useState<number | "">("");
    const [newAulaComision, setNewAulaComision] = useState("");
    const [newAulaTurno, setNewAulaTurno] = useState("");
    const [savingAula, setSavingAula] = useState(false);

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
            const [salasData, docentesData] = await Promise.all([getSalas(), getDocentes()]);
            setSalas(salasData);
            setDocentes(docentesData);

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

    useEffect(() => {
        if (!pendingRestore || loading || escuelas.length === 0) return;

        const restore = async () => {
            if (initialZonaId) {
                const zona = zonas.find((z) => z.id === initialZonaId);
                if (zona) setSelectedZona(zona);
            }

            if (initialEscuelaId) {
                const escuela = escuelas.find((e) => e.id === initialEscuelaId);
                if (escuela) {
                    setSelectedEscuela(escuela);
                    if (initialAulaId) {
                        const escuelaAulas = aulasByEscuela.get(escuela.id) || [];
                        const aula = escuelaAulas.find((a) => a.id === initialAulaId);
                        if (aula) {
                            await openAulaEstudiantes(aula);
                        } else {
                            setView("aulas");
                        }
                    } else {
                        setView("aulas");
                    }
                }
            }
            setPendingRestore(false);
        };
        restore();
    }, [pendingRestore, loading, escuelas, zonas, aulas]);

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
            const [estudiantes, todos] = await Promise.all([
                getAulaEstudiantes(aula.id),
                getEstudiantes(),
            ]);
            setAulaEstudiantes(estudiantes);
            setTodosLosEstudiantes(todos);
            setSelectedEstudianteId("");
            setView("estudiantes");
        } catch (e: any) {
            setError(e.message || "Error al cargar estudiantes del aula");
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleAsignarEstudiante = async () => {
        if (!selectedAula || !selectedEstudianteId) return;
        try {
            await asignarEstudianteAula(selectedAula.id, selectedEstudianteId);
            const updated = await getAulaEstudiantes(selectedAula.id);
            setAulaEstudiantes(updated);
            setSelectedEstudianteId("");
        } catch (err: any) {
            alert(err.message || "Error al asignar estudiante");
        }
    };

    const handleDesasignarEstudiante = async (estudianteId: string) => {
        if (!selectedAula) return;
        try {
            await desasignarEstudianteAula(selectedAula.id, estudianteId);
            const updated = await getAulaEstudiantes(selectedAula.id);
            setAulaEstudiantes(updated);
        } catch (err: any) {
            alert(err.message || "Error al quitar estudiante");
        }
    };

    const estudiantesDisponiblesParaAula = todosLosEstudiantes.filter(
        (e) => !aulaEstudiantes.some((ae) => ae.id === e.id)
    );

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

    const openDocentesDialog = async (aula: Aula) => {
        try {
            const data = await getAulaDocentes(aula.id);
            setDocenteDialogAula(aula);
            setAulaDocentes(data);
            setSelectedDocenteIdForAula("");
        } catch (e: any) {
            setError(e.message || "Error al cargar docentes del aula");
        }
    };

    const handleAsignarDocenteAula = async () => {
        if (!docenteDialogAula || !selectedDocenteIdForAula) return;
        try {
            await asignarDocenteAula(docenteDialogAula.id, selectedDocenteIdForAula);
            const data = await getAulaDocentes(docenteDialogAula.id);
            setAulaDocentes(data);
            setSelectedDocenteIdForAula("");
        } catch (e: any) {
            alert(e.message || "Error al asignar docente al aula");
        }
    };

    const handleDesasignarDocenteAula = async (profesorId: string) => {
        if (!docenteDialogAula) return;
        if (!window.confirm("¿Quitar a este docente del aula?")) return;
        try {
            await desasignarDocenteAula(docenteDialogAula.id, profesorId);
            const data = await getAulaDocentes(docenteDialogAula.id);
            setAulaDocentes(data);
        } catch (e: any) {
            alert(e.message || "Error al desasignar docente del aula");
        }
    };

    const docentesDisponiblesParaAulaDialog = docentes.filter(
        (d) => !aulaDocentes.some((ad) => ad.profesor_id === d.id)
    );

    const handleCreateAula = async () => {
        if (!selectedEscuela || !newAulaSalaId || !newAulaComision.trim() || !newAulaTurno.trim()) {
            setError("Todos los campos son obligatorios.");
            return;
        }
        setSavingAula(true);
        setError(null);
        try {
            await createAula({
                sala_id: Number(newAulaSalaId),
                comision: newAulaComision.trim(),
                turno: newAulaTurno.trim(),
                escuela_id: selectedEscuela.id,
            });
            setShowAulaForm(false);
            setNewAulaSalaId("");
            setNewAulaComision("");
            setNewAulaTurno("");
            await loadData();
        } catch (e: any) {
            setError(e.message || "Error al crear el aula");
        } finally {
            setSavingAula(false);
        }
    };

    const renderAulas = () => {
        const escuelaAulas = selectedEscuela ? aulasByEscuela.get(selectedEscuela.id) || [] : [];
        return (
            <>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => { setView("escuelas"); setShowAulaForm(false); }}
                        sx={{ textTransform: "none" }}
                    >
                        Volver a escuelas
                    </Button>
                    {!showAulaForm && (
                        <Button
                            startIcon={<AddIcon />}
                            variant="contained"
                            sx={{
                                bgcolor: "#5fb878",
                                color: "white",
                                textTransform: "none",
                                fontWeight: 600,
                                borderRadius: 2,
                                "&:hover": { bgcolor: "#4a9960" },
                            }}
                            onClick={() => setShowAulaForm(true)}
                        >
                            Nueva aula
                        </Button>
                    )}
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                    {selectedEscuela?.nombre}
                </Typography>

                {showAulaForm && (
                    <Paper sx={{ p: 3, mb: 3, border: "1px solid #eee", borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            Crear nueva aula
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
                            <TextField
                                select
                                label="Sala / Grado"
                                value={newAulaSalaId}
                                onChange={(e) => setNewAulaSalaId(Number(e.target.value))}
                                sx={{ minWidth: 180 }}
                                size="small"
                            >
                                {salas.map((s) => (
                                    <MenuItem key={s.id} value={s.id}>
                                        {s.nombre} {s.grado ? `(${s.grado})` : ""}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                label="Comisión"
                                value={newAulaComision}
                                onChange={(e) => setNewAulaComision(e.target.value)}
                                size="small"
                            />
                            <TextField
                                label="Turno"
                                placeholder="mañana / tarde"
                                value={newAulaTurno}
                                onChange={(e) => setNewAulaTurno(e.target.value)}
                                size="small"
                            />
                            <Button
                                variant="contained"
                                onClick={handleCreateAula}
                                disabled={savingAula}
                                sx={{ bgcolor: "#000", "&:hover": { bgcolor: "#333" }, textTransform: "none", fontWeight: 600 }}
                            >
                                Guardar
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => { setShowAulaForm(false); setNewAulaSalaId(""); setNewAulaComision(""); setNewAulaTurno(""); }}
                                sx={{ textTransform: "none", borderColor: "#000", color: "#000" }}
                            >
                                Cancelar
                            </Button>
                        </Box>
                    </Paper>
                )}

                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                    <Table>
                        <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: "bold" }}>Sala</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Comisión</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Turno</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }}>Docentes</TableCell>
                                <TableCell sx={{ fontWeight: "bold" }} align="center">Acción</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {escuelaAulas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                                        Esta escuela no tiene aulas cargadas.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                escuelaAulas.map((aula) => (
                                    <TableRow key={aula.id} hover>
                                        <TableCell>{aula.sala?.nombre || `Sala ${aula.sala_id}`}</TableCell>
                                        <TableCell>{aula.comision}</TableCell>
                                        <TableCell>{aula.turno}</TableCell>
                                        <TableCell>
                                            {aula.profesores_aulas && aula.profesores_aulas.length > 0
                                                ? aula.profesores_aulas.map((pa) => {
                                                    const nombre = pa.profesor?.personas?.nombre || "";
                                                    const apellido = pa.profesor?.personas?.primer_apellido || "";
                                                    return `${apellido}, ${nombre}`.trim();
                                                  }).join(" | ")
                                                : <Typography variant="body2" sx={{ color: "#999" }}>Sin asignar</Typography>
                                            }
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                sx={{ textTransform: "none", mr: 1 }}
                                                onClick={() => openAulaEstudiantes(aula)}
                                            >
                                                Ver estudiantes
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    textTransform: "none",
                                                    mr: 1,
                                                    borderColor: "#2e7d32",
                                                    color: "#2e7d32",
                                                    "&:hover": {
                                                        bgcolor: "rgba(46, 125, 50, 0.04)",
                                                        borderColor: "#2e7d32",
                                                    },
                                                }}
                                                onClick={() => openDocentesDialog(aula)}
                                            >
                                                Docentes
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    textTransform: "none",
                                                    borderColor: "#d32f2f",
                                                    color: "#d32f2f",
                                                    "&:hover": {
                                                        bgcolor: "rgba(211, 47, 47, 0.04)",
                                                        borderColor: "#d32f2f",
                                                    },
                                                }}
                                                onClick={async () => {
                                                    if (!window.confirm(`¿Seguro que querés eliminar el aula "${aula.comision}" (${aula.turno})?`)) return;
                                                    try {
                                                        await deleteAula(aula.id);
                                                        await loadData();
                                                    } catch (e: any) {
                                                        setError(e.message || "Error al eliminar el aula");
                                                    }
                                                }}
                                            >
                                                Eliminar
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

    const buildPanelBackTo = () => {
        const parts = ["/panel-control"];
        const queryParts: string[] = [];
        if (selectedAula) queryParts.push(`aulaId=${selectedAula.id}`);
        if (selectedEscuela) queryParts.push(`escuelaId=${selectedEscuela.id}`);
        if (selectedZona) queryParts.push(`zonaId=${selectedZona.id}`);
        if (queryParts.length > 0) parts.push("?" + queryParts.join("&"));
        return parts.join("");
    };

    const renderEstudiantes = () => {
        const panelBackTo = buildPanelBackTo();
        const aulaLabel = `${selectedAula?.sala?.nombre || `Sala ${selectedAula?.sala_id}`} - ${selectedAula?.comision} (${selectedAula?.turno})`;

        return (
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
            <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
                Seleccioná un estudiante para ver su historial o evaluarlo.
            </Typography>

            {/* Agregar estudiante */}
            <Box sx={{ display: "flex", gap: 1, mb: 3, maxWidth: 500 }}>
                <TextField
                    select
                    fullWidth
                    size="small"
                    label="Agregar estudiante al aula"
                    value={selectedEstudianteId}
                    onChange={(e) => setSelectedEstudianteId(e.target.value)}
                >
                    {estudiantesDisponiblesParaAula.map((e) => (
                        <MenuItem key={e.id} value={e.id}>
                            {e.personas?.primer_apellido}, {e.personas?.nombre}
                        </MenuItem>
                    ))}
                    {estudiantesDisponiblesParaAula.length === 0 && (
                        <MenuItem disabled>No hay más estudiantes disponibles</MenuItem>
                    )}
                </TextField>
                <Button
                    variant="contained"
                    sx={{
                        textTransform: "none",
                        bgcolor: "#5fb878",
                        color: "#fff",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        "&:hover": { bgcolor: "#4a9960" },
                    }}
                    disabled={!selectedEstudianteId}
                    onClick={handleAsignarEstudiante}
                >
                    Agregar
                </Button>
            </Box>

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
                                <TableCell sx={{ fontWeight: "bold" }} align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {aulaEstudiantes.map((est) => {
                                const nombre = `${est.personas?.nombre ?? ""} ${est.personas?.primer_apellido ?? ""}`.trim();
                                return (
                                <TableRow
                                    key={est.id}
                                    hover
                                    sx={{ cursor: "pointer" }}
                                    onClick={() => {
                                        const params = new URLSearchParams({
                                            estudianteId: est.id,
                                            nombre,
                                            backTo: panelBackTo,
                                            backLabel: "Volver al aula",
                                        });
                                        navigate(`/historial-estudiante?${params.toString()}`);
                                    }}
                                >
                                    <TableCell>{`${est.personas?.primer_apellido ?? ""}, ${est.personas?.nombre ?? ""}`}</TableCell>
                                    <TableCell>{est.personas?.dni ?? "-"}</TableCell>
                                    <TableCell align="center">
                                        <Button
                                            size="small"
                                            sx={{ textTransform: "none", mr: 1 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/evaluaciones?estudianteId=${est.id}&nombre=${encodeURIComponent(nombre)}&salaId=${selectedAula!.sala_id}&aulaId=${selectedAula!.id}&aulaLabel=${encodeURIComponent(aulaLabel)}&escuelaNombre=${encodeURIComponent(selectedEscuela?.nombre ?? "Escuela")}&backTo=${encodeURIComponent(panelBackTo)}&backLabel=${encodeURIComponent("Volver al aula")}`);
                                            }}
                                        >
                                            Evaluar
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            sx={{ textTransform: "none", mr: 1 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const params = new URLSearchParams({
                                                    estudianteId: est.id,
                                                    nombre,
                                                    backTo: panelBackTo,
                                                    backLabel: "Volver al aula",
                                                });
                                                navigate(`/historial-estudiante?${params.toString()}`);
                                            }}
                                        >
                                            Historial
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                textTransform: "none",
                                                borderColor: "#d32f2f",
                                                color: "#d32f2f",
                                                "&:hover": {
                                                    bgcolor: "rgba(211, 47, 47, 0.04)",
                                                    borderColor: "#d32f2f",
                                                },
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDesasignarEstudiante(est.id);
                                            }}
                                        >
                                            Quitar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </>
        );
    };

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
                    <Box>
                        <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
                            Panel de control
                        </Typography>
                        <Typography variant="body1" sx={{ color: "#666" }}>
                            {panelSubtitle}
                        </Typography>
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {loading || pendingRestore ? (
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

            {/* Docentes del aula */}
            {docenteDialogAula && (
                <Box
                    sx={{
                        position: "fixed",
                        top: 0, left: 0, right: 0, bottom: 0,
                        bgcolor: "rgba(0,0,0,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1300,
                    }}
                >
                    <Box sx={{ bgcolor: "#fff", p: 3, borderRadius: 2, minWidth: 400, maxWidth: 500 }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                            Docentes del aula
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, color: "#666" }}>
                            {docenteDialogAula.sala?.nombre || `Sala ${docenteDialogAula.sala_id}`} - {docenteDialogAula.comision} ({docenteDialogAula.turno})
                        </Typography>

                        <Box sx={{ mb: 2, maxHeight: 200, overflowY: "auto" }}>
                            {aulaDocentes.length === 0 ? (
                                <Typography variant="body2" sx={{ color: "#777" }}>
                                    No hay docentes asignados a esta aula.
                                </Typography>
                            ) : (
                                aulaDocentes.map((ad) => (
                                    <Box
                                        key={ad.profesor_id}
                                        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.5 }}
                                    >
                                        <Typography variant="body2">
                                            {ad.profesor.personas?.nombre || "Sin nombre"}{" "}
                                            {ad.profesor.personas?.primer_apellido || ""}
                                        </Typography>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                textTransform: "none",
                                                borderColor: "#d32f2f",
                                                color: "#d32f2f",
                                                "&:hover": { bgcolor: "rgba(211, 47, 47, 0.04)", borderColor: "#d32f2f" },
                                            }}
                                            onClick={() => handleDesasignarDocenteAula(ad.profesor_id)}
                                        >
                                            Quitar
                                        </Button>
                                    </Box>
                                ))
                            )}
                        </Box>

                        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Agregar docente"
                                value={selectedDocenteIdForAula}
                                onChange={(e) => setSelectedDocenteIdForAula(e.target.value)}
                            >
                                {docentesDisponiblesParaAulaDialog.map((d) => (
                                    <MenuItem key={d.id} value={d.id}>
                                        {d.apellido}, {d.nombre}
                                    </MenuItem>
                                ))}
                                {docentesDisponiblesParaAulaDialog.length === 0 && (
                                    <MenuItem disabled>No hay más docentes disponibles</MenuItem>
                                )}
                            </TextField>
                            <Button
                                variant="contained"
                                sx={{ textTransform: "none", bgcolor: "#000", color: "#fff", fontWeight: 600, "&:hover": { bgcolor: "#333" } }}
                                disabled={!selectedDocenteIdForAula}
                                onClick={handleAsignarDocenteAula}
                            >
                                Asignar
                            </Button>
                        </Box>

                        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <Button
                                variant="outlined"
                                sx={{ textTransform: "none", borderColor: "#000", color: "#000", fontWeight: 600, "&:hover": { bgcolor: "rgba(0,0,0,0.04)" } }}
                                onClick={() => { setDocenteDialogAula(null); setAulaDocentes([]); setSelectedDocenteIdForAula(""); }}
                            >
                                Cerrar
                            </Button>
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
}

