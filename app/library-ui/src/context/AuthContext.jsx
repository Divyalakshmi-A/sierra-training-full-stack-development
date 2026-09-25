import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, fetchCurrentUserFromAppRouter, setAuthCredentials } from '../services/api.js';

const MOCK_USERS = {
  admin: { password: 'admin123', roles: ['Admin'], displayName: 'Admin User' },
  member: { password: 'member123', roles: ['Member'], displayName: 'Member User' },
};

const STORAGE_KEY = 'library.auth';

const AuthContext = createContext(null);

function loadStoredAuth() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAuth(data) {
  if (data) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  else sessionStorage.removeItem(STORAGE_KEY);
}

function appRolesFromScopes(scopes = []) {
  const list = Array.isArray(scopes) ? scopes : String(scopes).split(/[,\s]+/);
  const roles = new Set();
  for (const raw of list) {
    const s = String(raw);
    if (/\.Admin$/i.test(s) || s === 'Admin') roles.add('Admin');
    if (/\.Member$/i.test(s) || s === 'Member') roles.add('Member');
  }
  return [...roles];
}

export function AuthProvider({ children }) {
  const authMode = import.meta.env.VITE_AUTH_MODE || 'mock';
  const [bootstrapping, setBootstrapping] = useState(authMode === 'xsuaa');
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (authMode !== 'xsuaa') return;
    let cancelled = false;
    (async () => {
      const current = await fetchCurrentUserFromAppRouter();
      if (cancelled) return;
      if (!current) {
        setBootstrapping(false);
        return;
      }

      let roles = appRolesFromScopes(current.scopes);
      try {
        const me = await api.getMe();
        const capRoles = me?.roles || me?.value?.roles || [];
        if (Array.isArray(capRoles) && capRoles.length) {
          roles = [...new Set([...roles, ...capRoles.filter((r) => r === 'Admin' || r === 'Member')])];
        }
      } catch {
        /* 403 here means JWT reached CAP but no library role */
      }

      if (cancelled) return;
      setUser({
        username: current.userName || current.email || current.name || 'user',
        displayName: current.firstname
          ? `${current.firstname} ${current.lastname || ''}`.trim()
          : current.displayName || current.name || current.userName,
        roles,
        mode: 'xsuaa',
      });
      setBootstrapping(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [authMode]);

  useEffect(() => {
    if (user?.mode === 'mock' && user.username) {
      setAuthCredentials(user.username, user.password);
    } else if (authMode === 'xsuaa') {
      setAuthCredentials(null, null);
    }
  }, [user, authMode]);

  const login = useCallback(
    async (username, password) => {
      const key = username.trim().toLowerCase();
      const mock = MOCK_USERS[key];
      if (!mock || mock.password !== password) {
        throw new Error('Invalid username or password');
      }
      setAuthCredentials(key, password);
      await api.getCategories();
      const next = {
        username: key,
        password,
        displayName: mock.displayName,
        roles: mock.roles,
        mode: 'mock',
      };
      saveAuth({ ...next, password: undefined });
      setUser(next);
      setAuthCredentials(key, password);
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
    setAuthCredentials(null, null);
    saveAuth(null);
    if (authMode === 'xsuaa') {
      window.location.href = '/logout';
    }
  }, [authMode]);

  const value = useMemo(
    () => ({
      user,
      bootstrapping,
      isAuthenticated: Boolean(user),
      login,
      logout,
      authMode,
      hasRole: (role) => user?.roles?.includes(role),
      canManage: () => user?.roles?.includes('Admin'),
      hasLibraryAccess: () =>
        user?.roles?.includes('Admin') || user?.roles?.includes('Member'),
      isReadOnly: () =>
        user?.roles?.includes('Member') && !user?.roles?.includes('Admin'),
    }),
    [user, bootstrapping, login, logout, authMode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
