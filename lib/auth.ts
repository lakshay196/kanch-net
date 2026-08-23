import starter from "@/data/starter-list.json";
import type { SessionUser } from "@/lib/types";

const KEY = "kanch-net-user";

export function findUser(phone: string, code: string) {
  const cleaned = phone.replace(/\s/g, "");
  return starter.users.find(
    (user) => user.phone === cleaned && user.code === code,
  );
}

export function saveSession(user: SessionUser) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function readSession(): SessionUser | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(KEY);
}
