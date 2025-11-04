import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthManager } from '@/lib/auth';
import type { User, LoginData } from '@shared/schema';

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/v1/auth/me'],
    enabled: AuthManager.isAuthenticated(),
    retry: false,
    queryFn: async () => {
      if (!AuthManager.isAuthenticated()) {
        return null;
      }
      
      const response = await fetch('/api/v1/auth/me', {
        headers: AuthManager.getAuthHeaders(),
      });
      
      if (!response.ok) {
        AuthManager.clearAuth();
        throw new Error('Authentication failed');
      }
      
      return response.json();
    },
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginData) => AuthManager.login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/auth/me'] });
    },
  });

  const logout = () => {
    AuthManager.logout();
    queryClient.clear();
  };

  return {
    user: user as User | null,
    isLoading,
    isAuthenticated: AuthManager.isAuthenticated(),
    login: loginMutation.mutateAsync,
    logout,
    isLoggingIn: loginMutation.isPending,
  };
}
