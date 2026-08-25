"use client";

import { useEffect, useState } from "react";
import { colourWords } from "@/lib/labels";
import type { UiLang } from "@/lib/lang";
import {
  acceptDemo,
  getThread,
  onStoreChange,
  postChat,
  rejectDemo,
  sendDemo,
  type ChatThread,
} from "@/lib/store";
import type { Role } from "@/lib/types";

export default function ChatPanel({
  threadId,
  role,
  lang,
}: {
  threadId: string;
  role: Role;
  lang: UiLang;
}) {
  const hi = lang === "hi";
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [text, setText] = useState("");
  const [demoQty, setDemoQty] = useState(12);
  const [demoColour, setDemoColour] = useState<"ruby_red" | "blue">("ruby_red");
  const [photoUrl, setPhotoUrl] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    function refresh() {
      setThread(getThread(threadId));
    }
    refresh();
    return onStoreChange(refresh);
  }, [threadId]);

  if (!thread) {
    return <p className="text-lg text-[#5c4638]">{hi ? "बात नहीं मिली।" : "Chat not found."}</p>;
  }

  function sendText() {
    postChat(threadId, role === "artisan" ? "artisan" : "buyer", text);
    setText("");
  }

  function onSendDemo() {
    sendDemo(threadId, {
      colourFamily: demoColour,
      qty: demoQty,
      photoUrl,
    });
  }

  function onPickPhoto(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPhotoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function onAccept() {
    const result = acceptDemo(threadId);
    setNote(
      result.ok
        ? hi
          ? "डेमो स्वीकार। मात्रा लॉक।"
          : "Demo accepted. Quantity locked."
        : result.reason ?? "",
    );
  }

  function onReject() {
    const result = rejectDemo(threadId);
    setNote(
      result.ok
        ? hi
          ? "डेमो अस्वीकार। ढेर पूल में रहा।"
          : "Demo rejected. Pile stays in the pool."
        : result.reason ?? "",
    );
  }

  const demo = thread.demo;

  return (
    <div>
      <div className="kn-chat-log mt-4 space-y-3">
        {thread.messages.map((msg) => (
          <p
            key={msg.id}
            className={`kn-bubble ${msg.from === "system" ? "is-sys" : msg.from === role ? "is-me" : "is-them"}`}
          >
            {msg.text}
          </p>
        ))}
      </div>

      {demo ? (
        <div className="kn-card mt-6 p-5">
          <p className="text-lg font-extrabold">{hi ? "डेमो टुकड़ा" : "Demo piece"}</p>
          <div className="mt-3 flex items-center gap-4">
            <span
              className={`kn-dot ${demo.colourFamily === "blue" ? "kn-dot-blue" : "kn-dot-red"}`}
            />
            <p className="text-lg font-bold">
              {colourWords(demo.colourFamily, lang)} · {demo.qty}
            </p>
          </div>
          {demo.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={demo.photoUrl} alt="" className="mt-4 max-h-40 rounded-2xl object-cover" />
          ) : (
            <div
              className={`mt-4 h-16 rounded-2xl ${demo.colourFamily === "blue" ? "bg-[#1e4d7a]" : "bg-[#8b1e14]"}`}
            />
          )}
          <p className="mt-2 text-sm text-[#5c4638]">
            {thread.demoStatus === "sent"
              ? hi
                ? "खरीदार का जवाब बाकी"
                : "Waiting for buyer"
              : thread.demoStatus === "accepted"
                ? hi
                  ? "स्वीकार · मात्रा लॉक"
                  : "Accepted · quantity locked"
                : thread.demoStatus === "rejected"
                  ? hi
                    ? "अस्वीकार · ढेर पूल में"
                    : "Rejected · pile stays in pool"
                  : ""}
          </p>
        </div>
      ) : null}

      {role === "artisan" && thread.demoStatus !== "accepted" ? (
        <div className="mt-8">
          <p className="text-lg font-bold">{hi ? "डेमो भेजें" : "Send demo piece"}</p>
          <div className="mt-4 kn-colour-pick">
            <button
              type="button"
              onClick={() => setDemoColour("ruby_red")}
              className={`kn-orb kn-orb-red${demoColour === "ruby_red" ? " is-on" : ""}`}
            >
              {hi ? "लाल" : "Red"}
            </button>
            <button
              type="button"
              onClick={() => setDemoColour("blue")}
              className={`kn-orb kn-orb-blue${demoColour === "blue" ? " is-on" : ""}`}
            >
              {hi ? "नीली" : "Blue"}
            </button>
          </div>
          <label className="mt-6 block text-lg font-bold">{hi ? "कितने" : "How many"}</label>
          <input
            type="number"
            min={1}
            value={demoQty}
            onChange={(e) => setDemoQty(Number(e.target.value))}
            className="kn-field mt-2 text-2xl"
          />
          <label className="mt-6 block text-lg font-bold">
            {hi ? "फोटो (ऐच्छिक)" : "Photo (optional)"}
          </label>
          <input
            type="file"
            accept="image/*"
            className="kn-field mt-2"
            onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
          />
          <input
            value={photoUrl.startsWith("data:") ? "" : photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            className="kn-field mt-2"
            placeholder={hi ? "या फोटो लिंक" : "Or photo link"}
          />
          {photoUrl.startsWith("data:") ? (
            <p className="mt-2 text-sm text-[#5c4638]">
              {hi ? "फोटो चुनी गई।" : "Photo attached."}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onSendDemo}
            className="kn-btn-primary mt-5 w-full rounded-full bg-[#8b1e14] py-4 text-xl font-extrabold text-white"
          >
            {hi ? "डेमो भेजें" : "Send demo"}
          </button>
        </div>
      ) : null}

      {role === "buyer" && thread.demoStatus === "sent" ? (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onAccept}
            className="kn-btn-primary rounded-full bg-[#8b1e14] py-4 text-lg font-extrabold text-white"
          >
            {hi ? "स्वीकार" : "Accept demo"}
          </button>
          <button
            type="button"
            onClick={onReject}
            className="kn-chip text-lg text-[#8b1e14]"
          >
            {hi ? "अस्वीकार" : "Reject demo"}
          </button>
        </div>
      ) : null}

      {note ? <p className="mt-4 text-lg text-[#8b1e14]">{note}</p> : null}

      <label className="mt-8 block text-lg font-bold">{hi ? "संदेश" : "Message"}</label>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="kn-field mt-2"
        placeholder={hi ? "लिखें…" : "Type…"}
      />
      <button
        type="button"
        onClick={sendText}
        className="kn-btn-primary mt-4 w-full rounded-full bg-[#8b1e14] py-4 text-xl font-extrabold text-white"
      >
        {hi ? "भेजें" : "Send"}
      </button>
    </div>
  );
}
