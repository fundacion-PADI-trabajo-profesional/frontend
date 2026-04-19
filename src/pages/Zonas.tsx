import { useState } from "react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { createZona, desvincularEncargado, type Zona } from "../api/zonas";
import AsignarEncargadoModal from "../components/AsignarEncargadoModal"; 
import BotonNuevo from "../components/BotonNuevo";
import ZonaForm from "../components/ZonaForm";

interface ZonasViewProps {
    zonas: Zona[];
    onVerEscuelas: (zona: Zona) => void;
    onUpdate: () => Promise<void>;
    setError: (error: string | null) => void;
}

export default function ZonasView({ zonas, onVerEscuelas, onUpdate, setError }: ZonasViewProps) {
    // Estado para crear zona
    const [zonaDialogOpen, setZonaDialogOpen] = useState(false);
    const [savingZona, setSavingZona] = useState(false);
   
    // Estado para tu modal de encargados
    const [encargadoModalOpen, setEncargadoModalOpen] = useState(false);
    const [selectedZonaForEncargado, setSelectedZonaForEncargado] = useState<Zona | null>(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [encargadoToRemove, setEncargadoToRemove] = useState<{ id: string; nombre: string } | null>(null);

    const openCreateZonaDialog = () => {
        setZonaDialogOpen(true);
    };

    const handleCreateZona = async (data: { nombre: string }) => {
        setSavingZona(true);
        setError(null);
        try {
            await createZona(data.nombre.trim());
            setZonaDialogOpen(false);
            await onUpdate();
        } catch (e: any) {
            // Lanzamos el error para que lo ataje el catch de ZonaForm y lo muestre en el TextField
            throw e; 
        } finally {
            setSavingZona(false);
        }
    };

    const openEncargadoModal = (zona: Zona) => {
        setSelectedZonaForEncargado(zona);
        setEncargadoModalOpen(true);
    };

    const handleRemoveClick = (encargadoZonaId: string, nombre: string) => {
        setEncargadoToRemove({ id: encargadoZonaId, nombre });
        setConfirmDeleteOpen(true);
    };

    const confirmRemoveEncargado = async () => {
        if (!encargadoToRemove) return;
        setError(null);
        try {
            await desvincularEncargado(encargadoToRemove.id);
            await onUpdate();
        } catch (e: any) {
            setError(e.message || "Error al quitar encargado");
        } finally {
            setConfirmDeleteOpen(false);
            setEncargadoToRemove(null);
        }
    };

    return (
        <>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <BotonNuevo 
                    texto="Nueva zona" 
                    onClick={openCreateZonaDialog} 
                />
            </Box>
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <Table>
                    <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>Zona</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Encargados</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }} align="center">Escuelas</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }} align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {zonas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                                    No hay zonas registradas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            zonas.map((zona) => {
                                const encargados = zona.encargados || [];
                                return (
                                    <TableRow key={zona.id} hover>
                                        <TableCell>{zona.nombre}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                                {encargados.length > 0 ? (
                                                    encargados.map((enc) => (
                                                        <Chip
                                                            key={enc.id}
                                                            label={`${enc.usuario.nombre} ${enc.usuario.apellido}`}
                                                            onDelete={() =>
                                                                handleRemoveClick(
                                                                    enc.id,
                                                                    `${enc.usuario.nombre} ${enc.usuario.apellido}`
                                                                )
                                                            }
                                                            deleteIcon={<CloseIcon />}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: "rgba(103, 58, 183, 0.1)",
                                                                color: "#673AB7",
                                                                fontWeight: 500,
                                                                "& .MuiChip-deleteIcon": { color: "#673AB7" },
                                                            }}
                                                        />
                                                    ))
                                                ) : (
                                                    <Typography variant="body2" sx={{ color: "#999" }}>
                                                        Sin asignar
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">{zona._count?.escuelas || 0}</TableCell>
                                        <TableCell align="center">
                                            <Button
                                                size="small"
                                                sx={{ textTransform: "none", mr: 1 }}
                                                onClick={() => openEncargadoModal(zona)}
                                            >
                                                Asignar encargado
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                sx={{ textTransform: "none" }}
                                                onClick={() => onVerEscuelas(zona)}
                                            >
                                                Ver escuelas
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Modal para Crear Zona */}
            <Dialog open={zonaDialogOpen} onClose={() => setZonaDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: "bold" }}>Nueva zona</DialogTitle>
                <DialogContent>
                    <ZonaForm 
                        onSubmit={handleCreateZona} 
                        onCancel={() => setZonaDialogOpen(false)} 
                        loading={savingZona} 
                    />
                </DialogContent>
            </Dialog>

            {/* Tu Modal para Asignar Encargado */}
            {selectedZonaForEncargado && (
                <AsignarEncargadoModal
                    open={encargadoModalOpen}
                    onClose={() => setEncargadoModalOpen(false)}
                    zonaId={selectedZonaForEncargado.id}
                    onSuccess={onUpdate}
                />
            )}

            {/* Modal de Confirmación para Quitar Encargado */}
            <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: "bold" }}>Quitar encargado</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro que querés quitar a <strong>{encargadoToRemove?.nombre}</strong> de esta zona?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setConfirmDeleteOpen(false)} color="inherit">
                        Cancelar
                    </Button>
                    <Button 
                        onClick={confirmRemoveEncargado} 
                        variant="contained" 
                        color="error"
                        sx={{ textTransform: "none", fontWeight: "bold" }}
                    >
                        Quitar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}