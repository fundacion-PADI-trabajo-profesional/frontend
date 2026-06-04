import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { adminCreateUsersBulk, type CreateUserPayload } from "../../api/auth";
import { ROLES, rolColor, rolLabel } from "./types";

interface Props {
  /** Controla la visibilidad del diálogo. */
  open: boolean;
  /** Callback invocado al cerrar sin completar la importación. */
  onClose: () => void;
  /** Callback invocado tras crear al menos un usuario exitosamente; la lista debe recargarse. */
  onCreated: () => void;
}

/**
 * Diálogo modal para importación masiva de usuarios desde un archivo Excel (.xlsx / .csv).
 *
 * Flujo interno:
 * 1. El usuario selecciona un archivo; se parsea con XLSX y se normalizan las columnas.
 * 2. Se valida que cada fila tenga nombre, apellido, email y un rol válido.
 * 3. Se muestra una vista previa con el resultado de la validación.
 * 4. Al confirmar se llama a `adminCreateUsersBulk` y se presenta el resumen de éxitos/errores.
 */
export default function ModalCargaMasiva({ open, onClose, onCreated }: Props) {
  const [excelRows, setExcelRows] = useState<CreateUserPayload[]>([]);
  const [excelError, setExcelError] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ creados: { email: string }[]; errores: { email: string; error: string }[] } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setExcelRows([]);
    setExcelError("");
    setBulkResult(null);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelError("");
    setBulkResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (rows.length === 0) {
          setExcelError("El archivo no tiene filas de datos.");
          return;
        }

        const normalized: CreateUserPayload[] = rows.map((row) => {
          const get = (keys: string[]) => {
            for (const k of keys) {
              const found = Object.keys(row).find((rk) => rk.toLowerCase().trim() === k.toLowerCase());
              if (found) return String(row[found]).trim();
            }
            return "";
          };
          return {
            nombre: get(["nombre", "name", "first name", "firstname"]),
            apellido: get(["apellido", "apellidos", "lastname", "last name", "surname"]),
            email: get(["email", "correo", "mail", "e-mail"]),
            rol: get(["rol", "role", "perfil"]).toLowerCase().replace(/\s/g, "_"),
          };
        });

        const invalidos = normalized.filter(
          (r) => !r.nombre || !r.apellido || !r.email || !ROLES.find((rol) => rol.value === r.rol)
        );

        if (invalidos.length > 0) {
          setExcelError(
            `${invalidos.length} fila(s) tienen datos inválidos. Verificá que las columnas sean: nombre, apellido, email, rol (valores: ${ROLES.map((r) => r.value).join(", ")}).`
          );
          setExcelRows(normalized);
          return;
        }

        setExcelRows(normalized);
      } catch {
        setExcelError("No se pudo leer el archivo. Asegurate de que sea un .xlsx o .csv válido.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleBulkSubmit = async () => {
    setBulkLoading(true);
    setBulkResult(null);
    setExcelError("");
    try {
      const result = await adminCreateUsersBulk(excelRows);
      setBulkResult(result);
      if (result.creados.length > 0) onCreated();
    } catch (err: unknown) {
      setExcelError(err instanceof Error ? err.message : "Error al procesar la importación.");
    } finally {
      setBulkLoading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      { nombre: "María", apellido: "García", email: "maria.garcia@ejemplo.com", rol: "docente" },
      { nombre: "Juan", apellido: "López", email: "juan.lopez@ejemplo.com", rol: "director" },
      { nombre: "Ana", apellido: "Martínez", email: "ana.martinez@ejemplo.com", rol: "encargado_zona" },
      { nombre: "Jose", apellido: "Juarez", email: "jose.juarez@ejemplo.com", rol: "equipo_padi" },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios");
    XLSX.writeFile(wb, "plantilla_usuarios_padi.xlsx");
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
        <GroupAddIcon sx={{ color: "#65944F" }} />
        Carga masiva de usuarios
        <IconButton onClick={handleClose} sx={{ ml: "auto" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          Subí un archivo <strong>.xlsx o .csv</strong> con las columnas:{" "}
          <strong>nombre, apellido, email, rol</strong>. Los valores válidos para el rol son:{" "}
          {ROLES.map((r) => <code key={r.value} style={{ marginRight: 6 }}>{r.value}</code>)}
        </Alert>

        {!bulkResult && (
          <Box
            onClick={() => fileInputRef.current?.click()}
            sx={{
              border: "2px dashed #65944F",
              borderRadius: 3,
              p: 4,
              textAlign: "center",
              cursor: "pointer",
              bgcolor: "#f9fdf6",
              transition: "0.2s",
              "&:hover": { bgcolor: "#f0faec" },
              mb: 2,
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: "#65944F", opacity: 0.7 }} />
            <Typography variant="body1" color="#555" mt={1}>
              Hacé clic para seleccionar un archivo
            </Typography>
            <Typography variant="caption" color="#999">
              Formatos aceptados: .xlsx, .csv
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </Box>
        )}

        <Button
          size="small"
          startIcon={<DownloadIcon />}
          onClick={downloadTemplate}
          sx={{ textTransform: "none", color: "#65944F", mb: 2 }}
        >
          Descargar plantilla de ejemplo
        </Button>

        {excelError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{excelError}</Alert>}

        {excelRows.length > 0 && !bulkResult && (
          <>
            <Typography variant="subtitle2" fontWeight={700} mb={1} color="#333">
              Vista previa — {excelRows.length} fila(s) detectada(s)
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 280, border: "1px solid #e0e0e0", borderRadius: 2, mb: 2 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Apellido</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {excelRows.map((row, i) => {
                    const isInvalid = !row.nombre || !row.apellido || !row.email || !ROLES.find((r) => r.value === row.rol);
                    return (
                      <TableRow key={i} sx={{ bgcolor: isInvalid ? "#fff3f3" : "inherit" }}>
                        <TableCell>{row.nombre || <span style={{ color: "#c62828" }}>—</span>}</TableCell>
                        <TableCell>{row.apellido || <span style={{ color: "#c62828" }}>—</span>}</TableCell>
                        <TableCell>{row.email || <span style={{ color: "#c62828" }}>—</span>}</TableCell>
                        <TableCell>
                          {ROLES.find((r) => r.value === row.rol) ? (
                            <Chip label={rolLabel(row.rol)} size="small" variant="outlined" color={rolColor(row.rol)} />
                          ) : (
                            <span style={{ color: "#c62828", fontWeight: 600 }}>{row.rol || "—"}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {bulkResult && (
          <Box>
            <Alert
              severity={bulkResult.errores.length === 0 ? "success" : "warning"}
              sx={{ mb: 2, borderRadius: 2 }}
              icon={bulkResult.errores.length === 0 ? <CheckCircleIcon /> : <ErrorOutlineIcon />}
            >
              <strong>{bulkResult.creados.length}</strong> usuario(s) creado(s)
              {bulkResult.errores.length > 0 && (
                <> · <strong>{bulkResult.errores.length}</strong> error(es)</>
              )}
            </Alert>

            {bulkResult.errores.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight={700} color="#c62828" mb={1}>
                  Errores:
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 200, border: "1px solid #f0c0c0", borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Error</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bulkResult.errores.map((e, i: number) => (
                        <TableRow key={i}>
                          <TableCell sx={{ color: "#555" }}>{e.email}</TableCell>
                          <TableCell sx={{ color: "#c62828" }}>{e.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        {bulkResult ? (
          <Button
            variant="contained"
            onClick={handleClose}
            sx={{ bgcolor: "#65944F", textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#558040" } }}
          >
            Cerrar
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} sx={{ textTransform: "none", color: "#666" }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleBulkSubmit}
              disabled={bulkLoading || excelRows.length === 0 || !!excelError}
              startIcon={bulkLoading ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />}
              sx={{ bgcolor: "#65944F", textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#558040" } }}
            >
              {bulkLoading ? "Procesando..." : `Importar ${excelRows.length} usuario(s)`}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
