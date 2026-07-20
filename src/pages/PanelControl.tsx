import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    CircularProgress,
    Container,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { type Escuela, getEscuelas } from "../api/escuelas";
import { type Aula, getAulaEstudiantes } from "../api/aulas";
import { type Estudiante, getEstudiantes, getSalas, type Sala } from "../api/estudiantes";
import { getDocentes, type Docente } from "../api/docentes";
import {
    getZonas,
    type Zona,
} from "../api/zonas";
import Zonas from "./Zonas";
import PageHeader from "../components/common/PageHeader";
import EscuelasView from "../components/escuelas/EscuelasView";
import AulasView from "../components/aulas/AulasView";
import EstudiantesAulaView from "../components/aulas/EstudiantesAulaView";
import SalasView from "../components/aulas/SalasView";
type ViewMode = "zonas" | "escuelas" | "salas" | "aulas" | "estudiantes";

export default function PanelControl() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialAulaId = searchParams.get("aulaId");
    const initialEscuelaId = searchParams.get("escuelaId");
    const initialZonaId = searchParams.get("zonaId");

    const [view, setView] = useState<ViewMode>("escuelas");
    const [pendingRestore, setPendingRestore] = useState(!!(initialAulaId || initialEscuelaId));
    const [zonas, setZonas] = useState<Zona[]>([]);
    const [escuelas, setEscuelas] = useState<Escuela[]>([]);
    const [aulas] = useState<Aula[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedZona, setSelectedZona] = useState<Zona | null>(null);
    const [selectedEscuela, setSelectedEscuela] = useState<Escuela | null>(null);
    const [selectedSala, setSelectedSala] = useState<Sala | null>(null);
    const [selectedAula, setSelectedAula] = useState<Aula | null>(null);
    const [, setAulaEstudiantes] = useState<Estudiante[]>([]);
    const [, setTodosLosEstudiantes] = useState<Estudiante[]>([]);
    const [, setSelectedEstudianteId] = useState("");
    const [, setLoadingStudents] = useState(false);
    const [, setDocentes] = useState<Docente[]>([]);
    const [, setSalas] = useState<Sala[]>([]);

    const currentRole = useMemo(() => {
        const stored = localStorage.getItem("padiUser");
        if (!stored) return "";
        try {
            const user = JSON.parse(stored);
            return user?.rol || "";
        } catch {
            return "";
        }
    }, []);

    const isEquipoPadi = currentRole === "equipo_padi";
    const isEncargadoZona = currentRole === "encargado_zona";

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [salasData, docentesData] = await Promise.all([getSalas(), getDocentes()]);
            setSalas(salasData);
            setDocentes(docentesData);

            if (isEquipoPadi) {
                const zonasData = await getZonas();
                setZonas(zonasData);
            } else {
                const escuelasData = await getEscuelas();
                setEscuelas(escuelasData);
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Error al cargar panel de control");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isEquipoPadi && !isEncargadoZona) {
            navigate("/home");
            return;
        }

        loadData().then(() => {
            if (isEquipoPadi) setView("zonas");
            else setView("escuelas");
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEquipoPadi, isEncargadoZona, navigate]);

    useEffect(() => {
        if (!pendingRestore || loading || escuelas.length === 0) return;

        const restore = async () => {
            if (initialZonaId) {
                const zona = zonas.find((z) => z.id === initialZonaId);
                if (zona) setSelectedZona(zona);
            }

            if (initialEscuelaId) {
                const escuela = escuelas.find((e) => e.id === initialEscuelaId);
                if (escuela) {
                    setSelectedEscuela(escuela);
                    if (initialAulaId) {
                        const escuelaAulas = aulasByEscuela.get(escuela.id) || [];
                        const aula = escuelaAulas.find((a) => a.id === initialAulaId);
                        if (aula) {
                            await openAulaEstudiantes(aula);
                        } else {
                            setView("aulas");
                        }
                    } else {
                        setView("aulas");
                    }
                }
            }
            setPendingRestore(false);
        };
        restore();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingRestore, loading, escuelas, zonas, aulas]);

    const aulasByEscuela = useMemo(() => {
        const map = new Map<string, Aula[]>();
        for (const aula of aulas) {
            const list = map.get(aula.escuela_id) || [];
            list.push(aula);
            map.set(aula.escuela_id, list);
        }
        return map;
    }, [aulas]);

    const openZonaEscuelas = (zona: Zona) => {
        setSelectedZona(zona);
        setSelectedEscuela(null);
        setSelectedAula(null);
        setAulaEstudiantes([]);
        setView("escuelas");
    };

    const openEscuelaSalas = (escuela: Escuela) => {
        setSelectedEscuela(escuela);
        setSelectedSala(null);
        setSelectedAula(null);
        setView("salas");
    };

    const openSalaAulas = (sala: Sala) => {
        setSelectedSala(sala);
        setSelectedAula(null);
        setView("aulas");
    };

    const openAulaEstudiantes = async (aula: Aula) => {
        setSelectedAula(aula);
        setLoadingStudents(true);
        setError(null);
        try {
            const [estudiantes, todos] = await Promise.all([
                getAulaEstudiantes(aula.id),
                getEstudiantes(),
            ]);
            setAulaEstudiantes(estudiantes);
            setTodosLosEstudiantes(todos);
            setSelectedEstudianteId("");
            setView("estudiantes");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Error al cargar estudiantes del aula");
        } finally {
            setLoadingStudents(false);
        }
    };

    const panelSubtitle = isEquipoPadi
        ? "Panel central de gestión. Inicia con la administración y asignación de encargadaos de zona y permite navegar en cascada a través de instituciones, salas y comisiones hasta el historial de evaluaciones de los alumnos."
        : "Vista de escuelas de tu zona, con acceso de solo lectura a aulas, estudiantes y evaluaciones.";

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
            <PageHeader
                title="Panel de control"
                subtitle={panelSubtitle}
                backTo="/home"
                backLabel="Volver a inicio"
            />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {loading || pendingRestore ? (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        {!error && view === "zonas" && (
                            <Zonas
                                zonas={zonas}
                                onVerEscuelas={openZonaEscuelas}
                                onUpdate={loadData}
                                setError={setError}
                            />
                        )}
                        {!error && view === "escuelas" && (
                            <EscuelasView
                                zonaIdParam={selectedZona?.id}
                                isEquipoPadi={isEquipoPadi}
                                onVolver={() => {
                                    setSelectedZona(null);
                                    setView("zonas");
                                }}
                                onVerAulas={openEscuelaSalas}
                            />
                        )}
                        {!error && view === "salas" && selectedEscuela && (
                            <SalasView
                                escuelaId={selectedEscuela.id}
                                escuelaNombre={selectedEscuela.nombre}
                                onVolver={() => setView("escuelas")}
                                onVerAulas={openSalaAulas}
                            />
                        )}
                        {!error && view === "aulas" && selectedEscuela && selectedSala && (
                            <AulasView
                                escuelaId={selectedEscuela.id}
                                salaSeleccionada={selectedSala}
                                isEquipoPadi={isEquipoPadi}
                                onVolver={() => setView("salas")}
                                onVerEstudiantes={openAulaEstudiantes}
                            />
                        )}
                        {!error && view === "estudiantes" && selectedAula && (
                            <EstudiantesAulaView
                                aula={selectedAula}
                                onVolver={() => setView("aulas")}
                            />
                        )}
                    </>
                )}
            </Container>
        </Box>
    );
}

