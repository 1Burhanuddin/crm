
import { useEffect, useState, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";
import { sha256 } from "@/lib/utils"; // We'll add a simple sha256 util below

type AuthStatus = "loading" | "signed_out" | "signed_in";

interface SessionContextProps {
  user: User | null;
  session: Session | null;
  status: AuthStatus;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextProps>({
  user: null,
  session: null,
  status: "loading",
  signOut: async () => {},
  refresh: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, sessionArg) => {
        setSession(sessionArg);
        setUser(sessionArg?.user ?? null);
        setStatus(sessionArg ? "signed_in" : "signed_out");
      }
    );
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setStatus(session ? "signed_in" : "signed_out");
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setStatus("signed_out");
    toast({ title: "Logged out" });
  };

  const refresh = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);
    setStatus(session ? "signed_in" : "signed_out");
  };

  return (
    <SessionContext.Provider value={{ user, session, status, signOut, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

// Utility for hashing PIN on client (not secure for production, but for demo it's OK)
export async function hashPIN(pin: string): Promise<string> {
  // Simple SHA-256 hash using browser crypto
  const data = new TextEncoder().encode(pin);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}
