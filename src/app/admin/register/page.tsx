"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { adminRegister } from "@/src/services/authService";

export default function AdminRegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const result = await adminRegister(username, email, password);
    if (result.success) {
      router.push("/admin");
    } else {
      setError(result.message || "Admin registration failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-16">
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">Admin Setup</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">Create account</h1>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/80">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/80">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/80">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/80">Confirm password</label>
            <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none" required />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-white px-4 py-3 font-black text-black transition hover:bg-white/90 disabled:opacity-60">
            {loading ? "Creating..." : "CREATE ADMIN"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-white/60">
          <Link href="/admin/login" className="hover:text-white">
            Back to login
          </Link>
          <Link href="/business/register" className="hover:text-white">
            Business signup
          </Link>
        </div>
      </div>
    </div>
  );
}
