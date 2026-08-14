const CREDS_KEY = 'pickleball_admin_creds_v1';
const SESSION_KEY = 'pickleball_admin_session_v1';

export const DEFAULT_LOGIN_ID = 'admin';
export const DEFAULT_PASSWORD = 'pickleball123';

/**
 * SHA-256 hash using Web Crypto API with fallback
 */
export async function hashPassword(password: string): Promise<string> {
  const trimmed = password.trim();
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(trimmed);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }

  // Simple string hash fallback
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16)}`;
}

interface StoredCreds {
  loginId: string;
  passwordHash: string;
  updatedAt: number;
}

/**
 * Get configured admin credentials, initializing defaults if first time
 */
export async function getStoredCredentials(): Promise<StoredCreds> {
  if (typeof window === 'undefined') {
    return {
      loginId: DEFAULT_LOGIN_ID,
      passwordHash: await hashPassword(DEFAULT_PASSWORD),
      updatedAt: Date.now(),
    };
  }

  try {
    const serialized = localStorage.getItem(CREDS_KEY);
    if (serialized) {
      const parsed = JSON.parse(serialized);
      if (parsed.loginId && parsed.passwordHash) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read admin creds from storage:', e);
  }

  // Initialize with default
  const defaultHash = await hashPassword(DEFAULT_PASSWORD);
  const initial: StoredCreds = {
    loginId: DEFAULT_LOGIN_ID,
    passwordHash: defaultHash,
    updatedAt: Date.now(),
  };

  try {
    localStorage.setItem(CREDS_KEY, JSON.stringify(initial));
  } catch {
    // ignore
  }

  return initial;
}

/**
 * Validates login credentials and starts session
 */
export async function authenticateAdmin(
  loginIdInput: string,
  passwordInput: string
): Promise<{ success: boolean; error?: string }> {
  const trimmedId = loginIdInput.trim();
  const trimmedPass = passwordInput.trim();

  if (!trimmedId) {
    return { success: false, error: 'Login ID cannot be empty.' };
  }
  if (!trimmedPass) {
    return { success: false, error: 'Password cannot be empty.' };
  }

  const stored = await getStoredCredentials();
  const inputHash = await hashPassword(trimmedPass);

  // Exact comparison
  if (
    stored.loginId.toLowerCase() === trimmedId.toLowerCase() &&
    stored.passwordHash === inputHash
  ) {
    // Save session
    try {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          authenticated: true,
          loginId: stored.loginId,
          timestamp: Date.now(),
        })
      );
    } catch {
      // ignore
    }
    return { success: true };
  }

  return { success: false, error: 'Invalid Login ID or Password. Only authorized admin can login.' };
}

/**
 * Check if the admin is currently authenticated in storage
 */
export function checkAdminSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed.authenticated);
  } catch {
    return false;
  }
}

/**
 * Get current logged in admin username
 */
export function getAdminUsername(): string {
  if (typeof window === 'undefined') return DEFAULT_LOGIN_ID;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return DEFAULT_LOGIN_ID;
    const parsed = JSON.parse(raw);
    return parsed.loginId || DEFAULT_LOGIN_ID;
  } catch {
    return DEFAULT_LOGIN_ID;
  }
}

/**
 * Logout admin
 */
export function logoutAdmin(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * Change admin credentials
 */
export async function updateAdminCredentials(
  currentPassword: string,
  newLoginId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const trimmedNewId = newLoginId.trim();
  const trimmedNewPass = newPassword.trim();

  if (!trimmedNewId) {
    return { success: false, error: 'New Login ID cannot be empty.' };
  }
  if (trimmedNewPass.length < 4) {
    return { success: false, error: 'New Password must be at least 4 characters.' };
  }

  const stored = await getStoredCredentials();
  const currentHash = await hashPassword(currentPassword.trim());

  if (stored.passwordHash !== currentHash) {
    return { success: false, error: 'Current password is incorrect.' };
  }

  const newHash = await hashPassword(trimmedNewPass);
  const updated: StoredCreds = {
    loginId: trimmedNewId,
    passwordHash: newHash,
    updatedAt: Date.now(),
  };

  try {
    localStorage.setItem(CREDS_KEY, JSON.stringify(updated));
    // Update active session
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        authenticated: true,
        loginId: trimmedNewId,
        timestamp: Date.now(),
      })
    );
    return { success: true };
  } catch (err) {
    console.error('Failed to save new credentials:', err);
    return { success: false, error: 'Failed to update credentials in storage.' };
  }
}
