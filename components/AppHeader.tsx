"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, readSession } from "@/lib/auth";
import type { SessionUser } from "@/lib/types";

export default function AppHeader() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(readSession());
  }, []);

  function logout() {
    clearSession();
    router.push("/");
  }

  return (
    <header className="flex items-center justify-between gap-3 border-b border-[#ead9c4] bg-[#fffaf3] px-4 py-3">
      <Link href={user?.home ?? "/"} className="text-lg font-bold text-[#8b1e14]">
        Kanch-Net
      </Link>
      {user ? (
        <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
          <span className="text-[#5c4638]">
            {user.name}
          </span>
          {user.role === "artisan" ? (
            <Link href="/phone" className="text-[#8b1e14] underline">
              Phone
            </Link>
          ) : null}
          {user.role === "coordinator" || user.role === "buyer" ? (
            <Link href="/matching" className="text-[#8b1e14] underline">
              Matching
            </Link>
          ) : null}
          {user.role === "collector" ? (
            <>
              <Link href="/pickup" className="text-[#8b1e14] underline">
                Pickup
              </Link>
              <Link href="/money" className="text-[#8b1e14] underline">
                Fake money
              </Link>
            </>
          ) : null}
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-[#8b1e14] px-3 py-1 text-[#8b1e14]"
          >
            Log out
          </button>
        </div>
      ) : null}
    </header>
  );
}
