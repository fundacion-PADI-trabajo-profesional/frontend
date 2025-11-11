"use client"

import { Box, Container, Typography, Button } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useNavigate } from "react-router-dom"

interface PageHeaderProps {
  backTo: string
  backLabel: string
  title: string
  subtitle?: string
}

export default function PageHeader({ backTo, backLabel, title, subtitle }: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    <Box sx={{ bgcolor: "#f5f5f5", py: 4, borderBottom: "1px solid #e0e0e0" }}>
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(backTo)}
          sx={{ color: "#5c7cfa", textTransform: "none", mb: 2 }}
        >
          {backLabel}
        </Button>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" sx={{ color: "#666" }}>
            {subtitle}
          </Typography>
        )}
      </Container>
    </Box>
  )
}


