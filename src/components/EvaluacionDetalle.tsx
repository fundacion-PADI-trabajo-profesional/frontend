"use client"

import { useEffect, useState } from "react"
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    IconButton,
    CircularProgress,
    Button,
    Paper,
    Alert
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import FaceIcon from '@mui/icons-material/Face';
import PsychologyIcon from '@mui/icons-material/Psychology';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';

import { getEvaluacionInstanciaById, type EvaluacionInstancia } from "../api/evaluaciones"
import EvaluacionWizard from "./EvaluacionWizard";

interface Props {
    evaluacionId: string
    onBack: () => void
}

// Helper functions (calcularEdad, getAreaIcon, getStatusColor - mantienen su lógica)

const calcularEdad = (fechaNac: string | null | undefined) => {
    if (!fechaNac) return "-";
    const hoy = new Date();
    const nac = new Date(fechaNac);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
        edad--;
    }
    const meses = (hoy.getMonth() + 12 * hoy.getFullYear()) - (nac.getMonth() + 12 * nac.getFullYear());
    const mesesRestantes = meses % 12;
    return `${edad} años, ${mesesRestantes} meses`;
}

const getAreaIcon = (areaId: string) => {
    switch (areaId) {
        case 'CG': return <PsychologyIcon sx={{ color: '#F59E0B' }} />;
        case 'CL': return <RecordVoiceOverIcon sx={{ color: '#EF4444' }} />;
        case 'SE': return <FavoriteIcon sx={{ color: '#8B5CF6' }} />;
        case 'SM': return <DirectionsRunIcon sx={{ color: '#EC4899' }} />;
        default: return <FaceIcon />;
    }
}

const getStatusColor = (estadoId: string) => {
    if (estadoId === 'N') return { bg: '#FEF3C7', text: '#D97706', label: 'No iniciado', color: 'warning' };
    if (estadoId === 'E') return { bg: '#DBEAFE', text: '#2563EB', label: 'En Progreso', color: 'info' };
    if (estadoId === 'C') return { bg: '#D1FAE5', text: '#059669', label: 'Completado', color: 'success' };
    if (estadoId === 'A') return { bg: '#D1FAE5', text: '#059669', label: 'Aprobada', color: 'success' };
    if (estadoId === 'D') return { bg: '#fee2e2', text: '#ef4444', label: 'Desaprobada', color: 'error' };
    return { bg: '#F3F4F6', text: '#374151', label: estadoId, color: 'default' };
}


export default function EvaluacionDetalle({ evaluacionId, onBack }: Props) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<EvaluacionInstancia | null>(null)
    const [error, setError] = useState<string | null>(null)

    // ESTADOS PARA EL WIZARD
    const [wizardOpen, setWizardOpen] = useState(false)
    const [selectedArea, setSelectedArea] = useState<{ id: string, nombre: string } | null>(null)


    // Carga inicial y recarga
    const loadEvaluationData = async () => {
        try {
            setLoading(true)
            const res = await getEvaluacionInstanciaById(evaluacionId)
            setData(res)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadEvaluationData()
    }, [evaluacionId])


    // Handler para abrir el Wizard
    const handleAreaClick = (areaId: string, areaNombre: string) => {
        // Solo permitir iniciar si no está completado
        const areaStatus = data?.areas?.find(a => a.id === areaId)?.estadoId;
        if (areaStatus === 'C') {
            console.log("Área ya completada. No se permite reanudar.");
            return;
        }

        setSelectedArea({ id: areaId, nombre: areaNombre })
        setWizardOpen(true)
    }

    // Handler para cerrar el wizard y refrescar
    const handleWizardClose = () => {
        setWizardOpen(false)
        setSelectedArea(null)
        // Recargamos los datos para actualizar el estado del área y la evaluación general
        loadEvaluationData();
    }

    if (loading) return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
    if (error) return <Box sx={{ p: 4 }}><Typography color="error">{error}</Typography><Button onClick={onBack}>Volver</Button></Box>
    if (!data || !data.estudiante) return <Box sx={{ p: 4 }}><Typography>No se encontraron datos del estudiante.</Typography></Box>;

    const fechaCreacion = new Date(data.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const overallStatus = getStatusColor(data.estadoId);

    return (
        <Box>
            {/* Header Nav */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton onClick={onBack} sx={{ mr: 1 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                    Evaluación {data.tipoId === 'inicial' ? 'Inicial' : 'de Cierre'}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#666' }}>
                    Sala {data.salaNombre || data.salaId}
                </Typography>
            </Box>

            {/* ALERT DE APROBACIÓN GENERAL */}
            {data.estadoId !== 'N' && data.estadoId !== 'E' && (
                <Alert severity={overallStatus.color as 'success' | 'error'} sx={{ mb: 3 }}>
                    <Typography sx={{ fontWeight: 'bold' }}>ESTADO GENERAL: {overallStatus.label}</Typography>
                    {data.puntaje !== null && data.puntaje !== undefined && (
                        <Typography variant="body2">Puntaje Total Obtenido: {data.puntaje.toFixed(2)}%</Typography>
                    )}
                </Alert>
            )}


            {/* Student Card */}
            <Card sx={{
                mb: 4,
                borderRadius: 4,
                background: 'linear-gradient(to right, #eff6ff, #fff)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: '1px solid #e0e7ff'
            }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        width: 60, height: 60,
                        bgcolor: '#BFDBFE',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <FaceIcon sx={{ fontSize: 35, color: '#2563EB' }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            {data.estudiante.nombre} {data.estudiante.apellido}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            DNI: {data.estudiante.dni}
                        </Typography>

                        <Grid container spacing={4} sx={{ mt: 1 }}>
                            <Grid item>
                                <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>Edad</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {calcularEdad(data.estudiante.fechaNacimiento)}
                                </Typography>
                            </Grid>
                            <Grid item>
                                <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>Fecha Evaluación</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                                    {fechaCreacion}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </CardContent>
            </Card>

            {/* Areas List */}
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Áreas de Evaluación</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {data.areas?.map((area) => {
                    const statusStyle = getStatusColor(area.estadoId);
                    return (
                        <Paper
                            key={area.id}
                            elevation={0}
                            sx={{
                                p: 2,
                                border: '1px solid #eee',
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                // Deshabilitar el click si ya está completada
                                opacity: area.estadoId === 'C' ? 0.7 : 1,
                                '&:hover': {
                                    boxShadow: area.estadoId !== 'C' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                                    borderColor: area.estadoId !== 'C' ? 'transparent' : '#eee'
                                }
                            }}
                            onClick={() => handleAreaClick(area.id, area.nombre)}
                        >
                            {/* Icon Box */}
                            <Box sx={{
                                mr: 2,
                                p: 1.5,
                                borderRadius: '12px',
                                bgcolor: '#fafafa',
                                display: 'flex'
                            }}>
                                {getAreaIcon(area.id)}
                            </Box>

                            {/* Text Info */}
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                    {area.nombre}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {area.descripcion}
                                </Typography>
                                <Chip
                                    label={statusStyle.label}
                                    size="small"
                                    sx={{
                                        mt: 0.5,
                                        height: 20,
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        bgcolor: statusStyle.bg,
                                        color: statusStyle.text
                                    }}
                                />
                                {area.estadoId === 'E' && (
                                    <Typography variant="caption" sx={{ ml: 1, color: '#999' }}>
                                        (Retomar)
                                    </Typography>
                                )}
                            </Box>

                            {/* Action Arrow */}
                            <ChevronRightIcon sx={{ color: '#999' }} />
                        </Paper>
                    )
                })}
            </Box>

            {/* WIZARD MODAL (Aparece al hacer click en un área) */}
            <EvaluacionWizard
                open={wizardOpen}
                onClose={handleWizardClose}
                evaluacionId={evaluacionId}
                areaId={selectedArea?.id || ""}
                areaNombre={selectedArea?.nombre || ""}
            />
        </Box>
    )
}