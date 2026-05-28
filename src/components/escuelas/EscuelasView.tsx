import { useState, useEffect, useMemo } from "react";
import { Box, Button, Typography, Dialog, DialogContent, CircularProgress, InputAdornment } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import EscuelasList from "./EscuelasList";
import EscuelaForm from "../forms/EscuelaForm";
import EscuelaDetalle from "./EscuelaDetalle";
import EditarEscuela from "./EditarEscuela";
import BotonNuevo from "../common/BotonNuevo";
import { getEscuelas, type Escuela } from "../../api/escuelas";
import { getZonas } from "../../api/zonas";
import { BuscadorPadi } from "../common/SearchBar";

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
    const [zonaNombre, setZonaNombre] = useState("");
    const [loading, setLoading] = useState(true);
    const [, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState("");
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [escuelaToView, setEscuelaToView] = useState<Escuela | null>(null);
    const [escuelaToEdit, setEscuelaToEdit] = useState<Escuela | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const escData = await getEscuelas();

            let zonasData: any[] = [];
            if (isEquipoPadi) {
                zonasData = await getZonas();
            }

            let filtered = escData;

            if (zonaIdParam) {
                filtered = escData.filter(e => e.zona?.id === zonaIdParam);
                const zona = zonasData.find((z: any) => z.id === zonaIdParam);
                setZonaNombre(zona?.nombre || "Zona desconocida");
            } else if (!isEquipoPadi && escData.length > 0) {
                setZonaNombre(escData[0].zona?.nombre || "Mi Zona");
            } else {
                setZonaNombre("Todas las Escuelas");
            }

            setEscuelas(filtered);
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

    const handleEditFromDetalle = () => {
        const esc = escuelaToView;
        setEscuelaToView(null);
        setEscuelaToEdit(esc);
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

            {/* <EscuelasList
                escuelas={escuelasFiltradas}
                onView={onVerAulas}
                onDetalle={(esc) => setEscuelaToView(esc)}
            /> */}
            <EscuelasList
                escuelas={escuelasFiltradas}
                onView={onVerAulas}
                onDetalle={(esc) => setEscuelaToView(esc)}
                onEditar={(esc) => setEscuelaToEdit(esc)}
            />

            {/* Modal detalle de escuela */}
            <Dialog open={!!escuelaToView} onClose={() => setEscuelaToView(null)} fullWidth maxWidth="lg">
                <DialogContent sx={{ p: 3 }}>
                    {escuelaToView && (
                        <EscuelaDetalle
                            escuela={escuelaToView}
                            onEdit={handleEditFromDetalle}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal editar escuela */}
            <Dialog open={!!escuelaToEdit} onClose={() => setEscuelaToEdit(null)} fullWidth maxWidth="md">
                <DialogContent sx={{ p: 0 }}>
                    {escuelaToEdit && (
                        <EditarEscuela
                            escuela={escuelaToEdit}
                            onCancel={() => setEscuelaToEdit(null)}
                            onSuccess={() => { setEscuelaToEdit(null); fetchData(); }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal nueva escuela */}
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
        </Box>
    );
}
