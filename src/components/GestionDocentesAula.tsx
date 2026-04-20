import { useState, useEffect } from "react";
import {
    Box, Button, Typography, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, CircularProgress, Divider, Alert
} from "@mui/material";
import { getDocentes, type Docente } from "../api/docentes";
import { 
    getAulaDocentes, asignarDocenteAula, desasignarDocenteAula, type AulaDocente, type Aula 
} from "../api/aulas";

interface Props {
    aula: Aula | null;
    open: boolean;
    onClose: () => void;
}

export default function GestionDocentesAula({ aula, open, onClose }: Props) {
    const [aulaDocentes, setAulaDocentes] = useState<AulaDocente[]>([]);
    const [todosLosDocentes, setTodosLosDocentes] = useState<Docente[]>([]);
    const [selectedDocenteId, setSelectedDocenteId] = useState("");
    const [loading, setLoading] = useState(false);

    const loadDocentesData = async () => {
        if (!aula) return;
        setLoading(true);
        try {
            const [actuales, todos] = await Promise.all([
                getAulaDocentes(aula.id),
                getDocentes() 
            ]);
            setAulaDocentes(actuales);
            setTodosLosDocentes(todos);
        } catch (e) {
            console.error("Error cargando docentes", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && aula) loadDocentesData();
    }, [open, aula]);

    const docentesDisponibles = todosLosDocentes.filter(docente => {
        // 1. Chequeamos si la escuela del aula está en el array de escuelas del docente
        const perteneceAEscuela = docente.escuelas?.some(e => e.id === aula?.escuela_id);

        // 2. Chequeamos si el aula ya está en el array de aulas del docente
        const yaEstaEnAula = docente.aulas?.some(a => a.id === aula?.id);

        return perteneceAEscuela && !yaEstaEnAula;
    });

    const handleAsignar = async () => {
        if (!aula || !selectedDocenteId) return;
        try {
            await asignarDocenteAula(aula.id, selectedDocenteId);
            setSelectedDocenteId("");
            loadDocentesData(); 
        } catch (e) { alert("Error al asignar"); }
    };

    const handleQuitar = async (profesorId: string) => {
        if (!aula || !window.confirm("¿Quitar docente de esta aula?")) return;
        try {
            await desasignarDocenteAula(aula.id, profesorId);
            loadDocentesData();
        } catch (e) { alert("Error al quitar"); }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700 }}>Asignar Docente</DialogTitle>
            <DialogContent>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
                ) : (
                    <>
                        <Typography variant="subtitle2" sx={{ mb: 2, color: "#5c7cfa" }}>
                            Aula: {aula?.sala?.nombre} - {aula?.comision} ({aula?.turno})
                        </Typography>

                        {/* Docentes asignados actualmente al aula */}
                        <Box sx={{ mb: 3, maxHeight: 200, overflowY: "auto" }}>
                            {aulaDocentes.length === 0 ? (
                                <Typography variant="body2" sx={{ color: "#999", fontStyle: "italic" }}>
                                    No hay docentes en esta comisión.
                                </Typography>
                            ) : (
                                aulaDocentes.map((ad) => (
                                    <Box key={ad.profesor_id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.5 }}>
                                        <Typography variant="body2">
                                            {ad.profesor.personas?.primer_apellido}, {ad.profesor.personas?.nombre}
                                        </Typography>
                                        <Button 
                                            size="small" 
                                            color="error" 
                                            onClick={() => handleQuitar(ad.profesor_id)}
                                        >
                                            Quitar
                                        </Button>
                                    </Box>
                                ))
                            )}
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        {/* Formulario de asignación */}
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <TextField
                                select fullWidth size="small" label="Seleccionar docente de la escuela"
                                value={selectedDocenteId}
                                onChange={(e) => setSelectedDocenteId(e.target.value)}
                            >
                                {docentesDisponibles.length > 0 ? (
                                    docentesDisponibles.map((d) => (
                                        <MenuItem key={d.id} value={d.id}>
                                            {d.apellido}, {d.nombre}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled value="">
                                        No hay docentes disponibles
                                    </MenuItem>
                                )}
                            </TextField>
                            
                            {docentesDisponibles.length === 0 && (
                                <Alert severity="info" sx={{ '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
                                    Solo podés asignar docentes que ya pertenezcan a esta escuela.
                                </Alert>
                            )}

                            <Button 
                                variant="contained" 
                                fullWidth
                                disabled={!selectedDocenteId} 
                                onClick={handleAsignar}
                                sx={{ bgcolor: "#000", textTransform: "none", fontWeight: 600 }}
                            >
                                Asignar al Aula
                            </Button>
                        </Box>
                    </>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} sx={{ color: "#666" }}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
}