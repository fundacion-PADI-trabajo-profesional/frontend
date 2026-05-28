import { useEffect, useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, Box,
    Typography, Button, CircularProgress, Alert,
    List, ListItem, ListItemText, ListItemSecondaryAction,
    Divider, TextField, InputAdornment
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { getEscuelasSinZona, asignarEscuela } from "../../api/zonas";

interface Props {
    open: boolean;
    onClose: () => void;
    zonaId: string;
    onSuccess: () => void;
}

export default function AsignarEscuelaModal({ open, onClose, zonaId, onSuccess }: Props) {
    const [escuelas, setEscuelas] = useState<any[]>([]);
    const [filtro, setFiltro] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [assigning, setAssigning] = useState<string | null>(null);

    const loadEscuelas = async () => {
        setLoading(true);
        try {
            const data = await getEscuelasSinZona();
            setEscuelas(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            loadEscuelas();
            setFiltro("");
            setError("");
        }
    }, [open]);

    const handleAsignar = async (escuelaId: string) => {
        setAssigning(escuelaId);
        try {
            // const stored = localStorage.getItem("padiUser");
            // const rol = stored ? JSON.parse(stored).rol : "";

            await asignarEscuela(zonaId, escuelaId);
            onSuccess(); // Refresca la tabla de la página principal
            onClose();   // Cierra el modal
        } catch (err: any) {
            setError(err.message);
        } finally {
            setAssigning(null);
        }
    };

    const escuelasFiltradas = escuelas.filter(e =>
        e.nombre.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: "bold", borderBottom: "1px solid #eee" }}>
                Vincular Escuela a la Zona
            </DialogTitle>
            <DialogContent sx={{ p: 0, minHeight: "400px" }}>
                <Box sx={{ p: 2, bgcolor: "#f9f9f9" }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Buscar escuela por nombre..."
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ bgcolor: "white" }}
                    />
                </Box>

                {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                        <CircularProgress size={30} sx={{ color: "#A3BE54" }} />
                    </Box>
                ) : escuelasFiltradas.length === 0 ? (
                    <Box sx={{ py: 10, textAlign: 'center' }}>
                        <Typography color="textSecondary">
                            {filtro ? "No se encontraron escuelas con ese nombre." : "No hay escuelas disponibles para asignar."}
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ pt: 0 }}>
                        {escuelasFiltradas.map((escuela, index) => (
                            <Box key={escuela.id}>
                                <ListItem sx={{ py: 2 }}>
                                    <ListItemText
                                        primary={escuela.nombre}
                                        secondary={escuela.direccion || "Sin dirección"}
                                        primaryTypographyProps={{ fontWeight: 500 }}
                                    />
                                    <ListItemSecondaryAction>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={assigning === escuela.id ? <CircularProgress size={16} /> : <AddIcon />}
                                            onClick={() => handleAsignar(escuela.id)}
                                            disabled={!!assigning}
                                            sx={{
                                                color: "#A3BE54",
                                                borderColor: "#A3BE54",
                                                '&:hover': { borderColor: "#8da548", bgcolor: "rgba(163, 190, 84, 0.05)" }
                                            }}
                                        >
                                            Asignar
                                        </Button>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < escuelasFiltradas.length - 1 && <Divider />}
                            </Box>
                        ))}
                    </List>
                )}
            </DialogContent>
            <Box sx={{ p: 2, borderTop: "1px solid #eee", textAlign: "right" }}>
                <Button onClick={onClose} sx={{ color: "#666" }}>Cerrar</Button>
            </Box>
        </Dialog>
    );
}