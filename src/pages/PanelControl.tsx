import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
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
import { useNavigate, useSearchParams } from "react-router-dom";
import { type Escuela, getEscuelas } from "../api/escuelas";
import { type Aula, type AulaDocente, getAulaEstudiantes, getAulaDocentes, asignarDocenteAula, desasignarDocenteAula, asignarEstudianteAula, desasignarEstudianteAula } from "../api/aulas";
import { type Estudiante, getEstudiantes, getSalas, type Sala } from "../api/estudiantes";
import { getDocentes, type Docente } from "../api/docentes";
import { asignarEscuelaADirectivo, getDirectivos, type Directivo } from "../api/directivos";
import {
    getZonas,
    type Zona,
} from "../api/zonas";
import Zonas from "./Zonas";
import PageHeader from "../components/PageHeader";
import EscuelasView from "../components/EscuelasView";
import AulasView from "./AulasView";
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
    const [aulas] = useState<Aula[]>([]);
    const [directivos, setDirectivos] = useState<Directivo[]>([]);
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

    const [docentes, setDocentes] = useState<Docente[]>([]);
    const [docenteDialogAula, setDocenteDialogAula] = useState<Aula | null>(null);
    const [aulaDocentes, setAulaDocentes] = useState<AulaDocente[]>([]);
    const [selectedDocenteIdForAula, setSelectedDocenteIdForAula] = useState("");

    const [, setSalas] = useState<Sala[]>([]);

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
                const zonasData = await getZonas();
                setZonas(zonasData);
            } else {
                const [escuelasData, directivosData] = await Promise.all([
                    getEscuelas(),
                    getDirectivos(),
                ]);
                setEscuelas(escuelasData);
                setDirectivos(directivosData);
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
        
        loadData().then(() => {
            if (isEquipoPadi) setView("zonas");
            else setView("escuelas");
        });
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
            <PageHeader 
                title="Panel de control"
                subtitle={panelSubtitle}
                backTo="/home"
                backLabel="Volver a inicio"
            />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {loading || pendingRestore ? (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        {!error && view === "zonas" && (
                            <Zonas
                                zonas={zonas} 
                                onVerEscuelas={openZonaEscuelas} 
                                onUpdate={loadData} 
                                setError={setError} 
                            />
                        )}
                        {!error && view === "escuelas" && (
                            <EscuelasView
                                zonaIdParam={selectedZona?.id}
                                isEquipoPadi={isEquipoPadi}
                                onVolver={() => {
                                    setSelectedZona(null);
                                    setView("zonas");
                                }}
                                onVerAulas={openEscuelaAulas}
                            />
                        )}
                        {!error && view === "aulas" && selectedEscuela && (
                            <AulasView
                                escuelaId={selectedEscuela.id}
                                isEquipoPadi={isEquipoPadi}
                                onVerEstudiantes={openAulaEstudiantes}
                            />
                        )}
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

