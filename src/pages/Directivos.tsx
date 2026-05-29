import { useEffect, useState } from "react"
import { Box, Container, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useNavigate } from "react-router-dom"
import { getDirectivos, type Directivo, asignarEscuelaADirectivo } from "../api/directivos"
import { getEscuelas, type Escuela } from "../api/escuelas"

export default function DirectivosPage() {
    const [items, setItems] = useState<Directivo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [escuelas, setEscuelas] = useState<Escuela[]>([])
    const [selectedDirectivo, setSelectedDirectivo] = useState<Directivo | null>(null)
    const [selectedEscuelaId, setSelectedEscuelaId] = useState<string>("")
    const [dialogOpen, setDialogOpen] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const [directivosData, escuelasData] = await Promise.all([
                    getDirectivos(),
                    getEscuelas(),
                ])
                setItems(directivosData)
                setEscuelas(escuelasData)
            } catch (e: any) {
                setError(e.message || "Error al cargar directivos")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const openAsignarEscuela = (directivo: Directivo) => {
        setSelectedDirectivo(directivo)
        setSelectedEscuelaId(directivo.escuela?.id || "")
        setDialogOpen(true)
    }

    const closeDialog = () => {
        setDialogOpen(false)
        setSelectedDirectivo(null)
        setSelectedEscuelaId("")
    }

    const handleAsignar = async () => {
        if (!selectedDirectivo || !selectedEscuelaId) return
        try {
            await asignarEscuelaADirectivo(selectedDirectivo.id, selectedEscuelaId)
            const updated = await getDirectivos()
            setItems(updated)
            closeDialog()
        } catch (e: any) {
            setError(e.message || "Error al asignar escuela")
        }
    }

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
            <Box sx={{ bgcolor: "#f5f5f5", py: 4, borderBottom: "1px solid #e0e0e0" }}>
                <Container maxWidth="lg">
                    <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/home")} sx={{ color: "#5c7cfa", textTransform: "none", mb: 2 }}>
                        Volver a inicio
                    </Button>
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
                        Directivos
                    </Typography>
                    <Typography variant="body1" sx={{ color: "#666" }}>
                        Listado de directivos del sistema
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : items.length === 0 ? (
                    <Typography sx={{ color: "#666" }}>No hay directivos registrados.</Typography>
                ) : (
                    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                        <Table>
                            <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                                <TableRow>
                                    <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Apellido</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Nombre</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Escuela asignada</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((d) => (
                                    <TableRow
                                        key={d.id}
                                        hover
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell align="center">{d.apellido}</TableCell>
                                        <TableCell align="center">{d.nombre}</TableCell>
                                        <TableCell align="center">{d.escuela?.nombre || "Sin asignar"}</TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                <Button
                                                    size="small"
                                                    sx={{ textTransform: "none" }}
                                                    onClick={() => openAsignarEscuela(d)}
                                                >
                                                    Asignar escuela
                                                </Button>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Container>
            <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
                <DialogTitle>Asignar escuela a directivo</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>
                        {selectedDirectivo
                            ? `Directivo: ${selectedDirectivo.apellido}, ${selectedDirectivo.nombre}`
                            : ""}
                    </Typography>
                    <TextField
                        select
                        fullWidth
                        label="Escuela"
                        value={selectedEscuelaId}
                        onChange={(e) => setSelectedEscuelaId(e.target.value)}
                    >
                        {escuelas.map((e) => (
                            <MenuItem key={e.id} value={e.id}>
                                {e.nombre} {e.zona?.nombre ? `(${e.zona.nombre})` : ''}
                            </MenuItem>
                        ))}
                        {escuelas.length === 0 && (
                            <MenuItem disabled>No hay escuelas disponibles</MenuItem>
                        )}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={handleAsignar}
                        disabled={!selectedEscuelaId}
                    >
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}


