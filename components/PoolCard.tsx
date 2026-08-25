import { formatInr, type PoolView } from "@/lib/pool";
import type { UiLang } from "@/lib/lang";

export default function PoolCard({
  view,
  lang,
  onPayBooking,
  onConfirm,
}: {
  view: PoolView;
  lang: UiLang;
  onPayBooking?: () => void;
  onConfirm?: () => void;
}) {
  const hi = lang === "hi";
  return (
    <section className="kn-card mt-8 p-5">
      <h2 className="text-2xl font-extrabold">{hi ? "पैसा पूल" : "Money pool"}</h2>
      <p className="mt-1 text-base text-[#5c4638]">
        {hi ? "बुकिंग · पूल · रिहाई।" : "Booking · pool · release."}
      </p>
      {view.qtyLocked ? (
        <p className="mt-3 text-base font-bold text-[#8b1e14]">
          {hi
            ? `मात्रा लॉक ${view.qty.toLocaleString("en-IN")}। घटा नहीं सकते।`
            : `Quantity locked at ${view.qty.toLocaleString("en-IN")}. Cannot shrink.`}
        </p>
      ) : null}
      <ul className="mt-4 space-y-3">
        <li className="kn-row">
          <span className="min-w-0 flex-1">
            <span className="font-bold">{hi ? "बुकिंग" : "Booking"}</span>
            <span className="mt-0.5 block text-sm text-[#5c4638]">
              {view.bookingPaid
                ? hi
                  ? "भरी हुई"
                  : "Paid"
                : hi
                  ? "बाकी · ~25%"
                  : "Due · ~25%"}
            </span>
          </span>
          <span className="font-extrabold text-[#8b1e14]">
            {formatInr(view.bookingInr)}
          </span>
        </li>
        <li className="kn-row">
          <span className="min-w-0 flex-1">
            <span className="font-bold">{hi ? "पूल में" : "In pool"}</span>
            <span className="mt-0.5 block text-sm text-[#5c4638]">
              {view.confirmed
                ? hi
                  ? "बाकी राशि"
                  : "Rest after confirm"
                : hi
                  ? "कन्फर्म के बाद"
                  : "After confirm"}
            </span>
          </span>
          <span className="font-extrabold text-[#8b1e14]">{formatInr(view.inPoolInr)}</span>
        </li>
        <li className="kn-row">
          <span className="min-w-0 flex-1">
            <span className="font-bold">{hi ? "रिहाई" : "Released"}</span>
            <span className="mt-0.5 block text-sm text-[#5c4638]">
              {hi ? "स्वीकार QC → कारीगर" : "Accepted QC → artisan"}
            </span>
          </span>
          <span className="font-extrabold text-[#8b1e14]">{formatInr(view.releasedInr)}</span>
        </li>
        <li className="kn-row">
          <span className="min-w-0 flex-1">
            <span className="font-bold">{hi ? "वापस" : "Returned"}</span>
            <span className="mt-0.5 block text-sm text-[#5c4638]">
              {hi ? "अस्वीकार → खरीदार" : "Rejected → buyer"}
            </span>
          </span>
          <span className="font-extrabold text-[#8b1e14]">{formatInr(view.returnedInr)}</span>
        </li>
      </ul>
      {view.awaitingQc ? (
        <p className="mt-3 text-base text-[#5c4638]">
          {hi ? "कलेक्टर QC के बाद रिहाई।" : "Release after collector QC."}
        </p>
      ) : null}
      {onPayBooking && view.canPayBooking ? (
        <button
          type="button"
          onClick={onPayBooking}
          className="kn-btn-primary mt-4 w-full rounded-full bg-[#8b1e14] py-4 text-xl font-extrabold text-white"
        >
          {hi ? "बुकिंग भरें" : "Pay booking"}
        </button>
      ) : null}
      {onConfirm && view.canConfirm ? (
        <button
          type="button"
          onClick={onConfirm}
          className="kn-btn-primary mt-3 w-full rounded-full bg-[#8b1e14] py-4 text-xl font-extrabold text-white"
        >
          {hi ? "कन्फर्म" : "Confirm"}
        </button>
      ) : null}
      {!view.hasAcceptedDemo ? (
        <p className="mt-3 text-base text-[#5c4638]">
          {hi
            ? "कन्फर्म से पहले डेमो स्वीकार करें।"
            : "Accept a demo piece before Confirm."}
        </p>
      ) : null}
    </section>
  );
}
