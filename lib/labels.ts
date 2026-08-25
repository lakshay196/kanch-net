import type { UiLang } from "@/lib/lang";

export function colourWords(family: string, lang: UiLang = "en") {
  if (family === "ruby_red") return lang === "hi" ? "लाल" : "Red";
  if (family === "blue") return lang === "hi" ? "नीली" : "Blue";
  return family.replace(/_/g, " ");
}

export function gradeWords(grade: string, lang: UiLang = "en") {
  if (grade === "A") return lang === "hi" ? "A · बढ़िया" : "A · fine";
  if (grade === "B") return lang === "hi" ? "B · आम" : "B · regular";
  return grade;
}

export function pileTitle(colourFamily: string, qty: number, lang: UiLang = "en") {
  const pieces = lang === "hi" ? "टुकड़े" : "pieces";
  return `${colourWords(colourFamily, lang)} · ${qty} ${pieces}`;
}

/** Person names for artisan households (not "Family 1"). */
const ARTISAN_NAMES: Record<string, { en: string; hi: string }> = {
  "HH-01": { en: "Ramesh", hi: "रमेश" },
  "HH-02": { en: "Suresh", hi: "सुरेश" },
  "HH-03": { en: "Imran", hi: "इमरान" },
  "HH-04": { en: "Sunita", hi: "सुनीता" },
  "HH-05": { en: "Kalpana", hi: "कल्पना" },
  "HH-06": { en: "Aslam", hi: "अस्लम" },
  "HH-07": { en: "Meena", hi: "मीना" },
  "HH-08": { en: "Vikas", hi: "विकास" },
  "HH-09": { en: "Farida", hi: "फरीदा" },
  "HH-10": { en: "Pradeep", hi: "प्रदीप" },
  "HH-11": { en: "Nisha", hi: "निशा" },
  "HH-12": { en: "Rahul", hi: "राहुल" },
  "HH-13": { en: "Poonam", hi: "पूनम" },
  "HH-14": { en: "Salim", hi: "सलीम" },
  "HH-15": { en: "Geeta", hi: "गीता" },
  "HH-16": { en: "Anil", hi: "अनिल" },
  "HH-17": { en: "Shabana", hi: "शबाना" },
  "HH-18": { en: "Deepak", hi: "दीपक" },
  "HH-19": { en: "Rekha", hi: "रेखा" },
  "HH-20": { en: "Mohsin", hi: "मोहसिन" },
};

/** Display name for an artisan household — person name, not "Family N". */
export function familyName(householdId: string, lang: UiLang = "en") {
  const named = ARTISAN_NAMES[householdId];
  if (named) return lang === "hi" ? named.hi : named.en;
  const m = householdId.match(/^HH-0*(\d+)$/);
  if (!m) return householdId;
  return lang === "hi" ? `कारीगर ${m[1]}` : `Artisan ${m[1]}`;
}
