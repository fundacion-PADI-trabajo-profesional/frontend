"use client"

import { Box, Container, Typography, Button } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import AddIcon from "@mui/icons-material/Add"
import { useNavigate } from "react-router-dom"
import { ReactNode } from "react";

interface PageHeaderProps {
  backTo?: string
  backLabel?: string
  title: string
  subtitle?: ReactNode;
  onBack?: () => void
  onAdd?: () => void
  addLabel?: string
}

export default function PageHeader({
  backTo,
  backLabel = "Volver",
  title,
  subtitle,
  onBack,
  onAdd,
  addLabel
}: PageHeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
      return
    }
    if (backTo) {
      navigate(backTo)
    } else {
      navigate(-1)
    }
  }

  return (
    <Box sx={{ bgcolor: "#f5f5f5", pt: 3, pb: 4, borderBottom: "1px solid #e0e0e0", mb: 3 }}>
      <Container maxWidth="lg">

        {/* 1. FILA SUPERIOR: SOLO NAVEGACIÓN (VOLVER) */}
        <Box sx={{ mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{
              color: "#5c7cfa",
              textTransform: "none",
              fontWeight: 500,
              pl: 0, // Sacamos el padding izquierdo para que se alinee perfecto con el título
              "&:hover": { bgcolor: "transparent", textDecoration: "underline" }
            }}
            disableRipple // Efecto más limpio para links de texto
          >
            {backLabel}
          </Button>
        </Box>

        {/* 2. FILA PRINCIPAL: TÍTULO A LA IZQUIERDA, ACCIÓN A LA DERECHA */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

          {/* Bloque de Título y Subtítulo */}
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700, color: "#1a1a1a", mb: 1 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body1" sx={{ color: "#666" }}>
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Botón de Acción (Alineado con el bloque del título) */}
          {onAdd && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAdd}
              sx={{
                bgcolor: "#5fb878",
                color: "white",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1,
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)", // Sombra suave para destacar
                "&:hover": {
                  bgcolor: "#000",
                  transform: "translateY(-1px)",
                  boxShadow: "0 6px 8px rgba(0,0,0,0.15)"
                },
                transition: "all 0.2s ease"
              }}
            >
              {addLabel || "Agregar"}
            </Button>
          )}
        </Box>

      </Container>
    </Box>
  )
}