const DEMO_KEY = "nido-demo-session";
const DEMO_DURATION_MS = 60 * 60 * 1000; // 1 hora

export interface DemoSession {
  id: string;
  email: string;
  createdAt: number;
  expiresAt: number;
  type: "demo";
}

export function createDemoSession(email?: string): DemoSession {
  const now = Date.now();
  const session: DemoSession = {
    id: `demo-${now}-${Math.random().toString(36).slice(2, 8)}`,
    email: email || `demo-${new Date().toLocaleTimeString("es-ES")}`,
    createdAt: now,
    expiresAt: now + DEMO_DURATION_MS,
    type: "demo",
  };
  localStorage.setItem(DEMO_KEY, JSON.stringify(session));
  return session;
}

export function getDemoSession(): DemoSession | null {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (!raw) return null;
    const session: DemoSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(DEMO_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearDemoSession() {
  localStorage.removeItem(DEMO_KEY);
}

export function getDemoTimeRemaining(): number | null {
  const session = getDemoSession();
  if (!session) return null;
  return Math.max(0, session.expiresAt - Date.now());
}

export function isDemoExpired(): boolean {
  return getDemoSession() === null && localStorage.getItem(DEMO_KEY) !== null;
}

export function getDemoMinutesLeft(): number {
  const remaining = getDemoTimeRemaining();
  if (remaining === null) return 0;
  return Math.ceil(remaining / 60000);
}
