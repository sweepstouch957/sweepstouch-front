import { UploadFile as UploadIcon } from '@mui/icons-material';
import { Box, Chip, Divider, Paper, Toolbar, Typography } from '@mui/material';
import { FileUploader } from '../FileUploader';

type CircularsUploaderCardProps = {
    maxMb: number;
    onFileUpload: (files: File[]) => void;
};

export function CircularsUploaderCard({ maxMb, onFileUpload }: CircularsUploaderCardProps) {
    return (
        <Paper
            sx={{
                borderRadius: 3,
                overflow: 'hidden',
                mb: 3,
                border: '1px solid', borderColor: 'divider',
            }}
            elevation={0}
        >
            <Toolbar
                sx={{
                    px: 3,
                    py: 2,
                    minHeight: 56,
                    borderBottom: '1px solid', borderColor: 'divider',
                    bgcolor: 'action.hover',
                    display: 'flex',
                    gap: 1.5,
                }}
            >
                <UploadIcon sx={{ color: 'text.secondary' }} />
                <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, color: 'text.primary' }}
                >
                    Subir PDFs (drag & drop)
                </Typography>
                <Chip
                    label={`Máx ${maxMb}MB`}
                    size="small"
                    sx={{ ml: 'auto', bgcolor: 'action.hover', color: 'text.secondary', fontWeight: 600 }}
                />
            </Toolbar>

            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <FileUploader uploadedFiles={[]}
                    onFileUpload={onFileUpload} />
                <Divider sx={{ mt: 2 }} />
                <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', display: 'block', mt: 1.5 }}
                >
                    Tip: el nombre del archivo debe incluir el <b>slug</b> de la tienda (ej.{' '}
                    <i>new-rochelle.pdf</i>) para auto-rellenar la columna.
                </Typography>
            </Box>
        </Paper>
    );
}
