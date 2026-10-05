"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { changeUserPassword, deleteUserAccount, getCurrentUser, getUserProfile, logout, updateUserProfile } from "@/src/services/authService";
import { cancelBooking, getUserBookings } from "@/src/services/bookingService";
import { platformApi } from "@/src/services/platformService";

type RecordItem = Record<string, any>;
type AccountData = Record<string, any[]>;
const sections = [
  ["bookings", "Bookings"], ["invoices", "Invoices"], ["wallet", "Wallet & points"],
  ["memberships", "Memberships"], ["reviews", "Reviews"], ["notifications", "Notifications"],
  ["support", "Support"], ["settings", "Profile & security"],
] as const;

function toRecords(value: any, keys: string[] = []): RecordItem[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  for (const key of [...keys, "items", "results", "records", "history"]) {
    if (Array.isArray(value[key])) return value[key];
  }
  return Object.keys(value).length ? [value] : [];
}

function labelValue(value: any) {
  if (value == null || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function RecordList({ items, empty, onSelect }: { items: RecordItem[]; empty: string; onSelect?: (item: RecordItem) => void }) {
  if (!items.length) return <p className="py-8 text-center text-sm text-zinc-400">{empty}</p>;
  return <div className="space-y-3">{items.map((item, index) => {
    const title = item.bookingNumber || item.subject || item.title || item.name || item.plan?.name || item.turf?.turfDetails?.turfName || `${item.type || "Record"} ${index + 1}`;
    const id = item._id || item.id || index;
    const details = Object.entries(item).filter(([key, value]) => !["_id", "id", "__v"].includes(key) && value != null && typeof value !== "object").slice(0, 6);
    return <article key={String(id)} className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-white">{title}</h3><p className="mt-1 text-xs text-zinc-500">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</p></div>
        {item.status && <span className="rounded-full bg-white/10 px-3 py-1 text-xs capitalize text-zinc-300">{String(item.status).replaceAll("_", " ").toLowerCase()}</span>}
      </div>
      {details.length > 0 && <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">{details.map(([key, value]) => <div key={key} className="flex justify-between gap-4 text-xs"><dt className="capitalize text-zinc-500">{key.replace(/[A-Z]/g, (letter) => ` ${letter}`).replaceAll("_", " ")}</dt><dd className="max-w-[65%] break-words text-right text-zinc-300">{labelValue(value)}</dd></div>)}</dl>}
      {onSelect && <button onClick={() => onSelect(item)} className="mt-3 text-sm font-semibold text-lime-300 hover:text-lime-200">Open / reply</button>}
    </article>;
  })}</div>;
}

export default function UserAccountPage() {
  const [active, setActive] = useState<string>("bookings");
  const [data, setData] = useState<AccountData>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState<RecordItem | null>(null);
  const [preferences, setPreferences] = useState<RecordItem>({});
  const [selectedTicket, setSelectedTicket] = useState<RecordItem | null>(null);
  const [bookingDetails, setBookingDetails] = useState<RecordItem | null>(null);
  const [reviewForm, setReviewForm] = useState({ bookingId: "", rating: "5", comment: "" });
  const [supportForm, setSupportForm] = useState({ category: "BOOKING", priority: "MEDIUM", subject: "", bookingId: "", message: "" });
  const [reply, setReply] = useState("");
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [profileForm, setProfileForm] = useState({ name: "", contactNumber: "" });

  const loadAccount = useCallback(async () => {
    setLoading(true);
    const [profileResult, bookingResult, invoiceResult, reviewResult, pointsResult, walletResult, membershipResult, planResult, notificationResult, preferenceResult, supportResult] = await Promise.all([
      getUserProfile(), getUserBookings(), platformApi.invoices(), platformApi.myReviews(), platformApi.loyalty(), platformApi.wallet(), platformApi.myMemberships(), platformApi.membershipPlans(), platformApi.notifications(), platformApi.notificationPreferences(), platformApi.supportTickets(),
    ]);
    const next: AccountData = {
      bookings: bookingResult.success ? bookingResult.data : [],
      invoices: invoiceResult.success ? toRecords(invoiceResult.data, ["invoices"]) : [],
      reviews: reviewResult.success ? toRecords(reviewResult.data, ["reviews"]) : [],
      loyalty: pointsResult.success ? toRecords(pointsResult.data, ["history", "transactions"]) : [],
      wallet: walletResult.success ? toRecords(walletResult.data, ["ledger", "transactions"]) : [],
      memberships: membershipResult.success ? toRecords(membershipResult.data, ["memberships"]) : [],
      plans: planResult.success ? toRecords(planResult.data, ["plans"]) : [],
      notifications: notificationResult.success ? toRecords(notificationResult.data, ["notifications"]) : [],
      support: supportResult.success ? toRecords(supportResult.data, ["tickets"]) : [],
    };
    setData(next);
    if (profileResult.success) {
      const response = profileResult.data;
      const current = response?.user || response?.data?.user || response?.profile || response?.data || response || getCurrentUser();
      setProfile(current);
      setProfileForm({ name: current?.name || "", contactNumber: current?.contactNumber || "" });
    } else {
      const current = getCurrentUser();
      setProfile(current);
      setProfileForm({ name: current?.name || "", contactNumber: current?.contactNumber || "" });
    }
    if (preferenceResult.success) setPreferences(preferenceResult.data?.preferences || preferenceResult.data || {});
    setLoading(false);
  }, []);

  useEffect(() => { void loadAccount(); }, [loadAccount]);

  const runAction = async (action: () => Promise<any>, successText: string, reload = true) => {
    setBusy(true);
    setMessage("");
    const result = await action();
    if (result?.success) {
      setMessage(successText);
      if (reload) await loadAccount();
    } else setMessage(result?.message || "Request failed. Please try again.");
    setBusy(false);
    return result;
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reviewForm.bookingId) return setMessage("Select the booking this review is for.");
    await runAction(() => platformApi.createReview({ bookingId: reviewForm.bookingId, targetType: "FACILITY", rating: Number(reviewForm.rating), comment: reviewForm.comment }), "Review submitted.");
    setReviewForm({ bookingId: "", rating: "5", comment: "" });
  };

  const submitSupport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runAction(() => platformApi.createSupportTicket({ ...supportForm, bookingId: supportForm.bookingId || undefined }), "Support ticket created.");
    setSupportForm({ category: "BOOKING", priority: "MEDIUM", subject: "", bookingId: "", message: "" });
  };

  const submitReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTicket) return;
    const ticketId = selectedTicket._id || selectedTicket.id;
    await runAction(() => platformApi.replyToSupportTicket(ticketId, { message: reply }), "Reply sent.");
    setReply("");
  };

  const submitProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await runAction(() => updateUserProfile(profileForm), "Profile updated.", false);
    if (result.success) {
      const latest = getCurrentUser();
      setProfile(latest);
    }
  };

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await runAction(() => changeUserPassword(passwordForm.currentPassword, passwordForm.newPassword), "Password changed.", false);
    if (result.success) setPasswordForm({ currentPassword: "", newPassword: "" });
  };

  const savePreferences = () => runAction(() => platformApi.updateNotificationPreferences(preferences), "Notification preferences saved.", false);

  const viewBooking = async (booking: RecordItem) => {
    const result = await platformApi.getBooking(booking.id || booking._id);
    if (result.success) setBookingDetails(result.data?.booking || result.data);
    else setMessage(result.message || "Could not load booking details.");
  };

  const viewTicket = async (ticket: RecordItem) => {
    const result = await platformApi.supportTicket(ticket._id || ticket.id);
    if (result.success) setSelectedTicket(result.data?.ticket || result.data);
    else setMessage(result.message || "Could not load the support ticket.");
  };

  const deleteAccount = async () => {
    if (!window.confirm("Delete your account? This action cannot be undone.")) return;
    const result = await deleteUserAccount();
    if (result.success) {
      logout();
      window.location.assign("/");
    } else setMessage(result.message || "Could not delete account.");
  };

  const entries = data[active] || [];
  const fieldClass = "mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-lime-300";
  const buttonClass = "rounded-lg bg-lime-300 px-4 py-3 font-bold text-black hover:bg-lime-200 disabled:opacity-50";

  return <main className="min-h-screen bg-[#090b0a] px-5 pb-20 pt-28 text-white md:px-10">
    <div className="mx-auto max-w-7xl">
      <Link href="/dashboard" className="text-sm text-lime-300 hover:text-lime-200">← Dashboard</Link>
      <div className="mb-8 mt-5"><p className="text-xs font-bold uppercase tracking-[.25em] text-lime-300">Customer account</p><h1 className="mt-2 text-4xl font-black md:text-5xl">Your activity & settings</h1><p className="mt-2 text-zinc-400">Bookings, payments, rewards and support in one place.</p></div>
      {message && <div role="status" className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">{message}</div>}
      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col">{sections.map(([key, label]) => <button key={key} onClick={() => { setActive(key); setMessage(""); }} className={`whitespace-nowrap rounded-xl px-4 py-3 text-left text-sm font-semibold ${active === key ? "bg-lime-300 text-black" : "border border-white/10 bg-white/[.03] text-zinc-300 hover:border-white/25"}`}>{label}</button>)}</nav>
        <section className="min-h-[520px] rounded-2xl border border-white/10 bg-white/[.035] p-5 md:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-bold">{sections.find(([key]) => key === active)?.[1]}</h2><p className="mt-1 text-sm text-zinc-400">Manage your customer account and activity.</p></div><button onClick={() => void loadAccount()} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:border-lime-300">Refresh</button></div>
          {loading ? <p className="py-12 text-center text-zinc-400">Loading account data…</p> : <>
            {active === "bookings" && <><RecordList items={entries} empty="No bookings found yet." onSelect={viewBooking} />{bookingDetails && <div className="mt-4 rounded-xl border border-lime-300/30 p-4"><div className="mb-2 flex items-center justify-between"><h3 className="font-bold">Booking details</h3><button onClick={() => setBookingDetails(null)} className="text-sm text-zinc-400">Close</button></div><RecordList items={[bookingDetails]} empty="No details." />{bookingDetails._id && !["COMPLETED", "CANCELLED", "REFUNDED"].includes(String(bookingDetails.bookingStatus || bookingDetails.status).toUpperCase()) && <button disabled={busy} onClick={() => void runAction(() => cancelBooking(bookingDetails._id), "Booking cancellation requested.")} className="mt-4 text-sm text-red-300 hover:text-red-200">Cancel this booking</button>}</div>}</>}
            {active === "invoices" && <RecordList items={entries} empty="No invoices available." />}
            {active === "wallet" && <div className="space-y-8"><div><h3 className="mb-3 font-bold">Wallet & ledger</h3><RecordList items={data.wallet || []} empty="No wallet activity." /></div><div><h3 className="mb-3 font-bold">Loyalty points history</h3><RecordList items={data.loyalty || []} empty="No loyalty activity yet." /></div></div>}
            {active === "memberships" && <div className="space-y-8"><div><h3 className="mb-3 font-bold">Your memberships</h3><RecordList items={data.memberships || []} empty="No active memberships." /></div><div><h3 className="mb-3 font-bold">Available plans</h3><RecordList items={data.plans || []} empty="No membership plans available." />{(data.plans || []).map((plan) => <button key={plan._id || plan.id} disabled={busy} onClick={() => void runAction(() => platformApi.purchaseMembership({ planId: plan._id || plan.id }), "Membership purchase started.")} className="mr-2 mt-3 rounded-lg border border-lime-300/50 px-4 py-2 text-sm text-lime-200 hover:bg-lime-300/10">Choose {plan.name || "plan"}</button>)}</div></div>}
            {active === "reviews" && <div className="space-y-8"><form onSubmit={submitReview} className="grid gap-4 rounded-xl border border-white/10 p-4 md:grid-cols-2"><h3 className="font-bold md:col-span-2">Leave a review</h3><label className="text-sm text-zinc-400">Booking<select required value={reviewForm.bookingId} onChange={(e) => setReviewForm({ ...reviewForm, bookingId: e.target.value })} className={fieldClass}><option value="">Select a booking</option>{(data.bookings || []).map((booking) => <option key={booking.id} value={booking.id}>{booking.turf} · {booking.date}</option>)}</select></label><label className="text-sm text-zinc-400">Rating<select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })} className={fieldClass}>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}</select></label><label className="text-sm text-zinc-400 md:col-span-2">Comment<textarea required value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} rows={3} className={fieldClass} /></label><button disabled={busy} className={buttonClass + " md:col-span-2"}>Submit review</button></form><div><h3 className="mb-3 font-bold">Your reviews</h3><RecordList items={data.reviews || []} empty="You have not reviewed a venue yet." /></div></div>}
            {active === "notifications" && <div className="space-y-8"><div className="space-y-3">{entries.length ? entries.map((notification, index) => <article key={notification._id || notification.id || index} className="flex items-start justify-between gap-4 rounded-xl border border-white/10 p-4"><div><h3 className="font-semibold">{notification.title || notification.type || "Notification"}</h3><p className="mt-1 text-sm text-zinc-400">{notification.message || notification.body || ""}</p></div>{!notification.readAt && <button onClick={() => void runAction(() => platformApi.markNotificationRead(notification._id || notification.id), "Notification marked read.")} className="shrink-0 text-xs text-lime-300">Mark read</button>}</article>) : <p className="py-6 text-center text-zinc-400">No notifications.</p>}</div><div className="rounded-xl border border-white/10 p-4"><h3 className="mb-4 font-bold">Notification preferences</h3><div className="grid gap-3 sm:grid-cols-2">{["booking", "payment", "reminder", "marketing", "offers", "security"].map((key) => <label key={key} className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-3 text-sm capitalize"><span>{key}</span><input type="checkbox" checked={preferences[key] ?? key !== "marketing"} onChange={(e) => setPreferences({ ...preferences, [key]: e.target.checked })} className="h-4 w-4 accent-lime-300" /></label>)}</div><button disabled={busy} onClick={() => void savePreferences()} className={buttonClass + " mt-4"}>Save preferences</button></div></div>}
            {active === "support" && <div className="space-y-8"><form onSubmit={submitSupport} className="grid gap-4 rounded-xl border border-white/10 p-4 md:grid-cols-2"><h3 className="font-bold md:col-span-2">Create support ticket</h3><label className="text-sm text-zinc-400">Category<select value={supportForm.category} onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value })} className={fieldClass}>{["BOOKING", "PAYMENT", "ACCOUNT", "OTHER"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-sm text-zinc-400">Priority<select value={supportForm.priority} onChange={(e) => setSupportForm({ ...supportForm, priority: e.target.value })} className={fieldClass}>{["LOW", "MEDIUM", "HIGH"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-sm text-zinc-400 md:col-span-2">Subject<input required value={supportForm.subject} onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })} className={fieldClass} /></label><label className="text-sm text-zinc-400 md:col-span-2">Message<textarea required value={supportForm.message} onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })} rows={3} className={fieldClass} /></label><button disabled={busy} className={buttonClass + " md:col-span-2"}>Create ticket</button></form><div><h3 className="mb-3 font-bold">Your support tickets</h3><RecordList items={data.support || []} empty="No support tickets." onSelect={viewTicket} /></div>{selectedTicket && <form onSubmit={submitReply} className="rounded-xl border border-white/10 p-4"><h3 className="mb-3 font-bold">Reply to: {selectedTicket.subject || selectedTicket.title || "support ticket"}</h3><textarea required value={reply} onChange={(e) => setReply(e.target.value)} rows={3} className={fieldClass} placeholder="Write a reply" /><button disabled={busy} className={buttonClass + " mt-3"}>Send reply</button><button type="button" onClick={() => setSelectedTicket(null)} className="ml-3 text-sm text-zinc-400">Close</button></form>}</div>}
            {active === "settings" && <div className="grid gap-8 xl:grid-cols-2"><form onSubmit={submitProfile} className="space-y-4 rounded-xl border border-white/10 p-4"><h3 className="font-bold">Profile information</h3><label className="block text-sm text-zinc-400">Name<input required value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className={fieldClass} /></label><label className="block text-sm text-zinc-400">Contact number<input value={profileForm.contactNumber} onChange={(e) => setProfileForm({ ...profileForm, contactNumber: e.target.value })} className={fieldClass} /></label><p className="text-sm text-zinc-500">{profile?.email || ""}</p><button disabled={busy} className={buttonClass}>Save profile</button></form><form onSubmit={submitPassword} className="space-y-4 rounded-xl border border-white/10 p-4"><h3 className="font-bold">Change password</h3><label className="block text-sm text-zinc-400">Current password<input required type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className={fieldClass} /></label><label className="block text-sm text-zinc-400">New password<input required minLength={8} type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className={fieldClass} /></label><button disabled={busy} className={buttonClass}>Update password</button></form><div className="rounded-xl border border-red-900/60 bg-red-950/20 p-4 xl:col-span-2"><h3 className="font-bold text-red-200">Delete account</h3><p className="my-2 text-sm text-zinc-400">Permanently delete your account through the account API.</p><button onClick={() => void deleteAccount()} className="rounded-lg border border-red-400/50 px-4 py-2 text-sm text-red-200 hover:bg-red-400/10">Delete my account</button></div></div>}
          </>}
        </section>
      </div>
    </div>
  </main>;
}
