import { Box, Container, Typography, Button } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
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

        <Box sx={{ mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{
              color: "#5c7cfa",
              textTransform: "none",
              fontWeight: 500,
            }}
            disableRipple 
          >
            {backLabel}
          </Button>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
        }}
        >
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

          <Box sx={{ display: "flex", gap: 1, mt: { xs: 1, md: 0 }, width: { xs: "100%", md: "auto" }, justifyContent: { xs: "flex-start", md: "flex-end" } }}>
            {onAdd && (
              <Button variant="contained" onClick={onAdd} sx={{ textTransform: "none" }}>
                {addLabel || "Agregar"}
              </Button>
            )}
          </Box>
        </Box>

      </Container>
    </Box>
  )
}