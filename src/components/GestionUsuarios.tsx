// src/components/GestionUsuarios.tsx
import { useState, useRef, useCallback, useEffect } from "react";
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
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  adminCreateUser,
  adminCreateUsersBulk,
  adminDeleteUser,
  adminListUsers,
  type CreateUserPayload,
} from "../api/auth";

const ROLES = [
  { value: "equipo_padi", label: "Equipo PADI" },
  { value: "director", label: "Director" },
  { value: "encargado_zona", label: "Encargado de Zona" },
  { value: "docente", label: "Docente" },
];

const rolLabel = (rol: string) =>
  ROLES.find((r) => r.value === rol)?.label ?? rol;

const rolColor = (rol: string): "default" | "primary" | "warning" | "success" | "info" => {
  switch (rol) {
    case "equipo_padi": return "primary";
    case "director": return "warning";
    case "encargado_zona": return "info";
    case "docente": return "success";
    default: return "default";
  }
};

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
}

const emptyForm: CreateUserPayload = {
  nombre: "",
  apellido: "",
  email: "",
  rol: "",
};

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal individual
  const [openIndividual, setOpenIndividual] = useState(false);
  const [formData, setFormData] = useState<CreateUserPayload>(emptyForm);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");

  // Modal masivo
  const [openMasivo, setOpenMasivo] = useState(false);
  const [excelRows, setExcelRows] = useState<CreateUserPayload[]>([]);
  const [excelError, setExcelError] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ creados: any[]; errores: any[] } | null>(null);

  // Confirmación de eliminación
  const [confirmDelete, setConfirmDelete] = useState<Usuario | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminListUsers();
      setUsuarios(data);
    } catch (err: any) {
      setError(err.message || "No se pudo cargar la lista de usuarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  // ─── CREACIÓN INDIVIDUAL ───────────────────────────────────────────────────

  const handleIndividualSubmit = async () => {
    setFormError("");
    setFormSuccess("");

    if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.email.trim() || !formData.rol) {
      setFormError("Todos los campos son obligatorios.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError("El formato del email no es válido.");
      return;
    }

    setFormLoading(true);
    try {
      await adminCreateUser(formData);
      setFormSuccess(
        `Usuario ${formData.nombre} ${formData.apellido} creado. Se envió un correo con la contraseña temporal.`
      );
      setFormData(emptyForm);
      fetchUsuarios();
    } catch (err: any) {
      setFormError(err.message || "No se pudo crear el usuario.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseIndividual = () => {
    setOpenIndividual(false);
    setFormData(emptyForm);
    setFormError("");
    setFormSuccess("");
  };

  // ─── IMPORTACIÓN MASIVA ────────────────────────────────────────────────────

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
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (rows.length === 0) {
          setExcelError("El archivo no tiene filas de datos.");
          return;
        }

        // Normalizar columnas (case-insensitive)
        const normalized: CreateUserPayload[] = rows.map((row, _i) => {
          const get = (keys: string[]) => {
            for (const k of keys) {
              const found = Object.keys(row).find(
                (rk) => rk.toLowerCase().trim() === k.toLowerCase()
              );
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

        // Validaciones básicas
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

    // Reset input para permitir subir el mismo archivo nuevamente
    e.target.value = "";
  };

  const handleBulkSubmit = async () => {
    setBulkLoading(true);
    setBulkResult(null);
    setExcelError("");

    try {
      const result = await adminCreateUsersBulk(excelRows);
      setBulkResult(result);
      if (result.creados.length > 0) {
        fetchUsuarios();
      }
    } catch (err: any) {
      setExcelError(err.message || "Error al procesar la importación.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleCloseMasivo = () => {
    setOpenMasivo(false);
    setExcelRows([]);
    setExcelError("");
    setBulkResult(null);
  };

  // ─── DESCARGA DE PLANTILLA ─────────────────────────────────────────────────

  const downloadTemplate = () => {
    const templateData = [
      { nombre: "María", apellido: "García", email: "maria.garcia@ejemplo.com", rol: "docente" },
      { nombre: "Juan", apellido: "López", email: "juan.lopez@ejemplo.com", rol: "director" },
      { nombre: "Ana", apellido: "Martínez", email: "ana.martinez@ejemplo.com", rol: "encargado_zona" },
      { nombre: "Jose", apellido: "Juarez", email: "jose.juarez@ejemplo.com", rol: "equipo_padi" }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios");
    XLSX.writeFile(wb, "plantilla_usuarios_padi.xlsx");
  };

  // ─── ELIMINACIÓN ───────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleteLoading(true);
    try {
      await adminDeleteUser(confirmDelete.id);
      setConfirmDelete(null);
      fetchUsuarios();
    } catch (err: any) {
      setError(err.message || "No se pudo eliminar el usuario.");
      setConfirmDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h6" fontWeight={700} color="#333">
          Gestión de Usuarios
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchUsuarios}
            disabled={loading}
            sx={{ borderColor: "#65944F", color: "#65944F", textTransform: "none", borderRadius: 2 }}
          >
            Actualizar
          </Button>
          <Button
            variant="outlined"
            startIcon={<GroupAddIcon />}
            onClick={() => setOpenMasivo(true)}
            sx={{ borderColor: "#65944F", color: "#65944F", textTransform: "none", borderRadius: 2 }}
          >
            Carga masiva
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setOpenIndividual(true)}
            sx={{ bgcolor: "#65944F", textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#558040" } }}
          >
            Nuevo usuario
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Tabla */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "#65944F" }} />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: "1px solid #e0e0e0" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Apellido</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 60 }} align="center">Acc.</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: "#999" }}>
                    No hay usuarios registrados.
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.nombre}</TableCell>
                    <TableCell>{u.apellido}</TableCell>
                    <TableCell sx={{ color: "#555", fontSize: "0.85rem" }}>{u.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={rolLabel(u.rol)}
                        color={rolColor(u.rol)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Eliminar usuario">
                        <IconButton
                          size="small"
                          onClick={() => setConfirmDelete(u)}
                          sx={{ color: "#c62828", "&:hover": { bgcolor: "#ffebee" } }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── MODAL: Creación individual ─────────────────────────────────────── */}
      <Dialog
        open={openIndividual}
        onClose={handleCloseIndividual}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
          <PersonAddIcon sx={{ color: "#65944F" }} />
          Crear nuevo usuario
          <IconButton onClick={handleCloseIndividual} sx={{ ml: "auto" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {formError}
            </Alert>
          )}
          {formSuccess && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              {formSuccess}
            </Alert>
          )}

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            />
            <TextField
              label="Apellido"
              value={formData.apellido}
              onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            />
          </Box>

          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
          />

          <TextField
            label="Rol"
            select
            value={formData.rol}
            onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
            fullWidth
            size="small"
            sx={{ mb: 1 }}
          >
            <MenuItem value="" disabled>
              Seleccioná un rol
            </MenuItem>
            {ROLES.map((r) => (
              <MenuItem key={r.value} value={r.value}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>

          <Typography variant="caption" color="#888" sx={{ display: "block", mt: 1 }}>
            Se generará una contraseña temporal y se enviará al email del usuario.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={handleCloseIndividual} sx={{ textTransform: "none", color: "#666" }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleIndividualSubmit}
            disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            sx={{
              bgcolor: "#65944F",
              textTransform: "none",
              borderRadius: 2,
              "&:hover": { bgcolor: "#558040" },
            }}
          >
            {formLoading ? "Creando..." : "Crear usuario"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── MODAL: Carga masiva ────────────────────────────────────────────── */}
      <Dialog
        open={openMasivo}
        onClose={handleCloseMasivo}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
          <GroupAddIcon sx={{ color: "#65944F" }} />
          Carga masiva de usuarios
          <IconButton onClick={handleCloseMasivo} sx={{ ml: "auto" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          {/* Instrucciones */}
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Subí un archivo <strong>.xlsx o .csv</strong> con las columnas:{" "}
            <strong>nombre, apellido, email, rol</strong>. Los valores válidos para el rol son:{" "}
            {ROLES.map((r) => <code key={r.value} style={{ marginRight: 6 }}>{r.value}</code>)}
          </Alert>

          {/* Zona de carga */}
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

          {excelError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {excelError}
            </Alert>
          )}

          {/* Vista previa de filas cargadas */}
          {excelRows.length > 0 && !bulkResult && (
            <>
              <Typography variant="subtitle2" fontWeight={700} mb={1} color="#333">
                Vista previa — {excelRows.length} fila(s) detectada(s)
              </Typography>
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ maxHeight: 280, border: "1px solid #e0e0e0", borderRadius: 2, mb: 2 }}
              >
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
                      const isInvalid =
                        !row.nombre ||
                        !row.apellido ||
                        !row.email ||
                        !ROLES.find((r) => r.value === row.rol);
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

          {/* Resultado de la carga */}
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
                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{ maxHeight: 200, border: "1px solid #f0c0c0", borderRadius: 2 }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Error</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bulkResult.errores.map((e: any, i: number) => (
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
              onClick={handleCloseMasivo}
              sx={{ bgcolor: "#65944F", textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#558040" } }}
            >
              Cerrar
            </Button>
          ) : (
            <>
              <Button onClick={handleCloseMasivo} sx={{ textTransform: "none", color: "#666" }}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleBulkSubmit}
                disabled={
                  bulkLoading ||
                  excelRows.length === 0 ||
                  !!excelError
                }
                startIcon={
                  bulkLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <UploadFileIcon />
                  )
                }
                sx={{
                  bgcolor: "#65944F",
                  textTransform: "none",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#558040" },
                }}
              >
                {bulkLoading
                  ? "Procesando..."
                  : `Importar ${excelRows.length} usuario(s)`}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* ── CONFIRMACIÓN DE ELIMINACIÓN ────────────────────────────────────── */}
      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>¿Eliminar usuario?</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro que querés eliminar a{" "}
            <strong>
              {confirmDelete?.nombre} {confirmDelete?.apellido}
            </strong>
            ? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDelete(null)} sx={{ textTransform: "none", color: "#666" }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteLoading}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            {deleteLoading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
