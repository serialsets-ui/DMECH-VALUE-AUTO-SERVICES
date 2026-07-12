"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Minimal sign-out — not a full account menu, just enough to avoid getting
// stuck logged in during testing before the real dashboard/nav exists.
export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      style={{
        background: "transparent",
        color: "var(--muted)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      Sign Out
    </button>
  );
}
