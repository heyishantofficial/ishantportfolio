import { useState, useEffect, useCallback } from 'react';

const ADMIN_PASSWORD = 'ishucreationz';
const AUTH_KEY = 'ishant_admin_auth';

let globalIsAdmin = typeof window !== 'undefined' ? sessionStorage.getItem(AUTH_KEY) === 'true' : false;
const listeners = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn(globalIsAdmin));
}

export function checkIsAdmin() {
  return globalIsAdmin;
}

export function setAdminStatus(status) {
  globalIsAdmin = !!status;
  if (typeof window !== 'undefined') {
    if (globalIsAdmin) {
      sessionStorage.setItem(AUTH_KEY, 'true');
    } else {
      sessionStorage.removeItem(AUTH_KEY);
    }
  }
  notifyListeners();
}

export function verifyAdminPassword(pwd) {
  if (typeof pwd !== 'string') return false;
  const match = pwd.trim() === ADMIN_PASSWORD;
  if (match) {
    setAdminStatus(true);
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

  const authenticate = useCallback((pwd) => {
    return verifyAdminPassword(pwd);
  }, []);

  const lock = useCallback(() => {
    lockAdminMode();
  }, []);

  return {
    isAdmin,
    authenticate,
    lock
  };
}
