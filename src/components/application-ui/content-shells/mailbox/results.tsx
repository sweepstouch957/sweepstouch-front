import { Box, Card, Divider, Pagination, Stack, Typography } from '@mui/material';
import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
// ✅ zustand
import useMailStore, { getMails, runMailThunk } from 'src/slices/mailbox';
import ResultsActionBar from './results-actionbar';
import { ResultsItem } from './results-item';

interface MailboxResultsProps {
  tag: string;
}

export const MailboxResults: FC<MailboxResultsProps> = (props) => {
  const { tag } = props;

  const mails = useMailStore((state) => state.mails);
  const [selectedMails, setSelectedMails] = useState<string[]>([]);
  const { t } = useTranslation();

  // ✅ para no recalcular a cada render
  const allIds = mails.allIds;
  const byId = mails.byId;

  useEffect(() => {
    runMailThunk(getMails({ tag }));

    // opcional: cuando cambia el tag, limpiar selección
    setSelectedMails([]);
  }, [tag]);

  const handleSelectAllMails = (): void => {
    setSelectedMails(allIds.slice());
  };

  const handleDeselectAllMails = (): void => {
    setSelectedMails([]);
  };

  const handleSelectOneMail = (mailId: string): void => {
    setSelectedMails((prev) => (prev.includes(mailId) ? prev : [...prev, mailId]));
  };

  const handleDeselectOneMail = (mailId: string): void => {
    setSelectedMails((prev) => prev.filter((id) => id !== mailId));
  };

  const totalSelected = selectedMails.length;
  const totalMails = allIds.length;

  return (
    <Box>
      <ResultsActionBar
        onDeselectAll={handleDeselectAllMails}
        onSelectAll={handleSelectAllMails}
        selectedMails={totalSelected}
        mails={totalMails}
      />

      <Divider />

      {totalMails === 0 && (
        <Typography
          sx={{ py: 5 }}
          variant="h3"
          fontWeight={400}
          color="text.secondary"
          align="center"
        >
          {t('There are no messages in this category')}
        </Typography>
      )}

      <Box p={{ xs: 0, sm: 2, md: 3 }}>
        <Card
          sx={{ borderWidth: { xs: 0, sm: 1 } }}
          variant="outlined"
        >
          <Stack divider={<Divider />}>
            {allIds.map((mailId: string) => (
              <ResultsItem
                key={mailId}
                mailbox={byId[mailId]}
                href={tag && tag !== 'inbox' ? `?mailId=${mailId}&tag=${tag}` : `?mailId=${mailId}`}
                onDeselect={() => handleDeselectOneMail(mailId)}
                onSelect={() => handleSelectOneMail(mailId)}
                selected={selectedMails.includes(mailId)}
              />
            ))}
          </Stack>
        </Card>
      </Box>

      {totalMails !== 0 && (
        <Box
          pb={{ xs: 2, sm: 3 }}
          display="flex"
          justifyContent="center"
        >
          <Pagination
            shape="rounded"
            size="large"
            count={3}
            variant="outlined"
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};
