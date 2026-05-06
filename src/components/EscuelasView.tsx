import { useState, useEffect, useMemo } from "react";
import { Box, Button, Typography, Dialog, DialogContent, CircularProgress, TextField, MenuItem, DialogActions, DialogTitle, InputAdornment } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import EscuelasList from "./EscuelasList";
import EscuelaForm from "./EscuelaForm";
import BotonNuevo from "./BotonNuevo";
import { getEscuelas, type Escuela } from "../api/escuelas";
import { getDirectivos, type Directivo, asignarEscuelaADirectivo } from "../api/directivos";
import { getZonas } from "../api/zonas";
import { getAulas, type Aula } from "../api/aulas"; 
import { BuscadorPadi } from "./SearchBar";

interface Props {
    zonaIdParam?: string | null;
    isEquipoPadi: boolean;
    onVolver: () => void;
    onVerAulas: (escuela: Escuela) => void;
    showBack?: boolean; 
    showTitle?: boolean;
}

export default function EscuelasView({ zonaIdParam, isEquipoPadi, onVolver, onVerAulas, showBack, showTitle }: Props) {
    const [escuelas, setEscuelas] = useState<Escuela[]>([]);
    const [, setAulas] = useState<Aula[]>([]); 
    const [directivos, setDirectivos] = useState<Directivo[]>([]);
    const [zonaNombre, setZonaNombre] = useState("");
    const [loading, setLoading] = useState(true);
    const [, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState("");
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [directorDialogOpen, setDirectorDialogOpen] = useState(false);
    const [directorEscuelaTarget, setDirectorEscuelaTarget] = useState<Escuela | null>(null);
    const [directorId, setDirectorId] = useState("");
    const [savingDirector, setSavingDirector] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [escData, dirData, aulasData] = await Promise.all([
                getEscuelas(),
                getDirectivos().catch((err) => {
                    console.warn("Aviso: No se pudieron cargar directivos", err);
                    return [];
                }),
                getAulas().catch((err) => {
                    console.warn("Aviso: No se pudieron cargar aulas", err);
                    return [];
                })
            ]);

            let zonasData: any[] = [];
            if (isEquipoPadi) {
                zonasData = await getZonas();
            }

            let filtered = escData;

            if (zonaIdParam) {
                // Caso PADI filtrando por zona
                filtered = escData.filter(e => e.zona?.id === zonaIdParam);
                const zona = zonasData.find(z => z.id === zonaIdParam);
                setZonaNombre(zona?.nombre || "Zona desconocida");
            } else if (!isEquipoPadi && escData.length > 0) {
                // Caso Encargado: Saca el nombre de la zona desde la primera escuela que le vino
                setZonaNombre(escData[0].zona?.nombre || "Mi Zona");
            } else {
                setZonaNombre("Todas las Escuelas");
            }

            setEscuelas(filtered);
            setDirectivos(dirData);
            setAulas(aulasData);
        } catch (e) {
            console.error("Error en fetchData:", e);
            setError("Error al cargar datos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [zonaIdParam]);

    const escuelasFiltradas = useMemo(() => {
        return escuelas.filter(escuela => 
            escuela.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            escuela.direccion?.toLowerCase().includes(busqueda.toLowerCase())
        );
    }, [escuelas, busqueda]);

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
                {showBack && (
                    <Button startIcon={<ArrowBackIcon />} onClick={onVolver} sx={{ textTransform: "none", mb: 1, color: "#5c7cfa" }}>
                        Volver
                    </Button>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {showTitle ? (
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>{zonaNombre}</Typography>
                    ) : (
                        <Box /> 
                    )}

                    <BuscadorPadi 
                        placeholder="Buscar escuela por nombre o dirección..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#adb5bd' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    
                    <BotonNuevo texto="Nueva escuela" onClick={() => setCreateModalOpen(true)} />
                </Box>
            </Box>

            <EscuelasList
                escuelas={escuelasFiltradas}
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
            <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} fullWidth maxWidth="sm">
                <DialogContent sx={{ p: 0 }}>
                    {createModalOpen && (
                        <EscuelaForm 
                            defaultZonaId={zonaIdParam || undefined} 
                            onCancel={() => setCreateModalOpen(false)} 
                            onSuccess={() => { setCreateModalOpen(false); fetchData(); }} 
                        />
                    )}
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