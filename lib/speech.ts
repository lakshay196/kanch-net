type SpeechHit = {
  colourFamily?: "ruby_red" | "blue";
  qty?: number;
  grade?: "A" | "B";
  raw: string;
};

type RecCtor = new () => KnSpeechRecognition;

type KnSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((ev: KnSpeechResultEvent) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type KnSpeechResultEvent = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: { transcript: string; confidence: number };
    };
  };
};

function speechWindow() {
  if (typeof window === "undefined") return null;
  return window as Window & {
    SpeechRecognition?: RecCtor;
    webkitSpeechRecognition?: RecCtor;
  };
}

function getSpeechCtor(): RecCtor | null {
  const w = speechWindow();
  if (!w) return null;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function parseSpoken(text: string): SpeechHit {
  const t = text.toLowerCase();
  const hit: SpeechHit = { raw: text };

  if (
    t.includes("नीली") ||
    t.includes("नीला") ||
    t.includes("neeli") ||
    t.includes("neela") ||
    t.includes("blue")
  ) {
    hit.colourFamily = "blue";
  } else if (
    t.includes("लाल") ||
    t.includes("lal") ||
    t.includes("red") ||
    t.includes("ruby")
  ) {
    hit.colourFamily = "ruby_red";
  }

  const num = t.match(/(\d{2,5})/);
  if (num) hit.qty = Number(num[1]);

  if (/\bgrade a\b|\bfine\b|ए ग्रेड|a ग्रेड/.test(t) || t.includes("grade a")) {
    hit.grade = "A";
  } else if (/\bgrade b\b|\bregular\b|बी ग्रेड|b ग्रेड/.test(t) || t.includes("grade b")) {
    hit.grade = "B";
  }

  return hit;
}

export function browserSpeechAvailable() {
  if (typeof window === "undefined") return false;
  if (!window.isSecureContext) return false;
  return Boolean(getSpeechCtor());
}

async function unlockMic(): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return;
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((track) => track.stop());
}

function readTranscript(ev: KnSpeechResultEvent): { finalText: string; interimText: string } {
  let finalText = "";
  let interimText = "";
  for (let i = 0; i < ev.results.length; i++) {
    const row = ev.results[i];
    const piece = row?.[0]?.transcript ?? "";
    if (row?.isFinal) finalText += piece;
    else interimText += piece;
  }
  return { finalText, interimText };
}

export type ListenOpts = {
  speechLang?: "hi" | "en";
  onPartial?: (text: string) => void;
  onListening?: () => void;
};

export function listenOnce(speechLangOrOpts: "hi" | "en" | ListenOpts = "hi"): Promise<SpeechHit> {
  const opts: ListenOpts =
    typeof speechLangOrOpts === "string" ? { speechLang: speechLangOrOpts } : speechLangOrOpts;
  const speechLang = opts.speechLang ?? "hi";

  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      reject(new Error("insecure-context"));
      return;
    }
    const Ctor = getSpeechCtor();
    if (!Ctor) {
      reject(new Error("no-speech-api"));
      return;
    }

    let settled = false;
    let endTimer: ReturnType<typeof setTimeout> | null = null;
    let lastHeard = "";

    const finish = (ok: boolean, value: SpeechHit | Error) => {
      if (settled) return;
      settled = true;
      if (endTimer) clearTimeout(endTimer);
      try {
        rec.abort();
      } catch {
        /* already stopped */
      }
      if (ok) resolve(value as SpeechHit);
      else reject(value);
    };

    const rec = new Ctor();
    rec.lang = speechLang === "en" ? "en-IN" : "hi-IN";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      opts.onListening?.();
    };

    rec.onresult = (ev) => {
      const { finalText, interimText } = readTranscript(ev);
      const heard = (finalText || interimText).trim();
      if (heard) {
        lastHeard = heard;
        opts.onPartial?.(heard);
      }
      if (finalText.trim()) {
        finish(true, parseSpoken(finalText.trim()));
      }
    };

    rec.onerror = (ev) => {
      const code = ev.error || "speech-error";
      if (code === "aborted") return;
      if (code === "no-speech" && lastHeard) {
        finish(true, parseSpoken(lastHeard));
        return;
      }
      finish(false, new Error(code));
    };

    rec.onend = () => {
      if (settled) return;
      // Chrome often fires onend before the last onresult lands.
      endTimer = setTimeout(() => {
        if (lastHeard) finish(true, parseSpoken(lastHeard));
        else finish(false, new Error("no-speech"));
      }, 250);
    };

    void (async () => {
      try {
        await unlockMic();
      } catch {
        finish(false, new Error("not-allowed"));
        return;
      }
      try {
        rec.start();
      } catch {
        finish(false, new Error("speech-error"));
      }
    })();
  });
}
