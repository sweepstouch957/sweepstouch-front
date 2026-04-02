'use client';

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PersonAddRounded from '@mui/icons-material/PersonAddRounded';
import { Box, Button, Container, Stack, alpha, useTheme } from '@mui/material';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import UsersTableListing from 'src/components/application-ui/tables/users/users';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';
import CreateUserDialog from 'src/components/merchants/CreateUserDialog';
import EditUserDialog from 'src/components/merchants/EditUserDialog';

function Page(): React.JSX.Element {
  const customization = useCustomization();
  const { t } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);

  const pageMeta = {
    title: 'Users',
    description: 'Manage user accounts and permissions',
  };

  const triggerExport = (
    mode: 'filtered' | 'page' | 'selected' | 'all' = 'filtered'
  ) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('users-export', { detail: { mode } })
      );
    }
  };

  return (
    <>
      {pageMeta.title && (
        <Container
          sx={{
            py: {
              xs: 2,
              sm: 3,
            },
          }}
          maxWidth={customization.stretch ? false : 'xl'}
        >
          <PageHeading
            sx={{
              px: 0,
            }}
            title={t(pageMeta.title)}
            description={pageMeta.description && pageMeta.description}
            actions={
              <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FileDownloadOutlinedIcon />}
                  onClick={() => triggerExport('page')}
                  sx={{ borderRadius: 2 }}
                >
                  {t('Export page')}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FileDownloadOutlinedIcon />}
                  onClick={() => triggerExport('all')}
                  sx={{ borderRadius: 2 }}
                >
                  {t('Export all')}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FileDownloadOutlinedIcon />}
                  onClick={() => triggerExport('filtered')}
                  sx={{ borderRadius: 2 }}
                >
                  {t('Export filtered')}
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PersonAddRounded />}
                  onClick={() => setCreateOpen(true)}
                  disableElevation
                  sx={{
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  }}
                >
                  {t('Create User')}
                </Button>
              </Stack>
            }
          />
        </Container>
      )}
      <Box
        pb={{
          xs: 2,
          sm: 3,
        }}
      >
        <Container maxWidth={customization.stretch ? false : 'xl'}>
          <UsersTableListing onEditUser={(u: any) => setEditUser(u)} />
        </Container>
      </Box>

      {/* Dialogs */}
      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['users'] });
          setCreateOpen(false);
        }}
      />

      {editUser && (
        <EditUserDialog
          open={!!editUser}
          user={editUser}
          onClose={() => setEditUser(null)}
          onUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setEditUser(null);
          }}
        />
      )}
    </>
  );
}

export default Page;
