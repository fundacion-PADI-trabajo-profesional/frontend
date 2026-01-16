import { useEffect, useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, Box,
    Typography, Button, CircularProgress, Alert,
    List, ListItem, ListItemText, ListItemSecondaryAction,
    Divider, TextField, InputAdornment
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { getEncargadosSinZona, asignarEncargadoAZona } from "../api/zonas";

interface Props {
    open: boolean;
    onClose: () => void;
    zonaId: string;
    onSuccess: () => void;
}

export default function AsignarEncargadoModal({ open, onClose, zonaId, onSuccess }: Props) {
    const [encargados, setEncargados] = useState<any[]>([]);
    const [filtro, setFiltro] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [assigningId, setAssigningId] = useState<string | null>(null);

    const loadEncargados = async () => {
        setLoading(true);
        try {
            const data = await getEncargadosSinZona();
            setEncargados(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            loadEncargados();
            setFiltro("");
        }
    }, [open]);

    const handleAsignar = async (encargadoId: string) => {
        setAssigningId(encargadoId);
        try {
            await asignarEncargadoAZona(zonaId, encargadoId);
            onSuccess(); // Refresca la vista de fondo para ver al nuevo encargado
            // Filtramos localmente para que desaparezca de la lista de "disponibles"
            setEncargados(prev => prev.filter(e => e.id !== encargadoId));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setAssigningId(null);
        }
    };

    const filtrados = encargados.filter(e =>
        `${e.usuario.nombre} ${e.usuario.apellido}`.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: "bold" }}>Asignar Encargados a la Zona</DialogTitle>
            <DialogContent sx={{ p: 0, minHeight: "350px" }}>
                <Box sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Buscar por nombre o apellido..."
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress size={30} sx={{ color: "#A3BE54" }} />
                    </Box>
                ) : filtrados.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                        <Typography color="textSecondary">No hay encargados disponibles.</Typography>
                    </Box>
                ) : (
                    <List>
                        {filtrados.map((enc, index) => (
                            <Box key={enc.id}>
                                <ListItem>
                                    <ListItemText
                                        primary={`${enc.usuario.nombre} ${enc.usuario.apellido}`}
                                        secondary={enc.usuario.email}
                                    />
                                    <ListItemSecondaryAction>
                                        <Button
                                            size="small"
                                            startIcon={assigningId === enc.id ? <CircularProgress size={14} /> : <PersonAddIcon />}
                                            onClick={() => handleAsignar(enc.id)}
                                            disabled={!!assigningId}
                                            sx={{ color: "#673AB7" }}
                                        >
                                            Asignar
                                        </Button>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < filtrados.length - 1 && <Divider />}
                            </Box>
                        ))}
                    </List>
                )}
            </DialogContent>
            <Box sx={{ p: 2, textAlign: "right", borderTop: "1px solid #eee" }}>
                <Button onClick={onClose}>Finalizar</Button>
            </Box>
        </Dialog>
    );
}