"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { loginByRole } from "@/src/services/authService";
import { getBusinessOnboardingResumePath } from "@/src/services/businessOnboarding";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const result = await loginByRole(email, password);

    if (result.success) {
      setSuccess("Login successful! Redirecting...");
      const role = "role" in result ? result.role : "user";
      const destination = role === "admin"
        ? "/admin"
        : role === "business"
          ? getBusinessOnboardingResumePath(email)
          : "/dashboard";
      setTimeout(() => router.push(destination), 500);
    } else {
      setError(result.message || "Login failed. Please try again.");
    }

    setLoading(false);
  };

  return (
    <main className="relative isolate flex min-h-screen items-start justify-center overflow-x-hidden bg-black px-6 pb-12 pt-28 text-white sm:pt-32">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Bebas+Neue&display=swap');

        .glass{
          background: rgba(255,255,255,.04);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,.08);
        }

        .cta-primary{
          background: #ffffff;
          color: #0B0B0B;
          transition:all .3s;
          box-shadow: 0 4px 12px rgba(255,255,255,.15);
        }
        .cta-primary:hover{
          background: #f0f0f0;
          box-shadow: 0 8px 20px rgba(255,255,255,.2);
          transform: translateY(-2px);
        }

        .input-field{
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.1);
          transition: all .3s;
        }
        .input-field:focus{
          background: rgba(255,255,255,.06);
          border-color: rgba(255,255,255,.5);
          box-shadow: 0 0 0 3px rgba(255,255,255,.1);
        }
      `}</style>

      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-slate-900 via-black to-black"/>
      <div className="pointer-events-none absolute right-0 top-1/4 z-0 h-96 w-96 bg-white/3 blur-3xl"/>
      <div className="pointer-events-none absolute bottom-1/4 left-0 z-0 h-96 w-96 bg-white/2 blur-3xl"/>

      <div className="relative z-10 my-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0b0b]/95 p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-4xl tracking-wide mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to continue to your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500 text-green-400 rounded-lg text-sm">
            {success}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="input-field w-full px-4 py-3 rounded-lg text-white placeholder:text-gray-600 outline-none"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field w-full px-4 py-3 rounded-lg text-white placeholder:text-gray-600 outline-none"
              required
            />
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm text-gray-400">Remember me</span>
            </label>
            <Link href="#" className="text-sm text-white hover:text-gray-300 transition-colors">Forgot password?</Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="cta-primary w-full py-3 rounded-lg font-black text-black text-lg transition-all disabled:opacity-50"
          >
            {loading ? "Signing in..." : "SIGN IN"}
          </button>
        </form>

        <p className="text-center mt-8 text-gray-400">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-white font-bold hover:text-gray-300 transition-colors">Sign up now</Link>
        </p>
        <p className="mt-3 text-center text-sm text-gray-500">
          Business owner? <Link href="/business/register" className="font-semibold text-white hover:text-gray-300">List your turf</Link>
        </p>

        {/* Footer */}
        <div className="mt-10 pt-8 border-t border-gray-800 text-center text-xs text-gray-600">
          <p>By signing in, you agree to our <Link href="#" className="text-white hover:text-gray-300">Terms</Link> and <Link href="#" className="text-white hover:text-gray-300">Privacy Policy</Link></p>
        </div>
      </div>
    </main>
  );
}
