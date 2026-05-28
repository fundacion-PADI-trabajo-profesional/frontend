import { useEffect, useState } from "react";
import { Container, Box, CircularProgress, Alert } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { type Aula } from "../api/aulas";
import { type Sala } from "../api/estudiantes";
import SalasView from "../components/aulas/SalasView";
import AulasView from "../components/aulas/AulasView";
import EstudiantesAulaView from "../components/aulas/EstudiantesAulaView";
import PageHeader from "../components/common/PageHeader";

export default function AulasPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentRole, setCurrentRole] = useState("");
  const [escuelaId, setEscuelaId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [selectedSala, setSelectedSala] = useState<Sala | null>(null);
  const [selectedAula, setSelectedAula] = useState<Aula | null>(null);
  const [escuelaNombre, setEscuelaNombre] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem("padiUser");
    if (!stored) {
      navigate("/login");
      return;
    }

    const user = JSON.parse(stored);
    setCurrentRole(user.rol);

    if (!["director", "encargado_zona", "equipo_padi"].includes(user.rol)) {
      navigate("/home");
      return;
    }

    const paramEscuelaId = searchParams.get("escuelaId");
    const paramEscuelaNombre = searchParams.get("escuelaNombre");

    setEscuelaId(paramEscuelaId || user.escuela_id || "");
    setEscuelaNombre(paramEscuelaNombre || user.escuela_nombre || "");

    setIsInitializing(false);
  }, [navigate, searchParams]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
      <PageHeader
        title="Niveles y Comisiones"
        subtitle="Gestión de salas, comisiones y alumnos de la institución."
        backTo="/home"
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {isInitializing ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) :

          !escuelaId ? (
            <Alert severity="warning">
              No se especificó ninguna escuela. Si sos administrador, volvé al Panel de Control y seleccioná una institución primero.
            </Alert>
          ) :

            // Mostrar las Salas (si no hay ninguna seleccionada)
            !selectedSala ? (
              <SalasView
                escuelaId={escuelaId}
                escuelaNombre={escuelaNombre}
                onVolver={() => navigate("/home")}
                onVerAulas={(sala) => setSelectedSala(sala)}
              />
            ) :

              // Mostrar las Aulas de esa Sala (si no hay aula seleccionada)
              !selectedAula ? (
                <AulasView
                  escuelaId={escuelaId}
                  salaSeleccionada={selectedSala}
                  isEquipoPadi={currentRole === "equipo_padi"}
                  onVolver={() => setSelectedSala(null)}
                  onVerEstudiantes={(aula) => setSelectedAula(aula)}
                />
              ) :

                // Mostrar los Estudiantes del Aula
                (
                  <EstudiantesAulaView
                    aula={selectedAula}
                    onVolver={() => setSelectedAula(null)}
                  />
                )}
      </Container>
    </Box>
  );
}