import { Button, type ButtonProps } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

interface BotonNuevoProps extends ButtonProps {
    texto: string;
}

export default function BotonNuevo({ texto, ...props }: BotonNuevoProps) {
    return (
        <Button
            startIcon={<AddIcon />}
            variant="contained"
            {...props} 
            sx={{
                bgcolor: "#A3BE54",
                color: "white",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1,
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                "&:hover": {
                    bgcolor: "#000",
                    transform: "translateY(-1px)",
                    boxShadow: "0 6px 8px rgba(0,0,0,0.15)",
                },
                transition: "all 0.2s ease",
                ...props.sx,
            }}
        >
            {texto}
        </Button>
    );
}
