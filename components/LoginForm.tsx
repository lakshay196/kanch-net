"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { findUser, saveSession } from "@/lib/auth";

export default function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const user = findUser(phone, code);
    if (!user) {
      setError("Wrong phone or code.");
      return;
    }
    saveSession({
      phone: user.phone,
      role: user.role as "artisan" | "collector" | "coordinator" | "buyer",
      householdId: user.householdId,
      name: user.name,
      home: user.home,
    });
    router.push(user.home);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block">
        <span className="mb-2 block text-lg font-bold">Phone</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="numeric"
          autoComplete="tel"
          placeholder="Your phone"
          className="kn-field text-2xl"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-lg font-bold">Code</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          placeholder="Code"
          className="kn-field"
        />
      </label>
      {error ? <p className="text-lg text-[#8b1e14]">{error}</p> : null}
      <button
        type="submit"
        className="kn-btn-primary w-full rounded-full bg-[#8b1e14] py-4 text-xl font-extrabold text-white shadow-[0_16px_32px_-16px_rgba(139,30,20,0.55)]"
      >
        Enter
      </button>
    </form>
  );
}
