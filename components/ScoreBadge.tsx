import { reliabilityScore } from "@/lib/score";
import type { UiLang } from "@/lib/lang";

export default function ScoreBadge({
  householdId,
  lang,
}: {
  householdId: string;
  lang: UiLang;
}) {
  const score = reliabilityScore(householdId);
  return (
    <p className="text-xs font-bold text-[#8b1e14]">
      {lang === "hi" ? "विश्वसनीयता" : "Reliability"} {score}
    </p>
  );
}
