"use client"

import { useEffect, useState } from "react"
import { Box, Container, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, CircularProgress, Alert, Button } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useNavigate } from "react-router-dom"
import { getDirectivos, type Directivo } from "../api/directivos"

export default function DirectivosPage() {
    const [items, setItems] = useState<Directivo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await getDirectivos()
                setItems(data)
            } catch (e: any) {
                setError(e.message || "Error al cargar directivos")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

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
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Apellido</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((d) => (
                                    <TableRow
                                        key={d.id}
                                        hover
                                        sx={{ cursor: "pointer" }}

                                    >
                                        <TableCell>{d.apellido}</TableCell>
                                        <TableCell>{d.nombre}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Container>
        </Box>
    )
}


