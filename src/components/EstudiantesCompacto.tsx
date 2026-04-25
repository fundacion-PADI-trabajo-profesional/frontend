import React, { useMemo, useState } from "react"
import {
    Box, Typography, IconButton, Menu, MenuItem,
    ListItemIcon, Tooltip, Paper,
} from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import AssessmentIcon from "@mui/icons-material/Assessment"
import EditIcon from "@mui/icons-material/Edit"
import VisibilityIcon from "@mui/icons-material/Visibility"
import SpeedDial from "@mui/material/SpeedDial"
import SpeedDialIcon from "@mui/material/SpeedDialIcon"
import SpeedDialAction from "@mui/material/SpeedDialAction"
import PersonAddIcon from "@mui/icons-material/PersonAdd"
import UploadFileIcon from "@mui/icons-material/UploadFile"
import { useNavigate } from "react-router-dom"
import type { Estudiante, EvaluacionAño } from "../api/estudiantes"
import { permissions } from "../utils/permissions"

interface Props {
    estudiantes: Estudiante[]
    onAddEstudiante: () => void
    onEditEstudiante: (est: Estudiante) => void
    onBulkAdd: () => void
    userRole: string
}

type GrupoComision = { label: string; sinAula: boolean; estudiantes: Estudiante[] }
type GrupoSala = { nombre: string; sala_id: number; comisiones: GrupoComision[]; total: number }
type GrupoEscuela = { id: string; nombre: string; zona_nombre: string | null; salas: GrupoSala[]; total: number }

function agrupar(estudiantes: Estudiante[]): GrupoEscuela[] {
    const mapEscuelas = new Map<string, GrupoEscuela>()
    for (const est of estudiantes) {
        const escId = est.escuela.escuela_id
        if (!mapEscuelas.has(escId)) {
            mapEscuelas.set(escId, { id: escId, nombre: est.escuela.nombre ?? "Sin escuela", zona_nombre: est.escuela.zona_nombre ?? null, salas: [], total: 0 })
        }
        const escGrupo = mapEscuelas.get(escId)!
        escGrupo.total++
        let salaGrupo = escGrupo.salas.find(s => s.sala_id === est.sala_id)
        if (!salaGrupo) {
            salaGrupo = { nombre: est.salas?.nombre ?? "Sin sala", sala_id: est.sala_id, comisiones: [], total: 0 }
            escGrupo.salas.push(salaGrupo)
        }
        salaGrupo.total++
        const sinAula = !est.aula_asignada
        const comisionLabel = sinAula ? "Sin aula asignada" : `${est.aula_asignada!.comision} · ${est.aula_asignada!.turno}`
        let comisionGrupo = salaGrupo.comisiones.find(c => c.label === comisionLabel)
        if (!comisionGrupo) {
            comisionGrupo = { label: comisionLabel, sinAula, estudiantes: [] }
            salaGrupo.comisiones.push(comisionGrupo)
        }
        comisionGrupo.estudiantes.push(est)
    }
    const result = Array.from(mapEscuelas.values())
    for (const esc of result) {
        esc.salas.sort((a, b) => a.sala_id - b.sala_id)
        for (const sala of esc.salas) {
            sala.comisiones.sort((a, b) => a.sinAula ? 1 : b.sinAula ? -1 : a.label.localeCompare(b.label))
            for (const com of sala.comisiones) {
                com.estudiantes.sort((a, b) => (a.personas.primer_apellido ?? "").localeCompare(b.personas.primer_apellido ?? ""))
            }
        }
    }
    return result.sort((a, b) => a.nombre.localeCompare(b.nombre))
}

const ESTADO_COLOR: Record<string, string> = { A: "#2e7d32", E: "#f9a825", D: "#d32f2f", N: "#bdbdbd" }
const ESTADO_LABEL: Record<string, string> = { A: "Aprobada", E: "En progreso", D: "Desaprobada", N: "No evaluada" }

function EvalDot({ estado, label }: { estado: string | null; label: string }) {
    return (
        <Tooltip title={`${label}: ${estado ? (ESTADO_LABEL[estado] ?? estado) : "Sin evaluación"}`}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, bgcolor: estado ? (ESTADO_COLOR[estado] ?? "#ccc") : "transparent", border: "1px solid #bbb" }} />
        </Tooltip>
    )
}

function EvalDots({ historial, salaId, allSalaIds, salaNombresMap }: {
    historial: EvaluacionAño[]
    salaId: number
    allSalaIds: number[]
    salaNombresMap: Map<number, string>
}) {
    const historialMap = new Map(historial.map(h => [h.sala_id, h]))
    const salaIdx = allSalaIds.indexOf(salaId)
    const expectedSalaIds = allSalaIds.slice(0, salaIdx + 1)
    if (expectedSalaIds.length === 0) return null
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
            {expectedSalaIds.map((sid, i) => {
                const ev = historialMap.get(sid)
                const nombre = salaNombresMap.get(sid) ?? `Sala ${sid}`
                return (
                    <React.Fragment key={sid}>
                        {i > 0 && <Box sx={{ width: 5, flexShrink: 0 }} />}
                        <EvalDot estado={ev?.inicial ?? null} label={`${nombre} – Inicio`} />
                        <EvalDot estado={ev?.cierre ?? null} label={`${nombre} – Cierre`} />
                    </React.Fragment>
                )
            })}
        </Box>
    )
}

export default function EstudiantesCompacto({ estudiantes, onAddEstudiante, onEditEstudiante, onBulkAdd, userRole }: Props) {
    const navigate = useNavigate()
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [selectedStudent, setSelectedStudent] = useState<Estudiante | null>(null)

    const grupos = useMemo(() => agrupar(estudiantes), [estudiantes])
    const isSingleEscuela = grupos.length <= 1

    const allSalaIds = useMemo(() => {
        const ids = new Set(estudiantes.map(e => e.sala_id))
        return Array.from(ids).sort((a, b) => a - b)
    }, [estudiantes])

    const salaNombresMap = useMemo(() => {
        const map = new Map<number, string>()
        for (const est of estudiantes) {
            if (est.salas?.nombre) map.set(est.sala_id, est.salas.nombre)
            for (const ev of est.evaluaciones_historial ?? []) {
                if (ev.sala_nombre) map.set(ev.sala_id, ev.sala_nombre)
            }
        }
        return map
    }, [estudiantes])

    const toggle = (key: string) => setExpanded(prev => {
        const next = new Set(prev)
        next.has(key) ? next.delete(key) : next.add(key)
        return next
    })
    const isExpanded = (key: string) => expanded.has(key)

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, est: Estudiante) => { setAnchorEl(e.currentTarget); setSelectedStudent(est) }
    const handleMenuClose = () => { setAnchorEl(null); setSelectedStudent(null) }

    const handleEvaluar = () => {
        if (selectedStudent) {
            const nombre = encodeURIComponent(`${selectedStudent.personas.nombre} ${selectedStudent.personas.primer_apellido}`)
            const aulaId = selectedStudent.aula_id || selectedStudent.aula_asignada?.id || selectedStudent.aula_asignada?.comision;
            let ruta = `/evaluaciones?estudianteId=${selectedStudent.id}&nombre=${nombre}&salaId=${selectedStudent.sala_id}`;
            
            if (aulaId) {
                ruta += `&aulaId=${aulaId}`;
            }

            ruta += `&backTo=${encodeURIComponent("/estudiantes")}&backLabel=${encodeURIComponent("Volver a estudiantes")}`;
            navigate(ruta);
        }
        handleMenuClose()
    }

    const handleVerMas = () => {
        if (selectedStudent) {
            const nombre = `${selectedStudent.personas.nombre} ${selectedStudent.personas.primer_apellido}`
            navigate(`/historial-estudiante?${new URLSearchParams({ estudianteId: selectedStudent.id, nombre, backTo: "/estudiantes", backLabel: "Volver a estudiantes" }).toString()}`)
        }
        handleMenuClose()
    }
    const handleModificar = () => { if (selectedStudent) onEditEstudiante(selectedStudent); handleMenuClose() }

    // Filas de alumnos dentro de una comisión
    const renderStudents = (com: GrupoComision, indent: number) =>
        com.estudiantes.map((est, idx) => (
            <Box key={est.id} sx={{
                display: "flex", alignItems: "center",
                pl: indent, pr: 0.5, py: 0.4,
                bgcolor: "#fff",
                borderBottom: idx < com.estudiantes.length - 1 ? "1px solid #f5f5f5" : "1px solid #eee",
                "&:hover": { bgcolor: "#fafafa" },
            }}>
                <Typography sx={{ fontSize: 13, flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", mr: 1 }}>
                    {est.personas.primer_apellido}, {est.personas.nombre}
                </Typography>
                <EvalDots historial={est.evaluaciones_historial ?? []} salaId={est.sala_id} allSalaIds={allSalaIds} salaNombresMap={salaNombresMap} />
                <IconButton size="small" onClick={(e) => handleMenuOpen(e, est)} sx={{ p: 0.25, ml: 0.5 }}>
                    <MoreVertIcon sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>
        ))

    // Header de comisión colapsable
    const renderComision = (com: GrupoComision, comKey: string, indentHeader: number, indentStudents: number) => {
        const comExpanded = isExpanded(comKey)
        return (
            <Box key={com.label}>
                <Box onClick={() => toggle(comKey)} sx={{
                    display: "flex", alignItems: "center",
                    bgcolor: com.sinAula ? "#fff8f0" : "#fafafa",
                    pl: indentHeader, pr: 1.5, py: 0.3,
                    cursor: "pointer", borderBottom: "1px solid #eee",
                    "&:hover": { filter: "brightness(0.97)" },
                }}>
                    {comExpanded
                        ? <ExpandMoreIcon sx={{ fontSize: 12, color: "#aaa", mr: 0.5, flexShrink: 0 }} />
                        : <ChevronRightIcon sx={{ fontSize: 12, color: "#aaa", mr: 0.5, flexShrink: 0 }} />
                    }
                    <Typography sx={{ fontSize: 12, fontStyle: "italic", color: com.sinAula ? "#e65100" : "#777", flexGrow: 1 }}>
                        {com.label}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: "#bbb", flexShrink: 0 }}>{com.estudiantes.length}</Typography>
                </Box>
                {comExpanded && renderStudents(com, indentStudents)}
            </Box>
        )
    }

    // Contenido de una sala (comisiones + alumnos) — reutilizado en ambos modos
    const renderSalaContent = (sala: GrupoSala, escId: string, comIndent: number, studIndent: number) =>
        sala.comisiones.map(com =>
            renderComision(com, `c:${escId}:${sala.sala_id}:${com.label}`, comIndent, studIndent)
        )

    // ── MODO DIRECTOR: carta por sala ────────────────────────────────────
    const renderSalaCard = (sala: GrupoSala, esc: GrupoEscuela) => (
        <Paper key={sala.sala_id} elevation={0} sx={{
            border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden",
            height: "100%", display: "flex", flexDirection: "column",
            borderTop: "3px solid #A3BE54",
        }}>
            {/* Header sala */}
            <Box sx={{ display: "flex", alignItems: "center", bgcolor: "#f5f5f5", px: 2, py: 0.9, borderBottom: "1px solid #eee" }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#A3BE54", mr: 1, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#444", flexGrow: 1 }}>
                    {sala.nombre}
                </Typography>
                <Box sx={{ bgcolor: "#A3BE54", color: "#fff", borderRadius: 10, px: 0.75, lineHeight: 1.6, flexShrink: 0 }}>
                    <Typography sx={{ fontSize: 11 }}>{sala.total}</Typography>
                </Box>
            </Box>
            {/* Comisiones */}
            <Box sx={{ flexGrow: 1 }}>
                {renderSalaContent(sala, esc.id, 1.5, 2.5)}
            </Box>
        </Paper>
    )

    // ── MODO ENCARGADO / PADI: carta por escuela ─────────────────────────
    const renderEscuelaCard = (esc: GrupoEscuela) => (
        <Paper key={esc.id} elevation={0} sx={{
            border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden",
            height: "100%", display: "flex", flexDirection: "column",
            borderTop: "3px solid #eaeffd",
        }}>
            {/* Header escuela */}
            <Box sx={{ bgcolor: "#eaeffd", px: 2, py: 0.9, borderBottom: "1px solid #d0d8f8", display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13, flexGrow: 1, color: "#2c3e50", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {esc.nombre}
                </Typography>
                {esc.zona_nombre && (
                    <Typography sx={{ fontSize: 11, color: "#777", flexShrink: 0 }}>{esc.zona_nombre}</Typography>
                )}
                <Box sx={{ bgcolor: "#5c7cfa", color: "#fff", borderRadius: 10, px: 0.75, lineHeight: 1.6, flexShrink: 0 }}>
                    <Typography sx={{ fontSize: 11 }}>{esc.total}</Typography>
                </Box>
            </Box>
            {/* Salas colapsables dentro de la carta */}
            <Box sx={{ flexGrow: 1 }}>
                {esc.salas.map(sala => {
                    const salaKey = `s:${esc.id}:${sala.sala_id}`
                    const salaExpanded = isExpanded(salaKey)
                    return (
                        <Box key={sala.sala_id}>
                            <Box onClick={() => toggle(salaKey)} sx={{
                                display: "flex", alignItems: "center",
                                bgcolor: "#f8f8f8", px: 1.5, py: 0.4,
                                cursor: "pointer", borderBottom: "1px solid #eee",
                                "&:hover": { bgcolor: "#f0f0f0" },
                            }}>
                                {salaExpanded
                                    ? <ExpandMoreIcon sx={{ fontSize: 13, color: "#888", mr: 0.5, flexShrink: 0 }} />
                                    : <ChevronRightIcon sx={{ fontSize: 13, color: "#888", mr: 0.5, flexShrink: 0 }} />
                                }
                                <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#A3BE54", mr: 0.75, flexShrink: 0 }} />
                                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#555", flexGrow: 1 }}>{sala.nombre}</Typography>
                                <Typography sx={{ fontSize: 11, color: "#999", flexShrink: 0 }}>{sala.total}</Typography>
                            </Box>
                            {salaExpanded && renderSalaContent(sala, esc.id, 3, 4)}
                        </Box>
                    )
                })}
            </Box>
        </Paper>
    )

    return (
        <Box sx={{ position: "relative" }}>
            {grupos.length === 0 && (
                <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: 4, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">No hay estudiantes que coincidan con los filtros.</Typography>
                </Paper>
            )}

            {/* DIRECTOR: nombre de escuela arriba + grid de salas */}
            {isSingleEscuela && grupos.length === 1 && (
                <Box>
                    <Box sx={{ mb: 1.5, display: "flex", alignItems: "baseline", gap: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#2c3e50" }}>{grupos[0].nombre}</Typography>
                        {grupos[0].zona_nombre && (
                            <Typography sx={{ fontSize: 12, color: "#888" }}>— {grupos[0].zona_nombre}</Typography>
                        )}
                        <Typography sx={{ fontSize: 12, color: "#aaa" }}>· {grupos[0].total} estudiantes</Typography>
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 1.5, alignItems: "stretch" }}>
                        {grupos[0].salas.map(sala => renderSalaCard(sala, grupos[0]))}
                    </Box>
                </Box>
            )}

            {/* ENCARGADO / PADI: grid de escuelas */}
            {!isSingleEscuela && (
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 1.5, alignItems: "stretch" }}>
                    {grupos.map(esc => renderEscuelaCard(esc))}
                </Box>
            )}

            {permissions.createEstudiante(userRole) && (
                <SpeedDial ariaLabel="Opciones de agregado" sx={{ position: "fixed", bottom: 40, right: 40 }} icon={<SpeedDialIcon />}>
                    <SpeedDialAction icon={<PersonAddIcon />} tooltipTitle="Crear uno solo" onClick={onAddEstudiante} />
                    <SpeedDialAction icon={<UploadFileIcon />} tooltipTitle="Carga masiva (Excel)" onClick={onBulkAdd} />
                </SpeedDial>
            )}

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <Box sx={{ px: 2, py: 1, borderBottom: "1px solid #eee", mb: 1 }}>
                    <Typography variant="caption" color="textSecondary">Estudiante</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {selectedStudent?.personas.primer_apellido}, {selectedStudent?.personas.nombre}
                    </Typography>
                </Box>
                <MenuItem onClick={handleEvaluar} sx={{ py: 1, px: 2 }}>
                    <ListItemIcon><AssessmentIcon fontSize="small" /></ListItemIcon>
                    Evaluar
                </MenuItem>
                {userRole !== "docente" && (
                    <MenuItem onClick={handleModificar}>
                        <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                        Modificar datos
                    </MenuItem>
                )}
                <MenuItem onClick={handleVerMas} sx={{ py: 1, px: 2 }}>
                    <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
                    Ver historial
                </MenuItem>
            </Menu>
        </Box>
    )
}
