"use client"

import { useState, useEffect } from "react"
import {
    Box,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Typography,
    Grid,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    FormHelperText,
    IconButton,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { 
    createEstudiante, 
    updateEstudiante, // Asegúrate de tener esta función en tu api/estudiantes.ts
    getGeneros, 
    getSalas, 
    type Estudiante,
    type Genero, 
    type Sala 
} from "../api/estudiantes"
import { getEscuelas, type Escuela } from "../api/escuelas"

interface EstudianteFormProps {
    onCancel: () => void
    onSuccess: (estudiante: any) => void
    estudianteAEditar?: Estudiante | null // Prop para detectar si estamos editando
    aulaContext?: {
        aula_id: string
        sala_id: number
        escuela_id: string
        aulaLabel?: string
        escuelaNombre?: string | null
    } | null
}

export default function EstudianteForm({ onCancel, onSuccess, estudianteAEditar, aulaContext }: EstudianteFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isDirector, setIsDirector] = useState(false)

    // Datos para selectores
    const [generos, setGeneros] = useState<Genero[]>([])
    const [salas, setSalas] = useState<Sala[]>([])
    const [escuelas, setEscuelas] = useState<Escuela[]>([])

    const [formData, setFormData] = useState({
        dni: "",
        nombre: "",
        apellido: "",
        fecha_nacimiento: "",
        genero_id: "",
        sala_id: "",
        escuela_id: "",
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true)
            try {
                // 1. Obtener datos del usuario logueado
                const stored = localStorage.getItem("padiUser")
                const user = stored ? JSON.parse(stored) : null
                
                // 2. Cargar datos de los selectores
                const [genData, salasData] = await Promise.all([
                    getGeneros(),
                    getSalas(),
                ])
                setGeneros(genData)
                setSalas(salasData)

                // 3. Cargar escuelas solo para roles que pueden listar escuelas
                if (user?.rol === "equipo_padi" || user?.rol === "encargado_zona") {
                    const escData = await getEscuelas()
                    setEscuelas(escData)
                }

                // 4. Lógica de Pre-carga (Edición vs Creación por Director)
                if (estudianteAEditar) {
                    // MODO EDICIÓN
                    setFormData({
                        dni: estudianteAEditar.personas.dni || "",
                        nombre: estudianteAEditar.personas.nombre || "",
                        apellido: estudianteAEditar.personas.primer_apellido || "",
                        fecha_nacimiento: estudianteAEditar.personas.fecha_nacimiento?.split('T')[0] || "",
                        genero_id: estudianteAEditar.genero_id || "",
                        sala_id: String(estudianteAEditar.sala_id),
                        escuela_id: estudianteAEditar.escuela.escuela_id || "",
                    })
                } else if (aulaContext) {
                    // MODO CREACIÓN DESDE AULA (docente)
                    setFormData(prev => ({
                        ...prev,
                        sala_id: String(aulaContext.sala_id),
                        escuela_id: aulaContext.escuela_id,
                    }))
                } else if (user && user.rol === "director" && user.escuela_id) {
                    // MODO CREACIÓN (Director)
                    setFormData(prev => ({ ...prev, escuela_id: user.escuela_id }))
                    setIsDirector(true)
                }
            } catch (err: any) {
                setError("Error al cargar los datos necesarios.")
            } finally {
                setLoading(false)
            }
        }
        loadInitialData()
    }, [estudianteAEditar, aulaContext])

    const validate = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.dni) newErrors.dni = "El DNI es obligatorio"
        if (!formData.nombre) newErrors.nombre = "El nombre es obligatorio"
        if (!formData.apellido) newErrors.apellido = "El apellido es obligatorio"
        if (!formData.fecha_nacimiento) newErrors.fecha_nacimiento = "La fecha de nacimiento es obligatoria"
        if (!formData.genero_id) newErrors.genero_id = "Seleccione un género"
        if (!formData.sala_id) newErrors.sala_id = "Seleccione una sala"
        if (!formData.escuela_id) newErrors.escuela_id = "Seleccione una institución"
        
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleChange = (e: any) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return

        setLoading(true)
        setError(null)
        try {
            if (estudianteAEditar) {
                // Actualizar estudiante existente
                const actualizado = await updateEstudiante(estudianteAEditar.id, {
                    ...formData,
                    sala_id: Number(formData.sala_id)
                })
                onSuccess(actualizado)
            } else {
                // Crear nuevo estudiante
                const nuevo = await createEstudiante({
                    ...formData,
                    sala_id: Number(formData.sala_id),
                    aula_id: aulaContext?.aula_id,
                })
                onSuccess(nuevo)
            }
        } catch (err: any) {
            setError(err.message || "Error al procesar la solicitud")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={onCancel} sx={{ mr: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {estudianteAEditar ? "Modificar Datos del Estudiante" : "Registrar Nuevo Estudiante"}
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth label="DNI" name="dni" variant="filled"
                        value={formData.dni} onChange={handleChange}
                        error={!!errors.dni} helperText={errors.dni}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth label="Fecha de Nacimiento" name="fecha_nacimiento" type="date"
                        variant="filled" InputLabelProps={{ shrink: true }}
                        value={formData.fecha_nacimiento} onChange={handleChange}
                        error={!!errors.fecha_nacimiento} helperText={errors.fecha_nacimiento}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth label="Nombre" name="nombre" variant="filled"
                        value={formData.nombre} onChange={handleChange}
                        error={!!errors.nombre} helperText={errors.nombre}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth label="Apellido" name="apellido" variant="filled"
                        value={formData.apellido} onChange={handleChange}
                        error={!!errors.apellido} helperText={errors.apellido}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant="filled" error={!!errors.genero_id}>
                        <InputLabel>Género</InputLabel>
                        <Select name="genero_id" value={formData.genero_id} onChange={handleChange}>
                            {generos.map((g) => (
                                <MenuItem key={g.id} value={g.id}>{g.descripcion}</MenuItem>
                            ))}
                        </Select>
                        {errors.genero_id && <FormHelperText>{errors.genero_id}</FormHelperText>}
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant="filled" error={!!errors.sala_id}>
                        <InputLabel>Sala / Comisión</InputLabel>
                        <Select
                            name="sala_id"
                            value={formData.sala_id}
                            onChange={handleChange}
                            disabled={!!aulaContext && !estudianteAEditar}
                        >
                            {salas.map((s) => (
                                <MenuItem key={s.id} value={String(s.id)}>{s.nombre} ({s.grado}° grado)</MenuItem>
                            ))}
                        </Select>
                        {errors.sala_id && <FormHelperText>{errors.sala_id}</FormHelperText>}
                    </FormControl>
                </Grid>

                <Grid item xs={12}>
                    <FormControl 
                        fullWidth variant="filled" 
                        error={!!errors.escuela_id} 
                        disabled={(isDirector && !estudianteAEditar) || (!!aulaContext && !estudianteAEditar)} // Bloqueado para director o creación desde aula
                    >
                        <InputLabel>Institución / Escuela</InputLabel>
                        <Select name="escuela_id" value={formData.escuela_id} onChange={handleChange}>
                            {isDirector ? (
                                <MenuItem value={formData.escuela_id}>Mi institución asignada</MenuItem>
                            ) : (
                                escuelas.map((e) => (
                                    <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>
                                ))
                            )}
                        </Select>
                        {isDirector && <FormHelperText>Escuela vinculada automáticamente a tu perfil de director.</FormHelperText>}
                        {!!aulaContext && !estudianteAEditar && (
                            <FormHelperText>
                                Aula asignada: {aulaContext.aulaLabel || "Aula"} ({aulaContext.escuelaNombre || "Escuela"})
                            </FormHelperText>
                        )}
                    </FormControl>
                </Grid>
            </Grid>

            <Box sx={{ mt: 5, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={onCancel} sx={{ color: '#666' }}>Cancelar</Button>
                <Button 
                    type="submit" variant="contained" 
                    disabled={loading}
                    sx={{ bgcolor: '#000', px: 4, py: 1.5, borderRadius: 2, "&:hover": { bgcolor: "#333" } }}
                >
                    {loading ? <CircularProgress size={24} /> : (estudianteAEditar ? "Guardar Cambios" : "Registrar Estudiante")}
                </Button>
            </Box>
        </Box>
    )
}