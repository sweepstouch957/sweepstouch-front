import { Close as CloseIcon } from '@mui/icons-material';
import { Box, IconButton, Modal, Paper, Typography } from '@mui/material';

type InstructionsModalProps = {
    open: boolean;
    instructions: string[];
    onClose: () => void;
};

export function InstructionsModal({ open, instructions, onClose }: InstructionsModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
            <Paper
                sx={{
                    maxWidth: 640,
                    width: '90%',
                    borderRadius: 3,
                    p: 4,
                    position: 'relative',
                    maxHeight: '80vh',
                    overflow: 'auto',
                    // Overlay real (Modal): mantiene elevación, pero del token del theme.
                    boxShadow: (theme) => theme.shadows[24],
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: 'text.primary' }}
                    >
                        Instructions
                    </Typography>
                    <IconButton onClick={onClose} 
                    sx={{ color: 'text.secondary' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {instructions.map((instruction, idx) => (
                    <Typography
                        key={idx}
                        variant="body2"
                        sx={{ color: 'text.secondary', mb: 1.2 }}
                    >
                        • {instruction}
                    </Typography>
                ))}
            </Paper>
        </Modal>
    );
}
