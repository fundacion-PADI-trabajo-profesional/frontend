import { useState, useEffect } from "react";
import {
    Box, Typography, Grid, Paper, List, ListItem, ListItemText,
    Button, IconButton, ListItemButton, Menu, MenuItem, ListItemIcon
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AssessmentIcon from "@mui/icons-material/Assessment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { getAulasPorEscuela, getAulaEstudiantes, Aula } from "../api/aulas";
import { getNivelSocioeconomicoLabel } from "../api/escuelas";
import { Estudiante } from "../api/estudiantes";

export default function EscuelaDetalle({ escuela, onEdit }: any) {
    const navigate = useNavigate();
    const [aulas, setAulas] = useState<Aula[]>([]);
    const [view, setView] = useState<"salas" | "aulas" | "estudiantes">("salas");
    const [selectedSala, setSelectedSala] = useState<number | null>(null);
    const [selectedAula, setSelectedAula] = useState<Aula | null>(null);
    const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
    const [loading, setLoading] = useState(false);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [activeStudent, setActiveStudent] = useState<Estudiante | null>(null);
    const [userRole, setUserRole] = useState<string>("");

    useEffect(() => {
        const stored = localStorage.getItem("padiUser");
        const user = stored ? JSON.parse(stored) : null;
        if (user) setUserRole(user.rol);
        if (escuela?.id) loadAulas();
    }, [escuela]);

    const loadAulas = async () => {
        const data = await getAulasPorEscuela(escuela.id);
        setAulas(data);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, est: Estudiante) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setActiveStudent(est);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setActiveStudent(null);
    };

    const handleEvaluar = () => {
        if (activeStudent && selectedAula) {
            const aulaLabel = `${selectedAula.sala?.nombre} - ${selectedAula.comision} (${selectedAula.turno})`;
            navigate(`/evaluaciones?estudianteId=${activeStudent.id}&nombre=${encodeURIComponent(`${activeStudent.personas.nombre} ${activeStudent.personas.primer_apellido}`)}&salaId=${activeStudent.sala_id}&aulaId=${selectedAula.id}&aulaLabel=${encodeURIComponent(aulaLabel)}&backTo=${encodeURIComponent(`/escuelas/${escuela.id}`)}&backLabel=${encodeURIComponent("Volver a escuela")}`);
        }
        handleMenuClose();
    };

    const handleVerHistorial = () => {
        if (activeStudent) {
            const nombre = `${activeStudent.personas.nombre} ${activeStudent.personas.primer_apellido}`;
            const params = new URLSearchParams({
                estudianteId: activeStudent.id,
                nombre,
                backTo: `/escuelas/${escuela.id}`,
                backLabel: "Volver a escuela",
            });
            navigate(`/historial-estudiante?${params.toString()}`);
        }
        handleMenuClose();
    };

    const handleModificarEstudiante = () => {
        if (activeStudent) navigate(`/estudiantes?estudianteId=${activeStudent.id}&edit=true`);
        handleMenuClose();
    };

    const salasUnicas = Array.from(new Set(aulas.map(a => a.sala_id))).map(id => {
        return aulas.find(a => a.sala_id === id)?.sala;
    });

    const handleSalaClick = (salaId: number) => {
        const aulasDeSala = aulas.filter(a => a.sala_id === salaId);
        if (aulasDeSala.length === 1) handleAulaClick(aulasDeSala[0]);
        else { setSelectedSala(salaId); setView("aulas"); }
    };

    const handleAulaClick = async (aula: Aula) => {
        setLoading(true);
        setSelectedAula(aula);
        try {
            const data = await getAulaEstudiantes(aula.id);
            setEstudiantes(data);
            setView("estudiantes");
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const columnBoxStyle = {
        bgcolor: '#f9f9f9',
        borderRadius: 2,
        minHeight: 300,
        overflow: 'hidden'
    };

    return (
        <Box>
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                    <Box>
                        <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>{escuela.nombre}</Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                            Zona: {escuela.zona?.nombre} | Dirección: {escuela.direccion || "No especificada"} | Nivel socioeconómico: {getNivelSocioeconomicoLabel(escuela.nivel_socioeconomico)}
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={onEdit}
                        sx={{ bgcolor: '#5fb878', borderRadius: 2, px: 3, '&:hover': { bgcolor: '#333' } }}
                    >
                        EDITAR ESCUELA
                    </Button>
                </Box>

                <Grid container spacing={3}>
                    {/* COLUMNA 1: DIRECTIVOS */}
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Directivos</Typography>
                        <Box sx={columnBoxStyle}>
                            <List disablePadding>
                                {escuela.directivos?.length > 0 ? (
                                    escuela.directivos.map((dir: any) => (
                                        <ListItem key={dir.id} divider>
                                            <ListItemText
                                                primary={<Typography sx={{ fontWeight: 600 }}>{dir.nombre} {dir.apellido}</Typography>}
                                                secondary="Director"
                                            />
                                        </ListItem>
                                    ))
                                ) : (
                                    <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary', fontStyle: 'italic' }}>
                                        No hay directivos asignados
                                    </Typography>
                                )}
                            </List>
                        </Box>
                    </Grid>

                    {/* COLUMNA 2: DOCENTES */}
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Docentes</Typography>
                        <Box sx={columnBoxStyle}>
                            <List disablePadding>
                                {escuela.profesores?.length > 0 ? (
                                    escuela.profesores.map((prof: any) => (
                                        <ListItem key={prof.id} divider>
                                            <ListItemText
                                                primary={<Typography sx={{ fontWeight: 600 }}>{prof.personas?.nombre} {prof.personas?.primer_apellido}</Typography>}
                                                secondary="Docente"
                                            />
                                        </ListItem>
                                    ))
                                ) : (
                                    <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary', fontStyle: 'italic' }}>
                                        No hay docentes asignados
                                    </Typography>
                                )}
                            </List>
                        </Box>
                    </Grid>

                    {/* COLUMNA 3: SALAS / ESTUDIANTES */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                            {view !== "salas" && (
                                <IconButton size="small" onClick={() => setView(view === "estudiantes" && aulas.filter(a => a.sala_id === selectedAula?.sala_id).length > 1 ? "aulas" : "salas")}>
                                    <ArrowBackIcon fontSize="small" />
                                </IconButton>
                            )}
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                {view === "salas" ? "Salas" : view === "aulas" ? "Comisiones" : `Alumnos: ${selectedAula?.comision}`}
                            </Typography>
                        </Box>

                        <Box sx={columnBoxStyle}>
                            {view === "salas" && (
                                <List disablePadding>
                                    {salasUnicas?.length > 0 ? (
                                        salasUnicas.map((sala) => (
                                            <ListItem key={sala?.id} disablePadding divider>
                                                <ListItemButton onClick={() => handleSalaClick(sala!.id)} sx={{ py: 1.5 }}>
                                                    <ListItemText primary={<Typography sx={{ fontWeight: 500 }}>{sala?.nombre || `Sala de ${sala?.grado}`}</Typography>} />
                                                    <ChevronRightIcon color="action" fontSize="small" />
                                                </ListItemButton>
                                            </ListItem>
                                        ))
                                    ) : (
                                        <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary', fontStyle: 'italic' }}>
                                            No hay salas asignadas
                                        </Typography>
                                    )}
                                </List>
                            )}

                            {view === "aulas" && (
                                <List disablePadding>
                                    {aulas.filter(a => a.sala_id === selectedSala).map((aula) => (
                                        <ListItem key={aula.id} disablePadding divider>
                                            <ListItemButton onClick={() => handleAulaClick(aula)} sx={{ py: 1.5 }}>
                                                <ListItemText
                                                    primary={<Typography sx={{ fontWeight: 600 }}>Comisión {aula.comision}</Typography>}
                                                    secondary={`Turno: ${aula.turno}`}
                                                />
                                                <ChevronRightIcon color="action" fontSize="small" />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </List>
                            )}

                            {view === "estudiantes" && (
                                <List disablePadding>
                                    {loading ? (
                                        <Typography sx={{ p: 2 }}>Cargando...</Typography>
                                    ) : estudiantes.map((est) => (
                                        <ListItem
                                            key={est.id}
                                            divider
                                            secondaryAction={
                                                <IconButton edge="end" onClick={(e) => handleMenuOpen(e, est)}>
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
                                            }
                                        >
                                            <ListItemText
                                                primary={<Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>{est.personas?.primer_apellido}, {est.personas?.nombre}</Typography>}
                                                secondary={`DNI: ${est.personas?.dni}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <Box sx={{ px: 2, py: 1, borderBottom: "1px solid #eee", mb: 1 }}>
                    <Typography variant="caption" color="textSecondary">Opciones</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {activeStudent?.personas.nombre} {activeStudent?.personas.primer_apellido}
                    </Typography>
                </Box>
                <MenuItem onClick={handleEvaluar}><ListItemIcon><AssessmentIcon fontSize="small" /></ListItemIcon> Tomar Evaluación</MenuItem>
                {userRole !== "docente" && (
                    <MenuItem onClick={handleModificarEstudiante}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon> Modificar datos</MenuItem>
                )}
                <MenuItem onClick={handleVerHistorial}><ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon> Ver historial</MenuItem>
            </Menu>
        </Box>
    );
}