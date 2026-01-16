// src/pages/EncargadosZona.tsx
import { useEffect, useState } from "react";
import {
    Container, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContentText, DialogActions, Button,
    Alert, Menu, MenuItem, Checkbox, ListItemText, Divider, Badge,
    CircularProgress,
    DialogContent,
    Box,
    Typography
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete"; // Opcional si agregamos borrar despues
import PageHeader from "../components/PageHeader"; // Tu componente existente
import EncargadoForm from "../components/EncargadoZonaForm";
import { getEncargados, createEncargado, type Encargado, type CreateEncargadoDto } from "../api/encargados-zona";
import EditIcon from "@mui/icons-material/Edit";
import { updateEncargado, type UpdateEncargadoDto } from "../api/encargados-zona";
import { deleteEncargado } from "../api/encargados-zona";
import FilterListIcon from '@mui/icons-material/FilterList';
import { getZonas, type Zona } from "../api/zonas";
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import TextField from '@mui/material/TextField';

export default function EncargadosZona() {
    const [encargados, setEncargados] = useState<Encargado[]>([]);
    const [zonas, setZonas] = useState<Zona[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingEncargado, setEditingEncargado] = useState<Encargado | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [encargadoToDelete, setEncargadoToDelete] = useState<{ id: string, nombreCompleto: string } | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedZones, setSelectedZones] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Cargar datos al iniciar
    const loadData = async () => {
        setLoading(true);
        try {
            const [encData, zonData] = await Promise.all([
                getEncargados(),
                getZonas()
            ]);
            setEncargados(encData);
            setZonas(zonData);
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

    const handleToggleZone = (zonaNombre: string) => {
        setSelectedZones(prev =>
            prev.includes(zonaNombre)
                ? prev.filter(z => z !== zonaNombre)
                : [...prev, zonaNombre]
        );
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

    const encargadosFiltrados = encargados.filter(enc => {
        // 1. Normalizamos el nombre de la zona para la comparación
        // Si enc.zona existe, usamos su nombre; si es null, usamos "Sin Zona"
        const zonaNombreEfectivo = enc.zona?.nombre || "Sin Zona";

        // 2. Verificamos si coincide con los filtros seleccionados
        const matchesZone = selectedZones.length === 0 || selectedZones.includes(zonaNombreEfectivo);

        // 3. Filtro por Buscador (Nombre, Apellido o Email)
        const fullName = `${enc.nombre} ${enc.apellido}`.toLowerCase();
        const matchesSearch =
            fullName.includes(searchTerm.toLowerCase()) ||
            enc.email.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesZone && matchesSearch;
    });

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Usamos tu componente PageHeader */}
            <PageHeader
                title="Encargados de Zona"
                subtitle="Gestión de usuarios responsables de zona"
                onAdd={() => setModalOpen(true)} // Botón de agregar
                addLabel="Nuevo Encargado"
            />

            {/* --- BARRA DE HERRAMIENTAS DE LA TABLA --- */}
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' }, // Responsivo
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                mt: 4,
                mb: 2,
                gap: 2
            }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#444' }}>
                    Lista de Responsables
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
                    {/* BUSCADOR */}
                    <TextField
                        size="small"
                        placeholder="Buscar encargado..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ bgcolor: '#fff', borderRadius: '8px', minWidth: '250px' }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#999' }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* FILTRO POR ZONA */}
                    <Badge badgeContent={selectedZones.length} color="primary">
                        <Button
                            startIcon={<FilterListIcon />}
                            onClick={(e) => setAnchorEl(e.currentTarget)}
                            variant="outlined"
                            sx={{
                                color: '#666',
                                borderColor: '#ccc',
                                textTransform: 'none',
                                fontWeight: 500,
                                borderRadius: '8px',
                                height: '40px',
                                bgcolor: selectedZones.length > 0 ? '#f0f4ff' : 'transparent'
                            }}
                        >
                            {selectedZones.length > 0 ? `Zonas (${selectedZones.length})` : "Zonas"}
                        </Button>
                    </Badge>
                </Box>
            </Box>

            <TableContainer component={Paper} sx={{ mt: 3, borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <Table>
                    <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                        <TableRow>
                            <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Apellido</TableCell>
                            <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Nombre</TableCell>
                            <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Zona</TableCell>
                            <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Email</TableCell>
                            <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : encargadosFiltrados.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3, color: "#777" }}>
                                    {selectedZones.length > 0
                                        ? "No hay encargados en las zonas seleccionadas."
                                        : "No hay encargados registrados."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            encargadosFiltrados.map((encargado) => (
                                <TableRow key={encargado.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell align="center">{encargado.apellido}</TableCell>
                                    <TableCell align="center">{encargado.nombre}</TableCell>
                                    <TableCell align="center">{encargado.zona?.nombre || "Sin Zona"}</TableCell>
                                    <TableCell align="center">{encargado.email}</TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                            <IconButton size="small" onClick={() => handleEditClick(encargado)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteClick(encargado.id, `${encargado.nombre} ${encargado.apellido}`)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
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

            {/* --- MENÚ DESPLEGABLE DE FILTRO --- */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{ sx: { width: 220, borderRadius: '12px', mt: 1 } }}
            >
                <MenuItem onClick={() => setSelectedZones([])} sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    Limpiar Filtros
                </MenuItem>
                <Divider />

                {/* Opción para Sin Zona */}
                <MenuItem onClick={() => handleToggleZone("Sin Zona")}>
                    <Checkbox checked={selectedZones.includes("Sin Zona")} size="small" />
                    <ListItemText primary="Sin Zona" />
                </MenuItem>

                {/* Zonas dinámicas */}
                {zonas.map((zona) => (
                    <MenuItem key={zona.id} onClick={() => handleToggleZone(zona.nombre)}>
                        <Checkbox checked={selectedZones.includes(zona.nombre)} size="small" />
                        <ListItemText primary={zona.nombre} />
                    </MenuItem>
                ))}
            </Menu>

        </Container>

    );
}