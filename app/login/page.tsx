'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Sparkles, ArrowRight, AlertCircle, UserPlus, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Mode = 'signin' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode]         = useState<Mode>('signin');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetState = (nextMode: Mode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'signin') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.push('/dashboard');
      } else {
        const { error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
        setSuccess('Account created! Please check your email to confirm your address, then sign in.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const isSignIn = mode === 'signin';

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Background Gradients & Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-950 to-slate-950 z-0" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Container */}
      <div className="relative z-10 w-full max-w-md p-8 mx-4 bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl">

        {/* Branding header */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/DevStack.png" 
            alt="DevStack Logo" 
            className="w-12 h-12 rounded-xl object-contain mb-4" 
          />
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Dev-Stack Analyzer
          </h1>
          <p className="text-sm text-slate-400 mt-2 text-center">
            {isSignIn ? 'Sign in to access your workspace' : 'Create an account to get started'}
          </p>
        </div>

        {/* Mode toggle pills */}
        <div className="flex bg-slate-950/60 border border-slate-800 rounded-xl p-1 mb-6 gap-1">
          <button
            type="button"
            onClick={() => resetState('signin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              isSignIn
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => resetState('signup')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              !isSignIn
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Sign Up
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Error alert */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success alert */}
          {success && (
            <div className="flex items-start gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-400 animate-in fade-in slide-in-from-top-2 duration-300">
              <Shield className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@devstack.com"
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              {isSignIn && (
                <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Forgot password?
                </a>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
              required
            />
            {!isSignIn && (
              <p className="mt-1.5 text-[11px] text-slate-500">Minimum 6 characters required.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full py-3.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isSignIn ? 'Sign In to Dashboard' : 'Create Account'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Guest Mode Divider & Button */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.setItem('devstack_guest', 'true');
              }
              router.push('/dashboard');
            }}
            className="w-full py-3 px-4 bg-slate-950/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-400 font-medium text-sm rounded-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md group"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:animate-ping" />
            <span>Продовжити в гостьовому режимі (Guest Access)</span>
          </button>
          <p className="text-[11px] text-slate-500 text-center mt-2">
            Вхід без авторизації. Історія ваших запитів не буде зберігатися.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              Supabase Auth
            </span>
            <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Gemini AI Powered
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
