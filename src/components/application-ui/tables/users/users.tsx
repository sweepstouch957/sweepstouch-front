'use client';

import { usersApi } from '@/mocks/users';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Results from './results';

interface UsersTableListingProps {
  onEditUser?: (user: any) => void;
  onAssignDepartment?: (user: any) => void;
}

function Component({ onEditUser, onAssignDepartment }: UsersTableListingProps) {
  const queryClient = useQueryClient();
  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="300px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography
        color="error"
        align="center"
      >
        Error al cargar usuarios
      </Typography>
    );
  }

  return <Results users={users || []} onEditUser={onEditUser} onAssignDepartment={onAssignDepartment} onDeleteUser={() => queryClient.invalidateQueries({ queryKey: ['users'] })} />;
}

export default Component;
