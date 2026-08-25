"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, readSession } from "@/lib/auth";
import type { SessionUser } from "@/lib/types";

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(readSession());
  }, [pathname]);

  function logout() {
    clearSession();
    router.push("/");
  }

  const staff =
    pathname.startsWith("/matching") || pathname.startsWith("/phone");

  return (
    <header className="kn-band">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <Link
          href={user?.home ?? "/"}
          className="text-2xl font-extrabold tracking-tight text-[#f6efe4]"
        >
          Kanch-Net
        </Link>
        {user ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="kn-chip kn-chip-ghost text-sm">{user.name}</span>
            {user.role === "artisan" ? (
              <>
                <Link href="/artisan" className="kn-nav">
                  Home
                </Link>
                <Link href="/chat" className="kn-nav">
                  Chat
                </Link>
                <Link href="/map" className="kn-nav">
                  Map
                </Link>
              </>
            ) : null}
            {user.role === "buyer" ? (
              <>
                <Link href="/buyer" className="kn-nav">
                  Home
                </Link>
                <Link href="/money" className="kn-nav">
                  Money
                </Link>
              </>
            ) : null}
            {user.role === "coordinator" ? (
              <Link href="/matching" className="kn-nav">
                Matching
              </Link>
            ) : null}
            <button type="button" onClick={logout} className="kn-chip kn-chip-cream">
              Log out
            </button>
          </div>
        ) : null}
      </div>
      {user?.role === "collector" ? (
        <nav className="flex gap-2 px-5 pb-4">
          <Link
            href="/pickup"
            className={`kn-btn-primary kn-chip flex-1 text-lg ${
              pathname.startsWith("/pickup") ? "is-on" : "kn-chip-cream"
            }`}
          >
            Pickup
          </Link>
          <Link
            href="/money"
            className={`kn-btn-primary kn-chip flex-1 text-lg ${
              pathname.startsWith("/money") ? "is-on" : "kn-chip-cream"
            }`}
          >
            Money
          </Link>
        </nav>
      ) : null}
      {staff ? (
        <p className="px-5 pb-4 text-sm text-[#f6efe4]/80">
          Staff tools. Main demo: artisan home and buyer home.
        </p>
      ) : null}
    </header>
  );
}
