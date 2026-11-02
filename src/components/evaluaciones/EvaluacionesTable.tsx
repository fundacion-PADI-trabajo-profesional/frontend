import { Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Chip, Button, Stack } from "@mui/material"
import type { EvaluacionInstancia } from "../../api/evaluaciones"
import { formatearFecha } from "../../utils/fechas"

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
    case "inicial":
    case "Evaluacion Inicial": return "Evaluación Inicial"
    case "cierre":
    case "Evaluacion de Cierre": return "Evaluación de Cierre"
    default: return tipo
  }
}

interface Props {
  items: EvaluacionInstancia[]
  showEstudiante?: boolean
  onRowClick?: (evaluacion: EvaluacionInstancia) => void
  onDelete?: (evaluacion: EvaluacionInstancia) => void
  /** Acción "Cambiar tipo" por fila. */
  onCambiarTipo?: (evaluacion: EvaluacionInstancia) => void
  /** Si se muestra "Cambiar tipo" en esa fila (por defecto, siempre que haya onCambiarTipo). */
  puedeCambiarTipo?: (evaluacion: EvaluacionInstancia) => boolean
}

export default function EvaluacionesTable({
  items,
  showEstudiante = false,
  onRowClick,
  onDelete,
  onCambiarTipo,
  puedeCambiarTipo = () => true,
}: Props) {
  const hayAcciones = !!onDelete || !!onCambiarTipo
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
            {hayAcciones && <TableCell sx={{ fontWeight: 700 }} align="center">Acciones</TableCell>}
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
              <TableCell>{formatearFecha(e.createdAt)}</TableCell>
              {hayAcciones && (
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    {onCambiarTipo && puedeCambiarTipo(e) && (
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: "none" }}
                        onClick={(ev) => {
                          ev.stopPropagation()
                          onCambiarTipo(e)
                        }}
                      >
                        Cambiar tipo
                      </Button>
                    )}
                    {onDelete && (
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
                    )}
                  </Stack>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}


