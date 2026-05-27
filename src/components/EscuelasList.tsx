import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, IconButton, Box, Button, Typography
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { type Escuela } from "../api/escuelas";

interface Props {
    escuelas: Escuela[];
    onEdit?: (escuela: Escuela) => void;
    onView: (escuela: Escuela) => void;
}

export default function EscuelasList({ escuelas, onEdit, onView }: Props) {
    
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
                        {/* Centramos los encabezados */}
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
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, alignItems: 'center' }}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            sx={{ textTransform: "none" }}
                                            onClick={() => onView(escuela)}
                                        >
                                            Ver aulas
                                        </Button>

                                        {onEdit && (
                                            <IconButton size="small" onClick={() => onEdit(escuela)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}