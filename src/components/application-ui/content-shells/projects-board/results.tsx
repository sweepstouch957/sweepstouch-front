import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import {
  Box,
  Button,
  Chip,
  ClickAwayListener,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import type { ChangeEvent, FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ButtonIcon } from 'src/components/base/styles/button-icon';
import { CardBorderColor } from 'src/components/base/styles/card-border-color';
import type { List as ListType } from 'src/models/projects_board';
import {
  runProjectsBoardThunk,
  updateList as updateListThunk,
  useProjectsBoardStore,
} from 'src/slices/projects_board';
import Task from './task';

interface ResultsProps {
  listId: string;
}

const Results: FC<ResultsProps> = ({ listId }) => {
  const { t } = useTranslation();

  // ✅ selector estable para evitar re-renders innecesarios
  const list = useProjectsBoardStore(
    useMemo(() => (state) => state.lists.byId[listId] as ListType, [listId])
  );

  // ✅ por si el board todavía no ha cargado
  if (!list) return null;

  const [name, setName] = useState<string>(list.name);
  const [isRenaming, setRename] = useState<boolean>(false);

  // ✅ si cambia el nombre en el store (ej: refresh / remote update)
  useEffect(() => {
    setName(list.name);
  }, [list.name]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setName(event.target.value);
  };

  const handleRenameInit = (): void => {
    setRename(true);
  };

  const handleRename = async (): Promise<void> => {
    try {
      const trimmed = (name ?? '').trim();

      if (!trimmed) {
        setName(list.name);
        setRename(false);
        return;
      }

      // ✅ evita request si no cambió
      if (trimmed === list.name) {
        setRename(false);
        return;
      }

      setRename(false);

      // ✅ thunk zustand (igual que redux pero sin dispatch)
      await runProjectsBoardThunk(updateListThunk(list.id, { name: trimmed }));

      toast.success(t('Project board updated successfully!'));
    } catch (err) {
      console.error(err);
      toast.error(t('There was an error, try again later'));
      // opcional: re-abrir rename
      // setRename(true);
    }
  };

  return (
    <CardBorderColor
      elevation={7}
      borderColor={list.color}
      borderPosition="top"
      sx={{
        minWidth: { xs: 'none', sm: 320 },
        width: { xs: 'auto', md: 320 },
        mr: { xs: 0, md: 3 },
        mb: { xs: 2, md: '2px' },
        ml: '2px',
      }}
    >
      <Box
        px={2}
        pt={2}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        {isRenaming ? (
          <ClickAwayListener onClickAway={handleRename}>
            <TextField
              value={name}
              size="small"
              onBlur={handleRename}
              onChange={handleChange}
              variant="outlined"
              margin="none"
              fullWidth
              autoFocus
            />
          </ClickAwayListener>
        ) : (
          <Typography
            color="inherit"
            variant="h4"
            noWrap
            fontWeight={500}
            onClick={handleRenameInit}
            sx={{ cursor: 'text' }}
          >
            {list.name}
          </Typography>
        )}

        <Stack
          spacing={0.5}
          direction="row"
          alignItems="center"
          pl={0.5}
        >
          <Tooltip
            arrow
            placement="top"
            title={t('Rename')}
          >
            <ButtonIcon
              size="small"
              startIcon={<EditTwoToneIcon fontSize="small" />}
              onClick={handleRenameInit}
            />
          </Tooltip>

          <Chip
            size="small"
            variant="outlined"
            label={(list.taskIds ?? []).length}
            color="primary"
          />
        </Stack>
      </Box>

      <Box
        px={2}
        pt={2}
      >
        <Tooltip
          placement="top"
          arrow
          title={t('Add new task')}
        >
          <Button
            variant="outlined"
            color="primary"
            fullWidth
          >
            <AddTwoToneIcon fontSize="small" />
          </Button>
        </Tooltip>
      </Box>

      {(list.taskIds ?? []).length === 0 && (
        <Box
          p={{ xs: 2, sm: 3, md: 4 }}
          textAlign="center"
        >
          <Typography variant="subtitle2">
            {t('Drag tasks here to assign them to this board')}
          </Typography>
        </Box>
      )}

      <Droppable droppableId={list.id}>
        {(provided) => (
          <Stack
            p={2}
            spacing={{ xs: 2, sm: 3 }}
            sx={{ minHeight: 260 }}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {(list.taskIds ?? []).map((taskId, index) => (
              <Draggable
                draggableId={taskId}
                index={index}
                key={taskId}
              >
                {(provided, snapshot) => (
                  <Task
                    taskId={taskId}
                    dragging={snapshot.isDragging}
                    index={index}
                    list={list}
                    // @ts-ignore (si Task es forwardRef)
                    ref={provided.innerRef}
                    style={{ ...provided.draggableProps.style }}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Stack>
        )}
      </Droppable>

      <Box
        px={2}
        pb={2}
      >
        <Tooltip
          placement="top"
          arrow
          title={t('Add new task')}
        >
          <Button
            color="primary"
            variant="outlined"
            fullWidth
          >
            <AddTwoToneIcon fontSize="small" />
          </Button>
        </Tooltip>
      </Box>
    </CardBorderColor>
  );
};

export default Results;
