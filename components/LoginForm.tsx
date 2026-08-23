"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { findUser, saveSession } from "@/lib/auth";

export default function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("9000000001");
  const [code, setCode] = useState("1234");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const user = findUser(phone, code);
    if (!user) {
      setError("Wrong phone or code. Try 9000000001 and 1234.");
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
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Phone number</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="numeric"
          className="w-full rounded-2xl border border-[#ead9c4] bg-white px-4 py-3 text-lg"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Login code</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          className="w-full rounded-2xl border border-[#ead9c4] bg-white px-4 py-3 text-lg"
        />
      </label>
      {error ? <p className="text-sm text-[#8b1e14]">{error}</p> : null}
      <button
        type="submit"
        className="w-full rounded-2xl bg-[#8b1e14] py-4 text-lg font-semibold text-white"
      >
        Enter
      </button>
    </form>
  );
}
