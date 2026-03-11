"use client"

import { useEffect, useState } from "react"
import { Box, Container, Typography, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, CircularProgress, Alert, Button, Stack, Chip, MenuItem, TextField } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useNavigate } from "react-router-dom"
import { asignarDocenteAEscuela, desasignarDocenteDeEscuela, getDocentes, type Docente } from "../api/docentes"
import { getEscuelas, type Escuela } from "../api/escuelas"
// import { getEvaluacionesInstanciasByProfesor } from "../api/evaluaciones"

export default function DocentesPage() {
  const [items, setItems] = useState<Docente[]>([])
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [selectedDocente, setSelectedDocente] = useState<Docente | null>(null)
  const [selectedEscuelaId, setSelectedEscuelaId] = useState("")
  const [saving, setSaving] = useState(false)
  const [currentRole, setCurrentRole] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const canManageAsignaciones = currentRole === "equipo_padi" || currentRole === "encargado_zona"

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const stored = localStorage.getItem("padiUser")
      const user = stored ? JSON.parse(stored) : null
      setCurrentRole(user?.rol || "")

      const [docentesData, escuelasData] = await Promise.all([
        getDocentes(),
        (user?.rol === "equipo_padi" || user?.rol === "encargado_zona")
          ? getEscuelas()
          : Promise.resolve([] as Escuela[]),
      ])
      setItems(docentesData)
      setEscuelas(escuelasData)
    } catch (e: any) {
      setError(e.message || "Error al cargar docentes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const formatAulaLabel = (aula: NonNullable<Docente["aulas"]>[number]) => {
    const grado = aula.grado ?? "?"
    const escuela = aula.escuelaNombre ? ` - ${aula.escuelaNombre}` : ""
    return `${grado}° - ${aula.comision} (${aula.turno})${escuela}`
  }

  const formatEscuelaLabel = (escuela: NonNullable<Docente["escuelas"]>[number]) => escuela.nombre || "Colegio sin nombre"

  const getEscuelasDisponiblesParaDocente = (docente: Docente) => {
    const assignedIds = new Set((docente.escuelas || []).map((e) => e.id))
    return escuelas.filter((e) => !assignedIds.has(e.id))
  }

  const handleOpenAsignarColegio = (docente: Docente) => {
    setSelectedDocente(docente)
    setSelectedEscuelaId("")
  }

  const handleCloseAsignarColegio = () => {
    setSelectedDocente(null)
    setSelectedEscuelaId("")
  }

  const handleConfirmAsignar = async () => {
    if (!selectedDocente || !selectedEscuelaId) return
    try {
      setSaving(true)
      await asignarDocenteAEscuela(selectedDocente.id, selectedEscuelaId)
      await loadData()
      handleCloseAsignarColegio()
    } catch (e: any) {
      setError(e.message || "Error al asignar colegio")
    } finally {
      setSaving(false)
    }
  }

  const handleDesasignarColegio = async (docenteId: string, escuelaId: string) => {
    const ok = window.confirm("¿Quitar este docente del colegio? También se cerrarán sus asignaciones a aulas de ese colegio.")
    if (!ok) return
    try {
      setSaving(true)
      await desasignarDocenteDeEscuela(docenteId, escuelaId)
      await loadData()
    } catch (e: any) {
      setError(e.message || "Error al desasignar colegio")
    } finally {
      setSaving(false)
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
                  <TableCell align="center" sx={{ fontWeight: "bold", color: "#444" }}>Colegios asignados</TableCell>
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
                    onClick={() => navigate(`/evaluaciones?docenteId=${d.id}&backTo=/docentes&backLabel=Volver%20a%20docentes`)}
                  >
                    <TableCell align="center">{d.apellido}</TableCell>
                    <TableCell align="center">{d.nombre}</TableCell>
                    <TableCell align="center">
                      {!d.escuelas || d.escuelas.length === 0 ? (
                        <Typography variant="body2" sx={{ color: "#777" }}>
                          Sin asignar
                        </Typography>
                      ) : (
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="center">
                          {d.escuelas.map((escuela) => (
                            <Chip
                              key={escuela.id}
                              size="small"
                              label={formatEscuelaLabel(escuela)}
                              onDelete={canManageAsignaciones ? () => handleDesasignarColegio(d.id, escuela.id) : undefined}
                            />
                          ))}
                        </Stack>
                      )}
                    </TableCell>
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
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button size="small" variant="text">
                          Ver evaluaciones
                        </Button>
                        {canManageAsignaciones && (
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={saving}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenAsignarColegio(d)
                            }}
                          >
                            Asignar colegio
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>

      {selectedDocente && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1300,
          }}
        >
          <Box sx={{ bgcolor: "#fff", p: 3, borderRadius: 2, minWidth: 420, maxWidth: 520 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Asignar colegio
            </Typography>
            <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
              {selectedDocente.apellido}, {selectedDocente.nombre}
            </Typography>

            <TextField
              select
              fullWidth
              size="small"
              label="Colegio"
              value={selectedEscuelaId}
              onChange={(e) => setSelectedEscuelaId(e.target.value)}
              sx={{ mb: 2 }}
            >
              {getEscuelasDisponiblesParaDocente(selectedDocente).map((escuela) => (
                <MenuItem key={escuela.id} value={escuela.id}>
                  {escuela.nombre}
                </MenuItem>
              ))}
              {getEscuelasDisponiblesParaDocente(selectedDocente).length === 0 && (
                <MenuItem disabled>No hay colegios disponibles</MenuItem>
              )}
            </TextField>

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={handleCloseAsignarColegio} disabled={saving}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleConfirmAsignar}
                disabled={!selectedEscuelaId || saving}
              >
                Asignar
              </Button>
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  )
}


