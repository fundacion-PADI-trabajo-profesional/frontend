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
} from "../../api/estudiantes"
import { getEscuelas, type Escuela } from "../../api/escuelas"
import { getAulasPorEscuela, type Aula } from "../../api/aulas";
import { filtrarAulasParaEstudiante } from "../../utils/docentes-aulas";

interface EstudianteFormProps {
    onCancel: () => void
    onSuccess: (estudiante: Estudiante | import("../../api/estudiantes").EstudianteCreado) => void
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

    const [aulasDisponibles, setAulasDisponibles] = useState<Aula[]>([]);

    const [formData, setFormData] = useState({
        dni: "",
        nombre: "",
        apellido: "",
        fecha_nacimiento: "",
        genero_id: "",
        sala_id: "",
        escuela_id: "",
        aula_id: "", // Nuevo campo para asignar aula al estudiante (opcional)
    })

    const handleAulaChange = (aulaId: string) => {
        // 1. Buscamos el objeto aula completo en nuestra lista de disponibles
        const aulaSeleccionada = aulasDisponibles.find(a => a.id === aulaId);

        if (aulaSeleccionada) {
            // 2. Si seleccionó un aula, actualizamos aula_id Y sala_id automáticamente
            setFormData({
                ...formData,
                aula_id: aulaId,
                sala_id: String(aulaSeleccionada.sala_id) // Sincronizamos la sala
            });
        } else {
            // Si deselecciona el aula
            setFormData({ ...formData, aula_id: "" });
        }
    };

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
                    if (user && user.rol === "director" && user.escuela_id) {
                        // MODO DIRECTOR (Nuevo estudiante)
                        setIsDirector(true)
                        setFormData(prev => ({
                            ...prev,
                            escuela_id: user.escuela_id // Institución automática
                        }))
                    }

                    // MODO EDICIÓN
                    setFormData({
                        dni: estudianteAEditar.personas.dni || "",
                        nombre: estudianteAEditar.personas.nombre || "",
                        apellido: estudianteAEditar.personas.primer_apellido || "",
                        fecha_nacimiento: estudianteAEditar.personas.fecha_nacimiento?.split('T')[0] || "",
                        genero_id: estudianteAEditar.genero_id || "",
                        sala_id: String(estudianteAEditar.sala_id), // Sala ya asignada
                        escuela_id: estudianteAEditar.escuela.escuela_id || "",
                        aula_id: estudianteAEditar.aula_asignada?.id || "",
                    })
                } else if (aulaContext) {
                    // MODO DOCENTE (Viene de aula específica)
                    setFormData(prev => ({
                        ...prev,
                        sala_id: String(aulaContext.sala_id),
                        escuela_id: aulaContext.escuela_id,
                        aula_id: aulaContext.aula_id,
                    }))
                } else if (user && user.rol === "director" && user.escuela_id) {
                    // MODO DIRECTOR (Nuevo estudiante)
                    setIsDirector(true)
                    setFormData(prev => ({
                        ...prev,
                        escuela_id: user.escuela_id // Institución automática
                    }))
                }
            } catch {
                setError("Error al cargar los datos necesarios.")
            } finally {
                setLoading(false)
            }
        }
        loadInitialData()
    }, [estudianteAEditar, aulaContext])

    useEffect(() => {
        const fetchAulas = async () => {
            if (formData.escuela_id) {
                try {
                    const data = await getAulasPorEscuela(formData.escuela_id);
                    setAulasDisponibles(data);
                    // Si el aula seleccionada previamente no pertenece a la nueva escuela, la limpiamos
                    setFormData(prev => ({ ...prev, aula_id: estudianteAEditar?.aula_asignada?.id || "" }));
                } catch (err) {
                    console.error("Error cargando aulas:", err);
                }
            } else {
                setAulasDisponibles([]);
            }
        };

        // Si ya tenemos un aulaContext (venimos de la vista de aula), no hace falta buscar
        if (!aulaContext) {
            fetchAulas();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.escuela_id, aulaContext]);

    const validate = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.dni) newErrors.dni = "El DNI es obligatorio"
        if (!formData.nombre) newErrors.nombre = "El nombre es obligatorio"
        if (!formData.apellido) newErrors.apellido = "El apellido es obligatorio"
        //if (!formData.fecha_nacimiento) newErrors.fecha_nacimiento = "La fecha de nacimiento es obligatoria"
        if (!formData.genero_id) newErrors.genero_id = "Seleccione un género"
        if (!formData.sala_id) newErrors.sala_id = "Seleccione una sala"
        if (!formData.escuela_id) newErrors.escuela_id = "Seleccione una institución"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return

        console.log("Enviando a la API:", formData);

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
                    aula_id: formData.aula_id || "",
                })
                onSuccess(nuevo)
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al procesar la solicitud")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
            {/* CABECERA */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={onCancel} sx={{ mr: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {estudianteAEditar ? "Modificar Datos del Estudiante" : "Registrar Nuevo Estudiante"}
                </Typography>
            </Box>

            {/* BANNER PARA DOCENTES (Solo si viene de aulaContext) */}
            {!!aulaContext && !estudianteAEditar && (
                <Box sx={{
                    mb: 4, p: 2.5, bgcolor: '#f0f4ff', borderLeft: '6px solid #3b5bdb',
                    borderRadius: '4px 12px 12px 4px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <Typography variant="overline" sx={{ color: '#3b5bdb', fontWeight: 900, fontSize: '0.75rem', letterSpacing: 1 }}>
                        REGISTRANDO EN
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#1c1e21', fontWeight: 800, mt: 0.5 }}>
                        {aulaContext.aulaLabel}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: '#495057', fontWeight: 500 }}>
                        Institución: <span style={{ color: '#000' }}>{aulaContext.escuelaNombre}</span>
                    </Typography>
                </Box>
            )}

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Grid container spacing={3}>
                {/* DATOS PERSONALES */}
                <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="DNI" name="dni" variant="filled" value={formData.dni} onChange={handleChange} error={!!errors.dni} helperText={errors.dni} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Fecha de Nacimiento" name="fecha_nacimiento" type="date" variant="filled" InputLabelProps={{ shrink: true }} value={formData.fecha_nacimiento} onChange={handleChange} error={!!errors.fecha_nacimiento} helperText={errors.fecha_nacimiento} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Nombre" name="nombre" variant="filled" value={formData.nombre} onChange={handleChange} error={!!errors.nombre} helperText={errors.nombre} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Apellido" name="apellido" variant="filled" value={formData.apellido} onChange={handleChange} error={!!errors.apellido} helperText={errors.apellido} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant="filled" error={!!errors.genero_id}>
                        <InputLabel>Género</InputLabel>
                        <Select name="genero_id" value={formData.genero_id} onChange={handleChange}>
                            {generos.map((g) => <MenuItem key={g.id} value={g.id}>{g.descripcion}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>

                {/* SECCIÓN DE UBICACIÓN ACADÉMICA */}
                {!aulaContext ? (
                    <>
                        {/* SALA: Libre si es nuevo, Bloqueada si es edición */}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth variant="filled" error={!!errors.sala_id} disabled={!!estudianteAEditar}>
                                <InputLabel>Sala</InputLabel>
                                <Select name="sala_id" value={formData.sala_id} onChange={handleChange}>
                                    {salas.map((s) => (
                                        <MenuItem key={s.id} value={String(s.id)}>{s.nombre}</MenuItem>
                                    ))}
                                </Select>
                                {estudianteAEditar && <FormHelperText>La sala no es editable en esta vista.</FormHelperText>}
                            </FormControl>
                        </Grid>

                        {/* LA ESCUELA SOLO SE MUESTRA SI NO ES DIRECTOR (Ej: Admin PADI) */}
                        {!isDirector && (
                            <Grid item xs={12}>
                                <FormControl fullWidth variant="filled" error={!!errors.escuela_id}>
                                    <InputLabel>Institución / Escuela</InputLabel>
                                    <Select
                                        name="escuela_id"
                                        value={escuelas.length > 0 ? formData.escuela_id : ""}
                                        onChange={handleChange}
                                    >
                                        {escuelas.map((e) => (
                                            <MenuItem key={e.id} value={e.id}>{e.nombre}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {/* AULA: requiere colegio seleccionado previamente */}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small" disabled={!formData.escuela_id}>
                                <InputLabel>Aula (Opcional)</InputLabel>
                                <Select
                                    label="Aula"
                                    value={formData.aula_id || ""}
                                    onChange={(e) => handleAulaChange(e.target.value)}
                                >
                                    <MenuItem value=""><em>Sin asignar</em></MenuItem>
                                    {filtrarAulasParaEstudiante(aulasDisponibles, formData.escuela_id, formData.sala_id)
                                        .map((aula) => (
                                            <MenuItem key={aula.id} value={aula.id}>
                                                {aula.sala?.nombre} - {aula.comision} ({aula.turno})
                                            </MenuItem>
                                        ))}
                                </Select>
                                {!formData.escuela_id && (
                                    <FormHelperText>Seleccioná un colegio primero</FormHelperText>
                                )}
                            </FormControl>
                        </Grid>
                    </>
                ) : (
                    /* VISTA DOCENTE */
                    <Grid item xs={12}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', bgcolor: '#f8f9fa', p: 2, borderRadius: 2, border: '1px dashed #dee2e6' }}>
                            📍 Institución y Aula configuradas automáticamente.
                        </Typography>
                    </Grid>
                )}
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