import { Alert, Snackbar } from '@mui/material';
import { SnackState } from '../types/ScheduleCirculars';

type CircularsSnackbarProps = {
    snack: SnackState;
    onClose: () => void;
};

export function CircularsSnackbar({ snack, onClose }: CircularsSnackbarProps) {
    return (
        <Snackbar
            open={snack.open}
            autoHideDuration={3500}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
            <Alert
                onClose={onClose}
                severity={snack.sev}
                variant="filled"
                sx={{ width: '100%' }}
            >
                {snack.msg}
            </Alert>
        </Snackbar>
    );
}
