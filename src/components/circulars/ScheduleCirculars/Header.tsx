import { Add as AddIcon, Help as HelpIcon, Save as SaveIcon } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';

type ScheduleCircularsHeaderProps = {
    onAddRow: () => void;
    onSaveAll: () => void;
    onOpenInstructions: () => void;
};

export function ScheduleCircularsHeader({
    onAddRow,
    onSaveAll,
    onOpenInstructions,
}: ScheduleCircularsHeaderProps) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
                <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: '#1A202C', mb: 0.25 }}
                >
                    Schedule Circulars
                </Typography>
                <Typography
                    variant="subtitle1"
                    sx={{ color: '#718096' }}
                >
                    Upload and manage circular files
                </Typography>
            </Box>

            <Stack direction="row"
                spacing={1}>
                <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={onAddRow}
                >
                    Nueva fila
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={onSaveAll}
                >
                    Guardar Todo
                </Button>
                <Button
                    variant="contained"
                    startIcon={<HelpIcon />}
                    onClick={onOpenInstructions}
                    sx={{ backgroundColor: '#E91E63', '&:hover': { backgroundColor: '#AD1457' } }}
                >
                    Instructions
                </Button>
            </Stack>
        </Box>
    );
}
