import React from "react";
import { Box, Typography, Paper } from "@mui/material";

interface DashboardCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    color?: string;
}

export default function DashboardCard({ title, description, icon, onClick, color = "#5c7cfa" }: DashboardCardProps) {
    const styledIcon = React.isValidElement(icon)
        ? React.cloneElement(icon as React.ReactElement, { sx: { fontSize: "2.5rem", color } })
        : icon;

    return (
        <Paper
            elevation={0}
            onClick={onClick}
            sx={{
                p: 3,
                height: "100%",
                borderRadius: 3,
                cursor: "pointer",
                border: "1px solid #e0e0e0",
                transition: "all 0.3s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 12px 24px rgba(0,0,0,0.1)",
                    borderColor: color,
                },
            }}
        >
            <Box sx={{
                mb: 2,
                bgcolor: `${color}15`,
                p: 1.5,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}>
                {styledIcon}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {description}
            </Typography>
        </Paper>
    );
}
