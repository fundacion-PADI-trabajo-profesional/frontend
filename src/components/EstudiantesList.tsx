"use client"

import {
    Box,
    List,
    ListItem,
    ListItemText,
    Typography,
    Paper,
    Fab,
    InputAdornment,
    TextField,
    Button,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    Divider,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import SearchIcon from "@mui/icons-material/Search"
import FilterListIcon from "@mui/icons-material/FilterList"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import EditIcon from "@mui/icons-material/Edit"
import VisibilityIcon from "@mui/icons-material/Visibility"
import AssessmentIcon from "@mui/icons-material/Assessment"
import type { Estudiante } from "../api/estudiantes"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

interface EstudiantesListProps {
    estudiantes: Estudiante[]
    onAddEstudiante: () => void // Función para cambiar la vista a "form"
}

/**
 * Componente que renderiza la lista de estudiantes,
 * agrupados por sala, con búsqueda y menú de acciones.
 */
export default function EstudiantesList({ estudiantes, onAddEstudiante }: EstudiantesListProps) {
    const [filtro, setFiltro] = useState("")
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedStudent, setSelectedStudent] = useState<Estudiante | null>(null);
    const navigate = useNavigate();

    // --- Manejo del Menú de Acciones ---
    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, student: Estudiante) => {
        event.stopPropagation(); // Evita que se dispare el click del ListItem
        setAnchorEl(event.currentTarget);
        setSelectedStudent(student);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedStudent(null);
    };

    const handleEvaluar = () => {
        if (selectedStudent) {
            // Navega a evaluaciones, pasando el ID del estudiante seleccionado
            navigate(`/evaluaciones?evaluarAhora=${selectedStudent.id}`)
        }
        handleMenuClose();
    };

    // TODO: Implementar estas acciones
    const handleModificar = () => {
        console.log("Modificar comisión:", selectedStudent?.id)
        handleMenuClose();
    }
    const handleVerMas = () => {
        console.log("Ver más:", selectedStudent?.id)
        handleMenuClose();
    }

    // --- Lógica de Filtro y Agrupación ---
    const estudiantesFiltrados = estudiantes.filter((est) => {
        const nombreCompleto = `${est.personas.nombre || ""} ${est.personas.primer_apellido || ""}`.toLowerCase()
        const dni = est.personas.dni || ""
        return nombreCompleto.includes(filtro.toLowerCase()) || dni.includes(filtro)
    })

    // Agrupa por sala (comisión)
    const estudiantesAgrupados = estudiantesFiltrados.reduce((acc, est) => {
        const salaNombre = est.salas.nombre || "Sin comisión"
        if (!acc[salaNombre]) {
            acc[salaNombre] = []
        }
        acc[salaNombre].push(est)
        return acc
    }, {} as Record<string, Estudiante[]>)

    // Obtiene las claves (nombres de sala) y las ordena
    const salasOrdenadas = Object.keys(estudiantesAgrupados).sort((a, b) => {
        if (a === "Sin comisión") return 1; // "Sin comisión" al final
        if (b === "Sin comisión") return -1;
        return a.localeCompare(b); // Orden alfabético para el resto
    });

    // --- Renderizado ---
    if (estudiantes.length === 0) {
        return (
            <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography variant="h6" sx={{ color: "#999", mb: 2 }}>
                    No hay estudiantes registrados
                </Typography>
                <Typography variant="body2" sx={{ color: "#ccc", mb: 4 }}>
                    Comienza creando un nuevo perfil de estudiante
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onAddEstudiante}
                    sx={{
                        bgcolor: "#000",
                        color: "#fff",
                        textTransform: "none",
                        borderRadius: 2,
                        py: 1,
                        px: 3,
                        "&:hover": { bgcolor: "#333" },
                    }}
                >
                    Crear Estudiante
                </Button>
            </Box>
        )
    }

    return (
        <Box sx={{ position: "relative", pb: 10 }}> {/* Padding-bottom para que el FAB no tape contenido */}

            {/* Controles de Búsqueda y Filtro (sticky) */}
            <Box sx={{
                display: "flex",
                gap: 2,
                mb: 3,
                position: 'sticky',
                top: 0,
                bgcolor: '#f5f5f5', // Mismo color de fondo de la página
                zIndex: 10,
                py: 2
            }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Buscar estudiante por nombre o DNI"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '50px', // Bordes redondeados
                            backgroundColor: '#fff', // Fondo blanco
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            border: 'none' // Sin borde
                        }
                    }}
                />
                <Button
                    variant="outlined"
                    startIcon={<FilterListIcon />}
                    sx={{
                        borderRadius: "50px",
                        borderColor: "#ddd",
                        bgcolor: '#fff',
                        color: "#333",
                        textTransform: "none",
                        px: 3,
                        flexShrink: 0, // Evita que se encoja
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                >
                    Filtrar
                </Button>
            </Box>

            {/* Lista de Estudiantes Agrupada */}
            {salasOrdenadas.map((salaNombre) => (
                <Box key={salaNombre} sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#555', px: 2, mb: 1, textTransform: 'uppercase' }}>
                        {salaNombre}
                    </Typography>
                    <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: 'hidden' }}>
                        <List sx={{ padding: 0 }}>
                            {estudiantesAgrupados[salaNombre].map((est, index) => (
                                <ListItem
                                    key={est.id}
                                    divider={index < estudiantesAgrupados[salaNombre].length - 1}
                                    sx={{
                                        py: 2,
                                        bgcolor: '#fff',
                                        "&:hover": { bgcolor: "#f9f9f9" },
                                        cursor: 'pointer',
                                    }}
                                    onClick={(e) => handleMenuClick(e, est)} // Abre el menú al hacer clic
                                >
                                    <ListItemText
                                        primary={
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {est.personas.primer_apellido}, {est.personas.nombre}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography component="span" variant="body2" color="text.secondary">
                                                DNI {est.personas.dni || "N/A"}
                                            </Typography>
                                        }
                                    />
                                    <IconButton
                                        aria-label="opciones"
                                        onClick={(e) => handleMenuClick(e, est)}
                                    >
                                        <MoreVertIcon />
                                    </IconButton>
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Box>
            ))}

            {/* Menú de Acciones (simula el bottom sheet) */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
                // Configuración para que se parezca más a un Bottom Sheet
                PaperProps={{
                    sx: {
                        width: { xs: '100%', sm: 350 },
                        maxWidth: '100%',
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
                        // Posicionamiento en el fondo
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        margin: 0,
                        // Oculta en pantallas más grandes (sm y más)
                        display: { sm: 'none' },
                    },
                }}
            >
                {/* Título del Menú */}
                {selectedStudent && (
                    <Box sx={{ px: 2, py: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {selectedStudent.personas.primer_apellido}, {selectedStudent.personas.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            DNI {selectedStudent.personas.dni} - {selectedStudent.salas.nombre || "Sin comisión"}
                        </Typography>
                    </Box>
                )}
                <Divider sx={{ mb: 1 }} />
                <MenuItem onClick={handleEvaluar} sx={{ py: 1.5, px: 2 }}>
                    <ListItemIcon><AssessmentIcon fontSize="small" /></ListItemIcon>
                    Evaluar
                </MenuItem>
                <MenuItem onClick={handleModificar} sx={{ py: 1.5, px: 2 }}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                    Modificar comisión
                </MenuItem>
                <MenuItem onClick={handleVerMas} sx={{ py: 1.5, px: 2 }}>
                    <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
                    Ver más
                </MenuItem>
            </Menu>

            {/* Menú de Acciones para Desktop (se oculta en móvil) */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
                PaperProps={{
                    sx: {
                        display: { xs: 'none', sm: 'block' }, // Oculto en XS
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        borderRadius: 2,
                    },
                }}
            >
                {/* Título del Menú */}
                {selectedStudent && (
                    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #eee' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {selectedStudent.personas.primer_apellido}, {selectedStudent.personas.nombre}
                        </Typography>
                    </Box>
                )}
                <MenuItem onClick={handleEvaluar} sx={{ py: 1, px: 2 }}>
                    <ListItemIcon><AssessmentIcon fontSize="small" /></ListItemIcon>
                    Evaluar
                </MenuItem>
                <MenuItem onClick={handleModificar} sx={{ py: 1, px: 2 }}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                    Modificar comisión
                </MenuItem>
                <MenuItem onClick={handleVerMas} sx={{ py: 1, px: 2 }}>
                    <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
                    Ver más
                </MenuItem>
            </Menu>

            {/* Botón Flotante para Añadir */}
            <Fab
                color="primary"
                aria-label="add"
                onClick={onAddEstudiante}
                sx={{
                    position: "fixed",
                    bottom: { xs: 24, md: 40 }, // Más bajo en móvil
                    right: { xs: 24, md: 40 },
                    bgcolor: "#000",
                    color: "#fff",
                    "&:hover": { bgcolor: "#333" },
                }}
            >
                <AddIcon />
            </Fab>
        </Box>
    )
}