import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Container, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
    DialogContent, CircularProgress, Alert, Chip
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PageHeader from "../components/PageHeader";
import ZonaForm from "../components/ZonaForm";
import { getZonas, createZona, type Zona, updateZona } from "../api/zonas";
import EditIcon from "@mui/icons-material/Edit";

export default function Zonas() {
    const [zonas, setZonas] = useState<Zona[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();
    const [editingZona, setEditingZona] = useState<Zona | null>(null);

    const handleEditClick = (zona: Zona) => {
        setEditingZona(zona);
        setModalOpen(true);
    };

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getZonas();
            setZonas(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async (data: { nombre: string }) => {
        setSaving(true);
        try {
            if (editingZona) {
                await updateZona(editingZona.id, data.nombre);
            } else {
                await createZona(data.nombre);
            }
            setModalOpen(false);
            setEditingZona(null); // Limpiar estado
            await loadData();
        } catch (err) {
            throw err;
        } finally {
            setSaving(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <PageHeader
                title="Zonas"
                subtitle="Gestión de regiones geográficas y sus instituciones"
                onAdd={() => setModalOpen(true)}
                addLabel="Nueva Zona"
            />

            {error && <Alert severity="error" sx={{ mb: 3, mt: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} sx={{ mt: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <Table>
                    <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>Nombre de la Zona</TableCell>
                            <TableCell align="center" sx={{ fontWeight: "bold" }}>Escuelas</TableCell>
                            <TableCell align="center" sx={{ fontWeight: "bold" }}>Encargados</TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                                    <CircularProgress sx={{ color: "#A3BE54" }} />
                                </TableCell>
                            </TableRow>
                        ) : zonas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3, color: "#777" }}>
                                    No hay zonas registradas. Comienza creando una.
                                </TableCell>
                            </TableRow>
                        ) : (
                            zonas.map((zona) => (
                                <TableRow key={zona.id} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>{zona.nombre}</TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={`${zona._count?.escuelas || 0} escuelas`}
                                            size="small"
                                            variant="outlined"
                                            sx={{ color: "#2196F3", borderColor: "#2196F3" }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={`${zona._count?.encargados || 0} encargados`}
                                            size="small"
                                            variant="outlined"
                                            sx={{ color: "#673AB7", borderColor: "#673AB7" }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            sx={{ color: "#666", mr: 1 }}
                                            onClick={() => handleEditClick(zona)}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => navigate(`/zonas/${zona.id}`)}
                                            title="Ver detalle de zona"
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={modalOpen} onClose={() => { setModalOpen(false); setEditingZona(null); }}>
                <DialogTitle sx={{ fontWeight: "bold" }}>
                    {editingZona ? "Editar Nombre de Zona" : "Crear Nueva Zona"}
                </DialogTitle>
                <DialogContent>
                    <ZonaForm
                        onSubmit={handleSave}
                        onCancel={() => { setModalOpen(false); setEditingZona(null); }}
                        loading={saving}
                        initialValue={editingZona?.nombre}
                    />
                </DialogContent>
            </Dialog>
        </Container>
    );
}