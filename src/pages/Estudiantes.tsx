import { useState, useEffect } from "react"
import { Box, Container, Typography, Button, CircularProgress, Alert, Paper, List, ListItem, ListItemText, Stack, Tooltip, FormControl, InputLabel, Select, MenuItem } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useNavigate } from "react-router-dom"
import EstudiantesCompacto from "../components/estudiantes/EstudiantesCompacto"
import EstudianteForm from "../components/forms/EstudianteForm"
import { getEstudiantes, deleteEstudiante, type Estudiante, type EstudianteCreado } from "../api/estudiantes"
import { getDocenteAulasConEstudiantes, type DocenteAulaConEstudiantes } from "../api/aulas"
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BulkUploadForm from "../components/forms/BulkUploadForm"
import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SinEscuelaAsignada from "../components/common/SinEscuelaAsignada";

/**
 * Página principal de Estudiantes.
 */
export default function Estudiantes() {
    const [searchTerm, setSearchTerm] = useState("");
    const [view, setView] = useState<"list" | "form" | "success" | "successBulk">("list")
    const [modalMasivoOpen, setModalMasivoOpen] = useState(false);
    const [cantidadCreados, setCantidadCreados] = useState(0); // Estado para el conteo
    const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [noEscuela, setNoEscuela] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const [estudianteCreado, setEstudianteCreado] = useState<EstudianteCreado | null>(null)
    const [selectedForEdit, setSelectedForEdit] = useState<Estudiante | null>(null);
    const [userRole, setUserRole] = useState("");
    const [aulasDocente, setAulasDocente] = useState<DocenteAulaConEstudiantes[]>([]);
    const [selectedAulaId, setSelectedAulaId] = useState<string | null>(null);

    const [escuelaFiltro, setEscuelaFiltro] = useState<string>("todas");
    const [salaFiltro, setSalaFiltro] = useState<string>("todas");
    const [comisionFiltro, setComisionFiltro] = useState<string>("todas");

    const navigate = useNavigate()
    // --- Carga de Datos Inicial ---
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("padiUser") || "{}")
        setUserRole(user.rol)
    }, [])

    useEffect(() => {
        if (view === "list") {
            loadEstudiantes()
        }
    }, [view, refreshKey])

    const loadEstudiantes = async () => {
        setLoading(true)
        setError(null)
        try {
            const user = JSON.parse(localStorage.getItem("padiUser") || "{}");
            if (user?.rol === "director" && !user?.escuela_id) {
                setNoEscuela(true)
                return
            }
            if (user?.rol === "docente") {
                const aulas = await getDocenteAulasConEstudiantes();
                setAulasDocente(aulas);
                setEstudiantes([]);
            } else {
                const data = await getEstudiantes();
                setEstudiantes(data);
                setAulasDocente([]);
            }
        } catch (err: any) {
            setError(err.message || "Error al cargar los estudiantes")
        } finally {
            setLoading(false)
        }
    }

    // Filtrado extendido
    const estudiantesFiltrados = estudiantes.filter((est) => {
        const cumpleTexto = `${est.personas.nombre} ${est.personas.primer_apellido} ${est.personas.dni}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        const cumpleEscuela = escuelaFiltro === "todas" || est.escuela?.escuela_id === escuelaFiltro;

        // Filtro de Sala: puede venir de aula_asignada o de la relación directa [cite: 55, 64]
        const cumpleSala = salaFiltro === "todas" || String(est.sala_id) === salaFiltro;

        // Filtro de Comisión
        const cumpleComision = comisionFiltro === "todas" || est.aula_asignada?.comision === comisionFiltro;

        return cumpleTexto && cumpleEscuela && cumpleSala && cumpleComision;
    });

    // 3. Obtener comisiones únicas para el dropdown (opcional)
    const comisionesUnicas = Array.from(new Set(estudiantes
        .map(est => est.aula_asignada?.comision)
        .filter((c): c is string => Boolean(c))
    ));

    // --- Handlers de Navegación ---
    const handleDeleteEstudiante = async (id: string) => {
        await deleteEstudiante(id);
        await loadEstudiantes();
    };

    const handleEdit = (estudiante: Estudiante) => {
        setSelectedForEdit(estudiante);
        setView("form");
    };

    const handleBackToList = () => {
        setSelectedForEdit(null);
        setView("list");
        if (userRole !== "docente") {
            setSelectedAulaId(null);
        }
        // Si usamos React Router, limpiamos la URL
        navigate("/estudiantes", { replace: true });
    }

    const handleSuccess = (nuevoEstudiante: EstudianteCreado) => {
        if (userRole === "docente") {
            setView("list");
            setRefreshKey(prev => prev + 1);
            return;
        }

        // Si estábamos editando, volvemos directo a la lista
        if (selectedForEdit) {
            handleBackToList();
            setRefreshKey(prev => prev + 1);
        } else {
            // Si es creación nueva, mostramos pantalla de éxito
            setEstudianteCreado(nuevoEstudiante);
            setView("success");
            setRefreshKey(prev => prev + 1);
        }
    }

    const handleEvaluarAhora = () => {
        if (estudianteCreado) {
            navigate(`/evaluaciones?estudianteId=${estudianteCreado.id}&backTo=${encodeURIComponent("/estudiantes")}&backLabel=${encodeURIComponent("Volver a estudiantes")}`);
        }
    }

    // --- Helper para Títulos ---
    const getTitle = () => {
        if (view === 'form') return selectedForEdit ? 'Modificar datos' : 'Nuevo estudiante';
        if (view === 'success') return 'Completado';
        return 'Estudiantes';
    }

    const getEstadoColor = (estado: string | null | undefined) => {
        if (estado === "A") return "#2e7d32";
        if (estado === "E") return "#f9a825";
        if (estado === "D") return "#d32f2f";
        return "transparent";
    };

    const getEstadoLabel = (estado: string | null | undefined) => {
        if (estado === "A") return "Aprobada";
        if (estado === "E") return "En progreso";
        if (estado === "D") return "Desaprobada";
        return "Sin evaluación";
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: view === 'form' ? '#fff' : '#f5f5f5' }}>
            {/* Header: Solo se muestra en List y Success */}
            {view !== 'form' && (
                <Box sx={{ py: { xs: 3, md: 4 }, borderBottom: "1px solid #e0e0e0", bgcolor: '#f5f5f5' }}>
                    <Container maxWidth="xl">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                            <Button
                                startIcon={<ArrowBackIcon />}
                                onClick={view === "list" ? () => navigate("/home") : handleBackToList}
                                sx={{ color: "#5c7cfa", textTransform: "none", fontSize: '1rem' }}
                            >
                                {view === "list" ? "Volver a inicio" : "Volver a estudiantes"}
                            </Button>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '2.25rem', md: '3rem' } }}>
                            {getTitle()}
                        </Typography>
                        <Typography variant="body1" sx={{ color: "#666" }}>
                            Alta de nuevos estudiantes, edición de datos y gestión de la base de estudiantes por escuela, sala y comisión.
                        </Typography>
                    </Container>
                </Box>
            )}

            {/* Contenido Principal */}
            <Container maxWidth="xl" sx={{ mt: view === 'form' ? 0 : 4, pb: 6 }}>
                {view === 'list' && (
                    <>
                        {noEscuela ? (
                            <SinEscuelaAsignada />
                        ) : loading ? (
                            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress /></Box>
                        ) : error ? (
                            <Alert severity="error">{error}</Alert>
                        ) : userRole === "docente" ? (
                            <>
                                {!selectedAulaId ? (
                                    <Stack spacing={2}>
                                        {aulasDocente.length === 0 && (
                                            <Alert severity="info">
                                                No tenés aulas asignadas por ahora.
                                            </Alert>
                                        )}
                                        {aulasDocente.map((aula) => (
                                            <Paper
                                                key={aula.id}
                                                sx={{ p: 2.5, borderRadius: 3, border: "1px solid #eee", cursor: "pointer" }}
                                                onClick={() => setSelectedAulaId(aula.id)}
                                            >
                                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                    {aula.sala?.grado ?? "?"}° - {aula.comision} ({aula.turno})
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: "#666", mt: 0.5 }}>
                                                    Escuela: {aula.escuela?.nombre ?? "Sin nombre"}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: "#444", mt: 1 }}>
                                                    Estudiantes asignados: {aula.estudiantes?.length ?? 0}
                                                </Typography>
                                            </Paper>
                                        ))}
                                    </Stack>
                                ) : (
                                    (() => {
                                        const aula = aulasDocente.find((a) => a.id === selectedAulaId);
                                        if (!aula) {
                                            return <Alert severity="warning">Aula no encontrada.</Alert>;
                                        }

                                        return (
                                            <Box>
                                                <Button
                                                    startIcon={<ArrowBackIcon />}
                                                    onClick={() => setSelectedAulaId(null)}
                                                    sx={{ mb: 2, textTransform: "none" }}
                                                >
                                                    Volver a mis aulas
                                                </Button>
                                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                                    {aula.sala?.grado ?? "?"}° - {aula.comision} ({aula.turno})
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
                                                    {aula.escuela?.nombre ?? "Escuela"}
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    onClick={() => setView("form")}
                                                    sx={{ mb: 2, bgcolor: "#000" }}
                                                >
                                                    Agregar estudiante a esta aula
                                                </Button>

                                                {aula.estudiantes.length === 0 ? (
                                                    <Alert severity="info">
                                                        Esta aula está asignada a vos, pero todavía no tiene estudiantes.
                                                    </Alert>
                                                ) : (
                                                    <Paper elevation={0} sx={{ border: "1px solid #eee", borderRadius: 3 }}>
                                                        <List>
                                                            {aula.estudiantes.map((est, index) => (
                                                                <ListItem
                                                                    key={est.id}
                                                                    divider={index < aula.estudiantes.length - 1}
                                                                    secondaryAction={
                                                                        <Stack direction="row" spacing={1}>
                                                                            <Tooltip title={`Inicial: ${getEstadoLabel(est.evaluaciones_resumen?.inicial)}`}>
                                                                                <Box
                                                                                    sx={{
                                                                                        width: 14,
                                                                                        height: 14,
                                                                                        borderRadius: "50%",
                                                                                        border: "1.5px solid #bdbdbd",
                                                                                        bgcolor: getEstadoColor(est.evaluaciones_resumen?.inicial),
                                                                                        alignSelf: "center",
                                                                                    }}
                                                                                />
                                                                            </Tooltip>
                                                                            <Tooltip title={`Cierre: ${getEstadoLabel(est.evaluaciones_resumen?.cierre)}`}>
                                                                                <Box
                                                                                    sx={{
                                                                                        width: 14,
                                                                                        height: 14,
                                                                                        borderRadius: "50%",
                                                                                        border: "1.5px solid #bdbdbd",
                                                                                        bgcolor: getEstadoColor(est.evaluaciones_resumen?.cierre),
                                                                                        alignSelf: "center",
                                                                                    }}
                                                                                />
                                                                            </Tooltip>
                                                                            <Button
                                                                                size="small"
                                                                                onClick={() =>
                                                                                    navigate(`/evaluaciones?estudianteId=${est.id}&nombre=${encodeURIComponent(`${est.personas.nombre} ${est.personas.primer_apellido}`)}&salaId=${aula.sala_id}&aulaId=${aula.id}&aulaLabel=${encodeURIComponent(`${aula.sala?.grado ?? "?"}° - ${aula.comision} (${aula.turno})`)}&escuelaNombre=${encodeURIComponent(aula.escuela?.nombre ?? "Escuela")}&backTo=${encodeURIComponent("/estudiantes")}&backLabel=${encodeURIComponent("Volver a estudiantes")}`)
                                                                                }
                                                                            >
                                                                                Evaluar
                                                                            </Button>
                                                                            <Button
                                                                                size="small"
                                                                                onClick={() =>
                                                                                    navigate(`/historial-estudiante?estudianteId=${est.id}&nombre=${est.personas.nombre} ${est.personas.primer_apellido}`)
                                                                                }
                                                                            >
                                                                                Historial
                                                                            </Button>
                                                                        </Stack>
                                                                    }
                                                                >
                                                                    <ListItemText
                                                                        primary={
                                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", pr: 22 }}>
                                                                                <Typography sx={{ fontWeight: 600 }}>
                                                                                    {`${est.personas.primer_apellido ?? ""}, ${est.personas.nombre ?? ""}`}
                                                                                </Typography>
                                                                                <Typography variant="body2" sx={{ color: "#666" }}>
                                                                                    {aula.escuela?.nombre ?? "Sin colegio"}
                                                                                </Typography>
                                                                                <Typography variant="body2" sx={{ color: "#666" }}>
                                                                                    {(aula.sala?.nombre || `Sala ${aula.sala?.grado ?? aula.sala_id}`)} - {aula.comision} ({aula.turno})
                                                                                </Typography>
                                                                            </Box>
                                                                        }
                                                                    />
                                                                </ListItem>
                                                            ))}
                                                        </List>
                                                    </Paper>
                                                )}
                                            </Box>
                                        );
                                    })()
                                )}
                            </>
                        ) : (
                            <Box>
                                {/* BARRA DE BUSQUEDA Y DROPDOWNS */}
                                <Paper elevation={0} sx={{ p: 2, mb: 4, bgcolor: '#fff', border: '1px solid #eee', borderRadius: 3 }}>
                                    <Stack spacing={2}>
                                        <TextField
                                            fullWidth
                                            placeholder="Buscar por nombre, apellido o DNI..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                                                sx: { borderRadius: 2 }
                                            }}
                                        />

                                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                            {/* DROPDOWN ESCUELA [cite: 52, 53] */}
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Escuela</InputLabel>
                                                <Select
                                                    value={escuelaFiltro}
                                                    label="Escuela"
                                                    onChange={(e) => setEscuelaFiltro(e.target.value)}
                                                >
                                                    <MenuItem value="todas">Todas las Escuelas</MenuItem>
                                                    {/* Aquí mapeas tus escuelas cargadas en el estado listaEscuelas */}
                                                    {Array.from(new Set(estudiantes.map(e => e.escuela?.nombre))).map(nombre => {
                                                        const id = estudiantes.find(e => e.escuela?.nombre === nombre)?.escuela?.escuela_id;
                                                        return <MenuItem key={id} value={id}>{nombre}</MenuItem>
                                                    })}
                                                </Select>
                                            </FormControl>

                                            {/* DROPDOWN SALA [cite: 64] */}
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Sala</InputLabel>
                                                <Select
                                                    value={salaFiltro}
                                                    label="Sala"
                                                    onChange={(e) => setSalaFiltro(e.target.value)}
                                                >
                                                    <MenuItem value="todas">Todas las Salas</MenuItem>
                                                    {/* Mapeo de salas únicas */}
                                                    {Array.from(new Set(estudiantes.map(e => e.salas?.nombre))).map(nombre => {
                                                        const id = estudiantes.find(e => e.salas?.nombre === nombre)?.sala_id;
                                                        return <MenuItem key={id} value={String(id)}>{nombre}</MenuItem>
                                                    })}
                                                </Select>
                                            </FormControl>

                                            {/* DROPDOWN COMISION [cite: 55] */}
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Comisión</InputLabel>
                                                <Select
                                                    value={comisionFiltro}
                                                    label="Comisión"
                                                    onChange={(e) => setComisionFiltro(e.target.value)}
                                                >
                                                    <MenuItem value="todas">Todas las Comisiones</MenuItem>
                                                    {comisionesUnicas.map(c => (
                                                        <MenuItem key={c} value={c}>{c}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Stack>
                                    </Stack>
                                </Paper>

                                <EstudiantesCompacto
                                    estudiantes={estudiantesFiltrados}
                                    onAddEstudiante={() => setView("form")}
                                    onEditEstudiante={handleEdit}
                                    onBulkAdd={() => setModalMasivoOpen(true)}
                                    onDeleteEstudiante={handleDeleteEstudiante}
                                    userRole={userRole}
                                />
                            </Box>
                        )}
                    </>
                )}

                {view === 'form' && (
                    <Box sx={{ pt: 4 }}>
                        <EstudianteForm
                            onCancel={handleBackToList}
                            onSuccess={handleSuccess}
                            estudianteAEditar={selectedForEdit}
                            aulaContext={
                                userRole === "docente" && !selectedForEdit && selectedAulaId
                                    ? (() => {
                                        const aula = aulasDocente.find((a) => a.id === selectedAulaId);
                                        if (!aula) return null;
                                        return {
                                            aula_id: aula.id,
                                            sala_id: aula.sala_id,
                                            escuela_id: aula.escuela_id,
                                            aulaLabel: `${aula.sala?.grado ?? "?"}° - ${aula.comision} (${aula.turno})`,
                                            escuelaNombre: aula.escuela?.nombre ?? null,
                                        };
                                    })()
                                    : null
                            }
                        />
                    </Box>
                )}

                {view === 'success' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, textAlign: 'center' }}>
                        <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                            {estudianteCreado?.reactivado ? "¡Estudiante reactivado!" : "¡Estudiante registrado!"}
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#666', mb: 4, maxWidth: 400 }}>
                            {estudianteCreado?.reactivado
                                ? "El alumno fue reactivado con los nuevos datos. ¿Querés evaluarlo ahora?"
                                : "Los datos fueron guardados correctamente. ¿Querés evaluarlo ahora?"}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 300 }}>
                            <Button variant="contained" onClick={handleEvaluarAhora} sx={{ bgcolor: '#000', py: 1.5, borderRadius: 2 }}>
                                Evaluar ahora
                            </Button>
                            <Button variant="outlined" onClick={handleBackToList} sx={{ borderColor: '#000', color: '#000', py: 1.5, borderRadius: 2 }}>
                                Volver a la lista
                            </Button>
                        </Box>
                    </Box>
                )}
                {view === 'successBulk' && (
                    <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
                        <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
                        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                            ¡Carga Masiva Exitosa!
                        </Typography>
                        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                            Se han registrado {cantidadCreados} estudiantes correctamente
                            en el sistema.
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => setView('list')}
                            sx={{ bgcolor: '#000', px: 4, py: 1.5, borderRadius: 2 }}
                        >
                            Volver a la lista
                        </Button>
                    </Paper>
                )}

                <BulkUploadForm
                    open={modalMasivoOpen}
                    onCancel={() => setModalMasivoOpen(false)}
                    onSuccess={(data) => {
                        setModalMasivoOpen(false);
                        setCantidadCreados(data.length);
                        setView('successBulk');
                        setRefreshKey(k => k + 1);
                    }}
                />

            </Container>
        </Box>
    )
}