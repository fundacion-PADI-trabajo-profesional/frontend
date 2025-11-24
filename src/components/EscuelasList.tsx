import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, IconButton, Chip, Typography, Box
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { Escuela } from "../api/escuelas";

interface Props {
    escuelas: Escuela[];
}

export default function EscuelasList({ escuelas }: Props) {

    const listaEscuelas = Array.isArray(escuelas) ? escuelas : [];

    return (
        <Box>

            <TableContainer component={Paper} sx={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)", borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: "#f9fafb" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>Nombre</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Zona</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Dirección</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Encargado</TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {listaEscuelas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4, color: "#888" }}>
                                    No hay escuelas registradas aún.
                                </TableCell>
                            </TableRow>
                        ) : (
                            listaEscuelas.map((escuela) => (
                                <TableRow key={escuela.id} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>{escuela.nombre}</TableCell>
                                    <TableCell>
                                        <Chip label={escuela.zona} size="small" color="primary" variant="outlined" />
                                    </TableCell>
                                    <TableCell>{escuela.direccion || "-"}</TableCell>
                                    <TableCell>
                                        {escuela.encargado
                                            ? `${escuela.encargado.usuario.nombre} ${escuela.encargado.usuario.apellido}`
                                            : <Typography variant="caption" color="text.secondary">Sin asignar</Typography>
                                        }
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small">
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}