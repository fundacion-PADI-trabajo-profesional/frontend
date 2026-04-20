import { useState, useEffect } from "react";
import { 
    Box, 
    Button, 
    Typography, 
    CircularProgress, 
    Alert, 
    TextField, 
    Stack, 
    Paper 
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AulasList from "./AulasList";
import GestionDocentesAula from "./GestionDocentesAula";
import { getAulasPorEscuela, createAula, updateAula, deleteAula, type Aula } from "../api/aulas";
import { type Sala } from "../api/estudiantes";

interface Props {
    escuelaId: string;
    salaSeleccionada: Sala; 
    isEquipoPadi: boolean;
    onVerEstudiantes: (aula: Aula) => void;
    onVolver: () => void; 
}

export default function AulasView({ escuelaId, salaSeleccionada, isEquipoPadi, onVerEstudiantes, onVolver }: Props) {
    const [aulas, setAulas] = useState<Aula[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [mode, setMode] = useState<"list" | "form">("list");
    const [editing, setEditing] = useState<Aula | null>(null);
    const [selectedAulaForDocentes, setSelectedAulaForDocentes] = useState<Aula | null>(null);
    
    const [formData, setFormData] = useState({ 
        comision: "", 
        turno: "" 
    });

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const aData = await getAulasPorEscuela(escuelaId);
            const aulasFiltradas = aData.filter(a => 
                String(a.escuela_id) === String(escuelaId) && 
                Number(a.sala_id) === Number(salaSeleccionada.id)
            );
            
            setAulas(aulasFiltradas);
        } catch (e: any) {
            setError("Error al cargar las comisiones de esta sala.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (escuelaId && salaSeleccionada) fetchData();
    }, [escuelaId, salaSeleccionada]);

    const handleSubmit = async () => {
        if (!formData.comision || !formData.turno) {
            alert("Por favor, completá todos los campos.");
            return;
        }

        try {
            if (editing) {
                await updateAula(editing.id, { 
                    ...formData, 
                    sala_id: salaSeleccionada.id 
                });
            } else {
                await createAula({ 
                    ...formData, 
                    sala_id: salaSeleccionada.id,
                    escuela_id: escuelaId 
                });
            }
            setMode("list");
            setEditing(null);
            fetchData(); 
        } catch (e: any) {
            alert("Error al guardar la comisión: " + e.message);
        }
    };

    const handleDelete = async (aula: Aula) => {
        if (!window.confirm(`¿Seguro que querés eliminar la comisión "${aula.comision}"?`)) return;
        try {
            await deleteAula(aula.id);
            fetchData();
        } catch (e: any) {
            alert("Error al eliminar: " + e.message);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    const salaLabel = salaSeleccionada.nombre || `Sala ${salaSeleccionada.grado ?? salaSeleccionada.id}`;

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* HEADER DE NAVEGACIÓN */}
            <Box sx={{ mb: 3 }}>
                <Button 
                    startIcon={<ArrowBackIcon />} 
                    onClick={onVolver} 
                    sx={{ textTransform: "none", mb: 1, color: "#5c7cfa" }}
                >
                    Volver a niveles / salas
                </Button>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {salaLabel} - Comisiones
                </Typography>
            </Box>

            {mode === "list" ? (
                <>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
                        <Button 
                            variant="contained" 
                            startIcon={<AddIcon />} 
                            onClick={() => {
                                setEditing(null);
                                setFormData({ comision: "", turno: "" });
                                setMode("form");
                            }} 
                            sx={{ 
                                bgcolor: "#5fb878", 
                                textTransform: "none",
                                fontWeight: 600,
                                "&:hover": { bgcolor: "#4a9960" } 
                            }}
                        >
                            Nueva Comisión
                        </Button>
                    </Box>

                    <AulasList 
                        aulas={aulas} 
                        onEdit={(a) => {
                            setEditing(a);
                            setFormData({ comision: a.comision, turno: a.turno });
                            setMode("form");
                        }}
                        onDelete={handleDelete}
                        onViewStudents={onVerEstudiantes}
                        onViewTeachers={(a) => setSelectedAulaForDocentes(a)}
                    />
                </>
            ) : (
                <Paper sx={{ p: 4, maxWidth: 500, borderRadius: 3, border: "1px solid #eee" }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                        {editing ? "Editar Comisión" : `Nueva Comisión para ${salaLabel}`}
                    </Typography>

                    <Stack spacing={3}>
                        <TextField
                            fullWidth
                            label="Nombre de la Comisión (Ej: Azul, A, etc.)"
                            value={formData.comision}
                            onChange={(e) => setFormData({ ...formData, comision: e.target.value })}
                        />

                        <TextField
                            fullWidth
                            label="Turno (Ej: Mañana, Tarde)"
                            value={formData.turno}
                            onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                        />

                        <Box sx={{ display: "flex", gap: 2, pt: 2 }}>
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                sx={{ 
                                    bgcolor: "#000", color: "#fff", textTransform: "none", fontWeight: 600, flex: 1,
                                    "&:hover": { bgcolor: "#333" } 
                                }}
                            >
                                Guardar
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => setMode("list")}
                                sx={{ borderColor: "#ccc", color: "#666", textTransform: "none", flex: 1 }}
                            >
                                Cancelar
                            </Button>
                        </Box>
                    </Stack>
                </Paper>
            )}

            {/* Modal de Gestión de Docentes Modularizado */}
            <GestionDocentesAula 
                aula={selectedAulaForDocentes}
                open={!!selectedAulaForDocentes}
                onClose={() => setSelectedAulaForDocentes(null)}
            />
        </Box>
    );
}