"use client"

import {
    Box, List, ListItem, ListItemText, Typography, Paper, Fab, InputAdornment,
    TextField, Button, IconButton, Menu, MenuItem, ListItemIcon,
    Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select
} from "@mui/material"
import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import AddIcon from "@mui/icons-material/Add"
import SearchIcon from "@mui/icons-material/Search"
import FilterListIcon from "@mui/icons-material/FilterList"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import AssessmentIcon from "@mui/icons-material/Assessment"
import EditIcon from "@mui/icons-material/Edit"
import VisibilityIcon from "@mui/icons-material/Visibility"
import { useSearchParams } from "react-router-dom"

import type { Estudiante } from "../api/estudiantes"
import { getSalas, type Sala } from "../api/estudiantes"
import { getEscuelas, type Escuela } from "../api/escuelas"
import { permissions } from "../utils/permissions"

interface EstudiantesListProps {
    estudiantes: Estudiante[]
    onAddEstudiante: () => void
    onEditEstudiante: (estudiante: Estudiante) => void
}

export default function EstudiantesList({ estudiantes, onAddEstudiante, onEditEstudiante }: EstudiantesListProps) {
    const navigate = useNavigate()
    const [filtroTexto, setFiltroTexto] = useState("")
    const [userRole, setUserRole] = useState<string>("")

    // Filtros de selección
    const [escuelaFiltro, setEscuelaFiltro] = useState<string>("todas")
    const [salaFiltro, setSalaFiltro] = useState<string>("todas")

    // Datos de selectores
    const [listaEscuelas, setListaEscuelas] = useState<Escuela[]>([])
    const [listaSalas, setListaSalas] = useState<Sala[]>([])
    const [puedeVerEscuelas, setPuedeVerEscuelas] = useState(false)

    // UI States
    const [openFilterDialog, setOpenFilterDialog] = useState(false)
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [selectedStudent, setSelectedStudent] = useState<Estudiante | null>(null)

    const [tabValue, setTabValue] = useState(0)
    const [searchParams] = useSearchParams()
    const prefillEstudianteId = searchParams.get("estudianteId")

    useEffect(() => {
        // Si venimos con un ID de estudiante, saltamos directo al formulario
        if (prefillEstudianteId) {
            setTabValue(1);
        }
    }, [prefillEstudianteId]);

    useEffect(() => {
        const loadInitialData = async () => {
            const stored = localStorage.getItem("padiUser")
            const user = stored ? JSON.parse(stored) : null
            if (user) setUserRole(user.rol)

            try {
                // Intentamos cargar escuelas. Si falla por permisos, el catch lo maneja. 
                const [salasData] = await Promise.all([getSalas()])
                setListaSalas(salasData)

                // Solo intentamos cargar escuelas si el rol tiene permisos 
                if (user?.rol === "equipo_padi" || user?.rol === "encargado_zona") {
                    const escuelasData = await getEscuelas()
                    setListaEscuelas(escuelasData)
                    setPuedeVerEscuelas(true)
                }
            } catch (err) {
                console.log("No se cargaron escuelas por falta de permisos o error")
                setPuedeVerEscuelas(false)
            }
        }
        loadInitialData()
    }, [])

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedStudent(null);
    };

    const handleEvaluar = () => {
        if (selectedStudent) {
            navigate(`/evaluaciones?estudianteId=${selectedStudent.id}&nombre=${encodeURIComponent(`${selectedStudent.personas.nombre} ${selectedStudent.personas.primer_apellido}`)}&salaId=${selectedStudent.sala_id}&backTo=${encodeURIComponent("/estudiantes")}&backLabel=${encodeURIComponent("Volver a estudiantes")}`);
        }
        handleMenuClose();
    };

    const handleVerMas = () => {
        if (selectedStudent) {
            const nombre = `${selectedStudent.personas.nombre} ${selectedStudent.personas.primer_apellido}`;
            const params = new URLSearchParams({
                estudianteId: selectedStudent.id,
                nombre,
                backTo: "/estudiantes",
                backLabel: "Volver a estudiantes",
            });
            navigate(`/historial-estudiante?${params.toString()}`);
        }
        handleMenuClose();
    };

    const handleModificar = () => {
        if (selectedStudent) {
            // Cambiamos la vista a "form" y pasamos el estudiante a editar
            // Si usas el estado 'view' en Estudiantes.tsx, asegúrate de pasarle el objeto
            onEditEstudiante(selectedStudent);
        }
        handleMenuClose();
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, estudiante: Estudiante) => {
        setAnchorEl(event.currentTarget)
        setSelectedStudent(estudiante)
    }

    const { agrupados, salasOrdenadas } = useMemo(() => {
        // 1. Filtrado por texto
        const filtrados = estudiantes.filter((est) => {
            const nombreCompleto = `${est.personas.nombre} ${est.personas.primer_apellido} ${est.personas.dni}`.toLowerCase();
            return nombreCompleto.includes(filtroTexto.toLowerCase());
        });

        // 2. Agrupación por Sala (Comisión)
        const grupos = filtrados.reduce((acc, est) => {
            const key = est.salas?.nombre || "Sin comisión";
            if (!acc[key]) acc[key] = [];
            acc[key].push(est);
            return acc;
        }, {} as Record<string, Estudiante[]>);

        // 3. Ordenar claves: Alfabético y "Sin comisión" al final
        const ordenadas = Object.keys(grupos).sort((a, b) => {
            if (a === "Sin comisión") return 1;
            if (b === "Sin comisión") return -1;
            return a.localeCompare(b);
        });

        return { agrupados: grupos, salasOrdenadas: ordenadas };
    }, [estudiantes, filtroTexto]);

    const estudiantesFiltrados = useMemo(() => {
        return estudiantes.filter((est) => {
            const cumpleTexto = `${est.personas.nombre} ${est.personas.primer_apellido} ${est.personas.dni}`
                .toLowerCase().includes(filtroTexto.toLowerCase())
            const cumpleEscuela = escuelaFiltro === "todas" || est.escuela.escuela_id === escuelaFiltro
            const cumpleSala = salaFiltro === "todas" || est.sala_id === Number(salaFiltro)
            return cumpleTexto && cumpleEscuela && cumpleSala
        })
    }, [estudiantes, filtroTexto, escuelaFiltro, salaFiltro])

    const resetFiltros = () => {
        setEscuelaFiltro("todas")
        setSalaFiltro("todas")
    }

    return (
        <Box sx={{ position: "relative", pb: 10 }}>
            {/* Buscador y Botón Filtrar */}
            <Box sx={{ display: "flex", gap: 2, mb: 4, alignItems: "center" }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Buscar estudiante..."
                    value={filtroTexto}
                    onChange={(e) => setFiltroTexto(e.target.value)}
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
                        sx: { borderRadius: 3, bgcolor: "#fff" }
                    }}
                />
                <Button
                    variant={escuelaFiltro !== "todas" || salaFiltro !== "todas" ? "contained" : "outlined"}
                    startIcon={<FilterListIcon />}
                    onClick={() => setOpenFilterDialog(true)}
                    sx={{ borderRadius: 3, height: "56px", px: 3, textTransform: "none", fontWeight: 600 }}
                >
                    Filtrar
                </Button>
            </Box>

            {/* Diálogo de Filtros Dinámico */}
            <Dialog open={openFilterDialog} onClose={() => setOpenFilterDialog(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 700 }}>Opciones de Filtro</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>

                        {/* FILTRO DE ESCUELAS: Solo se muestra si tiene permisos  */}
                        {puedeVerEscuelas && (
                            <FormControl fullWidth variant="filled">
                                <InputLabel>Institución / Escuela</InputLabel>
                                <Select value={escuelaFiltro} onChange={(e) => setEscuelaFiltro(e.target.value)}>
                                    <MenuItem value="todas">Todas las instituciones</MenuItem>
                                    {listaEscuelas.map((esc) => (
                                        <MenuItem key={esc.id} value={esc.id}>{esc.nombre}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {/* FILTRO DE SALAS: Siempre visible */}
                        <FormControl fullWidth variant="filled">
                            <InputLabel>Sala / Comisión</InputLabel>
                            <Select value={salaFiltro} onChange={(e) => setSalaFiltro(e.target.value)}>
                                <MenuItem value="todas">Todas las salas</MenuItem>
                                {listaSalas.map((s) => (
                                    <MenuItem key={s.id} value={String(s.id)}>{s.nombre}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={resetFiltros}>Limpiar</Button>
                    <Button variant="contained" onClick={() => setOpenFilterDialog(false)} sx={{ bgcolor: '#000' }}>
                        Ver resultados
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Listado Agrupado */}
            {salasOrdenadas.map((salaNombre) => (
                <Box key={salaNombre} sx={{ mb: 4 }}>
                    <Typography variant="subtitle2" sx={{ color: "#666", mb: 1, fontWeight: 700, textTransform: "uppercase" }}>
                        {salaNombre}
                    </Typography>
                    <Paper elevation={0} sx={{ border: "1px solid #eee", borderRadius: 3, overflow: "hidden" }}>
                        <List disablePadding>
                            {agrupados[salaNombre].map((est, index) => (
                                <ListItem
                                    key={est.id}
                                    divider={index < agrupados[salaNombre].length - 1}
                                    secondaryAction={
                                        <IconButton edge="end" onClick={(e) => handleMenuOpen(e, est)}>
                                            <MoreVertIcon />
                                        </IconButton>
                                    }
                                >
                                    <ListItemText
                                        primary={<Typography sx={{ fontWeight: 600 }}>{est.personas.primer_apellido}, {est.personas.nombre}</Typography>}
                                        secondary={`DNI: ${est.personas.dni}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Box>
            ))}

            {/* Mostramos el FAB solo si el usuario tiene permisos para crear estudiantes */}
            {permissions.createEstudiante(userRole) && (
                <Fab
                    color="primary"
                    onClick={onAddEstudiante}
                    sx={{ position: "fixed", bottom: 40, right: 40, bgcolor: "#000" }}
                >
                    <AddIcon />
                </Fab>
            )}

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <Box sx={{ px: 2, py: 1, borderBottom: "1px solid #eee", mb: 1 }}>
                    <Typography variant="caption" color="textSecondary">Estudiante</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {selectedStudent?.personas.primer_apellido}, {selectedStudent?.personas.nombre}
                    </Typography>
                </Box>

                <MenuItem onClick={handleEvaluar} sx={{ py: 1, px: 2 }}>
                    <ListItemIcon><AssessmentIcon fontSize="small" /></ListItemIcon>
                    Evaluar
                </MenuItem>

                {userRole !== "docente" && (
                    <MenuItem onClick={handleModificar}>
                        <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                        Modificar datos
                    </MenuItem>
                )}

                <MenuItem onClick={handleVerMas} sx={{ py: 1, px: 2 }}>
                    <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
                    Ver historial
                </MenuItem>
            </Menu>
        </Box>
    )
}