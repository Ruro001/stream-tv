import { motion } from "framer-motion";
import { Eye, EyeOff, Play, Wifi, Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { tmdbService } from "../services/tmdbService";
import { supabase } from "../lib/supabase";

export const RuroLogo = ({ className = "" }: { className?: string }) => (
  <div className={`flex flex-col items-center ${className}`}>
    <div className="flex items-center gap-1">
      <div className="relative flex items-center justify-center w-12 h-12 mr-2">
        <span className="text-5xl font-black bg-gradient-to-br from-teal-400 via-blue-500 to-purple-500 text-transparent bg-clip-text absolute z-10">
          R
        </span>
        <Wifi className="w-5 h-5 text-teal-400 absolute -top-1 -right-3 rotate-45" />
        <Play className="w-4 h-4 text-purple-500 absolute bottom-1 -right-1 fill-current" />
      </div>
      <span className="text-4xl md:text-5xl font-black text-white tracking-widest">
        URO
      </span>
    </div>
    <span className="text-yellow-500 text-xs md:text-sm tracking-[0.4em] font-medium mt-1 ml-4">
      STREAMING
    </span>
  </div>
);

export const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [bgImage, setBgImage] = useState("https://picsum.photos/seed/cinema-dark/1080/1920");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<'email' | 'otp' | 'forgot_password'>('email');
  const [mode, setMode] = useState<'password' | 'magic_link'>('password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchBg = async () => {
      try {
        const movies = await tmdbService.getTrending("movie");
        if (movies && movies.length > 0) {
          const randomMovie = movies[Math.floor(Math.random() * movies.length)];
          setBgImage(randomMovie.backdrop || randomMovie.thumbnail || bgImage);
        }
      } catch (e) {
        console.error("Failed to fetch background", e);
      }
    };
    fetchBg();
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        }
      });
      
      if (error) throw error;
      setStep('otp');
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });
      
      if (error) throw error;
      onLogin(); // Success!
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-40 flex flex-col overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={bgImage} 
          alt="Background" 
          className="w-full h-full object-cover opacity-60 transition-opacity duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80" />
      </div>

      {/* Top Logo */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 pt-16 pb-4 flex justify-center"
      >
        <RuroLogo className="scale-90" />
      </motion.div>

      {/* Spacer to push card to bottom */}
      <div className="flex-grow" />

      {/* Login Card - Solid Dark */}
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200, delay: 0.4 }}
        className="relative z-10 bg-[#0a0a0a] rounded-t-[2.5rem] px-6 pt-6 pb-12 w-full max-w-md mx-auto border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
      >
        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-8" />

        <h1 className="text-white text-3xl font-bold mb-2">
          {step === 'email' ? 'Welcome back' : 'Check your email'}
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          {step === 'email' ? 'Sign in to continue' : `We sent a code to ${email}`}
        </p>

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) {
        // If user doesn't exist, try to sign them up
        if (error.message.includes("Invalid login credentials")) {
           const { error: signUpErr } = await supabase!.auth.signUp({ email, password });
           if (signUpErr) throw signUpErr;
           setSuccessMsg("Account created! You can now sign in.");
        } else {
           throw error;
        }
      } else {
        onLogin();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) { setError("Enter your email first"); return; }
    setIsLoading(true);
    setError("");
    try {
      const { error } = await supabase!.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
      if (error) throw error;
      setSuccessMsg("Magic link sent! Check your inbox.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError("Enter your email first"); return; }
    setIsLoading(true);
    setError("");
    try {
      const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (error) throw error;
      setSuccessMsg("Reset link sent! Check your email.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-40 flex flex-col overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={bgImage} 
          alt="Background" 
          className="w-full h-full object-cover opacity-60 transition-opacity duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80" />
      </div>

      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 pt-16 pb-4 flex justify-center"
      >
        <RuroLogo className="scale-90" />
      </motion.div>

      <div className="flex-grow" />

      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200, delay: 0.4 }}
        className="relative z-10 bg-[#0a0a0a] rounded-t-[2.5rem] px-6 pt-6 pb-12 w-full max-w-md mx-auto border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
      >
        <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-8" />

        <h1 className="text-white text-3xl font-bold mb-2">
          {step === 'email' ? 'Welcome' : 'Help is on the way'}
        </h1>
        <p className="text-gray-400 text-sm mb-8 italic">
          Signin to your account or create a new one instantly.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl mb-6 text-sm">
            {successMsg}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={mode === 'password' ? handlePasswordSignIn : handleSendOtp} className="space-y-4">
            <div className="space-y-3">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address" 
                className="w-full bg-[#1a1a1a]/80 text-white px-5 py-4 rounded-xl border border-white/5 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 placeholder-gray-500 transition-all font-medium"
                required
              />
              
              {mode === 'password' && (
                <div className="relative group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password" 
                    className="w-full bg-[#1a1a1a]/80 text-white px-5 py-4 rounded-xl border border-white/5 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 placeholder-gray-500 transition-all font-medium pr-14"
                    required
                    minLength={6}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 mt-2 mb-6 px-1">
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="hover:text-white transition-colors hover:underline"
              >
                Forgot password?
              </button>
              
              <button 
                type="button" 
                onClick={handleMagicLink}
                className="text-red-500 font-bold hover:text-red-400 transition-colors flex items-center gap-1"
              >
                Sign in without password
              </button>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#E50914] hover:bg-[#b20710] disabled:bg-[#E50914]/50 text-white font-bold py-4 rounded-xl transition-all shadow-[0_8px_20px_rgba(229,9,20,0.3)] mt-8 text-lg flex items-center justify-center transform active:scale-95"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (mode === 'password' ? 'Sign In / Register' : 'Get Magic Code')}
            </button>
          </form>
        ) : step === 'otp' ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {/* OTP Input - Semi-transparent */}
            <div className="relative">
              <input 
                type="text" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 8-digit code" 
                className="w-full bg-[#1a1a1a]/80 text-white px-5 py-4 rounded-xl border border-white/5 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 placeholder-gray-500 transition-all text-center tracking-widest text-xl font-mono"
                required
                maxLength={8}
              />
            </div>

            {/* Verify Button */}
            <button 
              type="submit"
              disabled={isLoading || otp.length < 8}
              className="w-full bg-[#E50914] hover:bg-[#b20710] disabled:bg-[#E50914]/50 text-white font-bold py-4 rounded-xl transition-colors mt-8 text-lg flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verify & Sign In'}
            </button>
            
            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-gray-400 hover:text-white text-sm mt-4 transition-colors"
            >
              Use a different email
            </button>
          </form>
        )}

        {/* Footer */}
        {step === 'email' && (
          <div className="mt-8 text-center text-sm text-gray-400">
            First time here? <button className="text-white font-bold hover:underline ml-1">Sign up</button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
