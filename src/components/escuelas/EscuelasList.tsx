import { useState } from "react";
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Button, Typography, Menu, MenuItem, ListItemIcon
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import { type Escuela } from "../../api/escuelas";

interface Props {
    escuelas: Escuela[];
    onView: (escuela: Escuela) => void;
    onDetalle?: (escuela: Escuela) => void;
    onEditar?: (escuela: Escuela) => void;
}

export default function EscuelasList({ escuelas, onView, onDetalle, onEditar }: Props) {
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [menuEscuela, setMenuEscuela] = useState<Escuela | null>(null);

    const handleOpenMenu = (e: React.MouseEvent<HTMLElement>, escuela: Escuela) => {
        e.stopPropagation();
        setMenuAnchor(e.currentTarget);
        setMenuEscuela(escuela);
    };

    const handleCloseMenu = () => {
        setMenuAnchor(null);
        setMenuEscuela(null);
    };

    const escuelaDirectorName = (escuela: Escuela) => {
        if (!escuela.directivos?.length) return "Sin director asignado";
        const d = escuela.directivos[0];
        return `${d.nombre} ${d.apellido}`;
    };

    return (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <Table>
                <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                    <TableRow>
                        <TableCell align="center" sx={{ fontWeight: "bold" }}>Escuela</TableCell>
                        <TableCell align="center" sx={{ fontWeight: "bold" }}>Director</TableCell>
                        <TableCell align="center" sx={{ fontWeight: "bold" }}>Acciones</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {escuelas.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ py: 8 }}>
                                <Typography variant="body1" sx={{ color: "#666", fontStyle: "italic" }}>
                                    No hay escuelas registradas en esta zona.
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ) : (
                        escuelas.map((escuela) => (
                            <TableRow key={escuela.id} hover>
                                <TableCell align="center" sx={{ fontWeight: 500 }}>
                                    {escuela.nombre}
                                </TableCell>
                                <TableCell align="center">
                                    {escuelaDirectorName(escuela)}
                                </TableCell>
                                <TableCell align="center">
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        endIcon={<KeyboardArrowDownIcon />}
                                        onClick={(e) => handleOpenMenu(e, escuela)}
                                        sx={{ textTransform: "none" }}
                                    >
                                        Acciones
                                    </Button>

                                    <Menu
                                        anchorEl={menuAnchor}
                                        open={Boolean(menuAnchor) && menuEscuela?.id === escuela.id}
                                        onClose={handleCloseMenu}
                                    >
                                        <MenuItem onClick={() => { handleCloseMenu(); onView(escuela); }}>
                                            <ListItemIcon><MeetingRoomIcon fontSize="small" /></ListItemIcon>
                                            Ver aulas
                                        </MenuItem>
                                        {onDetalle && (
                                            <MenuItem onClick={() => { handleCloseMenu(); onDetalle(escuela); }}>
                                                <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
                                                Ver detalles
                                            </MenuItem>
                                        )}
                                        {onEditar && (
                                            <MenuItem onClick={() => { handleCloseMenu(); onEditar(escuela); }}>
                                                <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                                                Editar escuela
                                            </MenuItem>
                                        )}
                                    </Menu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}