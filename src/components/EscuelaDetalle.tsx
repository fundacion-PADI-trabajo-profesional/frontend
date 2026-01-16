import { Box, Typography, Grid, Paper, Divider, List, ListItem, ListItemText, Button, Chip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

export default function EscuelaDetalle({ escuela, onBack, onEdit }: any) {
    return (
        <Box>
            <Paper sx={{ p: 4, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>{escuela.nombre}</Typography>
                        <Typography variant="body1" color="text.secondary">
                            Zona: {escuela.zona?.nombre} | Dirección: {escuela.direccion || "No especificada"}
                        </Typography>
                    </Box>
                    <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit} sx={{ bgcolor: '#000' }}>
                        Editar Escuela
                    </Button>
                </Box>

                <Grid container spacing={4}>
                    {/* SECCIÓN DIRECTIVOS */}
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Directivos</Typography>
                        <List sx={{ bgcolor: '#f9f9f9', borderRadius: 2 }}>
                            {escuela.directivos?.map((dir: any) => (
                                <ListItem key={dir.id} divider>
                                    <ListItemText primary={`${dir.nombre} ${dir.apellido}`} secondary="Director" />
                                </ListItem>
                            ))}
                        </List>
                    </Grid>

                    {/* SECCIÓN DOCENTES */}
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Profesores</Typography>
                        <List sx={{ bgcolor: '#f9f9f9', borderRadius: 2 }}>
                            {escuela.profesores?.map((prof: any) => (
                                <ListItem key={prof.id} divider>
                                    <ListItemText
                                        primary={`${prof.personas?.nombre} ${prof.personas?.primer_apellido}`}
                                        secondary="Docente"
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Grid>

                    {/* SECCIÓN ALUMNOS (Vinculados por escuela_id) */}
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Estudiantes</Typography>
                        <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#B8DB7B' }}>
                                {escuela.estudiantes?.length || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Estudiantes vinculados</Typography>
                            <Button size="small" sx={{ mt: 1 }}>Ver lista de estudiantes</Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}