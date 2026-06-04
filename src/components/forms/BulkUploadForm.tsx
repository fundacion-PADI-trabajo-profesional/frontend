import React, { useState, useRef } from 'react';
import {
    Box, Button, Typography, CircularProgress, Alert,
    Paper, Dialog, DialogTitle, DialogContent, DialogActions,
    Divider, IconButton, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { bulkCreateEstudiantes, type EstudianteBulkRow } from '../../api/estudiantes';
import { getEscuelas } from '../../api/escuelas';
import { getAulas, type Aula } from '../../api/aulas';

interface BulkDryRunResult {
    nuevos: { dni: string }[];
    promovidos: { dni: string; old_sala_id: number | null }[];
    repitentes: { dni: string }[];
    retrocesos: { dni: string; old_sala_id: number | null }[];
    reactivados?: { dni: string }[];
}

interface BulkUploadProps {
    open: boolean;
    onSuccess: (creados: EstudianteBulkRow[]) => void;
    onCancel: () => void;
}

export default function BulkUploadForm({ open, onCancel, onSuccess }: BulkUploadProps) {
    const [bulkLoading, setBulkLoading] = useState(false);
    const [excelRows, setExcelRows] = useState<EstudianteBulkRow[]>([]);
    const [excelError, setExcelError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [step, setStep] = useState<'upload' | 'preview'>('upload');
    const [stats, setStats] = useState<BulkDryRunResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setExcelRows([]);
        setExcelError(null);
        setSuccessMessage(null);
        setStep('upload');
        setStats(null);
    };

    const handleClose = () => {
        resetState();
        onCancel();
    };

    // ─── GENERACIÓN DE PLANTILLA ────────────────────────────────
    const handleDownloadTemplate = async () => {
        try {
            setBulkLoading(true);
            setExcelError(null);

            const [escuelas, todasLasAulas] = await Promise.all([
                getEscuelas(),
                getAulas(),
            ]);

            // Aulas agrupadas por escuela_id (para ordenar por escuela)
            const aulasPorEscuela = new Map<string, Aula[]>();
            for (const aula of todasLasAulas) {
                const eid = String(aula.escuela_id);
                if (!aulasPorEscuela.has(eid)) aulasPorEscuela.set(eid, []);
                aulasPorEscuela.get(eid)!.push(aula);
            }

            // Lista combinada: nombre de escuela (sin aula) + "Escuela - Comisión - Turno"
            // Agrupada por escuela para que el dropdown sea fácil de navegar
            const combinedEntries: string[] = [];
            for (const escuela of escuelas) {
                combinedEntries.push(escuela.nombre);
                const aulas = (aulasPorEscuela.get(String(escuela.id)) || [])
                    .sort((a, b) => `${a.comision}${a.turno}`.localeCompare(`${b.comision}${b.turno}`));
                for (const aula of aulas) {
                    combinedEntries.push(`${escuela.nombre} - ${aula.comision} - ${aula.turno}`);
                }
            }

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet("Carga de Estudiantes");

            // 1. Columnas — una sola columna G para colegio y/o aula
            ws.columns = [
                { header: "DNI", key: "dni", width: 14 },
                { header: "Nombre", key: "nombre", width: 18 },
                { header: "Apellido", key: "apellido", width: 18 },
                { header: "Fecha Nacimiento", key: "fecha_nac", width: 18 },
                { header: "Genero", key: "genero", width: 10 },
                { header: "SalaID", key: "sala", width: 10 },
                { header: "Colegio / Aula", key: "colegio_aula", width: 45 },
            ];

            // Estilo del encabezado
            ws.getRow(1).eachCell((cell) => {
                cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5c7cfa" } };
                cell.alignment = { vertical: "middle", horizontal: "center" };
            });
            ws.getRow(1).height = 20;

            // 2. Validaciones por fila
            const LAST_ROW = 1000;
            for (let row = 2; row <= LAST_ROW; row++) {
                ws.getCell(`E${row}`).dataValidation = {
                    type: "list",
                    allowBlank: true,
                    formulae: ['"M,F"'],
                    showErrorMessage: true,
                    errorTitle: "Valor inválido",
                    error: 'Ingresá "M" o "F"',
                };

                ws.getCell(`F${row}`).dataValidation = {
                    type: "list",
                    allowBlank: true,
                    formulae: ['"3,4,5"'],
                    showErrorMessage: true,
                    errorTitle: "Valor inválido",
                    error: "Ingresá 3, 4 o 5",
                };

                ws.getCell(`G${row}`).dataValidation = {
                    type: "list",
                    allowBlank: true,
                    formulae: [`Datos_soporte!$A$2:$A$${combinedEntries.length + 1}`],
                    showErrorMessage: true,
                    errorTitle: "Opción inválida",
                    error: "Elegí una opción del menú desplegable",
                };

                ws.getCell(`D${row}`).numFmt = "dd/mm/yyyy";
            }

            ws.views = [{ state: "frozen", ySplit: 1 }];

            // 3. Hoja oculta: Datos_soporte con la lista combinada
            const wsSupport = wb.addWorksheet("Datos_soporte", { state: 'hidden' });
            wsSupport.columns = [{ header: "Colegio / Aula", key: "label", width: 50 }];
            combinedEntries.forEach((entry) => wsSupport.addRow({ label: entry }));

            // 4. Descargar archivo
            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'plantilla_estudiantes.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error al generar Excel:", error);
            setExcelError("No se pudo armar la plantilla. Verificá tu conexión.");
        } finally {
            setBulkLoading(false);
        }
    };

    // ─── LECTURA DEL EXCEL SUBIDO ───────────────────────────────────────────
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setExcelError(null);
        const reader = new FileReader();

        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { raw: false, defval: null });

                const rawRows = data as Record<string, unknown>[];
                const validRows = rawRows.filter((row) => row["DNI"] || row["Nombre"] || row["Apellido"]);

                const [escuelas, todasLasAulas] = await Promise.all([
                    getEscuelas(),
                    getAulas(),
                ]);

                // schoolOnlyMap: escuela nombre → escuela_id
                const schoolOnlyMap = new Map(escuelas.map((e) => [e.nombre, String(e.id)]));

                // schoolAulaMap: "Escuela - Comision - Turno" → { escuela_id, aula_id }
                const schoolAulaMap = new Map<string, { escuela_id: string; aula_id: string }>();
                for (const aula of todasLasAulas) {
                    const escuela = escuelas.find((e) => String(e.id) === String(aula.escuela_id));
                    if (escuela) {
                        const label = `${escuela.nombre} - ${aula.comision} - ${aula.turno}`;
                        schoolAulaMap.set(label, { escuela_id: String(aula.escuela_id), aula_id: aula.id });
                    }
                }

                const estudiantes = validRows.map((row) => {
                    const fecha = row["Fecha Nacimiento"];
                    let finalDate = null;

                    if (fecha) {
                        if (fecha instanceof Date && !isNaN(fecha.getTime())) {
                            finalDate = fecha.toISOString();
                        } else if (typeof fecha === 'string') {
                            const parts = fecha.split(/[/-]/);
                            if (parts.length === 3) {
                                const day = parseInt(parts[0], 10);
                                const month = parseInt(parts[1], 10) - 1;
                                const year = parseInt(parts[2], 10);
                                const fullYear = year < 100 ? 2000 + year : year;
                                const parsed = new Date(fullYear, month, day);
                                if (!isNaN(parsed.getTime())) finalDate = parsed.toISOString();
                            } else {
                                const parsed = new Date(fecha);
                                if (!isNaN(parsed.getTime())) finalDate = parsed.toISOString();
                            }
                        }
                    }

                    const colegioAula = row["Colegio / Aula"] ? String(row["Colegio / Aula"]).trim() : null;
                    let escuela_id: string | null = null;
                    let aula_id: string | null = null;

                    if (colegioAula) {
                        const aulaMatch = schoolAulaMap.get(colegioAula);
                        if (aulaMatch) {
                            escuela_id = aulaMatch.escuela_id;
                            aula_id = aulaMatch.aula_id;
                        } else {
                            escuela_id = schoolOnlyMap.get(colegioAula) ?? null;
                        }
                    }

                    return {
                        dni: row["DNI"] ? String(row["DNI"]).trim() : null,
                        nombre: row["Nombre"] ? String(row["Nombre"]).trim() : null,
                        apellido: row["Apellido"] ? String(row["Apellido"]).trim() : null,
                        fecha_nacimiento: finalDate,
                        genero_id: row["Genero"] ? String(row["Genero"]).trim() : null,
                        sala_id: row["SalaID"] ? Number(row["SalaID"]) : null,
                        escuela_id,
                        colegio_aula_label: colegioAula,
                        aula_id,
                    };
                });

                setExcelRows(estudiantes);
                setStep('upload');
                if (fileInputRef.current) fileInputRef.current.value = '';

            } catch {
                setExcelError("Error al leer el archivo Excel. Asegurate de que sea el formato correcto.");
            }
        };

        reader.readAsBinaryString(file);
    };

    // ─── PASO 1: ANALIZAR (DRY RUN) ──────────────────────────────────────────
    const handleAnalyze = async () => {
        setBulkLoading(true);
        setExcelError(null);

        if (excelRows.some(e => !e.escuela_id) || excelRows.some(e => !e.fecha_nacimiento)) {
            setExcelError("Hay alumnos sin colegio válido o con fechas inválidas.");
            setBulkLoading(false);
            return;
        }

        try {
            const response = await bulkCreateEstudiantes({ estudiantes: excelRows, dryRun: true });
            const data = response.data;
            setStats(data);

            // Mapeamos los estados a las filas para mostrarlos en la tabla
            const enrichedRows = excelRows.map(est => {
                const retroceso = data.retrocesos.find((r) => r.dni === est.dni);
                const promovido = data.promovidos.find((r) => r.dni === est.dni);
                const repitente = data.repitentes.find((r) => r.dni === est.dni);
                const reactivado = data.reactivados?.find((r) => r.dni === est.dni);

                if (retroceso) return { ...est, estado: 'retroceso', old_sala_id: retroceso.old_sala_id };
                if (promovido) return { ...est, estado: 'promovido', old_sala_id: promovido.old_sala_id };
                if (repitente) return { ...est, estado: 'repite' };
                if (reactivado) return { ...est, estado: 'reactivado' };
                return { ...est, estado: 'nuevo' };
            });

            setExcelRows(enrichedRows);
            setStep('preview');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setExcelError(msg || "Error al analizar los datos");
        } finally {
            setBulkLoading(false);
        }
    };

    // ─── PASO 2: GUARDAR DEFINITIVO ──────────────────────────────────────────
    const handleConfirmSubmit = async () => {
        setBulkLoading(true);
        setExcelError(null);

        try {
            const response = await bulkCreateEstudiantes({ estudiantes: excelRows, dryRun: false });
            setSuccessMessage(`Operación exitosa.`);

            setTimeout(() => {
                onSuccess(response.data);
                resetState();
            }, 1500);

        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setExcelError(msg || "Error interno al guardar estudiantes");
        } finally {
            setBulkLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
                <GroupAddIcon sx={{ color: "#65944F" }} />
                Carga masiva de Estudiantes
                <IconButton onClick={handleClose} sx={{ ml: "auto" }} disabled={bulkLoading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <Divider />

            <DialogContent sx={{ pt: 3 }}>
                {!successMessage && step === 'upload' && (
                    <>
                        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                            Descargá la plantilla, completá los datos eligiendo el colegio o aula en la columna <strong>Colegio / Aula</strong>, y subí el archivo <strong>.xlsx</strong>.
                            <br /><br />
                            <strong>Importante:</strong> El formato de la Fecha de Nacimiento debe ser <strong>DD/MM/AAAA</strong> (ej: 25/05/2018).
                        </Alert>

                        <Box onClick={() => !bulkLoading && fileInputRef.current?.click()} sx={{ border: "2px dashed #65944F", borderRadius: 3, p: 4, textAlign: "center", cursor: bulkLoading ? "not-allowed" : "pointer", bgcolor: "#f9fdf6", transition: "0.2s", "&:hover": { bgcolor: bulkLoading ? "#f9fdf6" : "#f0faec" }, mb: 2 }}>
                            <CloudUploadIcon sx={{ fontSize: 48, color: "#65944F", opacity: 0.7 }} />
                            <Typography variant="body1" color="#555" mt={1}>Hacé clic para seleccionar el archivo Excel</Typography>
                            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleFileChange} />
                        </Box>

                        <Button size="small" startIcon={bulkLoading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />} onClick={handleDownloadTemplate} sx={{ textTransform: "none", color: "#65944F", mb: 2 }} disabled={bulkLoading}>
                            {bulkLoading ? "Generando plantilla..." : "DESCARGAR PLANTILLA ESTUDIANTES"}
                        </Button>
                    </>
                )}

                {excelError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{excelError}</Alert>}
                {successMessage && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} icon={<CheckCircleIcon fontSize="inherit" />}><strong>¡Éxito!</strong> {successMessage}</Alert>}

                {step === 'preview' && stats && !successMessage && (
                    <Alert severity={stats.retrocesos.length > 0 ? "warning" : "info"} icon={stats.retrocesos.length > 0 ? <WarningAmberIcon /> : undefined} sx={{ mb: 3, borderRadius: 2 }}>
                        <strong>Análisis Alumnos:</strong> Se detectaron {stats.nuevos.length} ingresos nuevos, {stats.promovidos.length} pases de año y {stats.repitentes.length} que repiten sala.
                        {(stats.reactivados?.length ?? 0) > 0 && (
                            <Box sx={{ mt: 1, color: '#1565c0', fontWeight: 'bold' }}>
                                {stats.reactivados.length} alumno(s) serán reactivados (estaban dados de baja).
                            </Box>
                        )}
                        {stats.retrocesos.length > 0 && (
                            <Box sx={{ mt: 1, color: '#d32f2f', fontWeight: 'bold' }}>
                                ¡Atención! Hay {stats.retrocesos.length} alumno(s) que figuran retrocediendo de sala. ¿Estás seguro de que esto es correcto?
                            </Box>
                        )}
                    </Alert>
                )}

                {excelRows.length > 0 && !successMessage && (
                    <>
                        <Typography variant="subtitle2" fontWeight={700} mb={1} color="#333">
                            Vista previa — {excelRows.length} estudiante(s)
                        </Typography>
                        <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 280, border: "1px solid #e0e0e0", borderRadius: 2, mb: 2 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>DNI</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Colegio / Aula</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Sala</TableCell>
                                        {step === 'preview' && <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {excelRows.map((row, i) => {
                                        const isInvalid = !row.dni || !row.nombre || !row.escuela_id || !row.fecha_nacimiento;
                                        return (
                                            <TableRow key={i} sx={{ bgcolor: isInvalid ? "#fff3f3" : "inherit" }}>
                                                <TableCell>{row.dni || <span style={{ color: "#c62828" }}>Falta</span>}</TableCell>
                                                <TableCell>{row.nombre} {row.apellido}</TableCell>
                                                <TableCell>{row.colegio_aula_label}</TableCell>
                                                <TableCell>{row.sala_id || "—"}</TableCell>
                                                {step === 'preview' && (
                                                    <TableCell>
                                                        {row.estado === 'nuevo' && <Chip label="Nuevo ingreso" size="small" color="success" />}
                                                        {row.estado === 'promovido' && <Chip label={`Pasó (De ${row.old_sala_id} a ${row.sala_id})`} size="small" color="primary" variant="outlined" />}
                                                        {row.estado === 'repite' && <Chip label="Mantiene sala" size="small" color="default" />}
                                                        {row.estado === 'retroceso' && <Chip label={`Retrocede (De ${row.old_sala_id} a ${row.sala_id})`} size="small" color="error" />}
                                                        {row.estado === 'reactivado' && <Chip label="Reactivado" size="small" color="info" />}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button onClick={handleClose} sx={{ textTransform: "none", color: "#666" }} disabled={bulkLoading}>
                    Cancelar
                </Button>

                {!successMessage && step === 'upload' && (
                    <Button
                        variant="contained"
                        onClick={handleAnalyze}
                        disabled={bulkLoading || excelRows.length === 0 || !!excelError}
                        startIcon={bulkLoading ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />}
                        sx={{ bgcolor: "#65944F", textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#558040" } }}
                    >
                        {bulkLoading ? "Analizando..." : "Analizar Datos"}
                    </Button>
                )}

                {!successMessage && step === 'preview' && (
                    <Button
                        variant="contained"
                        onClick={handleConfirmSubmit}
                        disabled={bulkLoading || !!excelError}
                        startIcon={bulkLoading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                        sx={{
                            bgcolor: stats?.retrocesos?.length > 0 ? "#d32f2f" : "#65944F",
                            textTransform: "none",
                            borderRadius: 2,
                            "&:hover": { bgcolor: stats?.retrocesos?.length > 0 ? "#b71c1c" : "#558040" }
                        }}
                    >
                        {bulkLoading ? "Guardando..." : "Confirmar Importación"}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}