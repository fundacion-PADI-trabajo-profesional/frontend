"use client"

import { Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Chip, Button } from "@mui/material"
import type { EvaluacionInstancia } from "../api/evaluaciones"

function getEstadoColor(estado: string) {
  switch (estado) {
    case "N": return "warning"
    case "E": return "info"
    case "A": return "success"
    case "D": return "error"
    case "C": return "success"
    case "R": return "default"
    default: return "default"
  }
}
function getEstadoLabel(estado: string) {
  switch (estado) {
    case "N": return "No iniciada"
    case "E": return "En progreso"
    case "A": return "Aprobada"
    case "D": return "Desaprobada"
    case "C": return "Completada"
    case "R": return "Revisada"
    default: return estado
  }
}
function getTipoLabel(tipo: string) {
  switch (tipo) {
    case "Evaluacion Inicial": return "Evaluación Inicial"
    case "Evaluacion de Cierre": return "Evaluacion de Cierre"
    default: return tipo
  }
}

interface Props {
  items: EvaluacionInstancia[]
  showEstudiante?: boolean
  onRowClick?: (evaluacion: EvaluacionInstancia) => void
  onDelete?: (evaluacion: EvaluacionInstancia) => void
}

export default function EvaluacionesTable({ items, showEstudiante = false, onRowClick, onDelete }: Props) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead sx={{ bgcolor: "#f5f5f5" }}>
          <TableRow>
            {showEstudiante && <TableCell sx={{ fontWeight: 700 }}>Estudiante</TableCell>}
            <TableCell sx={{ fontWeight: 700 }}>Sala</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>Puntaje</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
            {onDelete && <TableCell sx={{ fontWeight: 700 }} align="center">Acciones</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((e) => (
            <TableRow
              key={e.id}
              hover
              onClick={onRowClick ? () => onRowClick(e) : undefined}
              sx={onRowClick ? { cursor: "pointer" } : undefined}
            >
              {showEstudiante && <TableCell>{e.estudianteNombre || e.estudianteId}</TableCell>}
              <TableCell>{e.salaId}</TableCell>
              <TableCell>{getTipoLabel(e.tipoId)}</TableCell>
              <TableCell>
                <Chip
                  label={getEstadoLabel(e.estadoId)}
                  color={getEstadoColor(e.estadoId)}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell align="right">{e.puntaje ?? "-"}</TableCell>
              <TableCell>{e.createdAt.toLocaleString()}</TableCell>
              {onDelete && (
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{
                      textTransform: "none",
                      borderColor: "#d32f2f",
                      color: "#d32f2f",
                      "&:hover": { bgcolor: "rgba(211, 47, 47, 0.04)", borderColor: "#d32f2f" },
                    }}
                    onClick={(ev) => {
                      ev.stopPropagation()
                      onDelete(e)
                    }}
                  >
                    Eliminar
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}


