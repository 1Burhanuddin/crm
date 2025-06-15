
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { toast } from "@/hooks/use-toast";

type Mode = "login" | "signup";

export default function AuthPage() {
  const { status, user } = useSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, go home
  if (status === "signed_in" && user) {
    navigate("/");
    return null;
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 1. Sign up on Supabase
    const redirectURL = `${window.location.origin}/`; // Important!
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectURL }
    });

    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    toast({ title: "Registration successful! Check your email to confirm." });
    setMode("login");
    setEmail(""); setPassword("");
    setIsSubmitting(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-900">
      <div className="bg-white rounded-xl shadow-xl p-7 w-full max-w-xs relative">
        <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">
          {mode === "login" ? "Login" : "Register"}
        </h2>
        <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="flex flex-col gap-3">
          <input
            className="border rounded px-3 py-2 text-base focus:outline-blue-700"
            type="email"
            value={email}
            placeholder="Email"
            onChange={e => setEmail(e.target.value)}
            required />
          <input
            className="border rounded px-3 py-2 text-base focus:outline-blue-700"
            type="password"
            value={password}
            placeholder="Password"
            minLength={6}
            onChange={e => setPassword(e.target.value)}
            required />
          <button
            type="submit"
            className="bg-blue-800 text-white w-full rounded py-2 mt-2 font-bold hover:bg-blue-700 transition"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Please wait..." : mode === "login" ? "Login" : "Register"}
          </button>
        </form>
        <div className="mt-5 text-xs text-center">
          {mode === "login" ? (
            <>
              New here?{" "}
              <button className="text-blue-700 font-bold" onClick={() => setMode("signup")}>Create account</button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button className="text-blue-700 font-bold" onClick={() => setMode("login")}>Login</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
