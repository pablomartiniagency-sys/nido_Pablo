const MASTER_KEY = "nido-master-session";
const MASTER_EMAIL = "pablomartiniagency@gmail.com";
const MASTER_PASSWORD = "RKewpablomartin90!2";

export interface MasterSession {
  email: string;
  role: "owner";
  loginTime: string;
}

export function getMasterCredentials() {
  return { email: MASTER_EMAIL, password: MASTER_PASSWORD };
}

export function createMasterSession(): MasterSession {
  const session: MasterSession = { email: MASTER_EMAIL, role: "owner", loginTime: new Date().toISOString() };
  if (typeof window !== "undefined") {
    localStorage.setItem(MASTER_KEY, JSON.stringify(session));
  }
  return session;
}

export function getMasterSession(): MasterSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MASTER_KEY);
    if (raw) return JSON.parse(raw);
  } catch { }
  return null;
}

export function clearMasterSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(MASTER_KEY);
  }
}

export function isValidMasterPassword(password: string): boolean {
  return password === MASTER_PASSWORD;
}
