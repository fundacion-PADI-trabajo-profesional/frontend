// src/pages/EncargadosZona.tsx
import { useEffect, useState } from "react";
import {
    Container, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContentText, DialogActions, Button,
    Alert,
    CircularProgress,
    DialogContent
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete"; // Opcional si agregamos borrar despues
import PageHeader from "../components/PageHeader"; // Tu componente existente
import EncargadoForm from "../components/EncargadoZonaForm";
import { getEncargados, createEncargado, type Encargado, type CreateEncargadoDto } from "../api/encargados-zona";
import EditIcon from "@mui/icons-material/Edit";
import { updateEncargado, type UpdateEncargadoDto } from "../api/encargados-zona";
import { deleteEncargado } from "../api/encargados-zona";

export default function EncargadosZona() {
    const [encargados, setEncargados] = useState<Encargado[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingEncargado, setEditingEncargado] = useState<Encargado | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [encargadoToDelete, setEncargadoToDelete] = useState<{ id: string, nombreCompleto: string } | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Cargar datos al iniciar
    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getEncargados();
            setEncargados(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleEditClick = (encargado: Encargado) => {
        setEditingEncargado(encargado);
        setModalOpen(true);
    };

    // Manejar creación
    const handleSave = async (data: any) => {
        setSaving(true);
        try {
            if (editingEncargado) {
                await updateEncargado(editingEncargado.id, data);
            } else {
                await createEncargado(data);
            }
            setModalOpen(false);
            setEditingEncargado(null);
            loadData();
        } catch (err) {
            throw err;
        } finally {
            setSaving(false);
        }
    };

    // Función que se llama al hacer clic en el icono del tachito
    const handleDeleteClick = (id: string, nombreCompleto: string) => {
        setEncargadoToDelete({ id, nombreCompleto });
        setDeleteDialogOpen(true);
    };

    // Función que se ejecuta al confirmar en el dialog
    const handleConfirmDelete = async () => {
        if (!encargadoToDelete) return;

        setDeleting(true);
        try {
            await deleteEncargado(encargadoToDelete.id);
            setDeleteDialogOpen(false);
            setEncargadoToDelete(null);
            loadData(); // Recargar la tabla
        } catch (err: any) {
            setError(err.message);
            setDeleteDialogOpen(false);
        } finally {
            setDeleting(false);
        }
    };

    // Función para cerrar el dialog sin hacer nada
    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setEncargadoToDelete(null);
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Usamos tu componente PageHeader */}
            <PageHeader
                title="Encargados de Zona"
                subtitle="Gestión de usuarios responsables de zona"
                onAdd={() => setModalOpen(true)} // Botón de agregar
                addLabel="Nuevo Encargado"
            />

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <TableContainer component={Paper} sx={{ mt: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <Table>
                    <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>Apellido</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Nombre</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Zona</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : encargados.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3, color: "#777" }}>
                                    No hay encargados registrados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            encargados.map((encargado) => (
                                <TableRow key={encargado.id} hover>
                                    <TableCell>{encargado.apellido}</TableCell>
                                    <TableCell>{encargado.nombre}</TableCell>
                                    <TableCell>{encargado.zona?.nombre || "Sin Zona"}</TableCell>
                                    <TableCell>{encargado.email}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEditClick(encargado)}
                                            sx={{ mr: 1 }}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeleteClick(encargado.id, `${encargado.nombre} ${encargado.apellido}`)} // <-- CAMBIO AQUÍ
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* --- DIALOG DE CONFIRMACIÓN DE ELIMINACIÓN --- */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCloseDeleteDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title" sx={{ fontWeight: 600 }}>
                    {"¿Eliminar encargado?"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Estás a punto de eliminar a <strong>{encargadoToDelete?.nombreCompleto}</strong>.
                        <br /><br />
                        Esta acción es irreversible y eliminará su acceso al sistema. ¿Estás seguro de que deseas continuar?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseDeleteDialog} disabled={deleting} sx={{ color: "#666" }}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        variant="contained"
                        color="error"
                        disabled={deleting}
                        autoFocus
                    >
                        {deleting ? "Eliminando..." : "Sí, eliminar"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL DE CREACIÓN */}
            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingEncargado ? "Editar Encargado" : "Crear Nuevo Encargado"}</DialogTitle>
                <DialogContent>
                    <EncargadoForm
                        onSubmit={handleSave}
                        onCancel={() => setModalOpen(false)}
                        loading={saving}
                        initialValues={editingEncargado} // Pasamos los datos si estamos editando
                    />
                </DialogContent>
            </Dialog>

        </Container>
    );
}