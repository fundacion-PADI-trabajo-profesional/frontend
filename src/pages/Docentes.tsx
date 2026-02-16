"use client"

import { useEffect, useState } from "react"
import { Box, Container, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, CircularProgress, Alert, Button, Stack, Chip } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useNavigate } from "react-router-dom"
import { getDocentes, type Docente } from "../api/docentes"
// import { getEvaluacionesInstanciasByProfesor } from "../api/evaluaciones"

export default function DocentesPage() {
  const [items, setItems] = useState<Docente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getDocentes()
        setItems(data)
      } catch (e: any) {
        setError(e.message || "Error al cargar docentes")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formatAulaLabel = (aula: NonNullable<Docente["aulas"]>[number]) => {
    const grado = aula.grado ?? "?"
    const escuela = aula.escuelaNombre ? ` - ${aula.escuelaNombre}` : ""
    return `${grado}° - ${aula.comision} (${aula.turno})${escuela}`
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
      <Box sx={{ bgcolor: "#f5f5f5", py: 4, borderBottom: "1px solid #e0e0e0" }}>
        <Container maxWidth="lg">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/home")} sx={{ color: "#5c7cfa", textTransform: "none", mb: 2 }}>
            Volver a inicio
          </Button>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
            Docentes
          </Typography>
          <Typography variant="body1" sx={{ color: "#666" }}>
            Listado de docentes del sistema
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
          <Typography sx={{ color: "#666" }}>No hay docentes registrados.</Typography>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <Table>
              <TableHead sx={{ bgcolor: "#f8f9fa" }}>
                <TableRow>
                  <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Apellido</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Nombre</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Aulas asignadas</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((d) => (
                  <TableRow
                    key={d.id}
                    hover
                    sx={{ cursor: "pointer", '&:last-child td, &:last-child th': { border: 0 } }}
                    onClick={() => navigate(`/evaluaciones-docente?profesorId=${d.id}&nombre=${encodeURIComponent(`${d.apellido}, ${d.nombre}`)}`)}
                  >
                    <TableCell align="center">{d.apellido}</TableCell>
                    <TableCell align="center">{d.nombre}</TableCell>
                    <TableCell align="center">
                      {!d.aulas || d.aulas.length === 0 ? (
                        <Typography variant="body2" sx={{ color: "#777" }}>
                          Sin aulas asignadas
                        </Typography>
                      ) : (
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="center">
                          {d.aulas.map((aula) => (
                            <Chip key={aula.id} size="small" label={formatAulaLabel(aula)} />
                          ))}
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell align="center">Ver evaluaciones</TableCell>
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


