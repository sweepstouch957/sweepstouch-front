const AUTH_STORAGE_KEY = 'uifort-authentication';

const canUseBrowserStorage = (): boolean => typeof window !== 'undefined';

const readCookie = (name: string): string | null => {
  if (!canUseBrowserStorage()) return null;

  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${encodeURIComponent(name)}=`));

  if (!cookie) return null;

  const value = cookie.slice(cookie.indexOf('=') + 1);
  return value ? decodeURIComponent(value) : null;
};

export const getAuthToken = (): string | null => {
  if (!canUseBrowserStorage()) return null;

  const localToken = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (localToken) return localToken;

  const cookieToken = readCookie(AUTH_STORAGE_KEY);
  if (!cookieToken) return null;

  window.localStorage.setItem(AUTH_STORAGE_KEY, cookieToken);
  return cookieToken;
};

export const setAuthToken = (token: string): void => {
  if (!canUseBrowserStorage()) return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, token);
};

export const removeAuthToken = (): void => {
  if (!canUseBrowserStorage()) return;

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  document.cookie = `${AUTH_STORAGE_KEY}=; Max-Age=0; path=/`;
};
