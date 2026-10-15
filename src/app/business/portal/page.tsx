"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { businessApi } from "@/src/services/businessApiService";
import { isBusinessLoggedIn, logout } from "@/src/services/authService";

type Row = Record<string, any>;
type Section = "overview" | "profile" | "verification" | "turfs" | "bookings" | "finance" | "inbox";
const sections: { id: Section; label: string }[] = [
  { id: "overview", label: "Overview" }, { id: "profile", label: "Business profile" },
  { id: "verification", label: "Verification" }, { id: "turfs", label: "Turfs" },
  { id: "bookings", label: "Bookings" }, { id: "finance", label: "Finance & plans" }, { id: "inbox", label: "Inbox & support" },
];
const panel = "rounded-2xl border border-white/10 bg-[#111613] p-5 sm:p-6";
const field = "w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-3 text-sm text-white outline-none focus:border-lime-300/60";
const button = "rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-lime-200 disabled:opacity-50";
const secondary = "rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/40";

function rows(result: any): Row[] {
  const data = result?.data;
  if (Array.isArray(data)) return data;
  for (const key of ["entries", "bookings", "plans", "notifications", "tickets", "settlements", "payouts"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}
function one(result: any): Row | null { return result?.data && typeof result.data === "object" && !Array.isArray(result.data) ? result.data : null; }
function title(row: Row) { return row.displayName || row.name || row.subject || row.title || row.documentType || "Business item"; }
function idOf(row: Row) { return row.id || row._id || ""; }
function isCurrentPlan(plan: Row, subscription: Row | null) {
  if (!subscription) return false;
  const subscribedPlan = subscription.plan;
  const currentId = typeof subscribedPlan === "string" ? subscribedPlan : idOf(subscribedPlan || {}) || subscription.planId;
  const candidateId = idOf(plan);
  if (currentId && candidateId) return String(currentId) === String(candidateId);
  const currentSlug = typeof subscribedPlan === "object" ? subscribedPlan?.slug : "";
  if (currentSlug && plan.slug) return String(currentSlug).toLowerCase() === String(plan.slug).toLowerCase();
  const currentName = typeof subscribedPlan === "object" ? subscribedPlan?.name : "";
  return Boolean(currentName && plan.name && String(currentName).trim().toLowerCase() === String(plan.name).trim().toLowerCase());
}
function notificationIsRead(item: Row) {
  return Boolean(item.readAt || item.isRead || item.read || String(item.status || "").toUpperCase() === "READ");
}
function moneyFromPaise(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `₹${(amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
}
function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function BusinessPortalPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [editingProfile, setEditingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Row>({ address: {} });
  const [auth, setAuth] = useState<Row>({});
  const [documents, setDocuments] = useState<Row[]>([]);
  const [turfs, setTurfs] = useState<Row[]>([]);
  const [bookings, setBookings] = useState<Row[]>([]);
  const [stats, setStats] = useState<Row>({});
  const [statement, setStatement] = useState<Row>({});
  const [settlements, setSettlements] = useState<Row[]>([]);
  const [plans, setPlans] = useState<Row[]>([]);
  const [subscription, setSubscription] = useState<Row | null>(null);
  const [notifications, setNotifications] = useState<Row[]>([]);
  const [preferences, setPreferences] = useState<Row>({});
  const [tickets, setTickets] = useState<Row[]>([]);
  const [ticketForm, setTicketForm] = useState({ category: "BUSINESS", priority: "MEDIUM", subject: "", message: "" });
  const [documentForm, setDocumentForm] = useState({ documentType: "BUSINESS_REGISTRATION", documentNumber: "", expiryDate: "" });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const results = await Promise.all([
      businessApi.authProfile(), businessApi.profile(), businessApi.documents(), businessApi.turfs(),
      businessApi.bookings(), businessApi.bookingStats(), businessApi.financialStatement({ page: 1, limit: 10 }),
      businessApi.settlements({ page: 1, limit: 10 }), businessApi.plans(), businessApi.subscription(), businessApi.notifications({ page: 1, limit: 20 }),
      businessApi.notificationPreferences(), businessApi.supportTickets(),
    ]);
    const [a, p, d, t, b, s, f, st, pl, sub, n, pref, tk] = results;
    const profileData = one(p) || { address: {} };
    setAuth(one(a) || {}); setProfile(profileData);
    setDocuments(rows(d).length ? rows(d) : Array.isArray(profileData.verificationDocuments) ? profileData.verificationDocuments : Array.isArray(profileData.documents) ? profileData.documents : []);
    setTurfs(rows(t).length ? rows(t) : Array.isArray(profileData.turfs) ? profileData.turfs : []);
    setBookings(rows(b)); setStats(one(s) || {}); setStatement(one(f) || {}); setSettlements(rows(st)); setPlans(rows(pl)); setSubscription(one(sub) || profileData.subscription || null);
    setNotifications(rows(n)); setPreferences(one(pref) || {}); setTickets(rows(tk));
    const failures = results.filter((result) => !result.success);
    if (failures.length === results.length) setError(failures[0]?.message || "Could not connect to the business APIs.");
    setLoading(false);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSection = params.get("section");
    if (requestedSection === "finance" || requestedSection === "profile") setSection(requestedSection);
    if (requestedSection === "profile" && params.get("edit") === "1") setEditingProfile(true);
  }, []);

  useEffect(() => {
    if (!isBusinessLoggedIn()) { router.replace("/business/login"); return; }
    void load();
  }, [load, router]);

  const run = async (action: () => Promise<any>, successMessage: string, refresh = true) => {
    setBusy(true); setError(""); setNotice("");
    const result = await action(); setBusy(false);
    if (!result.success) { setError(result.message || "That request could not be completed."); return result; }
    setNotice(successMessage); if (refresh) await load(); return result;
  };
  const startPaidCheckout = async (planId: string, planName: string) => {
    setBusy(true); setError(""); setNotice("");
    const result = await businessApi.subscriptionCheckout({ planId, billingCycle: "MONTHLY" });
    if (!result.success) { setBusy(false); setError(result.message || "Could not start subscription checkout."); return; }
    const order = one(result);
    const key = order?.keyId || order?.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const orderId = order?.providerOrderId || order?.razorpayOrderId;
    const amount = Number(order?.amountPaise);
    if (!key || !orderId || !Number.isFinite(amount) || amount <= 0) {
      setBusy(false); setError("Checkout order was created, but Razorpay checkout details are missing. Contact support before retrying."); return;
    }
    try {
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
          const script = existing || document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Razorpay checkout could not be loaded."));
          if (!existing) document.body.appendChild(script);
        });
      }
      if (!(window as any).Razorpay) throw new Error("Razorpay checkout did not initialize.");
      const checkout = new (window as any).Razorpay({
        key, order_id: orderId, amount, currency: order.currency || "INR", name: "TurfBook",
        description: `${planName} subscription`,
        handler: async (payment: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verified = await businessApi.verifySubscription({ orderId: payment.razorpay_order_id, paymentId: payment.razorpay_payment_id, signature: payment.razorpay_signature });
          setBusy(false);
          if (!verified.success) { setError(verified.message || "Payment was received, but subscription verification failed. Contact support with your payment receipt."); return; }
          setNotice("Payment verified. Your subscription is active."); await load();
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      checkout.on("payment.failed", (failure: { error?: { description?: string; reason?: string } }) => {
        setBusy(false); setError(failure?.error?.description || failure?.error?.reason || "Razorpay could not complete the payment.");
      });
      checkout.open();
    } catch (checkoutError) {
      setBusy(false); setError(checkoutError instanceof Error ? checkoutError.message : "Could not open Razorpay checkout.");
    }
  };
  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await run(() => businessApi.saveProfile(profile), "Business profile saved. Changes may be sent for review.");
    if (result.success) setEditingProfile(false);
  };
  const closeProfileEditor = () => {
    setEditingProfile(false);
    void load();
  };
  const submitDocument = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget; const file = (new FormData(form).get("document") as File | null);
    if (!file || !file.size) { setError("Choose a document file first."); return; }
    const body = new FormData(); body.set("documentType", documentForm.documentType); body.set("document", file);
    if (documentForm.documentNumber) body.set("documentNumber", documentForm.documentNumber);
    if (documentForm.expiryDate) body.set("expiryDate", new Date(documentForm.expiryDate).toISOString());
    await run(() => businessApi.submitDocument(body), "Verification document submitted."); form.reset();
  };
  const submitTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await run(() => businessApi.createSupportTicket(ticketForm), "Support ticket created.");
    setTicketForm({ category: "BUSINESS", priority: "MEDIUM", subject: "", message: "" });
  };
  const patchProfile = (key: string, value: string) => setProfile((current: Row) => ({ ...current, [key]: value }));
  const patchAddress = (key: string, value: string) => setProfile((current: Row) => ({ ...current, address: { ...(current.address || {}), [key]: value } }));

  const metricCards = [
    ["Turfs", turfs.length], ["Bookings", stats.totalBookings ?? bookings.length],
    ["Revenue", `₹${Number(stats.totalRevenue ?? 0).toLocaleString("en-IN")}`],
  ];
  const badge = (value: unknown) => <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">{String(value || "Pending").replaceAll("_", " ")}</span>;
  const list = (items: Row[], empty: string, render?: (item: Row) => React.ReactNode) => items.length ? <div className="divide-y divide-white/10">{items.map((item, index) => <div key={idOf(item) || index} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate font-semibold">{render ? render(item) : title(item)}</p><p className="mt-1 text-xs text-white/45">{item.email || item.city || item.createdAt && new Date(item.createdAt).toLocaleDateString() || ""}</p></div>{badge(item.status || item.reviewStatus || item.bookingStatus || item.paymentStatus)}</div>)}</div> : <p className="text-sm text-white/50">{empty}</p>;

  return <main className="min-h-screen bg-[#080b09] px-4 pb-16 pt-8 text-white sm:px-6 lg:px-10">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div><Link href="/business" className="text-xs font-bold uppercase tracking-[.24em] text-lime-300">TurfBook Business</Link><h1 className="mt-2 text-3xl font-black">Business center</h1><p className="mt-1 text-sm text-white/50">{auth.username || auth.email || "Manage your business account"}</p></div>
        <div className="flex gap-2"><Link className={secondary} href="/business">Dashboard</Link><button className={secondary} onClick={() => void load()} disabled={loading}>Refresh</button><button className={secondary} onClick={() => { logout(); router.replace("/business/login"); }}>Log out</button></div>
      </header>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">{sections.map((item) => <button key={item.id} onClick={() => setSection(item.id)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold ${section === item.id ? "bg-lime-300 text-black" : "bg-white/5 text-white/65 hover:bg-white/10"}`}>{item.label}</button>)}</div>
      {error && <div role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>}
      {notice && <div role="status" className="mt-5 rounded-xl border border-lime-300/20 bg-lime-300/5 px-4 py-3 text-sm text-lime-100">{notice}</div>}
      {loading && <p className="mt-5 animate-pulse text-sm text-white/50">Loading your business data…</p>}

      {section === "overview" && <div className="mt-6 space-y-5"><div className="flex flex-wrap gap-2">{[["Business review",profile.approvalStatus], ["Operations",profile.operationalStatus], ["Subscription",subscription?.status || profile.subscriptionStatus]].filter(([,value])=>value).map(([label,value])=><div key={String(label)} className="rounded-xl border border-white/10 bg-white/[.035] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</p><p className="mt-1 text-sm font-semibold">{String(value).replaceAll("_"," ")}</p></div>)}</div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metricCards.map(([label, value]) => <article className={panel} key={String(label)}><p className="text-sm text-white/50">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></article>)}</div>
        <div className="grid gap-5 lg:grid-cols-2"><article className={panel}><h2 className="mb-4 text-lg font-bold">Recent bookings</h2>{list(bookings.slice(0, 5), "No bookings yet.", (item) => <>{item.user?.name || item.customer?.name || "Customer booking"}<span className="ml-2 text-xs text-white/45">{item.turf?.turfDetails?.turfName || ""}</span></>)}</article><article className={panel}><h2 className="mb-4 text-lg font-bold">Setup checklist</h2><div className="space-y-3 text-sm">{[["Business profile", Boolean(profile.displayName)], ["Add your first turf", turfs.length > 0], ["Verification documents", documents.length > 0]].map(([label, done]) => <div key={String(label)} className="flex justify-between"><span className="text-white/70">{label}</span><span className={done ? "text-lime-300" : "text-amber-200"}>{done ? "Complete" : "To do"}</span></div>)}</div><button className={`${button} mt-5`} onClick={() => setSection("profile")}>Complete setup</button></article></div>
      </div>}

      {section === "profile" && <><div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><article className={panel}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Business profile</h2><p className="mt-1 text-sm text-white/45">View your saved business information and edit it when needed.</p></div><button type="button" className={button} aria-expanded={editingProfile} onClick={() => editingProfile ? closeProfileEditor() : setEditingProfile(true)}>{editingProfile ? "Close form" : "Edit profile"}</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{[["Business name",profile.displayName],["Legal name",profile.legalName],["Contact email",profile.contactEmail],["Contact phone",profile.contactPhone],["Business type",profile.businessType],["Website",profile.website]].map(([label,value])=><div key={label}><p className="text-xs text-white/40">{label}</p><p className="mt-1 break-words text-sm font-semibold text-white/85">{value || "—"}</p></div>)}<div className="sm:col-span-2"><p className="text-xs text-white/40">Registered address</p><p className="mt-1 text-sm font-semibold text-white/85">{[profile.address?.line1,profile.address?.line2,profile.address?.city,profile.address?.state,profile.address?.postalCode,profile.address?.country].filter(Boolean).join(", ") || "—"}</p></div></div><div className="mt-5 flex flex-wrap gap-2">{[["Review",profile.approvalStatus],["Operations",profile.operationalStatus],["Subscription",subscription?.status || profile.subscriptionStatus]].filter(([,value])=>value).map(([label,value])=><span key={String(label)} className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/70">{label}: {String(value).replaceAll("_"," ")}</span>)}</div>{editingProfile && <form className={`${panel} mt-5 grid gap-4 sm:grid-cols-2`} onSubmit={saveProfile}><div className="sm:col-span-2"><h2 className="text-lg font-bold">Edit business profile</h2><p className="mt-1 text-sm text-white/45">Update your business contact and registered address.</p></div>
        {[["legalName","Legal name"],["displayName","Display name"],["contactEmail","Contact email"],["contactPhone","Contact phone"],["website","Website"],["registrationNumber","Registration number"],["timezone","Timezone"]].map(([key,label]) => <label key={key} className="text-xs text-white/55">{label}<input className={`${field} mt-1.5`} value={profile[key] || ""} onChange={(e) => patchProfile(key,e.target.value)} required={["legalName","displayName","contactEmail","contactPhone"].includes(key)} /></label>)}
        <label className="text-xs text-white/55">Business type<select className={`${field} mt-1.5`} value={profile.businessType || "individual"} onChange={(e) => patchProfile("businessType",e.target.value)}>{["individual","partnership","private_limited","llp","other"].map(x => <option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}</select></label>
        <label className="text-xs text-white/55 sm:col-span-2">Description<textarea className={`${field} mt-1.5 min-h-20`} value={profile.description || ""} onChange={(e) => patchProfile("description",e.target.value)} /></label>
        <p className="font-semibold sm:col-span-2">Business address</p>{[["line1","Address line"],["line2","Address line 2"],["city","City"],["state","State"],["country","Country"],["postalCode","Postal code"]].map(([key,label]) => <label key={key} className="text-xs text-white/55">{label}<input className={`${field} mt-1.5`} value={profile.address?.[key] || ""} onChange={(e) => patchAddress(key,e.target.value)} required={["line1","city","state","country","postalCode"].includes(key)} /></label>)}
        <div className="flex justify-end gap-3 sm:col-span-2"><button type="button" className={secondary} onClick={closeProfileEditor}>Cancel</button><button className={button} disabled={busy}>{busy ? "Saving…" : "Save business profile"}</button></div></form>}</article>
        <article className={panel}><h2 className="text-lg font-bold">Account settings</h2><p className="mt-2 text-sm text-white/50">Signed in as {auth.businessUser?.username || auth.user?.username || auth.username || profile.owner?.username || "—"} · {auth.businessUser?.email || auth.user?.email || auth.email || profile.owner?.email || "—"}</p><PasswordForm onSave={(body) => run(() => businessApi.changePassword(body), "Password changed.", false)} busy={busy} /></article></div><ProfileDetails profile={profile} /></>}

      {section === "verification" && <div className="mt-6 grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><form className={`${panel} space-y-4`} onSubmit={submitDocument}><div><h2 className="text-lg font-bold">Submit verification document</h2><p className="mt-1 text-sm text-white/45">PDF, JPEG, PNG or WebP · up to 5 MB</p></div><label className="block text-xs text-white/55">Document type<select className={`${field} mt-1.5`} value={documentForm.documentType} onChange={e => setDocumentForm({...documentForm,documentType:e.target.value})}>{["IDENTITY_PROOF","BUSINESS_REGISTRATION","TAX_DOCUMENT","ADDRESS_PROOF","BANK_VERIFICATION","AUTHORIZATION"].map(x=><option key={x}>{x}</option>)}</select></label><label className="block text-xs text-white/55">Document number (optional)<input className={`${field} mt-1.5`} value={documentForm.documentNumber} onChange={e=>setDocumentForm({...documentForm,documentNumber:e.target.value})} /></label><label className="block text-xs text-white/55">Expiry date (optional)<input type="date" className={`${field} mt-1.5`} value={documentForm.expiryDate} onChange={e=>setDocumentForm({...documentForm,expiryDate:e.target.value})} /></label><input required name="document" type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="block w-full text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-bold file:text-black" /><button disabled={busy} className={button}>Upload for review</button></form><article className={panel}><h2 className="mb-4 text-lg font-bold">Submitted documents</h2>{list(documents,"No documents submitted yet.",item=><>{title(item)}<span className="ml-2 text-xs text-white/45">{item.documentNumberMasked || item.documentNumber || ""}</span></>)}{documents.map(item=>idOf(item) && <button key={`download-${idOf(item)}`} className="mr-2 mt-3 text-xs text-lime-200 underline" onClick={async()=>{const r=await businessApi.documentDownload(idOf(item));const url=one(r)?.url;if(url)window.open(url,"_blank","noopener,noreferrer");else setError(r.message||"Could not create download link.");}}>Get secure download link</button>)}</article></div>}

      {section === "turfs" && <div className="mt-6 grid gap-4 sm:grid-cols-2">{list(turfs,"No turfs created yet.",item=><>{item.turfDetails?.turfName || title(item)}<span className="ml-2 text-xs text-white/45">{item.location?.city || ""} · ₹{Number(item.pricing?.weekdayRate || 0).toLocaleString("en-IN")}/hour</span></>)}</div>}

      {section === "bookings" && <div className="mt-6 space-y-5"><div className="grid gap-3 sm:grid-cols-4">{[["Total",stats.totalBookings ?? bookings.length],["Paid",stats.paidBookings ?? 0],["Pending",stats.pendingBookings ?? 0],["Revenue",`₹${Number(stats.totalRevenue ?? 0).toLocaleString("en-IN")}`]].map(([k,v])=><div key={String(k)} className={panel}><p className="text-xs text-white/45">{k}</p><p className="mt-2 text-2xl font-black">{v}</p></div>)}</div><article className={panel}><h2 className="mb-4 text-lg font-bold">Booking requests</h2><div className="space-y-3">{bookings.length ? bookings.map((item,index)=><BookingRow key={idOf(item)||index} item={item} onUpdate={(status)=>run(()=>businessApi.updateBooking(idOf(item),{bookingStatus:status}),"Booking status updated.")} busy={busy}/>) : <p className="text-sm text-white/50">No bookings available.</p>}</div></article></div>}

      {section === "finance" && <div className="mt-6 grid gap-5 lg:grid-cols-2"><article className={`${panel} lg:col-span-2`}><h2 className="mb-4 text-lg font-bold">Available plans</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{plans.map((plan,index)=>{const currentPlan=isCurrentPlan(plan,subscription);return <div key={idOf(plan)||index} className="rounded-xl border border-white/10 bg-black/20 p-4"><div className="flex items-start justify-between gap-2"><p className="font-bold">{title(plan)}</p>{currentPlan&&<span className="rounded-full bg-lime-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-lime-200">Current plan</span>}</div><p className="mt-1 text-sm text-white/50">{plan.description || `${plan.trialDays || 0} trial days`}</p><p className="mt-3 text-lg font-black">{plan.monthlyPricePaise !== undefined ? moneyFromPaise(plan.monthlyPricePaise) : `₹${Number(plan.monthlyPrice ?? plan.price ?? 0).toLocaleString("en-IN")}`}<span className="text-xs font-normal text-white/45"> / month</span></p>{!currentPlan&&<div className="mt-4 flex flex-wrap gap-2">{Number(plan.monthlyPrice ?? plan.price ?? plan.monthlyPricePaise ?? 0) === 0 && <button className={button} disabled={busy} onClick={()=>void run(()=>businessApi.activateFreePlan({planId:idOf(plan),billingCycle:"MONTHLY"}),"Free plan activated.")}>Activate free</button>}{Number(plan.trialDays)>0 && <button className={secondary} disabled={busy} onClick={()=>void run(()=>businessApi.startTrial({planId:idOf(plan)}),"Trial started.")}>Start trial</button>}{Number(plan.monthlyPrice ?? plan.price ?? plan.monthlyPricePaise ?? 0)>0 && <button className={secondary} disabled={busy} onClick={()=>void startPaidCheckout(idOf(plan),title(plan))}>{busy ? "Opening checkout…" : "Pay with Razorpay"}</button>}</div>}</div>;})}</div>{!plans.length&&<p className="text-sm text-white/45">No active plans returned.</p>}</article>
        <article className={panel}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">Current subscription</h2><p className="mt-1 text-sm text-white/45">Your plan and billing period</p></div>{subscription&&badge(subscription.status)}</div>{subscription ? <><div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-xs uppercase tracking-wide text-white/45">Plan</p><p className="mt-1 text-xl font-bold">{subscription.plan?.name || subscription.plan?.displayName || "Business plan"}</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><p className="text-xs text-white/45">Billing cycle</p><p className="mt-1 font-semibold">{String(subscription.billingCycle || "—").toLowerCase()}</p></div><div><p className="text-xs text-white/45">Current amount</p><p className="mt-1 font-semibold">{moneyFromPaise(subscription.amountPaise ?? subscription.plan?.monthlyPricePaise)}</p></div><div><p className="text-xs text-white/45">Period starts</p><p className="mt-1 font-semibold">{formatDate(subscription.currentPeriodStart)}</p></div><div><p className="text-xs text-white/45">Period ends</p><p className="mt-1 font-semibold">{formatDate(subscription.currentPeriodEnd)}</p></div></div>{subscription.cancelAtPeriodEnd && <p className="mt-4 rounded-lg bg-amber-300/10 px-3 py-2 text-xs text-amber-100">Cancellation is scheduled for the end of this billing period.</p>}</div><button className={`${secondary} mt-4`} disabled={busy || subscription.cancelAtPeriodEnd} onClick={()=>void run(()=>businessApi.cancelSubscription(),"Subscription cancellation scheduled.")}>{subscription.cancelAtPeriodEnd ? "Cancellation scheduled" : "Cancel subscription"}</button></> : <p className="mt-5 text-sm text-white/50">No active subscription.</p>}</article>
        <article className={panel}><h2 className="text-lg font-bold">Statement totals</h2><p className="mt-1 text-sm text-white/45">Amounts shown in INR</p><div className="mt-5 space-y-3">{Object.entries(statement.totals||{}).filter(([key,value])=>key !== "_id" && typeof value === "number" && Number.isFinite(value)).map(([key,value])=><div key={key} className="flex justify-between gap-3 border-b border-white/5 pb-2 text-sm"><span className="capitalize text-white/55">{key.replace(/Paise$/,"" )}</span><b>{moneyFromPaise(value)}</b></div>)}{!Object.entries(statement.totals||{}).some(([key,value])=>key !== "_id" && typeof value === "number" && Number.isFinite(value)) && <p className="text-sm text-white/50">Statement totals are not available yet.</p>}</div><h3 className="mb-3 mt-6 font-bold">Recent settlements</h3>{list(settlements,"No settlements yet.")}</article></div>}

      {section === "inbox" && <div className="mt-6 grid gap-5 lg:grid-cols-2"><article className={panel}><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Notifications</h2><span className="text-xs text-white/45">{notifications.filter(item=>!notificationIsRead(item)).length} unread</span></div>{notifications.length ? <div className="divide-y divide-white/10">{notifications.map((item,index)=>{const read=notificationIsRead(item);return <div key={idOf(item)||index} className="flex items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{item.title || item.type || item.event || "Notification"}</p>{!read&&<span className="rounded-full bg-lime-300/10 px-2 py-0.5 text-[10px] font-semibold text-lime-200">NEW</span>}</div><p className="mt-1 text-sm leading-5 text-white/55">{item.message || item.body || item.description || ""}</p><p className="mt-1.5 text-xs text-white/40">{formatDate(item.createdAt || item.created_on || item.date)}</p></div><div className="flex shrink-0 flex-col items-end gap-2"><span className={`rounded-full border px-2.5 py-1 text-xs ${read ? "border-white/10 text-white/45" : "border-amber-300/20 text-amber-100"}`}>{read ? "Read" : "Unread"}</span>{!read&&<button className="text-xs font-semibold text-lime-200 underline" disabled={busy||!idOf(item)} onClick={()=>void run(()=>businessApi.markNotificationRead(idOf(item)),"Notification marked as read.")}>Mark read</button>}</div></div>;})}</div> : <p className="text-sm text-white/50">You are all caught up.</p>}<h3 className="mb-2 mt-6 font-semibold">Notification preferences</h3><div className="grid grid-cols-2 gap-2">{["booking","payment","reminder","marketing","offers","security"].map(key=><label key={key} className="flex items-center gap-2 text-sm capitalize text-white/65"><input type="checkbox" checked={Boolean(preferences[key])} onChange={e=>setPreferences({...preferences,[key]:e.target.checked})}/>{key}</label>)}</div><button className={`${secondary} mt-3`} disabled={busy} onClick={()=>void run(()=>businessApi.updateNotificationPreferences(preferences),"Notification preferences saved.")}>Save preferences</button></article><article className={panel}><h2 className="mb-4 text-lg font-bold">Create support ticket</h2><form className="space-y-3" onSubmit={submitTicket}><select className={field} value={ticketForm.category} onChange={e=>setTicketForm({...ticketForm,category:e.target.value})}>{["BOOKING","PAYMENT","REFUND","BUSINESS","VENUE","ACCOUNT","TECHNICAL","OTHER"].map(x=><option key={x}>{x}</option>)}</select><select className={field} value={ticketForm.priority} onChange={e=>setTicketForm({...ticketForm,priority:e.target.value})}>{["LOW","MEDIUM","HIGH","URGENT"].map(x=><option key={x}>{x}</option>)}</select><input className={field} required placeholder="Subject" value={ticketForm.subject} onChange={e=>setTicketForm({...ticketForm,subject:e.target.value})}/><textarea className={`${field} min-h-28`} required placeholder="Describe how we can help" value={ticketForm.message} onChange={e=>setTicketForm({...ticketForm,message:e.target.value})}/><button className={button} disabled={busy}>Submit ticket</button></form><h3 className="mb-3 mt-7 font-semibold">Your tickets</h3>{list(tickets,"No support tickets.",item=><>{title(item)}<span className="ml-2 text-xs text-white/45">{item.category || ""}</span></>)}</article></div>}
    </div>
  </main>;
}

function DetailCard({ title: heading, details }: { title: string; details: [string, unknown][] }) {
  const visible = details.filter(([, value]) => value !== undefined && value !== null && value !== "");
  return <article className={panel}><h3 className="mb-4 font-bold">{heading}</h3>{visible.length ? <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{visible.map(([label,value])=><div key={label} className="min-w-0"><dt className="text-xs text-white/40">{label}</dt><dd className="mt-1 break-words text-sm text-white/80">{Array.isArray(value) ? value.length ? value.join(", ") : "—" : typeof value === "boolean" ? value ? "Yes" : "No" : String(value)}</dd></div>)}</dl> : <p className="text-sm text-white/45">No details available.</p>}</article>;
}

function ProfileDetails({ profile }: { profile: Row }) {
  const documents: Row[] = Array.isArray(profile.verificationDocuments) ? profile.verificationDocuments : Array.isArray(profile.documents) ? profile.documents : [];
  const turfs: Row[] = Array.isArray(profile.turfs) ? profile.turfs : [];
  const owner = profile.ownerDetails || profile.owner || {};
  const subscription = profile.subscription || {};
  const plan = subscription.plan || {};
  return <section className="mt-5 space-y-5"><div><h2 className="text-xl font-bold">Full business profile details</h2><p className="mt-1 text-sm text-white/45">Complete information returned by the business profile API.</p></div>
    <div className="grid gap-4 lg:grid-cols-2">
      <DetailCard title="Business information" details={[["Legal name",profile.legalName],["Display name",profile.displayName],["Description",profile.description],["Business type",profile.businessType],["Contact email",profile.contactEmail],["Contact phone",profile.contactPhone],["Website",profile.website],["Registration number",profile.registrationNumber],["Tax ID",profile.taxIdMasked],["Timezone",profile.timezone],["Approval status",profile.approvalStatus],["Rejection reason",profile.rejectionReason],["Operational status",profile.operationalStatus],["Subscription status",profile.subscriptionStatus],["Created",formatDate(profile.createdAt)],["Last updated",formatDate(profile.updatedAt)]]} />
      <DetailCard title="Account owner" details={[["Name",owner.name],["Username",owner.username],["Email",owner.email],["Phone",owner.contactNumber || owner.phone],["Role",owner.role]]} />
      <DetailCard title="Registered address" details={[["Address line 1",profile.address?.line1],["Address line 2",profile.address?.line2],["City",profile.address?.city],["State",profile.address?.state],["Country",profile.address?.country],["Postal code",profile.address?.postalCode]]} />
      <DetailCard title={`Verification documents (${documents.length})`} details={documents.flatMap((doc,index)=>[[`Document ${index+1}`,doc.documentType],[`Document ${index+1} status`,doc.status],[`Document ${index+1} number`,doc.documentNumberMasked],[`Document ${index+1} expiry`,formatDate(doc.expiryDate)],[`Document ${index+1} submitted`,formatDate(doc.submittedAt)],[`Document ${index+1} reviewed`,formatDate(doc.reviewedAt)],[`Document ${index+1} rejection`,doc.rejectionReason]] as [string,unknown][])} />
    </div>
    <div className="grid gap-4 lg:grid-cols-2"><article className={`${panel} lg:col-span-2`}><h3 className="mb-4 font-bold">Turfs ({turfs.length})</h3>{turfs.length ? <div className="grid gap-4 sm:grid-cols-2">{turfs.map((turf,index)=><article key={idOf(turf)||index} className="overflow-hidden rounded-xl border border-white/10 bg-black/20">{turf.gallery?.mainImage && <img src={turf.gallery.mainImage} alt={turf.turfDetails?.turfName || `Turf ${index+1}`} className="h-44 w-full object-cover" />}<div className="p-4"><h4 className="font-bold">{turf.turfDetails?.turfName || `Turf ${index+1}`}</h4><p className="mt-1 text-sm text-white/55">{turf.turfDetails?.description || ""}</p><p className="mt-2 text-xs text-white/45">{[turf.location?.address,turf.location?.city,turf.location?.state].filter(Boolean).join(", ")}</p><p className="mt-2 text-sm text-white/70">{turf.turfDetails?.sportsAvailable?.join(", ") || "Sports not listed"} · {turf.turfDetails?.surfaceType || "Surface not listed"}</p><p className="mt-2 text-sm font-semibold">{moneyFromPaise(Number(turf.pricing?.weekdayRate || 0) * 100)} / hour</p>{Array.isArray(turf.gallery?.thumbnailImages) && turf.gallery.thumbnailImages.length > 0 && <div className="mt-3 flex gap-2 overflow-x-auto">{turf.gallery.thumbnailImages.map((image: string,imageIndex: number)=><img key={`${image}-${imageIndex}`} src={image} alt={`${turf.turfDetails?.turfName || "Turf"} photo ${imageIndex+2}`} className="h-16 w-24 shrink-0 rounded-lg object-cover" />)}</div>}</div></article>)}</div> : <p className="text-sm text-white/45">No turfs returned in the profile.</p>}</article>
      <DetailCard title="Current subscription" details={[["Plan",plan.name],["Plan description",plan.description],["Plan status",plan.status],["Plan features",plan.features],["Turf limit",plan.limits?.maxTurfs],["Subscription status",subscription.status],["Billing cycle",subscription.billingCycle],["Amount",subscription.amountPaise !== undefined ? moneyFromPaise(subscription.amountPaise) : undefined],["Currency",subscription.currency],["Current period start",formatDate(subscription.currentPeriodStart)],["Current period end",formatDate(subscription.currentPeriodEnd)],["Cancellation scheduled",subscription.cancelAtPeriodEnd],["Created",formatDate(subscription.createdAt)]]} />
    </div>
  </section>;
}

function PasswordForm({ onSave, busy }: { onSave: (body: Row) => Promise<any>; busy: boolean }) {
  const [currentPassword,setCurrent]=useState(""); const [newPassword,setNew]=useState("");
  return <form className="mt-6 space-y-3" onSubmit={async e=>{e.preventDefault();await onSave({currentPassword,newPassword});setCurrent("");setNew("");}}><h3 className="font-semibold">Change password</h3><input className={field} type="password" autoComplete="current-password" required placeholder="Current password" value={currentPassword} onChange={e=>setCurrent(e.target.value)}/><input className={field} type="password" autoComplete="new-password" minLength={6} required placeholder="New password" value={newPassword} onChange={e=>setNew(e.target.value)}/><button className={secondary} disabled={busy}>Update password</button></form>;
}

function BookingRow({ item, onUpdate, busy }: { item: Row; onUpdate: (status: string) => Promise<any>; busy: boolean }) {
  const id = idOf(item); const [status,setStatus]=useState(item.bookingStatus || "pending");
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-4"><div><p className="font-semibold">{item.turf?.turfDetails?.turfName || item.venue?.name || "Booking"}</p><p className="mt-1 text-xs text-white/45">{item.user?.name || item.customer?.name || "Customer"} · {item.date ? new Date(item.date).toLocaleDateString() : "Date unavailable"} · {item.timeSlot || ""}</p><p className="mt-1 text-xs text-white/50">Payment: {item.paymentStatus || "pending"} · ₹{Number(item.price || 0).toLocaleString("en-IN")}</p></div><div className="flex gap-2"><select className={`${field} min-w-32`} value={status} onChange={e=>setStatus(e.target.value)}>{["pending","confirmed","completed","cancelled"].map(x=><option key={x}>{x}</option>)}</select><button className={button} disabled={busy||!id} onClick={()=>void onUpdate(status)}>Save</button></div></div>;
}
