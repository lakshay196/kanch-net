"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { readSession } from "@/lib/auth";
import type { SessionUser } from "@/lib/types";

export default function NeedLogin({
  children,
}: {
  children: (user: SessionUser) => ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    const session = readSession();
    if (!session) {
      router.replace("/");
      setUser(null);
      return;
    }
    setUser(session);
  }, [router]);

  if (user === undefined) {
    return <p className="p-6 text-[#5c4638]">Opening login…</p>;
  }

  if (!user) {
    return <p className="p-6 text-[#5c4638]">Opening login…</p>;
  }

  return <>{children(user)}</>;
}
