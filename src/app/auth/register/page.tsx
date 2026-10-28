"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { userGoogleLogin, userSignup } from "@/src/services/authService";
import GoogleSignInButton from "@/src/app/auth/GoogleSignInButton";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
    },
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const addressField = name.slice("address.".length) as keyof typeof formData.address;
      setFormData((current) => ({
        ...current,
        address: { ...current.address, [addressField]: value },
      }));
      return;
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(formData.password)) {
      setError("Password must contain at least 6 characters, including an uppercase letter, a lowercase letter, and a number.");
      return;
    }

    setLoading(true);

    const result = await userSignup(
      formData.name,
      formData.email,
      formData.password,
      formData.contactNumber.replace(/\D/g, ""),
      formData.address
    );

    if (result.success) {
      setSuccess("Account created successfully! Redirecting...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } else {
      setError(result.message || "Registration failed. Please try again.");
    }

    setLoading(false);
  };

  const handleGoogleCredential = async (idToken: string) => {
    setError("");
    setSuccess("");
    setLoading(true);

    const result = await userGoogleLogin(idToken);
    if (result.success) {
      const payload = result.data.data || result.data.result || result.data;
      setSuccess(`${payload.message || "Google signup successful."} Redirecting...`);
      setTimeout(() => router.push("/dashboard"), 500);
    } else {
      setError(result.message || "Google sign-up failed. Please try again.");
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

      {error && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setError("");
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="registration-error-title"
            aria-describedby="registration-error-message"
            className="w-full max-w-md rounded-2xl border border-red-400/30 bg-[#111] p-6 text-white shadow-2xl shadow-red-950/40"
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <h2 id="registration-error-title" className="text-xl font-bold">Registration failed</h2>
              <button type="button" onClick={() => setError("")} aria-label="Close error message" className="rounded-md px-2 text-2xl leading-none text-gray-400 hover:text-white">&times;</button>
            </div>
            <p id="registration-error-message" className="whitespace-pre-line text-sm leading-6 text-red-200">{error}</p>
            <button type="button" onClick={() => setError("")} className="cta-primary mt-6 w-full rounded-lg py-2.5 font-bold">OK</button>
          </section>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-slate-900 via-black to-black"/>
      <div className="pointer-events-none absolute right-0 top-1/4 z-0 h-96 w-96 bg-white/3 blur-3xl"/>
      <div className="pointer-events-none absolute bottom-1/4 left-0 z-0 h-96 w-96 bg-white/2 blur-3xl"/>

      <div className="relative z-10 my-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#0b0b0b]/95 p-6 shadow-2xl sm:p-8">
        <div className="mb-8 text-center">
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-4xl tracking-wide mb-2">Join the Game</h1>
          <p className="text-gray-400">Create your account and start booking turfs today</p>
        </div>

        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500 text-green-400 rounded-lg text-sm">
            {success}
          </div>
        )}

        <div className="mb-6">
          <div className="mb-4 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <span className="text-sm text-gray-500">OR CONTINUE WITH</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>
          <GoogleSignInButton onCredential={handleGoogleCredential} />
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="input-field w-full px-4 py-3 rounded-lg text-white placeholder:text-gray-600 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="input-field w-full px-4 py-3 rounded-lg text-white placeholder:text-gray-600 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Phone Number</label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="+91 98765 32100"
              className="input-field w-full px-4 py-3 rounded-lg text-white placeholder:text-gray-600 outline-none"
              required
            />
          </div>

          <div className="space-y-4 rounded-xl border border-white/10 p-4">
            <p className="text-sm font-bold text-gray-300">Address</p>
            <input
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
              placeholder="Street address"
              autoComplete="street-address"
              className="input-field w-full rounded-lg px-4 py-3 text-white outline-none placeholder:text-gray-600"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                placeholder="City"
                autoComplete="address-level2"
                className="input-field w-full rounded-lg px-4 py-3 text-white outline-none placeholder:text-gray-600"
                required
              />
              <input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                placeholder="State"
                autoComplete="address-level1"
                className="input-field w-full rounded-lg px-4 py-3 text-white outline-none placeholder:text-gray-600"
                required
              />
              <input
                type="text"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleChange}
                placeholder="ZIP code"
                autoComplete="postal-code"
                className="input-field w-full rounded-lg px-4 py-3 text-white outline-none placeholder:text-gray-600"
                required
              />
              <input
                type="text"
                name="address.country"
                value={formData.address.country}
                onChange={handleChange}
                placeholder="Country"
                autoComplete="country-name"
                className="input-field w-full rounded-lg px-4 py-3 text-white outline-none placeholder:text-gray-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="input-field w-full px-4 py-3 rounded-lg text-white placeholder:text-gray-600 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="input-field w-full px-4 py-3 rounded-lg text-white placeholder:text-gray-600 outline-none"
              required
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer pt-2">
            <input type="checkbox" className="w-4 h-4 mt-1" required />
            <span className="text-sm text-gray-400">I agree to the <Link href="#" className="text-white hover:text-gray-300">Terms of Service</Link> and <Link href="#" className="text-white hover:text-gray-300">Privacy Policy</Link></span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="cta-primary w-full py-3 rounded-lg font-black text-black text-lg transition-all disabled:opacity-50 mt-6"
          >
            {loading ? "Creating account..." : "CREATE ACCOUNT"}
          </button>
        </form>

        <p className="text-center mt-8 text-gray-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-white font-bold hover:text-gray-300 transition-colors">
            Sign in here
          </Link>
        </p>
      </div>
    </main>
  );
}
