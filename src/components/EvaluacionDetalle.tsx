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
    Paper
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import FaceIcon from '@mui/icons-material/Face';
import PsychologyIcon from '@mui/icons-material/Psychology';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';

import { getEvaluacionInstanciaById, type EvaluacionInstancia } from "../api/evaluaciones"

interface Props {
    evaluacionId: string
    onBack: () => void
}

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
    if (estadoId === 'N') return { bg: '#FEF3C7', text: '#D97706', label: 'No iniciado' };
    if (estadoId === 'E') return { bg: '#DBEAFE', text: '#2563EB', label: 'En Progreso' };
    if (estadoId === 'C') return { bg: '#D1FAE5', text: '#059669', label: 'Completado' };
    return { bg: '#F3F4F6', text: '#374151', label: estadoId };
}

export default function EvaluacionDetalle({ evaluacionId, onBack }: Props) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<EvaluacionInstancia | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const load = async () => {
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
        load()
    }, [evaluacionId])

    if (loading) return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
    if (error) return <Box sx={{ p: 4 }}><Typography color="error">{error}</Typography><Button onClick={onBack}>Volver</Button></Box>

    // --- CORRECCIÓN CLAVE AQUÍ ---
    // Verificamos explícitamente data.estudiante. 
    // Si no existe, no renderizamos el componente (o mostramos un error).
    if (!data || !data.estudiante) {
        return <Box sx={{ p: 4 }}><Typography>No se encontraron datos del estudiante.</Typography></Box>;
    }

    // A partir de aquí, TypeScript sabe que data.estudiante NO es undefined
    const fechaCreacion = new Date(data.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

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
                    Sala {data.salaId || data.salaId}
                </Typography>
            </Box>

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
                                '&:hover': {
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                    borderColor: 'transparent'
                                }
                            }}
                            onClick={() => console.log("Ir a preguntas del area", area.id)}
                        >
                            <Box sx={{
                                mr: 2,
                                p: 1.5,
                                borderRadius: '12px',
                                bgcolor: '#fafafa',
                                display: 'flex'
                            }}>
                                {getAreaIcon(area.id)}
                            </Box>

                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                    {area.nombre}
                                </Typography>
                                <Chip
                                    label={statusStyle.label}
                                    size="small"
                                    sx={{
                                        mt: 0.5,
                                        height: 20,
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        bgcolor: statusStyle.bg,
                                        color: statusStyle.text
                                    }}
                                />
                            </Box>
                            <ChevronRightIcon sx={{ color: '#999' }} />
                        </Paper>
                    )
                })}
            </Box>
        </Box>
    )
}