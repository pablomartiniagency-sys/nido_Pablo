const STAFF_KEY = "nido-staff-users";

export interface StaffUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: "staff";
  createdAt: string;
}

export function getStaffUsers(): StaffUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STAFF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveStaffUsers(users: StaffUser[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STAFF_KEY, JSON.stringify(users));
  }
}

export function addStaffUser(email: string, password: string, name: string): StaffUser {
  const users = getStaffUsers();
  const newUser: StaffUser = {
    id: `staff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email,
    password,
    name,
    role: "staff",
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveStaffUsers(users);
  return newUser;
}

export function removeStaffUser(id: string): boolean {
  const users = getStaffUsers().filter(u => u.id !== id);
  saveStaffUsers(users);
  return true;
}

export function updateStaffPassword(id: string, newPassword: string): boolean {
  const users = getStaffUsers().map(u => u.id === id ? { ...u, password: newPassword } : u);
  saveStaffUsers(users);
  return true;
}

export function verifyStaffLogin(email: string, password: string): StaffUser | null {
  const users = getStaffUsers();
  return users.find(u => u.email === email && u.password === password) || null;
}
