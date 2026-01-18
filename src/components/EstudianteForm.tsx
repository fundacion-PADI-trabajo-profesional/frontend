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
    Container,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { createEstudiante, getGeneros, getSalas, type EstudianteCreado, type Genero, type Sala } from "../api/estudiantes"
import { getEscuelas, type Escuela } from "../api/escuelas";
import { SelectChangeEvent } from '@mui/material/Select';

interface EstudianteFormProps {
    onCancel: () => void
    onSuccess: (nuevoEstudiante: EstudianteCreado) => void
}

export default function EstudianteForm({ onCancel, onSuccess }: EstudianteFormProps) {
    const [formData, setFormData] = useState({
        dni: "",
        nombre: "",
        apellido: "",
        fecha_nacimiento: "",
        genero_id: "",
        sala_id: "",
        escuela_id: "",
    })
    const [errors, setErrors] = useState<{ [key: string]: string }>({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [loadingDropdowns, setLoadingDropdowns] = useState(true)
    const [generos, setGeneros] = useState<Genero[]>([])
    const [salas, setSalas] = useState<Sala[]>([])
    const [escuelas, setEscuelas] = useState<Escuela[]>([])

    // Cargar datos de dropdowns
    useEffect(() => {
        const loadDropdowns = async () => {
            try {
                const [generosData, salasData, escuelasData] = await Promise.all([getGeneros(), getSalas(), getEscuelas()])
                setGeneros(generosData)
                setSalas(salasData)
                setEscuelas(escuelasData)
            } catch (err: any) {
                setError("Error al cargar datos del formulario: " + err.message)
            } finally {
                setLoadingDropdowns(false)
            }
        }
        loadDropdowns()
    }, [])

    const validate = () => {
        const newErrors: { [key: string]: string } = {}

        if (!formData.dni) newErrors.dni = "El DNI es obligatorio"
        else if (!/^[0-9]+$/.test(formData.dni)) newErrors.dni = "Solo números sin puntos"
        else if (formData.dni.length < 7 || formData.dni.length > 9) newErrors.dni = "DNI inválido"

        if (!formData.nombre) newErrors.nombre = "El nombre es obligatorio"
        if (!formData.apellido) newErrors.apellido = "El apellido es obligatorio"
        if (!formData.fecha_nacimiento) newErrors.fecha_nacimiento = "La fecha de nacimiento es obligatoria"
        else if (new Date(formData.fecha_nacimiento) > new Date()) newErrors.fecha_nacimiento = "La fecha no puede ser futura"

        if (!formData.genero_id) newErrors.genero_id = "El género es obligatorio"
        if (!formData.sala_id) newErrors.sala_id = "La sala es obligatoria"
        if (!formData.escuela_id) newErrors.escuela_id = "La escuela es obligatoria"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    //     const { name, value } = e.target
    //     setFormData(prev => ({ ...prev, [name!]: value }))
    // }

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        if (!validate()) return

        setLoading(true)
        try {
            console.log("ID de escuela seleccionado:", formData.escuela_id);
            const nuevoEstudiante = await createEstudiante({
                ...formData,
                sala_id: Number(formData.sala_id),
                escuela_id: formData.escuela_id,
            })
            onSuccess(nuevoEstudiante)
        } catch (err: any) {
            setError(err.message || "Error al crear el estudiante.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Container maxWidth="sm" sx={{ p: 0 }}>
            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    bgcolor: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "100vh",
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        p: 2,
                        borderBottom: "1px solid #e0e0e0",
                        position: "sticky",
                        top: 0,
                        bgcolor: "white",
                        zIndex: 10,
                    }}
                >
                    <IconButton onClick={onCancel} aria-label="Volver">
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 600, ml: 1 }}>
                        Nuevo estudiante
                    </Typography>
                </Box>

                {/* Form */}
                <Box sx={{ p: 3, flexGrow: 1, overflowY: "auto" }}>
                    {loadingDropdowns ? (
                        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, color: "#333" }}>
                                    Datos personales
                                </Typography>
                            </Grid>

                            {/* DNI */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    variant="filled"
                                    label="DNI"
                                    name="dni"
                                    type="tel"
                                    value={formData.dni}
                                    onChange={handleChange}
                                    error={Boolean(errors.dni)}
                                    helperText={errors.dni}
                                />
                            </Grid>

                            {/* Nombre */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    variant="filled"
                                    label="Nombre"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    error={Boolean(errors.nombre)}
                                    helperText={errors.nombre}
                                />
                            </Grid>

                            {/* Apellido */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    variant="filled"
                                    label="Apellido"
                                    name="apellido"
                                    value={formData.apellido}
                                    onChange={handleChange}
                                    error={Boolean(errors.apellido)}
                                    helperText={errors.apellido}
                                />
                            </Grid>

                            {/* Fecha nacimiento */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    variant="filled"
                                    label="Fecha de nacimiento"
                                    name="fecha_nacimiento"
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.fecha_nacimiento}
                                    onChange={handleChange}
                                    error={Boolean(errors.fecha_nacimiento)}
                                    helperText={errors.fecha_nacimiento}
                                />
                            </Grid>

                            {/* Género */}
                            <Grid item xs={12}>
                                <FormControl fullWidth variant="filled" error={Boolean(errors.genero_id)}>
                                    <InputLabel id="genero-label">Género</InputLabel>
                                    <Select
                                        labelId="genero-label"
                                        name="genero_id"
                                        value={formData.genero_id}
                                        onChange={handleChange}
                                    >
                                        <MenuItem value="" disabled>
                                            <em>Seleccionar género</em>
                                        </MenuItem>
                                        {generos.map(g => (
                                            <MenuItem key={g.id} value={g.id}>
                                                {g.descripcion}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <FormHelperText>{errors.genero_id}</FormHelperText>
                                </FormControl>
                            </Grid>

                            {/* Sala */}
                            <Grid item xs={12}>
                                <FormControl fullWidth variant="filled" error={Boolean(errors.sala_id)}>
                                    <InputLabel id="sala-label">Sala / Comisión</InputLabel>
                                    <Select
                                        labelId="sala-label"
                                        name="sala_id"
                                        value={formData.sala_id}
                                        onChange={handleChange}
                                    >
                                        <MenuItem value="" disabled>
                                            <em>Seleccionar sala</em>
                                        </MenuItem>
                                        {salas.map(s => (
                                            <MenuItem key={s.id} value={s.id}>
                                                {s.nombre}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <FormHelperText>{errors.sala_id}</FormHelperText>
                                </FormControl>
                            </Grid>

                            {/* Escuela */}
                            <Grid item xs={12}>
                                <FormControl fullWidth variant="filled" error={Boolean(errors.escuela_id)}>
                                    <InputLabel id="escuela-label">Escuela / Institución</InputLabel>
                                    <Select
                                        labelId="escuela-label"
                                        name="escuela_id"
                                        value={formData.escuela_id}
                                        onChange={handleChange}
                                    >
                                        <MenuItem value="" disabled>
                                            <em>Seleccionar institución</em>
                                        </MenuItem>
                                        {escuelas.map((e) => (
                                            <MenuItem key={e.id} value={e.id}>
                                                {e.id} - {e.nombre}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <FormHelperText>{errors.escuela_id}</FormHelperText>
                                </FormControl>
                            </Grid>

                            {error && (
                                <Grid item xs={12}>
                                    <Alert severity="error">{error}</Alert>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </Box>

                {/* Footer */}
                <Box
                    sx={{
                        p: 2,
                        borderTop: "1px solid #e0e0e0",
                        position: "sticky",
                        bottom: 0,
                        bgcolor: "white",
                        zIndex: 10,
                    }}
                >
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={loading || loadingDropdowns}
                        sx={{
                            bgcolor: loading || loadingDropdowns ? "#ccc" : "#000",
                            color: "#fff",
                            textTransform: "none",
                            py: 1.5,
                            fontSize: "1rem",
                            borderRadius: 2,
                            "&:hover": { bgcolor: "#333" },
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Continuar"}
                    </Button>
                </Box>
            </Box>
        </Container>
    )
}
