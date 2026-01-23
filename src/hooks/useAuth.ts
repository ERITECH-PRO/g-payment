import { useState, useEffect } from 'react';
import { API_URL } from '@/config/api';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  token: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    loading: true,
    token: localStorage.getItem('auth_token'),
  });

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('auth_user');
      const savedRoles = localStorage.getItem('auth_roles');

      if (token && savedUser) {
        setAuthState({
          user: JSON.parse(savedUser),
          isAdmin: savedRoles?.includes('admin') || false,
          loading: false,
          token,
        });
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur de connexion');
    }

    const data = await response.json();

    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    localStorage.setItem('auth_roles', JSON.stringify(data.roles));

    setAuthState({
      user: data.user,
      isAdmin: data.roles.includes('admin'),
      loading: false,
      token: data.token,
    });

    return data;
  };

  const signUp = async (email: string, password: string) => {
    // Current implementation doesn't have public signup, but we can placeholder it or error
    throw new Error("L'inscription publique est désactivée. Contactez un administrateur.");
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_roles');

    setAuthState({
      user: null,
      isAdmin: false,
      loading: false,
      token: null,
    });
  };

  return {
    ...authState,
    session: authState.token ? { access_token: authState.token } : null, // Compatibility shim if needed
    signIn,
    signUp,
    signOut,
  };
}
