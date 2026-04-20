import { useState, useEffect } from "react";
import { Box, Button, Typography, Dialog, DialogContent, CircularProgress, TextField, MenuItem, DialogActions, DialogTitle } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EscuelasList from "./EscuelasList";
import EscuelaForm from "./EscuelaForm";
import BotonNuevo from "./BotonNuevo";
import { getEscuelas, type Escuela } from "../api/escuelas";
import { getDirectivos, type Directivo, asignarEscuelaADirectivo } from "../api/directivos";
import { getZonas } from "../api/zonas";
import { getAulas, type Aula } from "../api/aulas"; 

interface Props {
    zonaIdParam?: string | null;
    isEquipoPadi: boolean;
    onVolver: () => void;
    onVerAulas: (escuela: Escuela) => void;
}

export default function EscuelasView({ zonaIdParam, isEquipoPadi, onVolver, onVerAulas }: Props) {
    const [escuelas, setEscuelas] = useState<Escuela[]>([]);
    const [, setAulas] = useState<Aula[]>([]); 
    const [directivos, setDirectivos] = useState<Directivo[]>([]);
    const [zonaNombre, setZonaNombre] = useState("");
    const [loading, setLoading] = useState(true);
    const [, setError] = useState<string | null>(null);

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [directorDialogOpen, setDirectorDialogOpen] = useState(false);
    const [directorEscuelaTarget, setDirectorEscuelaTarget] = useState<Escuela | null>(null);
    const [directorId, setDirectorId] = useState("");
    const [savingDirector, setSavingDirector] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [escData, dirData, zonasData, aulasData] = await Promise.all([
                getEscuelas(),
                getDirectivos(),
                getZonas(),
                getAulas()
            ]);

            let filtered = escData;
            if (zonaIdParam) {
                filtered = escData.filter(e => e.zona?.id === zonaIdParam);
                const zona = zonasData.find(z => z.id === zonaIdParam);
                setZonaNombre(zona?.nombre || "Zona desconocida");
            } else {
                setZonaNombre("Todas las Escuelas");
            }

            setEscuelas(filtered);
            setDirectivos(dirData);
            setAulas(aulasData);
        } catch (e) {
            setError("Error al cargar datos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [zonaIdParam]);

    const handleAssignDirector = async () => {
        if (!directorEscuelaTarget || !directorId) return;
        setSavingDirector(true);
        try {
            await asignarEscuelaADirectivo(directorId, directorEscuelaTarget.id);
            setDirectorDialogOpen(false);
            await fetchData();
        } catch (e) { setError("Error al asignar director"); }
        finally { setSavingDirector(false); }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>;

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={onVolver} sx={{ textTransform: "none", mb: 1, color: "#5c7cfa" }}>
                    Volver
                </Button>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{zonaNombre}</Typography>
                    <BotonNuevo texto="Nueva escuela" onClick={() => setCreateModalOpen(true)} />
                </Box>
            </Box>

            <EscuelasList
                escuelas={escuelas}
                isEquipoPadi={isEquipoPadi}
                onView={onVerAulas}
                onAssignDirector={(esc) => {
                    setDirectorEscuelaTarget(esc);
                    const assigned = directivos.find(d => d.escuela?.id === esc.id);
                    setDirectorId(assigned?.id || "");
                    setDirectorDialogOpen(true);
                }}
            />

            {/* Modales de Crear y Asignar Director */}
            <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} fullWidth maxWidth="md">
                <DialogContent sx={{ p: 0 }}>
                    <EscuelaForm 
                        defaultZonaId={zonaIdParam || undefined} 
                        onCancel={() => setCreateModalOpen(false)} 
                        onSuccess={() => { setCreateModalOpen(false); fetchData(); }} 
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={directorDialogOpen} onClose={() => setDirectorDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 700 }}>Asignar director</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>Escuela: <strong>{directorEscuelaTarget?.nombre}</strong></Typography>
                    <TextField select fullWidth label="Director" value={directorId} onChange={(e) => setDirectorId(e.target.value)}>
                        {directivos.map((d) => (
                            <MenuItem key={d.id} value={d.id}>{d.apellido}, {d.nombre}</MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDirectorDialogOpen(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleAssignDirector} disabled={!directorId || savingDirector}>Guardar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}