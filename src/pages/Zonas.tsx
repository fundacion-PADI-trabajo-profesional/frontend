import { useState } from "react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { createZona, deleteZona, desvincularEncargado, type Zona } from "../api/zonas";
import AsignarEncargadoModal from "../components/escuelas/AsignarEncargadoModal";
import BotonNuevo from "../components/common/BotonNuevo";
import ZonaForm from "../components/forms/ZonaForm";

interface ZonasProps {
    zonas: Zona[];
    onVerEscuelas: (zona: Zona) => void;
    onUpdate: () => Promise<void>;
    setError: (error: string | null) => void;
}

export default function Zonas({ zonas, onVerEscuelas, onUpdate, setError }: ZonasProps) {
    // Estado para crear zona
    const [zonaDialogOpen, setZonaDialogOpen] = useState(false);
    const [savingZona, setSavingZona] = useState(false);

    // Estado para el modal de encargados
    const [encargadoModalOpen, setEncargadoModalOpen] = useState(false);
    const [selectedZonaForEncargado, setSelectedZonaForEncargado] = useState<Zona | null>(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [encargadoToRemove, setEncargadoToRemove] = useState<{ id: string; nombre: string } | null>(null);

    const [confirmDeleteZonaOpen, setConfirmDeleteZonaOpen] = useState(false);
    const [zonaToDelete, setZonaToDelete] = useState<Zona | null>(null);
    const [deletingZona, setDeletingZona] = useState(false);

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

    const handleDeleteZonaClick = (zona: Zona) => {
        setZonaToDelete(zona);
        setConfirmDeleteZonaOpen(true);
    };

    const confirmDeleteZona = async () => {
        if (!zonaToDelete) return;
        setDeletingZona(true);
        setError(null);
        try {
            await deleteZona(zonaToDelete.id);
            await onUpdate();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Error al eliminar zona");
        } finally {
            setDeletingZona(false);
            setConfirmDeleteZonaOpen(false);
            setZonaToDelete(null);
        }
    };

    const confirmRemoveEncargado = async () => {
        if (!encargadoToRemove) return;
        setError(null);
        try {
            await desvincularEncargado(encargadoToRemove.id);
            await onUpdate();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Error al quitar encargado");
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
                            <TableCell sx={{ fontWeight: "bold", width: "20%" }}>Zona</TableCell>
                            <TableCell sx={{ fontWeight: "bold", width: "35%" }}>Encargados</TableCell>
                            <TableCell sx={{ fontWeight: "bold", width: "22%" }} align="center">Gestión</TableCell>
                            <TableCell sx={{ fontWeight: "bold", width: "18%" }} align="center">Más Acciones</TableCell>
                            <TableCell sx={{ width: "5%" }} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {zonas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
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
                                        <TableCell align="center">
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                sx={{ textTransform: "none" }}
                                                onClick={() => openEncargadoModal(zona)}
                                            >
                                                Asignar encargado
                                            </Button>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                sx={{ textTransform: "none" }}
                                                onClick={() => onVerEscuelas(zona)}
                                            >
                                                Ver escuelas ({zona._count?.escuelas || 0})
                                            </Button>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Eliminar zona">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteZonaClick(zona)}
                                                >
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
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

            {/* Modal de Confirmación para Eliminar Zona */}
            <Dialog open={confirmDeleteZonaOpen} onClose={() => !deletingZona && setConfirmDeleteZonaOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: "bold", color: "error.main", display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <WarningAmberIcon /> Eliminar zona
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>
                        ¿Estás seguro que querés eliminar la zona <strong>"{zonaToDelete?.nombre}"</strong>? Esta acción no se puede deshacer.
                    </Typography>
                    {((zonaToDelete?._count?.escuelas ?? 0) > 0 || (zonaToDelete?._count?.encargados ?? 0) > 0) && (
                        <Box sx={{ bgcolor: "error.50", border: "1px solid", borderColor: "error.200", borderRadius: 1, p: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                Al eliminar esta zona también se desvinculará:
                            </Typography>
                            {(zonaToDelete?._count?.escuelas ?? 0) > 0 && (
                                <Typography variant="body2">
                                    • <strong>{zonaToDelete?._count?.escuelas}</strong> escuela{(zonaToDelete?._count?.escuelas ?? 0) !== 1 ? "s" : ""} asignada{(zonaToDelete?._count?.escuelas ?? 0) !== 1 ? "s" : ""} (quedarán sin zona)
                                </Typography>
                            )}
                            {(zonaToDelete?._count?.encargados ?? 0) > 0 && (
                                <Typography variant="body2">
                                    • <strong>{zonaToDelete?._count?.encargados}</strong> encargado{(zonaToDelete?._count?.encargados ?? 0) !== 1 ? "s" : ""} asignado{(zonaToDelete?._count?.encargados ?? 0) !== 1 ? "s" : ""} (quedarán sin zona)
                                </Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setConfirmDeleteZonaOpen(false)} color="inherit" disabled={deletingZona}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={confirmDeleteZona}
                        variant="contained"
                        color="error"
                        disabled={deletingZona}
                        sx={{ textTransform: "none", fontWeight: "bold" }}
                    >
                        {deletingZona ? "Eliminando..." : "Sí, eliminar zona"}
                    </Button>
                </DialogActions>
            </Dialog>

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