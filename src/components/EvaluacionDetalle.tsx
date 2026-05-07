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
import EvaluacionRevision from "./EvaluacionRevision";

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
    switch (estadoId) {
        case "N":
            return { bg: '#FEF3C7', text: '#D97706', label: 'No iniciada', color: 'warning' };
        case "E":
            return { bg: '#DBEAFE', text: '#2563EB', label: 'En Progreso', color: 'info' };
        case "A":
            return { bg: '#D1FAE5', text: '#059669', label: 'Aprobada', color: 'success' };
        case "D":
            return { bg: '#FEE2E2', text: '#EF4444', label: 'Desaprobada', color: 'error' };
        default:
            return { bg: '#F3F4F6', text: '#6B7280', label: 'Pendiente', color: 'default' };
    }
}

const getGeneroColor = (genero?: string) => {
    if (!genero) return "#9E9E9E"; // gris default

    const g = genero.toLowerCase();

    if (g.startsWith("f")) return "#F48FB1"; // rosa pastel
    if (g.startsWith("m")) return "#90CAF9"; // azul pastel

    return "#9E9E9E";
};


export default function EvaluacionDetalle({ evaluacionId, onBack }: Props) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<EvaluacionInstancia | null>(null)
    const [error, setError] = useState<string | null>(null)

    // ESTADOS PARA EL WIZARD
    const [wizardOpen, setWizardOpen] = useState(false)
    const [selectedArea, setSelectedArea] = useState<{ id: string, nombre: string } | null>(null)

    // ESTADOS PARA REVISIÓN
    const [revisionOpen, setRevisionOpen] = useState(false);
    const [revisionData, setRevisionData] = useState<{ id: string, nombre: string, score: number, total: number, statusId: string } | null>(null);

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


    const handleAreaClick = (areaId: string, areaNombre: string, statusId: string, aciertosIndividuales: number, totalQuestions: number) => {
        if (statusId === 'A' || statusId === 'D' || statusId === 'C') {
            // Área completada: mostrar revisión de respuestas
            setRevisionData({
                id: areaId,
                nombre: areaNombre,
                score: aciertosIndividuales,
                total: totalQuestions,
                statusId: statusId
            });
            setRevisionOpen(true);
            return;
        }
        // Área no iniciada o en progreso: abrir wizard
        setSelectedArea({ id: areaId, nombre: areaNombre });
        setWizardOpen(true);
    }

    // Abre el wizard para corregir desde la pantalla de revisión
    const handleCorrectFromRevision = () => {
        if (!revisionData) return;
        setRevisionOpen(false);
        setSelectedArea({ id: revisionData.id, nombre: revisionData.nombre });
        setWizardOpen(true);
    }
    
    if (loading) return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
    if (error) return <Box sx={{ p: 4 }}><Typography color="error">{error}</Typography><Button onClick={onBack}>Volver</Button></Box>
    if (!data || !data.estudiante) return <Box sx={{ p: 4 }}><Typography>No se encontraron datos del estudiante.</Typography></Box>
    const evaluacion = data
    const overallStatus = getStatusColor(evaluacion.estadoId);

    const fechaObj = evaluacion.createdAt;
    const mesYAnio = fechaObj.toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC' // Usar UTC si el backend envía ISO sin hora específica
    });

    return (
        <Box>
            {/* Header Nav */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton
                    onClick={onBack}
                    sx={{
                        mr: 2,
                        bgcolor: '#f0f2f5',
                        '&:hover': { bgcolor: '#e4e6e9' }
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                    Evaluación {evaluacion.tipoId === 'inicial' ? 'Inicial' : 'de Cierre'}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#000000' }}>
                    {evaluacion.salaNombre || evaluacion.salaId}
                </Typography>
            </Box>

            {/* ALERT DE APROBACIÓN GENERAL */}
            {evaluacion.estadoId !== 'N' && evaluacion.estadoId !== 'E' && (
                <Alert severity={overallStatus.color as 'success' | 'error'} sx={{ mb: 3 }}>
                    <Typography sx={{ fontWeight: 'bold' }}>ESTADO GENERAL: {overallStatus.label}</Typography>
                    {evaluacion.puntaje !== null && evaluacion.puntaje !== undefined && (
                        <Typography variant="body2">Puntaje Total Obtenido: {evaluacion.puntaje.toFixed(2)}%</Typography>
                    )}
                </Alert>
            )}


            {/* Student Card */}
            <Card sx={{ mb: 4, borderRadius: 4 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                        {/* Fila 1: Icono + Nombre */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <FaceIcon
                                sx={{
                                    color: getGeneroColor(evaluacion.estudiante?.genero),
                                    fontSize: 34,
                                }}
                            />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                {evaluacion.estudiante?.nombre} {evaluacion.estudiante?.apellido}
                            </Typography>
                        </Box>

                        {/* Fila 2: DNI + Edad */}
                        <Box
                            sx={{
                                mt: 0.5,
                                display: "flex",
                                gap: 2,
                                flexWrap: "wrap",
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                DNI:{" "}
                                <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                                    {evaluacion.estudiante?.dni ?? "-"}
                                </Box>
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                Edad:{" "}
                                <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                                    {calcularEdad(evaluacion.estudiante?.fechaNacimiento)}
                                </Box>
                            </Typography>
                        </Box>

                        {/* Fila 3: Chips Escuela + Comisión */}
                        <Box
                            sx={{
                                mt: 1,
                                display: "flex",
                                gap: 1,
                                flexWrap: "wrap",
                            }}
                        >
                            <Chip
                                icon={<span>🏫</span>}
                                label={evaluacion.estudiante?.escuelaNombre || "Escuela no asignada"}
                                sx={{
                                    bgcolor: "#d4edf5",
                                    color: "#00A5DB",
                                    fontWeight: 600,
                                }}
                            />

                            <Chip
                                label={`Comisión: ${evaluacion.aulaLabel || "Sin asignar"}`}
                                sx={{
                                    bgcolor: "#ebf4d2",
                                    color: "#9fbd4c",
                                    fontWeight: 600,
                                }}
                            />
                        </Box>

                        {/* (Si querés mantener la fecha evaluación abajo como antes) */}
                        <Grid container spacing={4} sx={{ mt: 1 }}>
                            <Grid item>
                                <Typography variant="caption" sx={{ display: "block" }}>
                                    Fecha Evaluación
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, textTransform: "capitalize" }}>
                                    {mesYAnio}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </CardContent>
            </Card>

            {/* Areas List */}
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Áreas de Evaluación</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {evaluacion.areas?.map((area) => {
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
                            onClick={() => handleAreaClick(area.id, area.nombre, area.estadoId, area.aciertosIndividuales || 0, area.totalPreguntas || 0)}
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
                                        bgcolor: statusStyle.bg,
                                        color: statusStyle.text
                                    }}
                                />

                                {area.estadoId !== "N" && area.totalPreguntas !== undefined && (
                                    <Typography variant="caption" sx={{ ml: 1, color: '#666', fontWeight: 'bold' }}>
                                        ({area.aciertosIndividuales || 0} / {area.totalPreguntas} respuestas logradas)
                                    </Typography>
                                )}
                            </Box>

                            {/* Action Arrow */}
                            <ChevronRightIcon sx={{ color: '#999' }} />
                        </Paper>
                    )
                })}
            </Box>

            {/* WIZARD MODAL */}
            <EvaluacionWizard
                open={wizardOpen}
                onClose={() => {
                    setWizardOpen(false);
                    setSelectedArea(null);
                    loadEvaluationData();
                }}
                evaluacionId={evaluacionId}
                areaId={selectedArea?.id || ""}
                areaNombre={selectedArea?.nombre || ""}
            />

            {/* REVISIÓN MODAL */}
            {revisionData && (
                <EvaluacionRevision
                    open={revisionOpen}
                    onClose={() => {
                        setRevisionOpen(false);
                        setRevisionData(null);
                        loadEvaluationData();
                    }}
                    onCorrect={handleCorrectFromRevision}
                    evaluacionId={evaluacionId}
                    areaId={revisionData.id}
                    areaNombre={revisionData.nombre}
                    score={revisionData.score}
                    total={revisionData.total}
                    statusId={revisionData.statusId}
                />
            )}
        </Box>
    )
}