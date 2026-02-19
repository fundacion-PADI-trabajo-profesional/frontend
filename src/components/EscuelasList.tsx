import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, IconButton, Tooltip, Box, Chip, Button, Typography
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import { Escuela } from "../api/escuelas";

interface Props {
    escuelas: Escuela[];
    onEdit: (escuela: Escuela) => void;
    onView: (escuela: Escuela) => void;
    isEquipoPadi: boolean;
    onAssignDirector: (escuela: Escuela) => void;
    onRemoveDirector: (directorUserId: string) => void;
}

export default function EscuelasList({
    escuelas,
    onEdit,
    onView,
    isEquipoPadi,
    onAssignDirector,
    onRemoveDirector,
}: Props) {
    return (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <Table>
                <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                    <TableRow>
                        {/* Todas las cabeceras con align="center" */}
                        <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Institución</TableCell>
                        <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Zona</TableCell>
                        <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Director</TableCell>
                        <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Dirección</TableCell>
                        <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Acciones</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {escuelas.map((escuela) => (
                        <TableRow
                            key={escuela.id}
                            hover
                            onClick={() => onView(escuela)}
                            sx={{
                                cursor: "pointer",
                                '&:last-child td, &:last-child th': { border: 0 },
                            }}
                        >
                            {/* Nombre de la institución centrado */}
                            <TableCell align="center" sx={{ fontWeight: 500 }}>
                                {escuela.nombre}
                            </TableCell>

                            {/* Chip de Zona centrado */}
                            <TableCell align="center">
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <Chip
                                        label={escuela.zona?.nombre || "Sin zona"}
                                        size="small"
                                        variant="outlined"
                                        color="primary"
                                        sx={{ fontWeight: 500, borderRadius: '6px' }}
                                    />
                                </Box>
                            </TableCell>

                            <TableCell align="center">
                                {escuela.directivos?.length ? (
                                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 0.5 }}>
                                        <Typography variant="body2">
                                            {`${escuela.directivos[0].nombre} ${escuela.directivos[0].apellido}`}
                                        </Typography>
                                        {isEquipoPadi && (
                                            <IconButton
                                                size="small"
                                                color="error"
                                                title="Quitar director"
                                                onClick={() => onRemoveDirector(escuela.directivos![0].id)}
                                            >
                                                <CloseIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>
                                ) : (
                                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                        Sin asignar
                                    </Typography>
                                )}
                            </TableCell>

                            {/* Dirección centrada */}
                            <TableCell align="center" sx={{ color: "text.secondary" }}>
                                {escuela.direccion || "—"}
                            </TableCell>

                            {/* Iconos de acciones centrados */}
                            <TableCell align="center">
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                    <Tooltip title="Ver detalles y estudiantes">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onView(escuela);
                                            }}
                                            sx={{ color: "#5c7cfa", '&:hover': { bgcolor: "#f0f3ff" } }}
                                        >
                                            <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Editar institución">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(escuela);
                                            }}
                                            sx={{ color: "#444", '&:hover': { bgcolor: "#f5f5f5" } }}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    {isEquipoPadi && (
                                        <Button
                                            size="small"
                                            sx={{ textTransform: "none", ml: 1 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAssignDirector(escuela);
                                            }}
                                        >
                                            {escuela.directivos?.length ? "Cambiar director" : "Asignar director"}
                                        </Button>
                                    )}
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}