import { useEffect, useRef } from "react";
import { Box, Paper, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { circuloPauta, estadoPauta, type ColorCirculo, type Pauta, type Respuestas } from "../../../utils/pautas";

const COLORES: Record<ColorCirculo, { bg: string; fg: string; borde: string }> = {
    gris: { bg: "#f3f4f6", fg: "#4b5563", borde: "transparent" },
    ambar: { bg: "#fef3c7", fg: "#b45309", borde: "#f59e0b" },
    verde: { bg: "#dcfce7", fg: "#15803d", borde: "transparent" },
    rojo: { bg: "#fee2e2", fg: "#b91c1c", borde: "transparent" },
};

const LEYENDA: { color: ColorCirculo; texto: string }[] = [
    { color: "verde", texto: "Aprobada" },
    { color: "rojo", texto: "No aprobada" },
    { color: "ambar", texto: "A medias" },
    { color: "gris", texto: "Sin responder" },
];

interface Props {
    pautas: Pauta[];
    respuestas: Respuestas;
    actual: number;
    onIr: (indice: number) => void;
    variante: "panel" | "fila";
}

function Circulo({ pauta, indice, respuestas, esActual, onIr, tamano }: {
    pauta: Pauta; indice: number; respuestas: Respuestas; esActual: boolean; onIr: (i: number) => void; tamano: number;
}) {
    const c = circuloPauta(pauta, respuestas, indice + 1);
    const col = COLORES[c.color];
    return (
        <Box
            component="button"
            type="button"
            onClick={() => onIr(indice)}
            aria-label={`Pauta ${pauta.numero ?? indice + 1}, ${pauta.titulo}: ${c.descripcion}`}
            aria-current={esActual ? "step" : undefined}
            data-contenido={c.contenido}
            data-color={c.color}
            data-actual={esActual ? "si" : "no"}
            sx={{
                width: tamano, height: tamano, borderRadius: "50%", flexShrink: 0, p: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: c.contenido === "fraccion" ? "0.7rem" : "0.78rem", fontWeight: 700, fontFamily: "inherit",
                cursor: "pointer", bgcolor: col.bg, color: col.fg,
                border: `2px solid ${col.borde}`,
                boxShadow: esActual ? "0 0 0 2.5px #5c7cfa" : "none",
                transition: "transform .15s",
                "&:hover": { transform: "scale(1.06)" },
            }}
        >
            {c.contenido === "check" ? <CheckIcon sx={{ fontSize: 16 }} /> : c.contenido === "cruz" ? <CloseIcon sx={{ fontSize: 16 }} /> : c.texto}
        </Box>
    );
}

/** Seguimiento del área: un círculo por pauta. `panel` es la columna fija de la web; `fila` es la tira con scroll del celular. */
export default function SeguimientoPautas({ pautas, respuestas, actual, onIr, variante }: Props) {
    const completas = pautas.filter((p) => estadoPauta(p, respuestas).completa).length;
    const filaRef = useRef<HTMLDivElement | null>(null);

    // En el celular, el círculo actual se centra solo (no corre en render estático).
    useEffect(() => {
        if (variante !== "fila") return;
        const el = filaRef.current?.querySelector<HTMLElement>('[data-actual="si"]');
        el?.scrollIntoView?.({ behavior: "smooth", block: "nearest", inline: "center" });
    }, [actual, variante]);

    if (variante === "fila") {
        return (
            <Box ref={filaRef} sx={{ display: { xs: "flex", sm: "none" }, gap: 1, overflowX: "auto", pb: 1, mb: 1.5, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
                {pautas.map((p, i) => <Circulo key={p.clave} pauta={p} indice={i} respuestas={respuestas} esActual={i === actual} onIr={onIr} tamano={32} />)}
            </Box>
        );
    }

    return (
        <Paper elevation={2} sx={{ width: 196, flexShrink: 0, p: 1.75, borderRadius: 3, alignSelf: "flex-start", position: "sticky", top: 16, display: { xs: "none", sm: "block" } }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: "block", color: "#374151" }}>Pautas completas</Typography>
            <Typography variant="body2" sx={{ display: "block", mb: 1.5, color: "#4b5563", fontWeight: 700 }}>{completas} / {pautas.length}</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
                {pautas.map((p, i) => <Circulo key={p.clave} pauta={p} indice={i} respuestas={respuestas} esActual={i === actual} onIr={onIr} tamano={34} />)}
            </Box>
            <Box sx={{ borderTop: "1px solid #f3f4f6", pt: 1.25, display: "flex", flexDirection: "column", gap: 0.5 }}>
                {LEYENDA.map((l) => (
                    <Box key={l.color} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: COLORES[l.color].bg, border: `1.5px solid ${COLORES[l.color].fg}` }} />
                        <Typography variant="caption" color="text.secondary">{l.texto}</Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
}
