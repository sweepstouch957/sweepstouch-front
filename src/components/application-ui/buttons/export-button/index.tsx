import * as React from 'react';
import { Button, type ButtonProps } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';

type ExportButtonProps = ButtonProps & {
  /** Nombre del CustomEvent a emitir (ej. "campaigns:export") */
  eventName?: string;
  /** Si es true, solo emite el evento y NO ejecuta la exportación interna */
  emitOnly?: boolean;
  /** Callback opcional para export personalizada sin eventos */
  onExport?: () => void;
};

const ExportButton: React.FC<ExportButtonProps> = ({
  eventName,
  emitOnly = false,
  onExport,
  children,
  ...rest
}) => {
  const handleClick = (): void => {
    // 1) Emitir evento si está configurado
    if (eventName && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName));
      if (emitOnly) return; // Evita export interna
    }

    // 2) Export personalizada vía callback si la proveen
    if (onExport) {
      onExport();
      return;
    }

    // 3) Comportamiento por defecto (si tuvieras uno previo, colócalo aquí).
    // Por ahora no hace nada para evitar descargas duplicadas.
    // console.log('ExportButton default export noop');
  };

  return (
    <Button
      variant="contained"
      startIcon={<FileDownloadOutlinedIcon fontSize="small" />}
      onClick={handleClick}
      {...rest}
    >
      {children ?? 'Export'}
    </Button>
  );
};

export default ExportButton;
