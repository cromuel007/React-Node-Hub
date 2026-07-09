import { useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';

export function useAuth() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      enabled: !!localStorage.getItem('token'),
    }
  });

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    queryClient.resetQueries();
    setLocation('/login');
  }, [setLocation, queryClient]);

  const login = useCallback((token: string) => {
    localStorage.setItem('token', token);
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    setLocation('/dashboard');
  }, [setLocation, queryClient]);

  return { user, isLoading, error, logout, login };
}
