import React from 'react';
import type { User } from 'src/contexts/auth/user';
import { authClient } from 'src/utils/auth/custom/client';
import { api } from '@/libs/axios';
import { removeAuthToken } from 'src/utils/auth/custom/storage';
import { UserContext } from './context';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [state, setState] = React.useState<{
    user: User | null;
    error: string | null;
    isLoading: boolean;
  }>({
    user: null,
    error: null,
    isLoading: true,
  });

  const checkSession = React.useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await authClient.getUser();

      if (error) {
        console.error(error);
        setState((prev) => ({ ...prev, user: null, error: 'Something went wrong' }));
        removeAuthToken();
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/auth/custom/login';
        return;
      }

      if (data) {
        setState((prev) => ({ ...prev, user: data, error: null }));
      }
    } catch (err) {
      console.error(err);
      setState((prev) => ({ ...prev, user: null, error: 'Something went wrong' }));
    }
  }, []);

  React.useEffect(() => {
    (async () => {
      await checkSession().catch(() => {});
      setState((prev) => ({ ...prev, isLoading: false }));
    })().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Expected
  }, []);

  const contextValue = React.useMemo(
    () => ({ ...state, checkSession }),
    [state, checkSession]
  );

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

export const UserConsumer = UserContext.Consumer;
