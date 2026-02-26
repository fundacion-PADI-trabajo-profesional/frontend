"use client"

import { useState, useEffect } from "react"
import { Box, Container, Typography, Button, CircularProgress, Alert, Paper, List, ListItem, ListItemText, Stack } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useNavigate } from "react-router-dom"
import EstudiantesList from "../components/EstudiantesList"
import EstudianteForm from "../components/EstudianteForm"
import { getEstudiantes, type Estudiante, type EstudianteCreado } from "../api/estudiantes"
import { getDocenteAulasConEstudiantes, type DocenteAulaConEstudiantes } from "../api/aulas"
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

/**
 * Página principal de Estudiantes.
 */
export default function Estudiantes() {
    const [view, setView] = useState<"list" | "form" | "success">("list")
    const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [refreshKey, setRefreshKey] = useState(0) 
    const [estudianteCreado, setEstudianteCreado] = useState<EstudianteCreado | null>(null)
    const [selectedForEdit, setSelectedForEdit] = useState<Estudiante | null>(null);
    const [userRole, setUserRole] = useState("");
    const [aulasDocente, setAulasDocente] = useState<DocenteAulaConEstudiantes[]>([]);
    const [selectedAulaId, setSelectedAulaId] = useState<string | null>(null);

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

    // --- Handlers de Navegación ---
    const handleEdit = (estudiante: Estudiante) => {
        setSelectedForEdit(estudiante);
        setView("form");
    };

    const handleGoToForm = () => {
        setSelectedForEdit(null); // Limpiamos por si veníamos de una edición
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

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: view === 'form' ? '#fff' : '#f5f5f5' }}>
            {/* Header: Solo se muestra en List y Success */}
            {view !== 'form' && (
                <Box sx={{ py: { xs: 3, md: 4 }, borderBottom: "1px solid #e0e0e0", bgcolor: '#f5f5f5' }}>
                    <Container maxWidth="lg">
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
                    </Container>
                </Box>
            )}

            {/* Contenido Principal */}
            <Container maxWidth="lg" sx={{ mt: view === 'form' ? 0 : 4, pb: 6 }}>
                {view === 'list' && (
                    <>
                        {loading ? (
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
                                                                        primary={`${est.personas.primer_apellido ?? ""}, ${est.personas.nombre ?? ""}`}
                                                                        secondary={`DNI: ${est.personas.dni ?? "-"}`}
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
                            <EstudiantesList 
                                estudiantes={estudiantes} 
                                onAddEstudiante={handleGoToForm} 
                                onEditEstudiante={handleEdit} 
                            />
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
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>¡Estudiante registrado!</Typography>
                        <Typography variant="body1" sx={{ color: '#666', mb: 4, maxWidth: 400 }}>
                            Los datos fueron guardados correctamente. ¿Querés evaluarlo ahora?
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
            </Container>
        </Box>
    )
}