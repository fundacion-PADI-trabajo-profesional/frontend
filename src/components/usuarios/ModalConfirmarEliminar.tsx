import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { adminDeleteUser } from "../../api/auth";
import type { Usuario } from "./types";

interface Props {
  /** Usuario a eliminar. El diálogo se abre cuando este valor es distinto de `null`. */
  usuario: Usuario | null;
  /** Callback invocado al cancelar o tras completar la eliminación. */
  onClose: () => void;
  /** Callback invocado tras eliminar exitosamente; la lista debe recargarse. */
  onDeleted: () => void;
}

/**
 * Diálogo de confirmación para eliminar un usuario del sistema.
 *
 * La eliminación es una baja lógica: revoca el acceso en Supabase Auth
 * pero preserva el historial de datos del usuario en la base de datos.
 * El diálogo se muestra cuando `usuario` es distinto de `null`.
 */
export default function ModalConfirmarEliminar({ usuario, onClose, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!usuario) return;
    setLoading(true);
    try {
      await adminDeleteUser(usuario.id);
      onDeleted();
      onClose();
    } catch (err: any) {
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!usuario} onClose={onClose} maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle fontWeight={700}>¿Eliminar usuario?</DialogTitle>
      <DialogContent>
        <Typography>
          ¿Estás seguro que querés eliminar a{" "}
          <strong>{usuario?.nombre} {usuario?.apellido}</strong>? Esta acción no se puede deshacer.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: "#666" }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={loading}
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          {loading ? "Eliminando..." : "Eliminar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
