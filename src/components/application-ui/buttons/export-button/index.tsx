import { Button } from '@mui/material';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface ExportButtonProps {
  campaigns: any[];
}

const ExportButton = ({ campaigns }: ExportButtonProps) => {
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(campaigns);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Campaigns');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    saveAs(dataBlob, 'campaigns_export.xlsx');
  };

  return (
    <Button
      onClick={handleExport}
      variant="contained"
    >
      Exportar
    </Button>
  );
};

export default ExportButton;
