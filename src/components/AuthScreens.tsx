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
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {/* Email Input - Semi-transparent */}
            <div className="relative">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email or phone number" 
                className="w-full bg-[#1a1a1a]/80 text-white px-5 py-4 rounded-xl border border-white/5 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 placeholder-gray-500 transition-all"
                required
              />
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between text-sm text-gray-400 mt-2 mb-6 px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 rounded border border-gray-600 group-hover:border-gray-400 transition-colors">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="absolute inset-0 bg-red-600 rounded opacity-0 peer-checked:opacity-100 transition-opacity" />
                  <svg className="w-3 h-3 text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="group-hover:text-gray-300 transition-colors">Remember me</span>
              </label>
              <button type="button" className="hover:text-white transition-colors">
                Need help?
              </button>
            </div>

            {/* Sign In Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#E50914] hover:bg-[#b20710] disabled:bg-[#E50914]/50 text-white font-bold py-4 rounded-xl transition-colors mt-8 text-lg flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Sign in'}
            </button>
          </form>
        ) : (
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
