import { useState, useEffect, useCallback } from 'react';

const ADMIN_PASSWORD = 'ishucreationz';
const AUTH_KEY = 'ishant_admin_auth';
const PWD_KEY = 'ishant_admin_pwd';

let globalIsAdmin = typeof window !== 'undefined' ? sessionStorage.getItem(AUTH_KEY) === 'true' : false;
const listeners = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn(globalIsAdmin));
}

export function checkIsAdmin() {
  return globalIsAdmin;
}

export function getAdminPassword() {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(PWD_KEY) || '';
}

export function setAdminStatus(status, pwd = null) {
  globalIsAdmin = !!status;
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

  // Try server verification first
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
  } catch {
    // Server unreachable — continue to local check
  }

  // Fallback: check against stored password or default
  let fallbackPass = ADMIN_PASSWORD;
  try {
    const custom = localStorage.getItem('admin_password');
    if (custom) fallbackPass = custom;
  } catch {}

  const match = clean === fallbackPass;
  if (match) {
    setAdminStatus(true, clean);
  }
  return match;
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
