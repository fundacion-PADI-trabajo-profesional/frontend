import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, Stack, Typography
} from "@mui/material";
import { type Aula } from "../../api/aulas";

interface Props {
  aulas: Aula[];
  onEdit: (aula: Aula) => void;
  onDelete: (aula: Aula) => void;
  onViewStudents: (aula: Aula) => void;
  onViewTeachers: (aula: Aula) => void;
}

export default function AulasList({ aulas, onEdit, onDelete, onViewStudents, onViewTeachers }: Props) {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
      <Table>
        <TableHead sx={{ bgcolor: "#f8f9fa" }}>
          <TableRow>
            <TableCell align="center" sx={{ fontWeight: "bold" }}>Sala</TableCell>
            <TableCell align="center" sx={{ fontWeight: "bold" }}>Comisión</TableCell>
            <TableCell align="center" sx={{ fontWeight: "bold" }}>Turno</TableCell>
            <TableCell align="center" sx={{ fontWeight: "bold" }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {aulas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                <Typography variant="body1" sx={{ color: "#666", fontStyle: "italic" }}>
                  No hay aulas registradas en esta escuela.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            aulas.map((a) => (
              <TableRow
                key={a.id}
                hover
                onClick={() => onViewStudents(a)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell align="center">
                  {a.sala?.nombre || `Sala ${a.sala_id}`}
                </TableCell>
                <TableCell align="center">{a.comision}</TableCell>
                <TableCell align="center">{a.turno}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" justifyContent="center" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => { e.stopPropagation(); onEdit(a); }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      onClick={(e) => { e.stopPropagation(); onViewTeachers(a); }}
                    >
                      Docentes
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={(e) => { e.stopPropagation(); onDelete(a); }}
                    >
                      Eliminar
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}