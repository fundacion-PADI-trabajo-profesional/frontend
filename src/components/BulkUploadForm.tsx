import React, { useState } from 'react';
import { Box, Button, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import * as XLSX from 'xlsx';
import { bulkCreateEstudiantes } from '../api/estudiantes';

// Definimos la estructura de las Props para quitar el error ts(7031)
interface BulkUploadProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export default function BulkUploadForm({ onCancel, onSuccess }: BulkUploadProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();

        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                // Aquí puedes mapear las columnas del Excel a lo que espera tu API
                const estudiantes = data.map((row: any) => ({
                    dni: row.DNI,
                    nombre: row.Nombre,
                    apellido: row.Apellido,
                    fecha_nacimiento: row.FechaNacimiento,
                    genero_id: row.Genero,
                    sala_id: row.SalaID,
                    aula_id: row.AulaID || null, // Si el aula_id es opcional
                }));

                await bulkCreateEstudiantes({ estudiantes });
                onSuccess();
            } catch (err: any) {
                setError("Error al procesar el archivo. Revisa el formato.");
            } finally {
                setLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>Carga Masiva de Estudiantes</Typography>
            <Typography color="textSecondary" sx={{ mb: 3 }}>
                Sube un archivo Excel (.xlsx) con las columnas: DNI, Nombre, Apellido, FechaNacimiento, Genero, SalaID.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box sx={{ border: '2px dashed #ccc', py: 5, borderRadius: 2, mb: 3 }}>
                <Button variant="contained" component="label" disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : "Seleccionar Archivo Excel"}
                    <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileUpload} />
                </Button>
            </Box>

            <Button onClick={onCancel}>Cancelar</Button>
        </Paper>
    );
}