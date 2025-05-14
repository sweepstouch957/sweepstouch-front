import { Box, Skeleton, TableCell, TableRow } from '@mui/material';

export const SkeletonTableRow = () => (
  <TableRow>
    <TableCell>
      <Box
        display="flex"
        alignItems="center"
      >
        <Skeleton
          variant="circular"
          width={24}
          height={24}
          sx={{ mr: 1 }}
        />
        <Skeleton
          variant="text"
          width={80}
        />
      </Box>
    </TableCell>
    <TableCell>
      <Skeleton
        variant="text"
        width={70}
      />
    </TableCell>
    <TableCell>
      <Box
        display="flex"
        alignItems="center"
      >
        <Skeleton
          variant="circular"
          width={38}
          height={38}
          sx={{ mr: 1 }}
        />
        <Skeleton
          variant="text"
          width={100}
        />
      </Box>
    </TableCell>
    <TableCell>
      <Skeleton
        variant="text"
        width={50}
      />
    </TableCell>
    <TableCell>
      <Skeleton
        variant="text"
        width={60}
      />
    </TableCell>
    <TableCell>
      <Skeleton
        variant="rounded"
        width={80}
        height={30}
      />
    </TableCell>
    <TableCell align="center">
      <Skeleton
        variant="circular"
        width={24}
        height={24}
        sx={{ mr: 1 }}
      />
      <Skeleton
        variant="circular"
        width={24}
        height={24}
      />
    </TableCell>
  </TableRow>
);
