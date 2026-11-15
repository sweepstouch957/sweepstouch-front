'use client';

import { alpha, Box, Container, useMediaQuery, useTheme } from '@mui/material';
import { useCustomization } from 'src/hooks/use-customization';
import { AiContextDialog } from './AiContextDialog';
import { EditProjectDrawer } from './EditProjectDrawer';
import { NewProjectDialog } from './NewProjectDialog';
import { ProjectsEmpty } from './ProjectsEmpty';
import { ProjectsGrid } from './ProjectsGrid';
import { ProjectsHeader } from './ProjectsHeader';
import { ProjectsLoading } from './ProjectsLoading';
import { ProjectsStats } from './ProjectsStats';
import { ProjectsTable } from './ProjectsTable';
import { ProjectsToolbar } from './ProjectsToolbar';
import { useProjectsBoard } from './use-projects-board';

/* ══════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                          */
/* ══════════════════════════════════════════════════════════════════ */

export default function ProjectsBoard() {
  const customization = useCustomization();
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isDark = theme.palette.mode === 'dark';
  const {
    toggleView,
    setToggleView,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    statusAnchorEl,
    setStatusAnchorEl,
    page,
    setPage,
    limit,
    setLimit,
    newProjectOpen,
    setNewProjectOpen,
    aiDialogOpen,
    setAiDialogOpen,
    editingProject,
    setEditingProject,
    projects,
    isLoading,
    aiContext,
    allUsers,
    createProjectMut,
    updateProjectMut,
    deleteProjectMut,
    filtered,
    paginated,
    getStatusName,
    handleOpenBoard,
    stats,
  } = useProjectsBoard();

  return (
    <Box
      display="flex"
      flex={1}
      flexDirection="column"
      sx={{ bgcolor: isDark ? alpha(theme.palette.neutral[25], 0.02) : 'neutral.25' }}
      p={{ xs: 2, sm: 3 }}
    >
      {/* ── Page heading ── */}
      <ProjectsHeader
        setNewProjectOpen={setNewProjectOpen}
        setAiDialogOpen={setAiDialogOpen}
      />

      {/* ── Stats row ── */}
      <ProjectsStats
        projects={projects}
        stats={stats}
      />

      <Container
        disableGutters={!mdUp}
        maxWidth={customization.stretch ? false : 'xl'}
      >
        {/* ── Toolbar ── */}
        <ProjectsToolbar
          toggleView={toggleView}
          setToggleView={setToggleView}
          query={query}
          setQuery={setQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          statusAnchorEl={statusAnchorEl}
          setStatusAnchorEl={setStatusAnchorEl}
          setPage={setPage}
          getStatusName={getStatusName}
        />

        {/* ── Loading ── */}
        <ProjectsLoading isLoading={isLoading} />

        {/* ── Empty ── */}
        <ProjectsEmpty
          query={query}
          statusFilter={statusFilter}
          setNewProjectOpen={setNewProjectOpen}
          isLoading={isLoading}
          filtered={filtered}
        />

        {/* ══ TABLE VIEW ══ */}
        <ProjectsTable
          toggleView={toggleView}
          page={page}
          setPage={setPage}
          limit={limit}
          setLimit={setLimit}
          setEditingProject={setEditingProject}
          isLoading={isLoading}
          deleteProjectMut={deleteProjectMut}
          filtered={filtered}
          paginated={paginated}
          handleOpenBoard={handleOpenBoard}
        />

        {/* ══ GRID VIEW ══ */}
        <ProjectsGrid
          toggleView={toggleView}
          page={page}
          setPage={setPage}
          limit={limit}
          setLimit={setLimit}
          setEditingProject={setEditingProject}
          isLoading={isLoading}
          filtered={filtered}
          paginated={paginated}
          handleOpenBoard={handleOpenBoard}
        />
      </Container>

      {/* ══ EDIT DRAWER ══ */}
      <EditProjectDrawer
        open={!!editingProject}
        project={editingProject}
        allUsers={allUsers}
        onClose={() => setEditingProject(null)}
        onSave={(id, data) => updateProjectMut.mutate({ id, ...data })}
        onDelete={(id) => deleteProjectMut.mutate(id)}
        isSaving={updateProjectMut.isPending}
      />

      {/* ══ NEW PROJECT DIALOG ══ */}
      {newProjectOpen && (
        <NewProjectDialog
          open
          isPending={createProjectMut.isPending}
          onClose={() => setNewProjectOpen(false)}
          onCreate={(payload) => createProjectMut.mutate(payload)}
        />
      )}

      {/* ══ AI CONTEXT DIALOG ══ */}
      <AiContextDialog
        aiDialogOpen={aiDialogOpen}
        setAiDialogOpen={setAiDialogOpen}
        aiContext={aiContext}
      />
    </Box>
  );
}
