"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { businessSignup } from "@/src/services/authService";
import { createBusinessTurf } from "@/src/services/turfService";
import { BUSINESS_ONBOARDING_DRAFT_KEY } from "@/src/services/businessOnboarding";

const steps = ["Register", "Add turf", "Location", "Image"];
const toBusinessUsername = (value: string) => value
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-zA-Z0-9_]/g, "_")
  .replace(/_+/g, "_")
  .replace(/^_+|_+$/g, "")
  .slice(0, 30);
const initialForm = {
  username: "", email: "", password: "", confirmPassword: "", contactNumber: "",
  turfName: "", description: "", sportsAvailable: "football", surfaceType: "Synthetic grass",
  length: "90", width: "50", dimensionUnit: "meters", capacity: "20", address: "",
  landmark: "", city: "", state: "", zipCode: "", weekdayRate: "", weekendRate: "",
  openingTime: "06:00", closingTime: "23:00", amenities: "Parking, Floodlights",
};
type FormData = typeof initialForm;

export default function BusinessRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(BUSINESS_ONBOARDING_DRAFT_KEY);
      if (!saved) return;
      const draft = JSON.parse(saved);
      const savedStep = Number(draft?.step);
      if (Number.isInteger(savedStep) && savedStep >= 0 && savedStep < steps.length) setStep(savedStep);
      if (draft?.form && typeof draft.form === "object") setForm((current) => ({ ...current, ...draft.form, password: "", confirmPassword: "" }));
    } catch {
      localStorage.removeItem(BUSINESS_ONBOARDING_DRAFT_KEY);
    }
  }, []);

  const update = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const saveDraft = (nextStep: number, values = form) => {
    const { password: _password, confirmPassword: _confirmPassword, ...safeForm } = values;
    localStorage.setItem(BUSINESS_ONBOARDING_DRAFT_KEY, JSON.stringify({ step: nextStep, form: safeForm }));
  };

  const continueStep = async () => {
    setError("");
    if (step === 0) {
      const username = toBusinessUsername(form.username.trim());
      if (username.length < 3) {
        setError("Business name must produce a username with at least 3 letters, numbers, or underscores."); return;
      }
      if (!form.email.trim()) { setError("Enter your email address."); return; }
      if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
      if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
      setLoading(true);
      const result = await businessSignup(username, form.email.trim(), form.password);
      setLoading(false);
      if (!result.success) { setError(result.message || "Unable to create your business account."); return; }
    }
    const next = Math.min(step + 1, steps.length - 1);
    saveDraft(next);
    setStep(next);
  };

  const submitListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!mainImage) { setError("Please add a main turf photo."); return; }
    if (!form.contactNumber.trim() || !form.turfName.trim() || !form.description.trim() || !form.city.trim() || !form.state.trim() || !form.address.trim() || !form.zipCode.trim() || !form.weekdayRate || !form.weekendRate) {
      setError("Please complete all required fields in the previous steps."); return;
    }
    setLoading(true);
    const payload = {
      ownerDetails: { name: form.username.trim(), contactNumber: form.contactNumber.trim(), email: form.email.trim() },
      turfDetails: {
        turfName: form.turfName.trim(), description: form.description.trim(),
        sportsAvailable: form.sportsAvailable.split(",").map((value) => value.trim()).filter(Boolean),
        surfaceType: form.surfaceType, dimensions: { length: Number(form.length), width: Number(form.width), unit: form.dimensionUnit }, capacity: Number(form.capacity),
      },
      location: { address: form.address.trim(), landmark: form.landmark.trim(), city: form.city.trim(), state: form.state.trim(), zipCode: form.zipCode.trim() },
      pricing: { weekdayRate: Number(form.weekdayRate), weekendRate: Number(form.weekendRate), currency: "INR", minimumBookingHours: 1 },
      availability: { openingTime: form.openingTime, closingTime: form.closingTime, closedDays: [], customUnavailableDates: [] },
      amenities: form.amenities.split(",").map((value) => value.trim()).filter(Boolean),
    };
    const result = await createBusinessTurf(payload, { mainImage, thumbnailImages: galleryImages });
    setLoading(false);
    if (!result.success) { setError(result.message || "Unable to submit your turf listing. Your account is saved; you can retry from your dashboard."); return; }
    localStorage.removeItem(BUSINESS_ONBOARDING_DRAFT_KEY);
    router.push("/business");
  };

  const input = (name: keyof FormData, label: string, type = "text", required = true) => (
    <label className="block text-sm font-semibold" htmlFor={name}>{label}
      <input id={name} name={name} type={type} required={required} value={form[name]} onChange={update} className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-lime-200" />
    </label>
  );

  return (
    <main className="min-h-screen bg-black px-5 py-12 text-white sm:py-16">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-[#10120e] p-6 shadow-2xl sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-lime-200">Turfbook for business</p>
        <h1 className="mt-2 text-3xl font-black">List your turf</h1>
        <p className="mt-2 text-sm text-white/60">Step {step + 1} of {steps.length}: {steps[step]}</p>
        <div className="mt-5 grid grid-cols-4 gap-2" aria-label="Registration progress">
          {steps.map((label, index) => <div key={label} className="text-center">
            <div className={`mb-2 h-1.5 rounded-full ${index <= step ? "bg-lime-200" : "bg-white/15"}`} />
            <span className={`text-[11px] font-semibold ${index <= step ? "text-lime-100" : "text-white/40"}`}>{label}</span>
          </div>)}
        </div>
        {error && <p role="alert" className="mt-5 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}

        <form className="mt-7" onSubmit={step === 3 ? submitListing : (event) => { event.preventDefault(); void continueStep(); }}>
          {step === 0 && <div className="grid gap-4 sm:grid-cols-2">
            {input("username", "Business name (letters and numbers work best)")}{input("email", "Email address", "email")}{input("password", "Password", "password")}{input("confirmPassword", "Confirm password", "password")}
          </div>}
          {step === 1 && <div className="grid gap-4 sm:grid-cols-2">
            {input("turfName", "Turf name")}{input("sportsAvailable", "Sports (comma separated)")}{input("surfaceType", "Surface type")}{input("length", "Length", "number")}{input("width", "Width", "number")}{input("dimensionUnit", "Dimension unit")}{input("capacity", "Player capacity", "number")}
            <label className="block text-sm font-semibold sm:col-span-2" htmlFor="description">Description<textarea id="description" name="description" required minLength={10} value={form.description} onChange={update} rows={4} className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-lime-200" /></label>
            {input("weekdayRate", "Weekday rate (₹)", "number")}{input("weekendRate", "Weekend rate (₹)", "number")}{input("openingTime", "Opening time", "time")}{input("closingTime", "Closing time", "time")}{input("amenities", "Amenities (comma separated)", "text", false)}
          </div>}
          {step === 2 && <div className="grid gap-4 sm:grid-cols-2">
            {input("contactNumber", "Owner contact number", "tel")}{input("address", "Street address")}{input("landmark", "Landmark", "text", false)}{input("city", "City")}{input("state", "State")}{input("zipCode", "PIN / ZIP code")}
          </div>}
          {step === 3 && <div className="space-y-5">
            <label className="block text-sm font-semibold" htmlFor="main-image">Main turf photo <span className="text-lime-200">(required)</span><input id="main-image" type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => setMainImage(event.target.files?.[0] || null)} className="mt-2 block w-full rounded-lg border border-white/15 bg-black/40 p-3 text-sm" /><span className="mt-1 block text-xs font-normal text-white/50">JPG, PNG or WebP · up to 5 MB</span></label>
            <label className="block text-sm font-semibold" htmlFor="gallery-images">Gallery photos (optional)<input id="gallery-images" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setGalleryImages(Array.from(event.target.files || []).slice(0, 9))} className="mt-2 block w-full rounded-lg border border-white/15 bg-black/40 p-3 text-sm" /><span className="mt-1 block text-xs font-normal text-white/50">Up to 9 additional photos</span></label>
          </div>}

          <div className="mt-8 flex flex-col-reverse justify-between gap-3 sm:flex-row">
            <button type="button" disabled={step === 0 || loading} onClick={() => { setError(""); setStep((current) => Math.max(0, current - 1)); }} className="rounded-lg border border-white/20 px-5 py-3 font-semibold text-white/80 disabled:opacity-40">Back</button>
            {step < 3 ? <button type="submit" disabled={loading} className="rounded-lg bg-lime-200 px-6 py-3 font-black text-black disabled:opacity-60">{loading ? "Please wait…" : step === 0 ? "CREATE ACCOUNT & CONTINUE" : "CONTINUE"}</button> : <button type="submit" disabled={loading} className="rounded-lg bg-lime-200 px-6 py-3 font-black text-black disabled:opacity-60">{loading ? "Submitting…" : "SUBMIT TURF LISTING"}</button>}
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-white/60">Already have a business account? <Link href="/auth/login" className="font-semibold text-lime-200 hover:text-lime-100">Log in</Link></p>
      </section>
    </main>
  );
}
