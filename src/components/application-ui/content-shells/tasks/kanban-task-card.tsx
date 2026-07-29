import { Task } from '@/services/task.service';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import SubdirectoryArrowRightRoundedIcon from '@mui/icons-material/SubdirectoryArrowRightRounded';
import {
  alpha,
  Avatar,
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { format, isAfter } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { priorityMeta } from './constants';
import { useDragTiltDom } from './use-drag-tilt';

export const KanbanTaskCard = React.memo(
  function KanbanTaskCardInner({
    task, onEdit, onDelete, dragging, style, ref, ...rest
  }: {
    task: Task;
    onEdit: (t: Task) => void;
    onDelete: (id: string) => void;
    dragging?: boolean;
    style?: React.CSSProperties;
    ref?: React.Ref<HTMLDivElement>;
    [key: string]: any;
  }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const pri = priorityMeta(theme, task.priority);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const isOverdue =
      mounted && task.dueDate && task.status !== 'done' && isAfter(new Date(), new Date(task.dueDate));

    const paperRef = useDragTiltDom(dragging, style?.transform);

    return (
      <Box
        ref={ref}
        style={style}
        {...rest}
        sx={{ mb: 1.5 }}
      >
        <Paper
          ref={paperRef}
          elevation={dragging ? 12 : 0}
          sx={{
            border: `1px solid ${
              dragging ? pri.color : alpha(theme.palette.divider, isDark ? 0.15 : 0.6)
            }`,
            borderLeft: `3px solid ${pri.color}`,
            borderRadius: 2,
            cursor: 'grab',
            bgcolor: dragging
              ? alpha(theme.palette.background.paper, 0.95)
              : theme.palette.background.paper,
            transformOrigin: 'bottom center', // Pegman hangs from the bottom or top depending on preference. Top is usually 'top center'
            transition: dragging ? 'none' : 'background-color 0.15s, border-color 0.15s',
            zIndex: dragging ? 9999 : 'auto',
            '&:hover': {
              bgcolor: alpha(pri.color, isDark ? 0.12 : 0.05),
              borderColor: alpha(pri.color, 0.6),
            },
          }}
          onClick={() => onEdit(task)}
        >
          <Box sx={{ p: 1.5 }}>
            {/* Top row: identifier + priority + delete */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              mb={0.75}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.75}
              >
                {task.identifier && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: 10,
                      color: alpha(theme.palette.text.secondary, 0.7),
                      letterSpacing: 0.4,
                      bgcolor: isDark
                        ? alpha(theme.palette.common.white, 0.05)
                        : alpha(theme.palette.common.black, 0.04),
                      px: 0.75,
                      py: 0.2,
                      borderRadius: 0.75,
                    }}
                  >
                    {task.identifier}
                  </Typography>
                )}
                <Chip
                  label={pri.label}
                  size="small"
                  sx={{
                    height: 17,
                    fontSize: 9,
                    fontWeight: 800,
                    bgcolor: alpha(pri.color, 0.12),
                    color: pri.color,
                    border: 'none',
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              </Stack>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task._id);
                }}
                sx={{
                  opacity: 0,
                  '.MuiPaper-root:hover &': { opacity: 0.4 },
                  '&:hover': { opacity: '1 !important', color: 'error.main' },
                  p: 0.25,
                }}
              >
                <DeleteRoundedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Stack>

            {/* Title */}
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ lineHeight: 1.4, fontSize: 12.5, mb: 0.5, wordBreak: 'break-word' }}
            >
              {task.title}
            </Typography>

            {/* Description snippet */}
            {task.description && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', lineHeight: 1.4, fontSize: 11, mb: 0.75, opacity: 0.75 }}
              >
                {task.description.slice(0, 80)}
                {task.description.length > 80 ? '…' : ''}
              </Typography>
            )}

            {/* Tags */}
            {task.tags?.length > 0 && (
              <Stack
                direction="row"
                spacing={0.4}
                flexWrap="wrap"
                gap={0.4}
                mb={0.75}
              >
                {task.tags.slice(0, 3).map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{
                      height: 16,
                      fontSize: 9,
                      fontWeight: 600,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: 'primary.main',
                      '& .MuiChip-label': { px: 0.5 },
                    }}
                  />
                ))}
              </Stack>
            )}

            {/* Progress */}
            {task.progress > 0 && (
              <Box mb={0.75}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={0.25}
                >
                  <Typography
                    variant="caption"
                    fontSize={9}
                    color="text.secondary"
                  >
                    Progress
                  </Typography>
                  <Typography
                    variant="caption"
                    fontSize={9}
                    fontWeight={700}
                    color="text.secondary"
                  >
                    {task.progress}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={task.progress}
                  sx={{
                    height: 3,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.divider, 0.15),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 2,
                      bgcolor: task.progress === 100 ? 'success.main' : 'primary.main',
                    },
                  }}
                />
              </Box>
            )}

            {/* Footer: due date + assignee + meta icons */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              mt={0.5}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
              >
                {task.dueDate && (
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.25}
                  >
                    <CalendarTodayRoundedIcon
                      sx={{ fontSize: 10, color: isOverdue ? 'error.main' : 'text.disabled' }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: 10,
                        color: isOverdue ? 'error.main' : 'text.secondary',
                        fontWeight: isOverdue ? 700 : 400,
                      }}
                    >
                      {format(new Date(task.dueDate), 'MMM d')}
                    </Typography>
                  </Stack>
                )}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                >
                  {(task.comments || 0) > 0 && (
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.2}
                    >
                      <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 10, color: 'text.disabled' }} />
                      <Typography
                        variant="caption"
                        sx={{ fontSize: 10, color: 'text.secondary' }}
                      >
                        {task.comments}
                      </Typography>
                    </Stack>
                  )}
                  {(task.attachments || 0) > 0 && (
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.2}
                    >
                      <AttachFileRoundedIcon sx={{ fontSize: 10, color: 'text.disabled' }} />
                      <Typography
                        variant="caption"
                        sx={{ fontSize: 10, color: 'text.secondary' }}
                      >
                        {task.attachments}
                      </Typography>
                    </Stack>
                  )}
                  {(task.sub_items || 0) > 0 && (
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.2}
                    >
                      <SubdirectoryArrowRightRoundedIcon
                        sx={{ fontSize: 10, color: 'text.disabled' }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ fontSize: 10, color: 'text.secondary' }}
                      >
                        {task.sub_items}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Stack>

              {task.assigneeName && (
                <Tooltip
                  title={task.assigneeName}
                  placement="top"
                >
                  <Avatar
                    src={task.assigneeAvatar}
                    sx={{
                      width: 22,
                      height: 22,
                      fontSize: 9,
                      fontWeight: 700,
                      bgcolor: alpha(pri.color, 0.2),
                      color: pri.color,
                    }}
                  >
                    {task.assigneeName.charAt(0).toUpperCase()}
                  </Avatar>
                </Tooltip>
              )}
            </Stack>
          </Box>
        </Paper>
      </Box>
    );
  }
);
KanbanTaskCard.displayName = 'KanbanTaskCard';
