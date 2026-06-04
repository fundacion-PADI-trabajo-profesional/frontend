import { Box, Typography, Grid, Paper, Button, Avatar, Divider } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PlaceIcon from "@mui/icons-material/Place";
import EqualizerIcon from "@mui/icons-material/Equalizer";
import { getNivelSocioeconomicoLabel, type Escuela } from "../../api/escuelas";

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <Box sx={{ color: "#A3BE54", mt: 0.3 }}>{icon}</Box>
            <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.65rem" }}>
                    {label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
                    {value}
                </Typography>
            </Box>
        </Box>
    );
}

function PersonCard<T extends { id: string | number }>({ title, people, getName, getSubtitle }: {
    title: string;
    people: T[];
    getName: (p: T) => string;
    getSubtitle: (p: T) => string;
}) {
    return (
        <Box sx={{ border: "1px solid #e8e8e8", borderRadius: 2, overflow: "hidden", height: "100%" }}>
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: "#f5f5f5", borderBottom: "1px solid #e8e8e8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
                <Box sx={{ bgcolor: "#A3BE54", color: "#fff", borderRadius: "12px", px: 1.2, py: 0.2, fontSize: "0.75rem", fontWeight: 700, minWidth: 24, textAlign: "center" }}>
                    {people.length}
                </Box>
            </Box>
            <Box sx={{ p: people.length === 0 ? 3 : 0 }}>
                {people.length === 0 ? (
                    <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic", textAlign: "center" }}>
                        No hay {title.toLowerCase()} asignados
                    </Typography>
                ) : (
                    people.map((p, i) => (
                        <Box key={p.id}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 1.5 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: "#A3BE54", fontSize: "0.8rem", fontWeight: 700 }}>
                                    {getName(p).split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                                </Avatar>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{getName(p)}</Typography>
                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>{getSubtitle(p)}</Typography>
                                </Box>
                            </Box>
                            {i < people.length - 1 && <Divider />}
                        </Box>
                    ))
                )}
            </Box>
        </Box>
    );
}

export default function EscuelaDetalle({ escuela, onEdit }: { escuela: Escuela; onEdit: () => void }) {
    return (
        <Box>
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>

                {/* Encabezado */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        {escuela.nombre}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={onEdit}
                        sx={{ bgcolor: "#A3BE54", borderRadius: 2, px: 3, flexShrink: 0, ml: 2, "&:hover": { bgcolor: "#333" } }}
                    >
                        EDITAR ESCUELA
                    </Button>
                </Box>

                {/* Info de la escuela */}
                <Box sx={{ display: "flex", gap: 4, mb: 3, flexWrap: "wrap" }}>
                    <InfoItem icon={<LocationOnIcon fontSize="small" />} label="Zona" value={escuela.zona?.nombre || "Sin zona"} />
                    <InfoItem icon={<PlaceIcon fontSize="small" />} label="Dirección" value={escuela.direccion || "No especificada"} />
                    <InfoItem icon={<EqualizerIcon fontSize="small" />} label="Nivel socioeconómico" value={getNivelSocioeconomicoLabel(escuela.nivel_socioeconomico)} />
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Directivos y Docentes */}
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <PersonCard
                            title="Directivos"
                            people={escuela.directivos ?? []}
                            getName={(d) => `${d.nombre} ${d.apellido}`}
                            getSubtitle={() => "Director"}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <PersonCard
                            title="Docentes"
                            people={escuela.profesores ?? []}
                            getName={(p) => `${p.personas?.nombre ?? ""} ${p.personas?.primer_apellido ?? ""}`}
                            getSubtitle={() => "Docente"}
                        />
                    </Grid>
                </Grid>

            </Paper>
        </Box>
    );
}
