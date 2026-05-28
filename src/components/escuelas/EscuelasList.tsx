import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, IconButton, Box, Button, Typography
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { type Escuela } from "../../api/escuelas";

interface Props {
    escuelas: Escuela[];
    onDetalle?: (escuela: Escuela) => void;
    onView: (escuela: Escuela) => void;
}

export default function EscuelasList({ escuelas, onDetalle, onView }: Props) {

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
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, alignItems: 'center' }}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            sx={{ textTransform: "none" }}
                                            onClick={() => onView(escuela)}
                                        >
                                            Ver aulas
                                        </Button>

                                        {onDetalle && (
                                            <IconButton size="small" onClick={() => onDetalle(escuela)} title="Ver detalle">
                                                <VisibilityIcon fontSize="small" />
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
