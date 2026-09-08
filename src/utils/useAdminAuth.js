import { useState, useEffect, useCallback } from 'react';

const AUTH_KEY = 'ishant_admin_auth';
const PWD_KEY = 'ishant_admin_pwd';

let inMemoryPassword = '';
let globalIsAdmin = typeof window !== 'undefined' ? sessionStorage.getItem(AUTH_KEY) === 'true' : false;
if (typeof window !== 'undefined') {
  inMemoryPassword = sessionStorage.getItem(PWD_KEY) || '';
}

const listeners = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn(globalIsAdmin));
}

export function checkIsAdmin() {
  return globalIsAdmin;
}

export function getAdminPassword() {
  if (inMemoryPassword) return inMemoryPassword;
  if (typeof window === 'undefined') return '';
  const pwd = sessionStorage.getItem(PWD_KEY);
  if (pwd) {
    inMemoryPassword = pwd;
    return pwd;
  }
  return '';
}

export function setAdminStatus(status, pwd = null) {
  globalIsAdmin = !!status;
  if (pwd) {
    inMemoryPassword = pwd;
  } else if (!status) {
    inMemoryPassword = '';
  }
  if (typeof window !== 'undefined') {
    if (globalIsAdmin) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      if (pwd) sessionStorage.setItem(PWD_KEY, pwd);
    } else {
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(PWD_KEY);
    }
  }
  notifyListeners();
}

export async function verifyAdminPassword(pwd) {
  if (typeof pwd !== 'string') return false;
  const clean = pwd.trim();
  if (!clean) return false;

  // Try server verification first (authoritative)
  try {
    const res = await fetch('/api/settings/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: clean })
    });
    if (res.ok) {
      setAdminStatus(true, clean);
      return true;
    }
    // Server explicitly denied access
    return false;
  } catch {
    // Server unreachable (e.g. offline dev mode without backend)
  }

  // Offline fallback only if a custom password was previously saved in this browser
  try {
    const custom = localStorage.getItem('admin_password');
    if (custom && clean === custom) {
      setAdminStatus(true, clean);
      return true;
    }
  } catch {}

  return false;
}

export function lockAdminMode() {
  setAdminStatus(false);
}

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(globalIsAdmin);

  useEffect(() => {
    const handler = (status) => setIsAdmin(status);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const authenticate = useCallback(async (pwd) => {
    return await verifyAdminPassword(pwd);
  }, []);

  const lock = useCallback(() => {
    lockAdminMode();
  }, []);

  return {
    isAdmin,
    authenticate,
    lock,
    getAdminPassword
  };
}
