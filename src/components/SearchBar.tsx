import { styled } from '@mui/material/styles';
import { TextField } from '@mui/material';

export const BuscadorPadi = styled(TextField)(({ theme }) => ({
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0px 2px 8px rgba(0,0,0,0.04)',
    width: '100%',
    [theme.breakpoints.up('sm')]: {
        width: '450px',
    },
    '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        '& fieldset': {
            borderColor: 'transparent',
            transition: 'border-color 0.2s ease-in-out',
        },
        '&:hover fieldset': {
            borderColor: '#e0e0e0',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#5c7cfa',
            borderWidth: '1px',
        },
    },
}));