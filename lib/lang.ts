export type UiLang = "hi" | "en";

type LangRole = "artisan" | "buyer" | "coordinator" | "collector";

const KEY: Record<LangRole, string> = {
  artisan: "kanch-lang-artisan",
  buyer: "kanch-lang-buyer",
  coordinator: "kanch-lang-coordinator",
  collector: "kanch-lang-collector",
};

export function defaultLang(role: LangRole): UiLang {
  if (role === "artisan" || role === "collector") return "hi";
  return "en";
}

export function readLang(role: LangRole): UiLang {
  if (typeof window === "undefined") return defaultLang(role);
  const raw = localStorage.getItem(KEY[role]);
  if (raw === "hi" || raw === "en") return raw;
  return defaultLang(role);
}

export function saveLang(role: LangRole, lang: UiLang) {
  localStorage.setItem(KEY[role], lang);
}
