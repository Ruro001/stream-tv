import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, Play, Wifi, Loader2, Mail, Lock, User, ArrowLeft } from "lucide-react";
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

type AuthView = 'login' | 'signup' | 'forgot-password' | 'magic-link' | 'magic-link-verify';

export const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [bgImage, setBgImage] = useState("https://picsum.photos/seed/cinema-dark/1080/1920");
  const [view, setView] = useState<AuthView>('login');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
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

  const resetMessages = () => {
    setError("");
    setSuccessMsg("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setError("Supabase is not configured."); return; }
    
    setIsLoading(true);
    resetMessages();
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      onLogin();
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setError("Supabase is not configured."); return; }
    
    setIsLoading(true);
    resetMessages();
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });
      if (error) throw error;
      setSuccessMsg("Signup successful! Please check your email to verify your account.");
      setView('login');
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setError("Supabase is not configured."); return; }
    
    setIsLoading(true);
    resetMessages();
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSuccessMsg("Password reset instructions sent to your email.");
      setTimeout(() => setView('login'), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setError("Supabase is not configured."); return; }
    
    setIsLoading(true);
    resetMessages();
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true }
      });
      if (error) throw error;
      setView('magic-link-verify');
    } catch (err: any) {
      setError(err.message || "Failed to send Magic Link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setIsLoading(true);
    resetMessages();
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });
      if (error) throw error;
      onLogin();
    } catch (err: any) {
      setError(err.message || "Invalid Code");
    } finally {
      setIsLoading(false);
    }
  };

  const InputField = ({ icon: Icon, type, placeholder, value, onChange, isPassword = false }: any) => (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-500" />
      </div>
      <input
        type={isPassword && !showPassword ? "password" : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[#1a1a1a]/80 text-white pl-12 pr-12 py-4 rounded-xl border border-white/5 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 placeholder-gray-500 transition-all"
        required
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      )}
    </div>
  );

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

      {/* Spacer */}
      <div className="flex-grow" />

      {/* Auth Card */}
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200, delay: 0.4 }}
        className="relative z-10 bg-[#0a0a0a] rounded-t-[2.5rem] px-6 pt-6 pb-12 w-full max-w-md mx-auto border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
      >
        <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-8" />

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header section with back button if not login */}
            <div className="flex items-center gap-3 mb-2">
              {view !== 'login' && view !== 'magic-link-verify' && (
                <button onClick={() => setView('login')} className="text-gray-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-6 h-6" />
                </button>
              )}
              {view === 'magic-link-verify' && (
                <button onClick={() => setView('magic-link')} className="text-gray-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-6 h-6" />
                </button>
              )}
              <h1 className="text-white text-3xl font-bold">
                {view === 'login' && 'Welcome back'}
                {view === 'signup' && 'Create Account'}
                {view === 'forgot-password' && 'Reset Password'}
                {view === 'magic-link' && 'Magic Link Login'}
                {view === 'magic-link-verify' && 'Check your email'}
              </h1>
            </div>

            <p className="text-gray-400 text-sm mb-8 ml-9">
              {view === 'login' && 'Sign in to continue'}
              {view === 'signup' && 'Join Ruro Streaming today'}
              {view === 'forgot-password' && 'Enter email to receive reset link'}
              {view === 'magic-link' && 'Passwordless secure login'}
              {view === 'magic-link-verify' && `We sent a code to ${email}`}
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

            {/* Login Form */}
            {view === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <InputField icon={Mail} type="email" placeholder="Email Address" value={email} onChange={(e: any) => setEmail(e.target.value)} />
                <InputField icon={Lock} type="password" placeholder="Password" value={password} onChange={(e: any) => setPassword(e.target.value)} isPassword />
                
                <div className="flex justify-end mt-2 mb-6">
                  <button type="button" onClick={() => setView('forgot-password')} className="text-sm text-gray-400 hover:text-white transition-colors">
                    Forgot password?
                  </button>
                </div>

                <button 
                  type="submit" disabled={isLoading}
                  className="w-full bg-[#E50914] hover:bg-[#b20710] disabled:bg-[#E50914]/50 text-white font-bold py-4 rounded-xl transition-colors mt-4 text-lg flex items-center justify-center shadow-lg"
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Sign In'}
                </button>

                <div className="relative flex py-5 items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">or</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button 
                  type="button" onClick={() => setView('magic-link')}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl transition-colors text-base border border-white/10 flex items-center justify-center gap-2"
                >
                  <Mail className="w-5 h-5" /> Passwordless Magic Link
                </button>

                <div className="mt-8 text-center text-sm text-gray-400">
                  First time here? <button type="button" onClick={() => setView('signup')} className="text-white font-bold hover:underline ml-1">Sign up</button>
                </div>
              </form>
            )}

            {/* Signup Form */}
            {view === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <InputField icon={User} type="text" placeholder="Username" value={username} onChange={(e: any) => setUsername(e.target.value)} />
                <InputField icon={Mail} type="email" placeholder="Email Address" value={email} onChange={(e: any) => setEmail(e.target.value)} />
                <InputField icon={Lock} type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e: any) => setPassword(e.target.value)} isPassword />

                <button 
                  type="submit" disabled={isLoading}
                  className="w-full bg-[#E50914] hover:bg-[#b20710] disabled:bg-[#E50914]/50 text-white font-bold py-4 rounded-xl transition-colors mt-8 text-lg flex items-center justify-center"
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Create Account'}
                </button>
              </form>
            )}

            {/* Forgot Password Form */}
            {view === 'forgot-password' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <InputField icon={Mail} type="email" placeholder="Email Address" value={email} onChange={(e: any) => setEmail(e.target.value)} />

                <button 
                  type="submit" disabled={isLoading}
                  className="w-full bg-[#E50914] hover:bg-[#b20710] disabled:bg-[#E50914]/50 text-white font-bold py-4 rounded-xl transition-colors mt-8 text-lg flex items-center justify-center"
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Send Reset Link'}
                </button>
              </form>
            )}

            {/* Magic Link Request Form */}
            {view === 'magic-link' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <InputField icon={Mail} type="email" placeholder="Email Address" value={email} onChange={(e: any) => setEmail(e.target.value)} />

                <button 
                  type="submit" disabled={isLoading}
                  className="w-full bg-prime-blue hover:bg-blue-600 disabled:bg-blue-600/50 text-white font-bold py-4 rounded-xl transition-colors mt-8 text-lg flex items-center justify-center"
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Send Magic Code'}
                </button>
              </form>
            )}

            {/* Magic Link Verify Form */}
            {view === 'magic-link-verify' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
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

                <button 
                  type="submit" disabled={isLoading || otp.length < 6}
                  className="w-full bg-prime-blue hover:bg-blue-600 disabled:bg-blue-600/50 text-white font-bold py-4 rounded-xl transition-colors mt-8 text-lg flex items-center justify-center"
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verify & Sign In'}
                </button>
              </form>
            )}

          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
