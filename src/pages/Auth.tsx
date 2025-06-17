import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Lock, UserPlus, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "login" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSession();

  // If user is already logged in, redirect to home or the originally requested page
  if (user) {
    const from = location.state?.from?.pathname || "/";
    navigate(from, { replace: true });
    return null;
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    toast({ title: "Success", description: "Please check your email to verify your account" });
    setMode("login");
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
    // Redirect to the originally requested page or home
    const from = location.state?.from?.pathname || "/";
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left side - Illustration */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex lg:w-1/2 bg-blue-900 text-white p-12 flex-col justify-between"
      >
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl font-bold"
          >
            KhataBook
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-blue-100 mt-2"
          >
            Manage your business efficiently
          </motion.p>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Smart Business Management</h2>
            <p className="text-blue-100">Take control of your business with our powerful tools</p>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Easy Accounting</h2>
            <p className="text-blue-100">Track your income and expenses effortlessly</p>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Secure Platform</h2>
            <p className="text-blue-100">Your data is protected with industry-standard security</p>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-sm text-blue-200"
        >
          © 2024 KhataBook. All rights reserved.
        </motion.div>
      </motion.div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-b from-white to-gray-50">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center">
                <motion.h2 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="text-3xl font-bold tracking-tight text-gray-900"
                >
                  {mode === "login" ? "Welcome back" : "Create your account"}
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="mt-2 text-gray-600"
                >
                  {mode === "login" 
                    ? "Enter your details to access your account" 
                    : "Get started with your free business account"}
                </motion.p>
              </div>

              <motion.form 
                onSubmit={mode === "login" ? handleLogin : handleSignup}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 bg-white p-8 rounded-xl shadow-sm border backdrop-blur-sm bg-white/50"
              >
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="pl-10 transition-all hover:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="pl-10 transition-all hover:border-blue-500 focus:ring-blue-500"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {mode === "signup" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm Password
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          </div>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            className="pl-10 transition-all hover:border-blue-500 focus:ring-blue-500"
                            required
                            minLength={6}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-blue-900 hover:bg-blue-800 text-white flex items-center justify-center gap-2 transition-all duration-300"
                    disabled={isSubmitting}
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Please wait...
                      </>
                    ) : mode === "login" ? (
                      <>
                        <LogIn className="h-5 w-5" />
                        Sign in
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-5 w-5" />
                        Create account
                      </>
                    )}
                  </Button>
                </motion.div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      {mode === "login" ? "New to KhataBook?" : "Already have an account?"}
                    </span>
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setMode(mode === "login" ? "signup" : "login");
                      setConfirmPassword("");
                    }}
                    className="w-full transition-all duration-300"
                  >
                    {mode === "login" ? "Create an account" : "Sign in to your account"}
                  </Button>
                </motion.div>
              </motion.form>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
