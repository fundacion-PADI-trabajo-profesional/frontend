import {
    Box, List, ListItem, ListItemText, Typography, Paper, IconButton, Menu, MenuItem, ListItemIcon, Tooltip
} from "@mui/material"
import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import AssessmentIcon from "@mui/icons-material/Assessment"
import EditIcon from "@mui/icons-material/Edit"
import VisibilityIcon from "@mui/icons-material/Visibility"
import { useSearchParams } from "react-router-dom"
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import type { Estudiante } from "../../api/estudiantes"
import { getSalas, type Sala } from "../../api/estudiantes"
import { getEscuelas, type Escuela } from "../../api/escuelas"
import { permissions } from "../../utils/permissions"

interface EstudiantesListProps {
    estudiantes: Estudiante[]
    onAddEstudiante: () => void
    onEditEstudiante: (estudiante: Estudiante) => void
    onBulkAdd: () => void
}

export default function EstudiantesList({ estudiantes, onAddEstudiante, onEditEstudiante, onBulkAdd }: EstudiantesListProps) {
    const navigate = useNavigate()
    const [filtroTexto] = useState("")
    const [userRole, setUserRole] = useState<string>("")

    // Filtros de selección
    const [escuelaFiltro] = useState<string>("todas")
    const [salaFiltro] = useState<string>("todas")

    // Datos de selectores
    const [_listaEscuelas, setListaEscuelas] = useState<Escuela[]>([])
    const [_listaSalas, setListaSalas] = useState<Sala[]>([])

    // UI States
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [selectedStudent, setSelectedStudent] = useState<Estudiante | null>(null)

    const [searchParams] = useSearchParams()
    const prefillEstudianteId = searchParams.get("estudianteId")

    useEffect(() => {
        // Si venimos con un ID de estudiante, saltamos directo al formulario
        if (prefillEstudianteId) {
            onAddEstudiante();
        }
    }, [prefillEstudianteId, onAddEstudiante]);

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
                }
            } catch (err) {
                console.log("No se cargaron escuelas por falta de permisos o error")
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
        // 1. Filtrado combinado (texto + escuela + sala)
        const filtrados = estudiantes.filter((est) => {
            const nombreCompleto = `${est.personas.nombre} ${est.personas.primer_apellido} ${est.personas.dni}`.toLowerCase();
            const cumpleTexto = nombreCompleto.includes(filtroTexto.toLowerCase());
            const cumpleEscuela = escuelaFiltro === "todas" || est.escuela?.escuela_id === escuelaFiltro;
            const cumpleSala = salaFiltro === "todas" || est.sala_id === Number(salaFiltro);
            return cumpleTexto && cumpleEscuela && cumpleSala;
        });

        // 2. Agrupación por Sala (Comisión)
        const grupos = filtrados.reduce((acc, est) => {
            const key = est.salas?.nombre || "Sin comisión";
            if (!acc[key]) acc[key] = [];
            acc[key].push(est);
            return acc;
        }, {} as Record<string, Estudiante[]>);

        // 3. Ordenar claves: Por sala_id ascendente, "Sin comisión" al final
        const ordenadas = Object.keys(grupos).sort((a, b) => {
            if (a === "Sin comisión") return 1;
            if (b === "Sin comisión") return -1;

            // Obtener sala_id de los estudiantes en cada grupo
            const salaIdA = filtrados.find(est => est.salas?.nombre === a)?.sala_id || 0;
            const salaIdB = filtrados.find(est => est.salas?.nombre === b)?.sala_id || 0;

            return salaIdA - salaIdB;
        });

        return { agrupados: grupos, salasOrdenadas: ordenadas };
    }, [estudiantes, filtroTexto, escuelaFiltro, salaFiltro]);

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
        <Box sx={{ position: "relative" }}>

            {/* Listado Agrupado */}
            {salasOrdenadas.map((salaNombre) => (
                <Box key={salaNombre} sx={{ mb: 4 }}>
                    {/* <Typography variant="subtitle2" sx={{ color: "#666", mb: 1, fontWeight: 700, textTransform: "uppercase" }}>
                        {salaNombre}
                    </Typography> */}
                    <Paper elevation={0} sx={{ border: "1px solid #eee", borderRadius: 3, overflow: "hidden" }}>
                        <List disablePadding>
                            {agrupados[salaNombre].map((est, index) => (
                                // Modificación de la fila del ListItem:
                                <ListItem
                                    key={est.id}
                                    divider={index < agrupados[salaNombre].length - 1}
                                    secondaryAction={
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            {/* Semáforo de colores basado en evaluaciones_resumen  */}
                                            <Tooltip title={`Inicial: ${getEstadoLabel(est.evaluaciones_resumen?.inicial)}`}>
                                                <Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: getEstadoColor(est.evaluaciones_resumen?.inicial), border: "1px solid #ccc" }} />
                                            </Tooltip>
                                            <Tooltip title={`Cierre: ${getEstadoLabel(est.evaluaciones_resumen?.cierre)}`}>
                                                <Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: getEstadoColor(est.evaluaciones_resumen?.cierre), border: "1px solid #ccc" }} />
                                            </Tooltip>

                                            <IconButton onClick={(e) => handleMenuOpen(e, est)}>
                                                <MoreVertIcon />
                                            </IconButton>
                                        </Box>
                                    }
                                >
                                    <ListItemText
                                        primary={
                                            <Typography sx={{ fontWeight: 600 }}>
                                                {est.personas.primer_apellido}, {est.personas.nombre}
                                            </Typography>
                                        }
                                        secondary={est.personas.dni ? `DNI: ${est.personas.dni}` : "Sin DNI"}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Box>
            ))}

            {/* Mostramos el FAB solo si el usuario tiene permisos para crear estudiantes */}
            {permissions.createEstudiante(userRole) && (
                <SpeedDial
                    ariaLabel="Opciones de agregado"
                    sx={{ position: 'fixed', bottom: 40, right: 40 }}
                    icon={<SpeedDialIcon />}
                >
                    <SpeedDialAction
                        key="Manual"
                        icon={<PersonAddIcon />}
                        tooltipTitle="Crear uno solo"
                        onClick={onAddEstudiante}
                    />
                    <SpeedDialAction
                        key="Bulk"
                        icon={<UploadFileIcon />}
                        tooltipTitle="Carga masiva (Excel)"
                        onClick={onBulkAdd}
                    />
                </SpeedDial>
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