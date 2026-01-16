import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Container, Box, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Alert, IconButton, Typography, Divider
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PageHeader from "../components/PageHeader";
import { desvincularEscuela, getZonaById } from "../api/zonas";
import AsignarEscuelaModal from "../components/AsignarEscuelaModal";
import AsignarEncargadoModal from "../components/AsignarEncargadoModal";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Chip } from "@mui/material";
import { desvincularEncargado } from "../api/zonas";

export default function ZonaDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [zona, setZona] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalEscuelaOpen, setModalEscuelaOpen] = useState(false);
    const [modalEncargadoOpen, setModalEncargadoOpen] = useState(false);

    const handleDesvincular = async (escuelaId: string, nombreEscuela: string) => {
        if (!window.confirm(`¿Estás seguro de quitar a la escuela "${nombreEscuela}" de esta zona?`)) {
            return;
        }

        try {
            await desvincularEscuela(escuelaId);
            await loadData(); // Recargamos la tabla para que desaparezca
        } catch (err: any) {
            alert(err.message);
        }
    };

    const loadData = async () => {
        if (!id) return;
        try {
            const data = await getZonaById(id);
            setZona(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [id]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress sx={{ color: "#A3BE54" }} />
        </Box>
    );

    if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;

    const nombresEncargados = zona.encargados?.length > 0
        ? zona.encargados.map((e: any) => `${e.usuario.nombre} ${e.usuario.apellido}`).join(", ")
        : "Sin encargados asignados";

    const handleDesvincularEncargado = async (encargadoId: string, nombre: string) => {
        if (!window.confirm(`¿Deseas quitar a ${nombre} como encargado de esta zona?`)) return;

        try {
            await desvincularEncargado(encargadoId);
            await loadData(); // Refrescar para ver los cambios
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>

            {/* Encabezado Principal con Gestión de Encargados */}
            <PageHeader
                title={`Zona ${zona.nombre}`}
                subtitle={
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        <Typography variant="body2" sx={{ color: "#666", mr: 1 }}>
                            Encargados:
                        </Typography>

                        {zona.encargados?.length > 0 ? (
                            zona.encargados.map((enc: any) => (
                                <Chip
                                    key={enc.id}
                                    label={`${enc.usuario.nombre} ${enc.usuario.apellido}`}
                                    onDelete={() => handleDesvincularEncargado(enc.id, enc.usuario.nombre)}
                                    size="small"
                                    sx={{
                                        bgcolor: "rgba(103, 58, 183, 0.1)",
                                        color: "#673AB7",
                                        fontWeight: 500,
                                        '& .MuiChip-deleteIcon': { color: '#673AB7' }
                                    }}
                                />
                            ))
                        ) : (
                            <Typography variant="body2" sx={{ color: "#999", fontStyle: "italic" }}>
                                Sin encargados asignados
                            </Typography>
                        )}

                        <IconButton
                            size="small"
                            onClick={() => setModalEncargadoOpen(true)}
                            sx={{ color: "#673AB7", ml: 1 }}
                        >
                            <AddCircleOutlineIcon fontSize="small" />
                        </IconButton>
                    </Box>
                }
                onAdd={() => setModalEscuelaOpen(true)}
                addLabel="Agregar Escuela"
            />

            {/* Sección de Escuelas */}
            <Box sx={{ mt: 5, mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: "#444" }}>
                    Escuelas Instituidas
                </Typography>
                <Divider sx={{ mt: 1, mb: 3 }} />
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)", borderRadius: "8px" }}>
                <Table>
                    <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: "bold", color: "#666" }}>Nombre de la Institución</TableCell>
                            <TableCell sx={{ fontWeight: "bold", color: "#666" }}>Dirección</TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold", color: "#666" }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {zona.escuelas?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} align="center" sx={{ py: 6, color: "#999", fontStyle: "italic" }}>
                                    Aún no hay escuelas vinculadas a esta zona.
                                </TableCell>
                            </TableRow>
                        ) : (
                            zona.escuelas.map((escuela: any) => (
                                <TableRow key={escuela.id} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>{escuela.nombre}</TableCell>
                                    <TableCell>{escuela.direccion || "Dirección no especificada"}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            title="Desvincular de la zona"
                                            onClick={() => handleDesvincular(escuela.id, escuela.nombre)}
                                        >
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* --- Modales de Gestión --- */}

            {/* Modal para Vincular Escuelas */}
            {id && (
                <AsignarEscuelaModal
                    open={modalEscuelaOpen}
                    onClose={() => setModalEscuelaOpen(false)}
                    zonaId={id}
                    onSuccess={loadData}
                />
            )}

            {/* Modal para Asignar Encargados */}
            {id && (
                <AsignarEncargadoModal
                    open={modalEncargadoOpen}
                    onClose={() => setModalEncargadoOpen(false)}
                    zonaId={id}
                    onSuccess={loadData}
                />
            )}

        </Container>
    );
}