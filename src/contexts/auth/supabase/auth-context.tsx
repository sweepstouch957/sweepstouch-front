import React from 'react';
import type { User } from 'src/contexts/auth/user';
import { createClient as createSupabaseClient } from 'src/utils/supabase/client';
import { UserContext } from './context';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [supabaseClient] = React.useState(createSupabaseClient());
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
      const { data, error } = await supabaseClient.auth.getSession();

      if (error) {
        console.error(error);
        setState((prev) => ({ ...prev, user: null, error: 'Something went wrong' }));
        return;
      }

      if (data?.session?.user) {
        setState((prev) => ({ ...prev, user: data.session.user as unknown as User, error: null }));
      }
    } catch (err) {
      console.error(err);
      setState((prev) => ({ ...prev, user: null, error: 'Something went wrong' }));
    }
  }, [supabaseClient]);

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
