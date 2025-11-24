// src/pages/EncargadosZona.tsx
import { useEffect, useState } from "react";
import {
    Container, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
    DialogContent, CircularProgress, Alert
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete"; // Opcional si agregamos borrar despues
import PageHeader from "../components/PageHeader"; // Tu componente existente
import EncargadoForm from "../components/EncargadoZonaForm";
import { getEncargados, createEncargado, type Encargado, type CreateEncargadoDto } from "../api/encargados-zona";

export default function EncargadosZona() {
    const [encargados, setEncargados] = useState<Encargado[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

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

    // Manejar creación
    const handleCreate = async (data: CreateEncargadoDto) => {
        setSaving(true);
        try {
            await createEncargado(data);
            setModalOpen(false);
            loadData(); // Recargar la tabla
        } catch (err) {
            throw err; // El formulario manejará el error visualmente
        } finally {
            setSaving(false);
        }
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
                                    <TableCell>{encargado.email}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" color="error" disabled>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* MODAL DE CREACIÓN */}
            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Crear Nuevo Encargado</DialogTitle>
                <DialogContent>
                    <EncargadoForm
                        onSubmit={handleCreate}
                        onCancel={() => setModalOpen(false)}
                        loading={saving}
                    />
                </DialogContent>
            </Dialog>

        </Container>
    );
}