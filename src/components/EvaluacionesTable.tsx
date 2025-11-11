"use client"

import { Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Chip } from "@mui/material"
import type { EvaluacionInstancia } from "../api/evaluaciones"

function getEstadoColor(estado: string) {
  switch (estado) {
    case "N": return "warning"
    case "C": return "success"
    case "R": return "error"
    default: return "default"
  }
}
function getEstadoLabel(estado: string) {
  switch (estado) {
    case "N": return "No iniciada"
    case "C": return "Completada"
    case "R": return "Revisada"
    default: return estado
  }
}
function getTipoLabel(tipo: string) {
  switch (tipo) {
    case "diagnostico": return "Diagnóstico"
    case "seguimiento": return "Seguimiento"
    case "cierre": return "Cierre"
    default: return tipo
  }
}

interface Props {
  items: EvaluacionInstancia[]
  showEstudiante?: boolean
}

export default function EvaluacionesTable({ items, showEstudiante = false }: Props) {
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
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((e) => (
            <TableRow key={e.id} hover>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}


