'use client';

import ConfirmDialog from '@/components/base/confirm-dialog';
import { Box, Card, Container, Divider, Pagination } from '@mui/material';
import { useCustomization } from 'src/hooks/use-customization';
import { StatusPopover } from './StatusPopover';
import { TicketDialog } from './TicketDialog';
import { TicketFilters } from './TicketFilters';
import { TicketsHeader } from './TicketsHeader';
import { TicketsMobileList } from './TicketsMobileList';
import { TicketsTable } from './TicketsTable';
import { useSupportTickets } from './use-support-tickets';

/** Tickets de soporte: filtros, tabla/tarjetas, alta y edición, cambio rápido de estado y borrado. */
export default function SupportTickets() {
  const customization = useCustomization();
  const {
    currentUserName,
    technicians,
    page,
    setPage,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    filterArea,
    setFilterArea,
    search,
    setSearch,
    dialogOpen,
    editTicket,
    setStoreRaw,
    storeSearch,
    loadingStores,
    stores,
    data,
    isLoading,
    pendingDelete,
    setPendingDelete,
    deleteMutation,
    openCreate,
    openEdit,
    closeDialog,
    handleSubmit,
    statusPopover,
    setStatusPopover,
    quickStatusMutation,
    totalPages,
    isSaving,
  } = useSupportTickets();

  return (
    <Container
      maxWidth={customization.stretch ? false : 'xl'}
      sx={{ py: { xs: 2, sm: 3 } }}
    >
      <TicketsHeader
        data={data}
        openCreate={openCreate}
      />

      <TicketFilters
        setPage={setPage}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterPriority={filterPriority}
        setFilterPriority={setFilterPriority}
        filterArea={filterArea}
        setFilterArea={setFilterArea}
        search={search}
        setSearch={setSearch}
      />

      {/* Table */}
      <Card>
        <TicketsTable
          data={data}
          isLoading={isLoading}
          setPendingDelete={setPendingDelete}
          openEdit={openEdit}
          setStatusPopover={setStatusPopover}
        />

        <TicketsMobileList
          data={data}
          isLoading={isLoading}
          setPendingDelete={setPendingDelete}
          openEdit={openEdit}
          setStatusPopover={setStatusPopover}
        />
        <Divider />
        <Box
          display="flex"
          justifyContent="center"
          py={2}
        >
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
            shape="rounded"
          />
        </Box>
      </Card>

      {/* -- Dialog -- */}
      {dialogOpen && (
        <TicketDialog
          open
          editTicket={editTicket}
          stores={stores}
          loadingStores={loadingStores}
          storeSearch={storeSearch}
          onStoreInputChange={setStoreRaw}
          technicians={technicians}
          currentUserName={currentUserName}
          isSaving={isSaving}
          onClose={closeDialog}
          onSubmit={handleSubmit}
        />
      )}

      <StatusPopover
        statusPopover={statusPopover}
        setStatusPopover={setStatusPopover}
        quickStatusMutation={quickStatusMutation}
      />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete);
          setPendingDelete(null);
        }}
        loading={deleteMutation.isPending}
        severity="error"
        title="Eliminar ticket"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
      />
    </Container>
  );
}
