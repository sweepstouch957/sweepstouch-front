import {
  Box,
  Card,
  Skeleton,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
} from '@mui/material';
import { FC } from 'react';

export const StoreTableSkeleton: FC<{ rows?: number }> = ({ rows = 12 }) => (
  <Card>
    <TableContainer sx={{ maxHeight: '70vh' }}>
      <Table
        stickyHeader
        size="small"
      >
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Skeleton
                variant="rectangular"
                width={20}
                height={20}
              />
            </TableCell>
            <TableCell>
              <Skeleton width={60} />
            </TableCell>
            <TableCell>
              <Skeleton width={160} />
            </TableCell>
            <TableCell>
              <Skeleton width={200} />
            </TableCell>
            <TableCell>
              <Skeleton width={70} />
            </TableCell>
            <TableCell align="center">
              <Skeleton
                width={60}
                sx={{ mx: 'auto' }}
              />
            </TableCell>
            <TableCell align="center">
              <Skeleton
                width={80}
                sx={{ mx: 'auto' }}
              />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              <TableCell padding="checkbox">
                <Skeleton
                  variant="rectangular"
                  width={20}
                  height={20}
                />
              </TableCell>
              <TableCell>
                <Skeleton
                  variant="rounded"
                  width={40}
                  height={40}
                />
              </TableCell>
              <TableCell>
                <Skeleton width="70%" />
              </TableCell>
              <TableCell>
                <Skeleton width="90%" />
              </TableCell>
              <TableCell>
                <Skeleton width={50} />
              </TableCell>
              <TableCell align="center">
                <Skeleton
                  width={50}
                  sx={{ mx: 'auto' }}
                />
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'inline-flex', gap: 1 }}>
                  <Skeleton
                    variant="circular"
                    width={28}
                    height={28}
                  />
                  <Skeleton
                    variant="circular"
                    width={28}
                    height={28}
                  />
                  <Skeleton
                    variant="circular"
                    width={28}
                    height={28}
                  />
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    <Box p={2}>
      <Skeleton width="35%" />
    </Box>
  </Card>
);
