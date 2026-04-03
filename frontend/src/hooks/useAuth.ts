import { useState, useEffect, useCallback } from 'react';
import { getToken, setToken, clearToken, setOnUnauthorized } from '../api/client';
import { login as apiLogin, verify } from '../api/auth';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearToken();
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    setOnUnauthorized(logout);

    async function checkAuth() {
      if (!getToken()) {
        setIsLoading(false);
        return;
      }

      const valid = await verify();
      if (valid) {
        setIsAuthenticated(true);
      } else {
        clearToken();
      }
      setIsLoading(false);
    }

    checkAuth();
  }, [logout]);

  const login = async (username: string, password: string) => {
    const data = await apiLogin(username, password);
    setToken(data.token);
    setIsAuthenticated(true);
  };

  return { isAuthenticated, isLoading, login, logout };
}
