import { Box, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Chip, Button, Stack, Typography } from "@mui/material"
import type { AreaDetalle, EvaluacionInstancia } from "../../api/evaluaciones"
import AnillosAreas from "./AnillosAreas"
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
  /** Muestra un anillo por área (avance y estado). Pensado para el historial de un alumno. */
  mostrarAreas?: boolean
  /** Con `mostrarAreas`: tocar un anillo abre esa área de la evaluación. */
  onAreaClick?: (evaluacion: EvaluacionInstancia, area: AreaDetalle) => void
}

export default function EvaluacionesTable({
  items,
  showEstudiante = false,
  onRowClick,
  onDelete,
  onCambiarTipo,
  puedeCambiarTipo = () => true,
  mostrarAreas = false,
  onAreaClick,
}: Props) {
  const anillos = (e: EvaluacionInstancia, compacto: boolean) =>
    mostrarAreas && e.areas && e.areas.length > 0 ? (
      <AnillosAreas areas={e.areas} compacto={compacto} onAreaClick={onAreaClick ? (area) => onAreaClick(e, area) : undefined} />
    ) : null

  const hayAcciones = !!onDelete || !!onCambiarTipo

  const chipEstado = (e: EvaluacionInstancia) => (
    <Chip label={getEstadoLabel(e.estadoId)} color={getEstadoColor(e.estadoId)} size="small" variant="outlined" />
  )

  const acciones = (e: EvaluacionInstancia) => (
    <>
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
    </>
  )

  return (
    <>
      {/* Celular: una tarjeta por evaluación (la tabla no entra en el ancho y escondía fecha y acciones). */}
      <Stack spacing={1.5} sx={{ display: { xs: "flex", sm: "none" } }} data-testid="evaluaciones-tarjetas">
        {items.map((e) => (
          <Paper
            key={e.id}
            variant="outlined"
            onClick={onRowClick ? () => onRowClick(e) : undefined}
            sx={{ p: 2, ...(onRowClick ? { cursor: "pointer" } : {}) }}
          >
            {showEstudiante && (
              <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{e.estudianteNombre || e.estudianteId}</Typography>
            )}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Typography sx={{ fontWeight: showEstudiante ? 500 : 700 }}>{getTipoLabel(e.tipoId)}</Typography>
              {chipEstado(e)}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Sala {e.salaId} · {formatearFecha(e.createdAt)}
              {e.puntaje !== null && e.puntaje !== undefined ? ` · Puntaje: ${e.puntaje}` : ""}
            </Typography>
            {mostrarAreas && <Box sx={{ mt: 1.5 }}>{anillos(e, false)}</Box>}
            {(onRowClick || hayAcciones) && (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                {onRowClick && (
                  <Button
                    size="small"
                    variant="contained"
                    sx={{ textTransform: "none", bgcolor: "#A3BE54", color: "#000", "&:hover": { bgcolor: "#8bc34a" } }}
                  >
                    Abrir
                  </Button>
                )}
                {acciones(e)}
              </Stack>
            )}
          </Paper>
        ))}
      </Stack>

      <TableContainer component={Paper} sx={{ display: { xs: "none", sm: "block" } }}>
        <Table>
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              {showEstudiante && <TableCell sx={{ fontWeight: 700 }}>Estudiante</TableCell>}
              <TableCell sx={{ fontWeight: 700 }}>Sala</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
              {mostrarAreas && <TableCell sx={{ fontWeight: 700 }}>Áreas</TableCell>}
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
                <TableCell>{chipEstado(e)}</TableCell>
                {mostrarAreas && <TableCell>{anillos(e, true)}</TableCell>}
                <TableCell align="right">{e.puntaje ?? "-"}</TableCell>
                <TableCell>{formatearFecha(e.createdAt)}</TableCell>
                {hayAcciones && (
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      {acciones(e)}
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}
