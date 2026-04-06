"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { userLogin } from "@/src/services/authService";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const result = await userLogin(email, password);

    if (result.success) {
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } else {
      setError(result.message || "Login failed. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-12 overflow-hidden">
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
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-black"/>
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-white/3 blur-3xl pointer-events-none"/>
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-white/2 blur-3xl pointer-events-none"/>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-black font-black text-xl">T</div>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-2xl tracking-wider text-white">TURFBOOK</span>
          </Link>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-4xl tracking-wide mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to book your perfect game</p>
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

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"/>
          <span className="text-gray-500 text-sm">OR</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"/>
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: "Google" },
            { name: "Facebook" },
            { name: "Apple" },
          ].map(s => (
            <button key={s.name} className="glass px-4 py-3 rounded-lg hover:border-white/40 transition-all text-center">
              <span className="text-xl">{s.name.charAt(0)}</span>
            </button>
          ))}
        </div>

        {/* Signup Link */}
        <p className="text-center mt-8 text-gray-400">
          Don't have an account?{" "}
          <Link href="/auth/register" className="text-white font-bold hover:text-gray-300 transition-colors">
            Sign up now
          </Link>
        </p>

        {/* Footer */}
        <div className="mt-10 pt-8 border-t border-gray-800 text-center text-xs text-gray-600">
          <p>By signing in, you agree to our <Link href="#" className="text-white hover:text-gray-300">Terms</Link> and <Link href="#" className="text-white hover:text-gray-300">Privacy Policy</Link></p>
        </div>
      </div>
    </div>
  );
}
