"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Box, Container, Typography, Button, CircularProgress, Alert } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useNavigate, useSearchParams } from "react-router-dom"
import EstudiantesList from "../components/EstudiantesList"
import EstudianteForm from "../components/EstudianteForm"
import { getEstudiantes, type Estudiante, type EstudianteCreado } from "../api/estudiantes"
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

type EstudianteView = "list" | "form" | "success"

/**
 * Página principal de Estudiantes.
 * Maneja el estado de la vista (lista, formulario, éxito)
 * y la carga de datos.
 */
export default function Estudiantes() {
    const [view, setView] = useState<EstudianteView>("list")
    const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [refreshKey, setRefreshKey] = useState(0) // Para refrescar la lista
    const [estudianteCreado, setEstudianteCreado] = useState<EstudianteCreado | null>(null)

    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    // Efecto para manejar la acción de "Evaluar ahora" desde el success
    // o desde la lista
    useEffect(() => {
        const newStudentId = searchParams.get("evaluarAhora");
        if (newStudentId) {
            // Lógica para pre-cargar la evaluación...
            console.log("Se debe evaluar al estudiante:", newStudentId);
            // Esto te lleva a la página de Evaluaciones, que
            // debería tener su propia lógica para leer este query param
        }
    }, [searchParams]);


    // Carga de estudiantes
    useEffect(() => {
        // Solo carga la lista si la vista es 'list'
        if (view === "list") {
            loadEstudiantes()
        }
    }, [view, refreshKey])

    const loadEstudiantes = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await getEstudiantes() // Usando la función de API real
            setEstudiantes(data)
        } catch (err: any) {
            setError(err.message || "Error al cargar los estudiantes")
        } finally {
            setLoading(false)
        }
    }

    // --- Navegación ---
    const handleGoToForm = () => setView("form")
    const handleBackToList = () => {
        // Limpia los query params al volver a la lista
        navigate("/estudiantes", { replace: true })
        setView("list")
    }

    // --- Manejo de éxito del formulario ---
    const handleSuccess = (nuevoEstudiante: EstudianteCreado) => {
        setEstudianteCreado(nuevoEstudiante) // Guarda el estudiante creado
        setView("success") // Cambia a la vista de éxito
        setRefreshKey(prev => prev + 1) // Prepara un refresh para cuando vuelva a la lista
    }

    const handleEvaluarAhora = () => {
        // Navega a evaluaciones, pasando un query param
        // para que la página de Evaluaciones sepa qué hacer
        navigate(`/evaluaciones?evaluarAhora=${estudianteCreado?.id}`)
    }

    // --- Renderizado del contenido principal ---
    const renderContent = () => {
        switch (view) {
            case "list":
                if (loading) {
                    return (
                        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                            <CircularProgress />
                        </Box>
                    )
                }
                if (error) {
                    return (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )
                }
                return <EstudiantesList estudiantes={estudiantes} onAddEstudiante={handleGoToForm} />

            case "form":
                // El formulario ahora se renderiza centrado y con su propio fondo
                return (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <EstudianteForm onCancel={handleBackToList} onSuccess={handleSuccess} />
                    </Box>
                )

            case "success":
                // La vista de éxito, centrada
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, textAlign: 'center', minHeight: '60vh' }}>
                        <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
                        <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
                            ¡Estudiante creado con éxito!
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#666', mb: 4, maxWidth: 400 }}>
                            Podés comenzar su primera evaluación ahora, o hacerlo en otro momento.
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 300 }}>
                            <Button
                                variant="contained"
                                onClick={handleEvaluarAhora}
                                sx={{
                                    bgcolor: '#000',
                                    color: '#fff',
                                    py: 1.5,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    '&:hover': { bgcolor: '#333' }
                                }}
                            >
                                Evaluar ahora
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={handleBackToList}
                                sx={{
                                    borderColor: '#000',
                                    color: '#000',
                                    py: 1.5,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                                }}
                            >
                                En otro momento
                            </Button>
                        </Box>
                    </Box>
                )
            default:
                return null
        }
    }

    // Título dinámico
    const getTitle = () => {
        switch (view) {
            case 'list': return 'Estudiantes';
            case 'form': return 'Nuevo estudiante';
            case 'success': return 'Completado';
            default: return 'Estudiantes';
        }
    }

    // El header solo se muestra si NO estás en el formulario (como en el mockup)
    const showHeader = view !== 'form';

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: view === 'form' ? '#fff' : '#f5f5f5' }}>
            {/* Header */}
            {showHeader && (
                <Box sx={{ bgcolor: "#f5f5f5", py: { xs: 3, md: 4 }, borderBottom: "1px solid #e0e0e0" }}>
                    <Container maxWidth="lg">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                            <Button
                                startIcon={<ArrowBackIcon />}
                                // Si está en la lista, vuelve a Home. Si está en success, vuelve a la lista.
                                onClick={view === "list" ? () => navigate("/home") : handleBackToList}
                                sx={{ color: "#5c7cfa", textTransform: "none", fontSize: '1rem' }}
                            >
                                {view === "list" ? "Volver a inicio" : "Volver a estudiantes"}
                            </Button>
                        </Box>
                        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '2.25rem', md: '3rem' } }}>
                            {getTitle()}
                        </Typography>
                        {view === 'list' && (
                            <Typography variant="body1" sx={{ color: "#666", fontSize: '1.1rem' }}>
                                Gestiona la lista de tus estudiantes y crea nuevos perfiles.
                            </Typography>
                        )}
                    </Container>
                </Box>
            )}

            {/* Main Content */}
            {/* Si es el formulario, no usamos Container para que ocupe todo el ancho en móvil */}
            {view === 'form' ? (
                renderContent()
            ) : (
                <Container maxWidth="lg" sx={{ py: 4 }}>
                    {renderContent()}
                </Container>
            )}
        </Box>
    )
}